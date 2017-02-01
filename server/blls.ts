import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import * as rawBody from 'raw-body'
import Router from './router'
import { IRouterContext } from 'koa-router'
import { genKey } from './utils'

const config = require('config')

interface FileMeta {
  name: string
  chunks: number
}

@Router.root('/api')
export class Blls {

  private static fileKeyPairs = new Map<string, FileMeta>()

  @Router.post('/upload/chunk')
  async getChunksMeta(ctx: IRouterContext, next: KoaNext) {
    const {
      fileSize,
      fileMD5,
      lastUpdated,
      fileName
    } = ctx.request.body
    const fileInfo = { fileSize, fileMD5, lastUpdated, fileName }
    const chunkSize = config.CHUNK_SIZE
    const chunks = Math.ceil(fileSize / chunkSize)
    const buffer = Buffer.concat([new Buffer(JSON.stringify(fileInfo)), crypto.randomBytes(1024)])
    const fileKey = genKey(fileInfo, buffer)
    Blls.fileKeyPairs.set(fileKey, {
      name: fileName, chunks
    })
    ctx.body = { chunkSize, chunks, fileKey }
    await next()
  }

  @Router.post('/upload/chunk/:fileKey')
  upload(ctx: IRouterContext, next: KoaNext) {
    const { chunk, chunks } = ctx.request.query
    if (chunk && chunks) {
      return this.uploadChunk(ctx, next)
    } else if (!chunk && !chunks) {
      return this.settle(ctx, next)
    } else {
      ctx.body = 'bad request'
      ctx.status = 400
      return next()
    }
  }

  async uploadChunk(ctx: IRouterContext, next: KoaNext) {
    const { fileKey } = ctx.params
    const { chunk, chunks } = ctx.request.query
    const raw = await new Promise((resolve, reject) => {
      rawBody(ctx.req, {
        length: ctx.req.headers['content-length']
      }, (err, body) => {
        if (err) {
          reject(err)
        }
        resolve(body)
      })
    })
    try {
      await new Promise((resolve, reject) => {
        const fileName = `${fileKey}_${chunk}`
        const dir = path.join(process.cwd(), `chunks`)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir)
        }
        fs.writeFile(`${dir}/${fileName}`, raw, (err) => {
          if (err) {
            reject(err)
          }
          resolve()
        })
      })
    } catch (e) {
      ctx.body = e.message ? e.message : e
      ctx.status = 500
      await next(e)
    }
    ctx.body = 'ok'
    await next()
  }

  async settle(ctx: IRouterContext, next: KoaNext) {
    const { fileKey } = ctx.params
    const { name, chunks } = Blls.fileKeyPairs.get(fileKey)
    const dir = path.join(process.cwd(), `chunks`)
    const promises: Promise<any>[] = []
    let blob: Buffer
    for (let i = 1; i <= chunks ; i ++) {
      const path = `${dir}/${fileKey}_${i}`
      const promise = this.readFileAsPromise(path)
        .then(newBlob => {
          blob = !blob ? newBlob : Buffer.concat([blob, newBlob])
          return this.deleteFileAsPromise(path)
        })
      promises.push(promise)
    }
    try {
      await Promise.all(promises)
      await this.writeFileAsPromise(`${dir}/${name}`, blob)
    } catch (e) {
      ctx.status = 500
      ctx.body = e.message ? e.message : e
      return await next(e)
    }
    ctx.body = 'ok'
    await next()
  }

  private writeFileAsPromise(path: string, blob: Buffer) {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, blob, (err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }

  private readFileAsPromise(path: string) {
    return new Promise<Buffer>((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if (err) {
          reject(err)
        }
        resolve(data)
      })
    })
  }

  private deleteFileAsPromise(path: string) {
    return new Promise((resolve, reject) => {
      fs.unlink(path, (err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }
}
