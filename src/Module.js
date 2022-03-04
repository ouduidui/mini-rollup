// magic-string 是 Rollup 作者写的一个关于字符串操作的库，这个库主要是对字符串一些常用方法进行了封装
const MagicString = require('magic-string');
const { parse } = require('acorn');
const analyse = require('./ast/analyse');

// 每个模块对应一个Module实例
class Module {
  /**
   * 构造函数
   * @param {{code: string, path: string, bundle: Bundle}} options
   */
  constructor({ code, path, bundle }) {
    this.code = new MagicString(code, { filename: path });
    this.path = path;
    this.bundle = bundle;

    // 将代码解析成AST语法树
    this.ast = parse(code, {
      ecmaVersion: 7, // ECMA版本
      sourceType: 'module' // 默认ES_MODULE类型
    });

    // 开始分析代码
    this.analyse();
  }

  /**
   * 对代码进行分析
   */
  analyse() {
    /**
     * 存储该模块的所有导入
     * @type {{name: string, localName: string, source: string}[]}
     */
    this.imports = {};

    /**
     * 存储该模块的所有导出
     * @type {{localName: string, node: *, expression: *}[]}
     */
    this.exports = {};

    this.ast.body.forEach((node) => {
      // import语句
      if (node.type === 'ImportDeclaration') {
        const source = node.source.value;

        node.specifiers.forEach((specifier) => {
          const name = specifier.imported.name;
          const localName = specifier.local.name;
          this.imports[localName] = { name, localName, source };
        });
      }
      // export 语句
      else if (/^Export/.test(node.type)) {
        const declaration = node.declaration;

        let name = '';

        // 导出的是变量
        if (declaration.type === 'VariableDeclaration') {
          name = declaration.declarations[0].id.name;
        }
        // 导出的是函数
        else if (declaration.type === 'FunctionDeclaration') {
          name = declaration.id.name;
        }

        if (name) {
          this.exports[name] = { node, localName: name, expression: declaration };
        }
      }
    });

    // 分析该模块，找到当前模块的全局变量和使用了的外部变量
    analyse(this.ast, this.code);

    // 存放当前模块的所有的全局变量定义语句（AST）
    this.definitions = {};
    this.ast.body.forEach((statement) => {
      Object.keys(statement._defines).forEach((name) => {
        this.definitions[name] = statement;
      });
    });
  }

  /**
   * 展开扁平化所有语句
   * @returns *[]
   */
  expandAllStatements() {
    const allStatements = [];
    // 遍历所有语句
    this.ast.body.forEach((statement) => {
      // 过滤import语句
      if (statement.type !== 'ImportDeclaration') {
        // 对个语句进行递归扁平化处理
        const statements = this.expandAllStatement(statement);
        allStatements.push(...statements);
      }
    });

    return allStatements;
  }

  /**
   * 扁平化单个语句
   * @param {*} statement
   * @returns *[]
   */
  expandAllStatement(statement) {
    const result = [];
    // 获取该语句是否有依赖项，即使用其他模块引入的变量
    const dependencies = Object.keys(statement._dependsOn);
    // 遍历依赖性
    dependencies.forEach((name) => {
      // 定义每个外部依赖
      const definition = this.define(name);
      result.push(...definition);
    });

    // 如果该语句没有被识别过，则插入结果中
    // 之所以放在后面是为了遵守先定义后使用原则
    if (!statement._included) {
      statement._included = true;
      result.push(statement);
    }

    return result;
  }

  /**
   * 获取变量的定义信息
   * @param {string} name
   * @returns
   */
  define(name) {
    // 如果是外部引入的变量
    if (this.imports.hasOwnProperty(name)) {
      // 从this.imports获取依赖信息
      const importData = this.imports[name];
      // 调用bundle.fetchModule，去分析这个引入模块
      const module = this.bundle.fetchModule(importData.source, this.path);
      // 获取这个引入模块的导出项，找到对应的变量
      const exportData = module.exports[importData.name];
      // 最后调用该模块的define方法，去获取该变量的定义信息（代码）
      return exportData ? module.define(exportData.localName) : [];
    }
    // 如果是模块内部变量
    else {
      // 在definitions获取该变量的声明语句
      let statement = this.definitions[name];
      if (statement && !statement._included /* 判断该声明语句之前是否解析过 */) {
        return this.expandAllStatement(statement);
      } else {
        // 如果直接解析该声明语句，就无需重复识别了
        return [];
      }
    }
  }
}

module.exports = Module;
