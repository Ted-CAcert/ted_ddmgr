exports.KeyValueStore=function() {
    this.store = {};

    this.get=function (key) {
        let ValObj = this.store[key] || null;
        if (ValObj) {
            ValObj.lru = Date.now();
            return ValObj.val;
        } else {
            return null;
        }
    }

    this.set=function (key, value) {
        let ValObj = { lru: Date.now(), val: value}
        this.store[key] = ValObj;
    }

    this.delete=function (key) {
        delete this.store[key];
    }
}
