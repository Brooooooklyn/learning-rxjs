import { Observable, Observer } from 'rxjs'

const stream = Observable.create((observer: Observer<number>) => {
  let i = 0
  const intervalId = setInterval(() => {
    observer.next(++i)
  }, 1000)
  return () => clearInterval(intervalId)
})

function createIntervalObservable(base: number) {
  let i = 0
  return Observable.create((observer: Observer<string>) => {
    const intervalId = setInterval(() => {
      observer.next(`base: ${base}, value: ${++i}`)
    }, 200)
    return () => {
      clearInterval(intervalId)
      console.log(`unsubscribe base: ${base}`)
    }
  })
}

stream.switchMap(createIntervalObservable)
  .subscribe(result => console.log(result))
