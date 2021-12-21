const path = require('path');
const rollup = require('./rollup');

// 获取入口文件的绝对路径
let entry = path.resolve(__dirname, 'src/index.js');

// 和源码有所不同，这里使用的是同步，增加可读性
rollup(entry, 'bundle.js');
