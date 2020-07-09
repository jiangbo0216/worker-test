// import 'regenerator-runtime/runtime'
import * as Comlink from 'comlink'
import * as CryptoJS from 'crypto-js'

function calculateBlockSize (size) {
  if (size >= 0 && size <= (128 << 20)) {
    return 256 << 10
  }
  if (size > (128 << 20) && size <= (256 << 20)) {
    return 512 << 10
  }
  if (size > (256 << 20) && size <= (512 << 20)) {
    return 1024 << 10
  }
  return 2048 << 10
}

class Gcid {
  gcid: string
  gcidSHA1: any
  constructor () {
    this.gcid = ''
    this.gcidSHA1 = ''
  }
  create () {
    this.gcid = ''
    this.gcidSHA1 = CryptoJS.algo.SHA1.create()
  }
  calculate (ab, blockSize) {
    const size = ab.byteLength
    const blockNum = size / blockSize
    for (let i = 0; i < blockNum; i++) {
      const wa = CryptoJS.lib.WordArray.create(ab.slice(blockSize * i, blockSize * (i + 1)))
      const bcidSHA1 = CryptoJS.SHA1(wa)
      this.gcidSHA1.update(bcidSHA1)
    }
    if (blockSize * blockNum < size) {
      const wa = CryptoJS.lib.WordArray.create(ab.slice(blockSize * blockNum, size))
      const bcidSHA1 = CryptoJS.SHA1(wa)
      this.gcidSHA1.update(bcidSHA1)
    }
  }
  finalize () {
    this.gcid = this.gcidSHA1.finalize().toString().toUpperCase()
    console.log('worker计算出来的gcid', this.gcid)
  }
}

const gcidTool = new Gcid();
let file: any = null

async function readFile (file, cb) {
  gcidTool.create()
  const reader = new FileReader()  // FileReader实例
    const blockSize = calculateBlockSize(file.size)
    const CHUNK_MIN_SIZE = 100 * 1024 * 1024
    const CHUNK_SIZE = Math.floor(CHUNK_MIN_SIZE / blockSize) * blockSize // 以blockSize为单位做最大分片(小于100M)
    const CHUNK_LEN = Math.ceil(file.size / CHUNK_SIZE)
    let reverse_index = 0
    console.log(`每${CHUNK_SIZE}大小分片读取文件中~~`, CHUNK_LEN)
    reader.onload = async () => {
      gcidTool.calculate(reader.result, blockSize)
      reverse_index += 1
      await cb((10 * reverse_index / CHUNK_LEN).toFixed(2))
      if (reverse_index >= CHUNK_LEN) {
        await gcidTool.finalize()
        const gcid = await gcidTool.gcid
        await cb(gcid)
      } else {
        seek()
      }
    }
    seek();
    function seek() {
      let start = CHUNK_SIZE * reverse_index;
      let end = (reverse_index >= CHUNK_LEN - 1) ? file.size : CHUNK_SIZE * (reverse_index + 1);
      let slice = file.slice(start, end);
      reader.readAsArrayBuffer(slice);
    }
}

const readFileGcid = {
  readFile: (val) => file = val,
  callback: readFile
}

// Comlink.expose(readFileGcid)
Comlink.expose(readFile)
