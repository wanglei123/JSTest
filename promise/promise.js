/*
 * @Author       : wanglei
 * @Date         : 2023-02-01 09:03:14
 * @LastEditors  : wanglei
 * @LastEditTime : 2023-02-01 18:06:24
 * @FilePath     : /JSTest/promise/promise.js
 * @description  : 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
function Promise(executor) {
  this.promiseState = 'pending';
  this.promiseResult = null;
  this.callbacks = []; // 定义成一个数组，可调用多个回调

  const that = this;

  function resolve(data) {
    // 处理状态只能修改一次
    if (that.promiseState !== 'pending') return;
    that.promiseState = 'fulfilled';
    that.promiseResult = data;
    // 异步回调时，调用回调函数
    if (that.callbacks.length > 0) {
      that.callbacks.forEach((item) => {
        item.onResolved(data);
      });
    }
  }

  function reject(data) {
    // 处理状态只能修改一次
    if (that.promiseState !== 'pending') return;
    that.promiseState = 'rejected';
    that.promiseResult = data;
    if (that.callbacks.length > 0) {
      that.callbacks.forEach((item) => {
        item.onRejected(data);
      });
    }
  }
  // 处理throw error时改变状态
  try {
    // 执行同步任务
    executor(resolve, reject);
  } catch (err) {
    reject(err);
  }
}

// 添加then 方法
Promise.prototype.then = function (onResolved, onRejected) {
  const that = this;
  // 判断回调函数
  if(typeof onRejected !== 'function'){
    onRejected = reason => {
      throw reason
    }
  }

  if (typeof onResolved !== 'function'){
    onResolved = value => value
  }
  return new Promise((resolve, reject) => {

    function callback(typeMethod){
      try {
        // 获取回调函数的执行结果
        let result = typeMethod(that.promiseResult);
        if (result instanceof Promise) {
          // 如果是promise对象
          result.then(
            (v) => {
              resolve(v);
            },
            (r) => {
              reject(r);
            }
          );
        } else {
          // 非promise对象
          resolve(result);
        }
      } catch (e) {
        reject(e);
      }
    }
    // 同步调用回调函数
    if (this.promiseState === 'fulfilled') {
      callback(onResolved)
    }
    // 同步调用回调函数
    if (this.promiseState === 'rejected') {
      callback(onRejected)
    }
    // 当promise内是异步内容时，不会马上改变promise的状态，这时promise的状态还是pending
    // 就需要保存回调，等promise的状态改变了，再执行回调函数
    if (this.promiseState === 'pending') {
      // 保存回调
      this.callbacks.push({
        onResolved: function () {
          callback(onResolved)
        },
        onRejected: function () {
          callback(onRejected)
        },
      });
    }
  });
};

Promise.prototype.catch = function(onRejected){
  return this.then(undefined, onRejected)
  
}

Promise.resolve = function(value){
  
  return new Promise((resolve, reject) => {
    if(value instanceof Promise){
      value.then((v) => {
        resolve(v)
      }, (r) => {
        reject(r)
      })
    } else {
      resolve(value)
    }

  })
}

Promise.reject = function(reason){
  return new Promise((resolve, reject) => {
    reject(reason)
  })
}
