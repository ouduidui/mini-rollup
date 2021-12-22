const MagicString = require('magic-string');
const { parse } = require('acorn');
const analyse = require('./ast/analyse');

/**
 * 每个文件都是一个模块，每个模块都对应一个Module实例
 * */
class Module {
  constructor({ code, path, bundle }) {
    // magic-string 是 Rollup 作者写的一个关于字符串操作的库，这个库主要是对字符串一些常用方法进行了封装
    this.code = new MagicString(code, { filename: path });
    this.path = path; // 模块的路径
    this.bundle = bundle; // 所属的bundle实例
    // 将源代码转成抽象语法树
    this.ast = parse(code, {
      ecmaVersion: 7,
      sourceType: 'module'
    });

    this.analyse();
  }

  analyse() {
    // 存放当前模块的所有导入
    this.imports = {};
    // 存放当前模块的所有导出
    this.exports = {};

    this.ast.body.forEach((node) => {
      if (node.type === 'ImportDeclaration') {
        // 说import语句
        let source = node.source.value; // 获取导入模块的路径
        let specifiers = node.specifiers; // 导入标识符

        specifiers.forEach((specifier) => {
          const name = specifier.imported.name; // 模块名称
          const localName = specifier.local.name; // 模块导入的变量名称
          this.imports[localName] = { name, localName, source };
        });
      } else if (/^Export/.test(node.type)) {
        // export语句
        let declaration = node.declaration;
        if (declaration.type === 'VariableDeclaration') {
          let name = declaration.declarations[0].id.name;
          this.exports[name] = {
            node,
            localName: name,
            expression: declaration
          };
        } else if (declaration.type === 'FunctionDeclaration') {
          let name = declaration.id.name;
          this.exports[name] = {
            node,
            localName: name,
            expression: declaration
          };
        }
      }
    });

    // 找到_defines和_dependsOn
    analyse(this.ast, this.code, this);

    // 查找外部依赖
    this.definitions = {}; // 存放着所有的全局变量定义的语句
    this.ast.body.forEach((statement) => {
      Object.keys(statement._defines).forEach((name) => {
        // key是全局变量名，值是定义这个全局变量的语句
        this.definitions[name] = statement;
      });
    });
  }

  // 展开这个模块的语句，把这些语句定义的变量的语句都放到这个结果里
  expandAllStatements() {
    let allStatements = [];
    this.ast.body.forEach((statement) => {
      if (statement.type === 'ImportDeclaration') return;
      let statements = this.expandAllStatement(statement);
      allStatements.push(...statements);
    });

    return allStatements;
  }

  // 找到当前节点依赖的变量，找到这些变量的声明语句。这些语句可能是在当前模块声明的，也也可能是在导入的模块的声明的 然后放入结果里
  expandAllStatement(statement) {
    let result = [];
    const dependencies = Object.keys(statement._dependsOn); // 外部依赖的keys
    dependencies.forEach((name) => {
      // 找到定义这个变量的声明节点，这个节点可以由在当前模块内，也可能在依赖的模块里
      let definition = this.define(name);
      result.push(...definition);
    });

    if (!statement._included) {
      statement._included = true; // 表示这个节点已经加入结果，避免重复添加
      result.push(statement);
    }

    return result;
  }

  define(name) {
    // 查找一下导入变量也没有name
    if (hasOwnProperty(this.imports, name)) {
      const importData = this.imports[name];
      // 获取导入变量的模块
      const module = this.bundle.fetchModule(importData.source, this.path);
      // 这个module模块也有导入导出
      const exportData = module.exports[importData.name];
      // 返回这个导入模块变量的声明语句
      return exportData ? module.define(exportData.localName) : [];
    } else {
      // definitions是对象，key是当前模块的变量名，值是定义这个变量的语句
      let statement = this.definitions[name];
      if (statement && !statement._included) {
        return this.expandAllStatement(statement);
      } else {
        return [];
      }
    }
  }
}

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = Module;
