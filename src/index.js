const Bundle = require('./Bundle');

/**
 * rollup函数
 * @param {string} entry
 * @param {string} outputFileName
 */
function rollup(entry, outputFileName) {
  new Bundle(entry).build(outputFileName);
}

module.exports = rollup;
