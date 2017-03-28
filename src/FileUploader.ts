import { Observable, Subscriber, Subject } from 'rxjs'
// spark-md5 没有第三方 .d.ts 文件，这里用 commonjs 风格的 require 它
// 如果未再 tsconfig.json 中设置 noImplicitAny: true 且 TypeScript 版本大于 2.1 则也可以用
// import * as SparkMD5 from 'spark-md5' 的方式引用
const SparkMD5 = require('spark-md5')
// @warn memory leak
const $attachment = document.querySelector('.attachment')
const $progressBar = document.querySelector('.progress-bar') as HTMLElement
const apiHost = 'http://127.0.0.1:5000/api'

interface FileInfo {
  fileSize: number
  fileMD5: string
  lastUpdated: string
  fileName: string
}

interface ChunkMeta {
  fileSize: number
  chunkSize: number
  chunks: number
  fileKey: string
}

type Action = 'pause' | 'resume' | 'progress' | 'complete'

export class FileUploader {

  private file$ = Observable.fromEvent($attachment, 'change')
    .map((r: Event) => (r.target as HTMLInputElement).files[0])
    .filter(f => !!f)

  private click$ = Observable.fromEvent($attachment, 'click')
    .map((e: Event) => e.target)
    .filter((e: HTMLElement) => e === $attachment)
    .scan((acc: number, val: HTMLElement) => {
      if (val.classList.contains('glyphicon-paperclip')) {
        return 1
      }
      if (acc === 2) {
        return 3
      }
      return 2
    }, 3)
    .filter(v => v !== 1)
  	.do((v) => {
      console.log(v)
      if (v === 2) {
        this.action$.next({ name: 'pause' })
        $attachment.classList.remove('glyphicon-pause')
        $attachment.classList.add('glyphicon-play')
      } else {
        this.action$.next({ name: 'resume' })
        this.buildPauseIcon()
      }
    })
    .map(v => ({ action: v === 2 ? 'PAUSE' : 'RESUME', payload: null }))

  private action$ = new Subject<{
    name: Action
    payload?: any
  }>()

  private pause$ = this.action$.filter(ac => ac.name === 'pause')
  private resume$ = this.action$.filter(ac => ac.name === 'resume')

  private progress$ = this.action$
    .filter(action => action.name === 'progress')
    .map(action => action.payload)
    .distinctUntilChanged((x: number, y: number) => x - y >= 0)
  	.do((r: number) => {
      const percent = Math.round(r * 100)
      $progressBar.style.width = `${percent}%`
      $progressBar.firstElementChild.textContent = `${percent > 1 ? percent - 1 : percent} %`
  	})
    .map(r => ({ action: 'PROGRESS', payload: r }))

  uploadStream$ = this.file$
    .switchMap(this.readFileInfo)
    .switchMap(i => Observable.ajax
      .post(`${apiHost}/upload/chunk`, i.fileinfo)
      .map((r) => {
        const blobs = this.slice(i.file, r.response.chunks, r.response.chunkSize)
        return { blobs, chunkMeta: r.response, file: i.file }
      })
    )
    .do(() => this.buildPauseIcon())
    .switchMap(({ blobs, chunkMeta, file }) => {
      const uploaded: number[] = []
      const dists = blobs.map((blob, index) => {
        let currentLoaded = 0
        return this.uploadChunk(chunkMeta, index, blob)
          .do(r => {
            currentLoaded = r.loaded / file.size
            uploaded[index] = currentLoaded
            const percent = uploaded.reduce((acc, val) => acc + (val ? val : 0))
            this.action$.next({ name: 'progress', payload: percent })
          })
      })

      const uploadStream = Observable.from(dists)
        .mergeAll(this.concurrency)

      return Observable.forkJoin(uploadStream)
        .mapTo(chunkMeta)
    })
    .switchMap((r: ChunkMeta) => Observable.ajax.post(`${apiHost}/upload/chunk/${r.fileKey}`)
      .mapTo({
        action: 'UPLOAD_SUCCESS',
        payload: r
      })
    )
    .do(() => {
      $progressBar.firstElementChild.textContent = '100 %'
      // restore icon
      $attachment.classList.remove('glyphicon-pause')
      $attachment.classList.add('glyphicon-paperclip');
      ($attachment.firstElementChild as HTMLInputElement).disabled = false
    })
    .merge(this.progress$, this.click$)

  constructor(
    private concurrency = 3
  ) { }

  // side effect
  private buildPauseIcon() {
    $attachment.classList.remove('glyphicon-paperclip')
    $attachment.classList.add('glyphicon-pause');
    ($attachment.firstElementChild as HTMLInputElement).disabled = true
  }

  private readFileInfo(file: File): Observable<{ file: File, fileinfo: FileInfo }> {
    const reader = new FileReader()
    const spark = new SparkMD5.ArrayBuffer()
    reader.readAsArrayBuffer(file)
    return Observable.create((observer: Subscriber<{ file: File, fileinfo: FileInfo }>) => {
      reader.onload = (e: Event) => {
        spark.append((e.target as FileReader).result)
        const fileMD5 = spark.end()
        observer.next({
          file, fileinfo: {
            fileMD5, fileSize: file.size,
            lastUpdated: file.lastModifiedDate.toISOString(),
            fileName: file.name
          }
        })
        observer.complete()
      }
      return () => {
        if (!reader.result) {
          console.warn('read file aborted')
          reader.abort()
        }
      }
    })
  }

  private slice(file: File, n: number, chunkSize: number): Blob[] {
    const result: Blob[] = []
    for (let i = 0; i < n; i ++) {
      const startSize = i * chunkSize
      const slice = file.slice(startSize, i === n - 1 ? startSize + (file.size - startSize) : (i + 1) * chunkSize)
      result.push(slice)
    }
    return result
  }

  private uploadChunk(meta: ChunkMeta, index: number, blob: Blob): Observable<ProgressEvent> {
    const host = `${apiHost}/upload/chunk/${meta.fileKey}?chunk=${index + 1}&chunks=${meta.chunks}`
    return Observable.create((subscriber: Subscriber<ProgressEvent>) => {
      const ajax$ = Observable.ajax({
        url: host,
        body: blob,
        method: 'post',
        crossDomain: true,
        headers: { 'Content-Type': 'application/octet-stream' },
        progressSubscriber: subscriber
      })
        .takeUntil(this.pause$)
        .repeatWhen(() => this.resume$)
      const subscription = ajax$.subscribe()
      return () => subscription.unsubscribe()
    })
      .retryWhen(() => this.resume$)
  }
}
