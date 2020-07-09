# web worker 实践
源链接： https://gitee.com/sternelee/example-worker
#### 介绍

通过使用Web Workers，Web应用程序可以在独立于主线程的后台线程中，运行一个脚本操作。这样做的好处是可以在独立线程中执行费时的处理任务，从而允许主线程（通常是UI线程）不会因此被阻塞/放慢，从页实现多线程。

主线程 => 创建 `worker` (`new Worker`(同源`js`链接)) -> 发送通知`postMessage` -> 接收通知`onmessage` -> 关闭`close`

`worker`线程 => 程序逻辑 -> 接收命令`onmessage` -> 处理数据 -> 发送通知`postMessage` -> 关闭`terminate`

#### 不可使用点

1. 与主线程不在同一个上下文
2. 不可以操作 DOM，一切与 DOM 操作相关的函数、类都不能使用
3. `window` 对象的某些属性和方法, 重点注意 `XMLHttpRequest` 只会返回 `null`
   > [Web Workers可以使用的函数和类](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Functions_and_classes_available_to_workers)


#### `Blob` 使用
> 学习参考：[动态创建 Web Worker 实践指南](https://zhuanlan.zhihu.com/p/59981684)

`Web Worker` 常用构造函数来加载 `js` 链接文件，而我们知道：
1. `Blob`对象是一个不可变、原始数据的类文件对象，但不局限于 JavaScript 原生格式的数据，常被用来存储体量很大的二进制编码格式的数据，因此我们可以存入 `worker.js` 的逻辑代码。
2. `URL.createObjectURL` 则可以创建链接。

因此我们有了这样的例子：

```javascript
const response = "onmessage=function(e){postMessage('Worker: '+e.data);}";
const blob = new Blob(
  [response],
  {type: "application/javascript"}
);
const worker = new Worker(URL.createObjectURL(blob));
worker.onmessage = (e) => {
  console.log("Response: " + e.data);
};

worker.postMessage("Test");
```


#### `Promise` 实现
> 学习参考: [使用 Web Worker 实现简单的非阻塞异步](https://segmentfault.com/a/1190000012563475)

`setTimeout` 和 `Promise` 是阻塞异步的， 当然也包括 `await` 的方式，这要求主线程等待。
在 `web worker` 中， `postMessage` 和 `onmessage` 是可以一一对应的，我们可以用一个唯一ID来匹配。

```javascript

const flagMapping = {};

dispatch(...args) {
  const flag = new Date().getTime();
  return new Promise((resolve, reject) => {
    flagMapping[flag] = { resolve, reject };
    this.worker.postMessage({flag, args});
  });
}

// ... worker 内处理数据逻辑


// 监听响应事件
onmessageCallbback = (e) => {
  const { falg, data } = e.data;
  const { resolve, reject } = this.flagMapping[flag];
  resolve(data);
}

```


#### 动态创建 `web worker`

通过以上的认识，我们可以创建一个类，构建 `postMessage` 和 `onmessage` 的接口，在初始化时传入 `worker.js` 的逻辑代码。

##### 方式一： 传入字符串

```javascript
const util = `
{
  add: function (num) {
    return num + num
  },
  say: functin (name) {
    return "我的名字叫" + name
  }
}

`
```

##### 方式二： 传入函数

原因： `Function.prototype.toString()`: 返回一个表示当前函数源代码的字符串

```javascript
const util = (method, ...args) => {
  if (method === 'add') {
    return args[0] + args[1]
  }
  if (method === 'say') {
    return '我的名字叫' + args[0]
  }
}
```

#### 难点：如何将 `js` 代码以字符串传入 `web worker`

##### 方式一： `worker-loader` 以内联方式打包:

```javascript
{
  test: /\.worker\.js$/,
    use: {
      loader: 'worker-loader',
      options: { inline: true }
    }
}
```

##### 方式二： `webpack` 以字符串方式加载js文件:

```javascript
import file from '!raw-loader!file.js'
```

#### 方式三：`nodejs` 使用 `fs` 在读取编译后文件以字符串输出


#### 内联`Blob` 和 `Promise` 的不足

1. `Promise` 只能响应处理对应的单条信息，持续响应还是需要 `onmessage` 原生方式 或 `Proxy`代理等方式实现
2. 内联`Blob`增加了项目初始大小


##### 扩展阅读：

1. [石墨表格之 Web Worker 应用实战](https://juejin.im/entry/59b89c88f265da0664641382)
2. [webpack使用](https://www.cnblogs.com/tugenhua0707/p/11253937.html)

### 最佳实践： 谷歌出品的 [comlink](https://github.com/GoogleChromeLabs/comlink)

使用 `Promise` 和 `Proxy` 实现

实践demo: [gcid.ts](./gcid.ts) 和 [gcid.worker.ts](./gcid.worker.ts)

注意：`proxy` 要与对应的方法传回调方法，不要传对象

### 扩展阅读： web worker 加载 webWebAssembly

1. [webassembly-web-workers](https://dzone.com/articles/webassembly-web-workers)
2. [Using WebAssembly with Web Workers](https://www.sitepen.com/blog/using-webassembly-with-web-workers/)