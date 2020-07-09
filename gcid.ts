import * as Comlink from 'comlink';

function callback (data?) {
  console.log('callback结果', data)
}

async function init(file) {
  const remoteFunction: any = Comlink.wrap(new Worker("http://127.0.0.1:5500/dist/gcidWorker.js"));
  // await remoteFunction.readFile(file, Comlink.proxy(callback))
  // await remoteFunction.callback();
  await remoteFunction(file, Comlink.proxy(callback))
}

const fileDom = document.getElementById('file') as HTMLInputElement;
fileDom.addEventListener("change", function (e) {
  const file = fileDom.files[0];
  init(file)
});