const Scope = require('./scope');
const walk = require('./walk');

/**
 * 找出当前模块使用到了哪些变量 标记哪些变量时当前模块声明的，哪些变量是导入别的模块的变量
 * @param {*} ast
 * @param {*} magicString
 * @param {*} module
 */
function analyse(ast, magicString, module) {
  // 创建一个模块内的全局作用域
  let scope = new Scope();

  // 遍历当前的所有语法树的所有顶级节点
  ast.body.forEach((statement) => {
    // 给作用域添加变量
    function addToScope(declaration) {
      const name = declaration.id.name; // 活动这个声明的变量
      scope.add(name);
      if (!scope.parent) {
        // 如果当前是全局作用域的话
        statement._defines[name] = true;
      }
    }

    Object.defineProperties(statement, {
      // 存放当前模块定义的所有全局变量
      _defines: { value: {} },
      // 当前模块没有定义但是使用到的变量，也就是外部依赖的变量
      _dependsOn: { value: {} },
      // 判断是否已经打包过，避免多次打包
      _included: { value: false, writable: true },
      // magicString.snip返回还是magicString克隆实例
      // start为此节点在源代码中的起始索引，end是结束索引
      _source: { value: magicString.snip(statement.start, statement.end) }
    });

    // 构建作用域
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
  });

  ast._scope = scope;

  // 找到外部依赖_dependsOn
  ast.body.forEach((statement) => {
    walk(statement, {
      enter(node) {
        if (node._scope) {
          scope = node._scope;
        }
        if (node.type === 'Identifier') {
          // 从当前的作用域向递归，找到这个变量的在变量在哪个作用域定义
          const definingScope = scope.findDefiningScope(node.name);
          if (!definingScope) {
            // 表示属于外部依赖变量
            statement._dependsOn[node.name] = true;
          }
        }
      },
      leave(node) {
        if (node._scope) {
          scope = scope.parent;
        }
      }
    });
  });
}

module.exports = analyse;
