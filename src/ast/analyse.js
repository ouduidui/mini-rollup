const Scope = require('./Scope');
const walk = require('./walk');

/**
 * @param  {*} ast
 * @param  {MagicString} code
 */
function analyse(ast, code) {
  // 创建该模块的全局作用域
  let scope = new Scope();
  // 将全局作用域存储在ast中
  ast._scope = scope;

  // 遍历AST，从顶级节点开始递归遍历
  // 此处遍历是为了初始化当前模块的作用域
  ast.body.forEach((statement) => {
    // 给statement定义属性
    Object.defineProperties(statement, {
      // 存放当前模块定义的所有全局变量
      _defines: { value: {} },
      // 存放模块使用到的但没有定义的变量，也就是外部引入的变量
      _dependsOn: { value: {} },
      // 判断是否已经打包过，避免多次打包
      _included: { value: false, writable: true },
      // 从code中切片出该语句的magicString克隆实例
      _source: { value: code.snip(statement.start, statement.end) }
    });

    // 遍历statement的AST树
    walk(statement, {
      // 前置函数，则在开始遍历该节点之前执行
      enter(node) {
        if (!node) return;

        let newScope; // 存储新作用域
        switch (node.type) {
          // 函数定义
          case 'FunctionDeclaration':
            // 将当前函数声明添加到当前作用域
            addToScope(node);
            // 获取函数内的所有遍历名
            const params = node.params.map((x) => x.name);
            // 初始化该函数作用域
            newScope = new Scope({
              parent: scope,
              params
            });
            break;

          // 声明变量，不会产生任何作用域，则直接将定义的变量加入当前作用域中
          case 'VariableDeclaration':
            node.declarations.forEach(addToScope);
            break;
        }

        // 如果当前节点声明产生了一个新的作用域的话，将scope变量切为新的作用域
        // 因为后续将对该节点进行递归遍历，该新作用域将为递归内层的父级作用域
        if (newScope) {
          // 在当前节点存储它的作用域
          node._scope = newScope;
          scope = newScope;
        }
      },

      // 后置函数，则遍历完该节点后执行
      leave(node) {
        // 如果该节点产生过新的作用域的话，则在离开的时候，将scope切回它的父级作用域
        if (node._scope) {
          scope = scope.parent;
        }
      }
    });

    walk(statement, {
      enter(node) {
        if (!node) return;

        let newScope;
        switch (node.type) {
          case 'FunctionDeclaration':
            const params = node.params.map((x) => x.name);
            if (node.type === 'FunctionDeclaration') {
              addToScope(node);
            }
            //如果遍历到的是一个函数声明，创建一个新的作用域对象
            newScope = new Scope({
              parent: scope, //父作用域就是当前的作用域
              params
            });
            break;
          case 'VariableDeclaration': //并不会生成一个新的作用域
            node.declarations.forEach(addToScope);
            break;
        }

        //当前节点声明一个新的作用域
        if (newScope) {
          //如果此节点生成一个新的作用域，那么会在这个节点放一个_scope，指向新的作用域
          Object.defineProperty(node, '_scope', { value: newScope });
          scope = newScope;
        }
      },
      leave(node) {
        //如果此节点产出了一个新的作用域，那等离开这个节点，scope 回到父作用法域
        if (node._scope) {
          scope = scope.parent;
        }
      }
    });

    /**
     * 给当前作用域添加变量
     * @param {*} declaration
     */
    function addToScope(declaration) {
      // 获取变量名
      const name = declaration.id.name;
      // 加入当前作用域内
      scope.add(name, declaration);
      // 如果scope没有父级作用域，则代表scope为全局作用域
      if (!scope.parent) {
        // 在当前statement的_defines中给该变量做记号
        statement._defines[name] = true;
      }
    }
  });

  // 再次遍历ast树，找到外部变量，即使用了但作用域没找到的变量
  ast.body.forEach((statement) => {
    walk(statement, {
      enter(node) {
        // 如果当前节点有函数作用域，则切到当前的函数作用域
        if (node._scope) {
          scope = node._scope;
        }

        // 如果为标识符，即读取变量
        if (node.type === 'Identifier') {
          // 在作用域链中查找是否有该变量定义
          // 如果没有的话，则意味是外部引入变量
          if (!scope.contains(node.name)) {
            statement._dependsOn[node.name] = true;
          }
        }
      },
      leave(node) {
        // 离开时切回父级作用域
        if (node._scope) {
          scope = scope.parent;
        }
      }
    });
  });
}

module.exports = analyse;
