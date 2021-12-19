const Bundle = require("./bundle");

/**
 * rollup
 * @param entry 入口文件的绝对路径
 * @param outputFileName  输出文件的路径
 * */
function rollup(entry, outputFileName) {
    // Bundle代表打包对象，里面包含所有模块信息
    const bundle = new Bundle({ entry });
    // 调用build方法进行编译
    bundle.build(outputFileName);
}

module.exports = rollup;