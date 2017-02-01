import * as Koa from 'koa'
import * as bodyParser from 'koa-bodyparser'
import Router from './router'
import './blls'

const config = require('config')

const app = new Koa

app.use(bodyParser())

Router.setRouters(app)

app.listen(config.port)

console.log(`app is listening on ${config.port}`)
