const rollup = require('../src/index');
const path = require('path');
const fs = require('fs');
const Bundle = require('../src/Bundle');
const Module = require('../src/Module');

const entry = path.resolve(__dirname, './example/index.js');
const outputFileName = 'build.js';

describe('rollup', () => {
  it('test', () => {
    expect(true).toBe(true);
  });

  it('entryPath', () => {
    let bundle = new Bundle('index');
    expect(bundle.entryPath).toBe('index.js');
    bundle = new Bundle('index.js');
    expect(bundle.entryPath).toBe('index.js');
  });

  it('ast', () => {
    const code = fs.readFileSync(entry, 'utf-8');
    const bundle = new Bundle(entry);
    const module = new Module({ code, entry, bundle });
    // AST树
    expect(module.ast).toEqual(require('./ast'));
    // 引入模块
    expect(module.imports).toEqual({
      foo: { name: 'foo', localName: 'foo', source: './foo' },
      title: { name: 'title', localName: 'title', source: './foo' }
    });
    // 导出模块
    expect(module.exports).toEqual({});
    // 全局变量
    expect(Object.keys(module.definitions)).toEqual(['saySomething']);
  });

  it('happy path', (done) => {
    rollup(entry, outputFileName);
    const code = fs.readFileSync('./dist/' + outputFileName, 'utf8');

    const logs = ['bar', 'Hello World!'];
    console.log = jest.fn((msg) => {
      expect(msg).toBe(logs.shift());
      if (!logs.length) done();
    });
    eval(code);
  });
});
