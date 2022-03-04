/**
 * AST语法树遍历
 * @param {*} ast
 * @param {{enter: (node: *, parent: *) => void, leave: (node: *, parent: *) => void}} callbacks
 */
function walk(ast, { enter, leave }) {
  // 开始递归遍历
  visit(ast, null, enter, leave);
}

/**
 * 递归遍历
 * @param {*} node 当前节点
 * @param {*} parent 父节点
 * @param {(node: *, parent: *) => void} enter 前置回调函数
 * @param {(node: *, parent: *) => void} leave 后置回调函数
 * @returns
 */
function visit(node, parent, enter, leave) {
  // 如果没有节点，则结束遍历
  if (!node) return;

  // 调用前置函数
  enter && enter.call(null, node, parent);

  // 获取所有孩子节点，并过滤到孩子节点不是对象的
  const childKeys = Object.keys(node).filter((key) => typeof node[key] === 'object');

  // 遍历孩子节点
  childKeys.forEach((childKey) => {
    const value = node[childKey];
    // 如果节点为数组，则逐一遍历，递归调用visit
    if (Array.isArray(value)) {
      value.forEach((val) => visit(val, node, enter, leave));
    }
    // 如果节点为对象，直接递归调用visit
    else {
      visit(value, node, enter, leave);
    }
  });

  // 调用后置函数
  leave && leave.call(null, node, parent);
}

module.exports = walk;
