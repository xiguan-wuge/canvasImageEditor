export default class Base {
  constructor() {

  }
  setParent(parent) {
    this._parent = parent
  }
  getParent() {
    return this._parent
  }
  getName() {
    return this.name
  }
}