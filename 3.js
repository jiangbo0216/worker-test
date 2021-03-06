class Dispatcher {
  constructor(fn) {
    this._queue = [];
    this._worker = new Worker(
      "data:text/javascript," +
        encodeURIComponent(`'use strict';
        const __fn = ${fn};
        onmessage = e => postMessage(__fn(...e.data));`)
    );
    this._worker.onmessage = (e) => this._queue.shift().resolve(e.data);
    this._worker.onerror = (e) => this._queue.shift().reject(e.error);
  }

  dispatch(...args) {
    return new Promise((resolve, reject) => {
      this._queue.push({ resolve, reject });
      this._worker.postMessage(args);
    });
  }
}

const dispatcher = new Dispatcher(arr => { // 创建对象，把入口函数传入，实际是将逻辑方法转字符串`toString()`
  for (let i=0; i<1000; ++i) arr.sort(); // 耗费些时间
  return arr;  // 返回处理后的结果
});

const arr = Array.from({ length: 8192 }, () => Math.random() * 10000); // 需要处理的数据
dispatcher.dispatch(arr)  // 派发给 Worker
  .then(res => console.log(res));  // 处理完毕后输出