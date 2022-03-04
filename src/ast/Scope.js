// 作用域
class Scope {
  /**
   * 构造函数
   * @param  {parent?: Scope, params?:*[], block?:boolean} options={}
   */
  constructor(options = {}) {
    // 父级作用域
    this.parent = options.parent || null;
    // 作用域层级
    this.depth = this.parent ? this.parent.depth + 1 : 0;
    // 作用域内的变量
    this.names = options.params || [];
    // 是否为块作用域
    this.isBlockScope = !!options.block;
  }

  /**
   * 增加变量
   * @param {string} name
   * @param {boolean} isBlockDeclaration 如果是const或let声明则为true
   */
  add(name, isBlockDeclaration) {
    if (!isBlockDeclaration && this.isBlockScope) {
      // 如果是var声明或function声明或是this，且此时是块级作用域，则进行变量提示
      // 将变量加入父级作用域
      this.parent.add(name, isBlockDeclaration);
    } else {
      // 否则将变量新增到该作用域里
      this.names.push(name);
    }
  }

  /**
   * 判断该变量是否在该作用域链
   * @param {string} name
   * @returns {boolean}
   */
  contains(name) {
    return !!this.findDefiningScope(name);
  }

  /**
   * 找到该变量所处的作用域
   * @param {string} name
   * @returns {Scope | null}
   */
  findDefiningScope(name) {
    if (this.names.includes(name)) {
      return this;
    }

    if (this.parent) {
      return this.parent.findDefiningScope(name);
    }

    return null;
  }
}

module.exports = Scope;
