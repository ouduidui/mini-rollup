const path = require('path');
const fs = require('fs');
const Module = require('./Module');
const MagicString = require('magic-string');

// 打包器
class Bundle {
  /**
   * 构造函数
   * @param {string} entry
   */
  constructor(entry) {
    // 保存入口文件的绝对路径
    this.entryPath = entry.replace(/\.js$/, '') + '.js' /* 需要js后缀 */;
  }

  /**
   * 执行打包动作
   * @param {string} outputFileName
   */
  build(outputFileName) {
    // 定义入口文件（模块）实例，即识别入口文件代码
    const entryModule = this.fetchModule(this.entryPath);
    // 以入口文件为起点，展开并扁平化所有模块
    this.statements = entryModule.expandAllStatements();
    // 生成代码
    const code = this.generate();

    // 导出文件
    const outputPath = './dist';
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }
    fs.writeFileSync(outputPath + '/' + outputFileName, code, 'utf-8');
  }

  /**
   * 获取模块实例
   * @param {string} importee 当前模块的路径
   * @param {string} importer 使用该模块的路径（绝对路径）
   * @returns {Module | null}
   */
  fetchModule(importee, importer) {
    let route;
    if (!importer) {
      // 如果没有importer，则代表为入口文件
      route = importee;
    } else {
      // 如果importee是绝对路径，这直接保存
      if (path.isAbsolute(importee)) {
        route = importee;
      }
      // 如果importee是相对路径，则转化成绝对路径
      else if (importee[0] === '.') {
        route = path.resolve(path.dirname(importer), importee.replace(/\.js$/, '') + '.js');
      }
    }

    if (route) {
      // 读取模块代码
      const code = fs.readFileSync(route, 'utf8');
      // 定义该模块示例
      const module = new Module({
        code,
        path: route,
        bundle: this
      });

      return module;
    }

    return null;
  }

  /**
   * 合并生成代码
   * @returns {string}
   */
  generate() {
    // 初始化一个字符串模块
    const magicString = new MagicString.Bundle();
    // 遍历所有声明语句
    this.statements.forEach((statement) => {
      // 获取该声明语句的代码切片，也是magic-string类型
      const source = statement._source;
      // 如果是导出语句，删除掉导出关键字，如export
      if (statement.type === 'ExportNamedDeclaration') {
        source.remove(statement.start, statement.declaration.start);
      }
      // 拼接代码
      magicString.addSource({
        content: source,
        separator: '\n' // 换行
      });
    });

    // 返回代码字符串
    return magicString.toString();
  }
}

module.exports = Bundle;
