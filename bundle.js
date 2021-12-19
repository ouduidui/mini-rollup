const path = require('path');
const fs = require('fs');
const Module = require('./module');
const {default: MagicString} = require("magic-string");

/**
 * 打包器
 * */
class Bundle {
    constructor(options) {
        // 入口文件的绝对路径，包括后缀
        this.entryPath = options.entry.replace(/\.js$/, '') + '.js';

        // 存放着所有模块 入口文件和它依赖的模块
        this.modules = {};
    }

    /**
     * build 打包
     * @param outputFileName 输出文件名
     * */
    build(outputFileName) {
        // 从入口文件的绝对路径触发找到它的模块定义
        let entryModule = this.fetchModule(this.entryPath);

        // 把入口所有语句展开，返回语句数组
        // import {name, age}
        this.statements = entryModule.expandAllStatements();

        // 生成代码
        const {code} = this.generate();

        // 导出
        fs.access('./dist', err => err ? fs.mkdirSync('dist') : '');
        fs.writeFileSync('./dist/' + outputFileName, code, "utf-8");
    }

    /**
     * fetchModule 获取模块信息
     * @param importee 模块路径
     * @param importer 引入模块
     * */
    fetchModule(importee, importer) {
        let route;
        if (!importer) {
            // 如果没有模块导入此模块的话，这就是入口模块
            route = importee;
        } else {
            if (path.isAbsolute(importee)) {   // 绝对路径
                route = importee;
            } else if (importee[0] === '.') {   // 相对路径
                // 转换为绝对路径
                route = path.resolve(
                    path.dirname(importer),
                    importee.replace(/\.js$/, '') + '.js'
                );
            }
        }

        if (route) {
            // 从硬盘上读取此模块的源代码
            const code = fs.readFileSync(route, 'utf8');
            const module = new Module({
                code,  // 模块的源代码
                path: route,  // 模块的绝对路径
                bundle: this  // Bundle实例
            });
            return module;
        }
    }

    generate() {
        const magicString = new MagicString.Bundle();
        this.statements.forEach(statement => {
            const source = statement._source;
            if (statement.type === 'ExportNamedDeclaration') {
                source.remove(statement.start, statement.declaration.start);
            }
            magicString.addSource({
                content: source,
                separator: '\n'
            })
        })

        return {code: magicString.toString()};
    }
}

module.exports = Bundle;