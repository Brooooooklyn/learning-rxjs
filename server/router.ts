import * as Koa from 'koa'
import * as KoaRouter from 'koa-router'

type ValidType = 'get' | 'post' | 'put' | 'delete'

type RouterConfig = {
  path: string
  method: ValidType
} | string

class Router {
  private static koaRouter = new KoaRouter()
  private static routerMap = new Map<any, RouterConfig>()
  private static routerSet = new Set<Function>()

  constructor() {
    const allowMethod = 'GET,PUT,DELETE,POST,OPTIONS'
    Router.koaRouter.options('*', async (ctx: KoaRouter.IRouterContext, next: any) => {
      ctx.status = 200
      ctx.res.setHeader('Allow', allowMethod)
      ctx.body = allowMethod
      await next()
    })
  }

  root(path: string) {
    return this.decorator(path)
  }

  get(path: string) {
    return this.decorator({
      path, method: 'get'
    })
  }

  post(path: string) {
    return this.decorator({
      path, method: 'post'
    })
  }

  put(path: string) {
    return this.decorator({
      path, method: 'put'
    })
  }

  delete(path: string) {
    return this.decorator({
      path, method: 'delete'
    })
  }

  setRouters(app: Koa): void {
    Router.routerMap.forEach((_, RouterClass) => new RouterClass())

    Router.routerSet.forEach(Func => Func())

    app.use(Router.koaRouter.routes())

    app.use(ctx => {
      ctx.res.setHeader('Access-Control-Allow-Origin', ctx.request.header.origin || '*')
      ctx.res.setHeader('Access-Control-Allow-Credentials', 'true')
      ctx.res.setHeader('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS')
      ctx.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, AUTHORIZATION, X-Socket-Id')
    })
  }

  private decorator(config: RouterConfig): Function {
    if (typeof config === 'string') {
      return function(target: any) {
        Router.routerMap.set(target, config)
      }
    } else {
      return function(target: any, _key: string, desc: PropertyDescriptor) {
        let path = config['path']
        const method = config['method']
        Router.routerSet.add(() => {
          const constructor = target.constructor
          const parentPath = Router.routerMap.get(constructor)
          if (typeof parentPath !== 'undefined') {
            path = parentPath + path
          }
          Router.koaRouter[method](path, async (ctx: KoaRouter.IRouterContext, next: any) => {
            let result: any
            try {
              result = await desc.value.call(target, ctx, next)
            } catch (e) {
              console.error(e)
              ctx.throw(400, e)
            }
            return result
          })
        })
      }
    }
  }
}

export default new Router
