import { Observable, Observer } from 'rxjs'

let dbIndex = 0
const searchStorage = new Map<number, HttpResponse>()

export interface HttpResponse {
  _id: number
  value: string
  isDone: boolean
}

const random = (begin: number, end: number) => {
  return begin + Math.floor((end - begin) * Math.random()) + 1
}

export const search = (inputValue: string): Observable<HttpResponse | null> => {
  return Observable.create((observer: Observer<HttpResponse | null>) => {
    let status = 'pending'
    const timmer = setTimeout(() => {
      let result: HttpResponse = null
      for (const [key, data] of searchStorage) {
        if (data.value === inputValue) {
          result = data
          break
        }
      }
      status = 'done'
      observer.next(result)
      observer.complete()
    }, random(400, 1200))
    return () => {
      clearTimeout(timmer)
      if (status === 'pending') {
        console.warn('search canceled')
      }
    }
  })
}

export const mockHttpPost = (value: string): Observable<HttpResponse> => {
  return Observable.create((observer: Observer<HttpResponse>) => {
    let status = 'pending'
    const timmer = setTimeout(() => {
      const result = {
        _id: ++dbIndex, value,
        isDone: false
      }
      searchStorage.set(result._id, result)
      status = 'done'
      observer.next(result)
      observer.complete()
    }, random(10, 1000))
    return () => {
      clearTimeout(timmer)
      if (status === 'pending') {
        console.warn('post canceled')
      }
    }
  })
}

export const mockToggle = (id: string, isDone: boolean): Observable<HttpResponse> => {
  return Observable.create((observer: Observer<HttpResponse>) => {
    let status = 'pending'
    const timmer = setTimeout(() => {
      const result = searchStorage.get(parseInt(id))
      result.isDone = !isDone
      searchStorage.set(result._id, result)
      status = 'done'
      observer.next(result)
      observer.complete()
    }, random(10, 1000))
    return () => {
      clearTimeout(timmer)
      if (status === 'pending') {
        console.warn('post canceled')
      }
    }
  })
}

export const mockDelete = (id: number): Observable<boolean> => {
  return Observable.create((observer: Observer<boolean>) => {
    let status = 'pending'
    const timmer = setTimeout(() => {
      searchStorage.delete(id)
      status = 'done'
      observer.next(true)
      observer.complete()
    }, random(10, 1000))
    return () => {
      clearTimeout(timmer)
      if (status === 'pending') {
        console.warn('delete canceled')
      }
    }
  })
}

export const createTodoItem = (data: HttpResponse) => {
  const result = <HTMLLIElement>document.createElement('LI')
  result.classList.add('list-group-item', `todo-item-${data._id}`)
  result.setAttribute('data-id', `${data._id}`)
  const innerHTML = `
    ${data.value}
    <button type="button" class="btn btn-default button-remove pull-right" aria-label="right Align">
      <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
    </button>
  `
  result.innerHTML = innerHTML
  return result
}
