import { observableToBeFn } from 'rxjs/testing/TestScheduler';
import { setTimeout } from 'timers';
import { Observable, Observer } from 'rxjs'
import { retry } from 'rxjs/operator/retry';
let dbIndex = 0
const searchStorage = new Map<number, string>()

export interface PostResponse {
  _id: number
  value: string
}

const random = (begin: number, end: number) => {
  return begin + Math.floor((end - begin) * Math.random()) + 1
}

export const search = (inputValue: string): Observable<string | null> => {
  return Observable.create((observer: Observer<string | null>) => {
    const timmer = setTimeout(() => {
      let result: string = null
      for (let [key, value] of searchStorage) {
        if (value.indexOf(inputValue) !== -1) {
          result = value
          break
        }
      }
      observer.next(result)
      observer.complete()
    }, random(10, 700))
    return () => {
      clearTimeout(timmer)
      console.warn('search canceled')
    }
  })
}

export const mockHttpPost = (value: string): Observable<PostResponse> => {
  return Observable.create((observer: Observer<PostResponse>) => {
    const timmer = setTimeout(() => {
      const result = {
        _id: ++dbIndex, value
      }
      searchStorage.set(result._id, result.value)
      observer.next(result)
      observer.complete()
    }, random(10, 1000))
    return () => {
      clearTimeout(timmer)
      console.warn('post canceled')
    }
  })
}

export const mockDelete = (id: number): Observable<boolean> => {
  return Observable.create((observer: Observer<boolean>) => {
    const timmer = setTimeout(() => {
      searchStorage.delete(id)
      observer.next(true)
      observer.complete()
    }, random(10, 1000))
    return () => {
      clearTimeout(timmer)
      console.warn('post canceled')
    }
  })
}
