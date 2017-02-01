import * as crypto from 'crypto'
const os = require('os')

const FINGERMARK = JSON.stringify(require('os').networkInterfaces())
const TIMESTAMP = 1485878400000
const PERIOD = 30 * 24 * 3600 * 1000
let keyCount = 0

interface FileMeta {
  fileName: string
  fileSize: number,
  chunkSize: number
  chunks: number
  created: Date
  fileMD5: string
  lastUpdated: string
}

export function genKey (fileMeta: Partial<FileMeta>, sampleFileBuffer: Buffer) {
  const now = Date.now()
  const metaBuf = new Buffer(FINGERMARK + (++keyCount) + JSON.stringify(fileMeta) + now)
  const time = Math.floor((now - TIMESTAMP) / PERIOD).toString(36)
  const key = '0' + time
  return key + crypto.createHash('md5').update(metaBuf).update(sampleFileBuffer).digest('hex')
}
