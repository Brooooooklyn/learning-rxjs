const webpack = require('webpack')
const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const webpackConfig = {
  entry: {
    'main': './src/main.ts',
    'vendor': ['jquery', 'bootstrap', 'rxjs']
  },

  output: {
    path: path.join(process.cwd(), './dist')
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.js'
    }),
    new ExtractTextPlugin('style.css'),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NodeEnvironmentPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html',
      inject: true,
    }),
    new webpack.ProvidePlugin({
      '$': 'jquery',
      jQuery: 'jquery',
    })
  ],
  module: {
    rules: [
      {
        test: /\.ts/,
        use: 'ts-loader'
      },
      {
        test: /\.css/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use:"css-loader",
        })
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: 'file-loader'
      },
      {
        test: /\.html$/,
        use: 'raw-loader'
      }
    ],
  }
}

const defaultConfig = {
  devtool: 'cheap-module-source-map',
  cache: true,
  output: {
    filename: '[name].js'
  },
  resolve: {
    modules: [path.join(__dirname, 'src'), "node_modules"],
    extensions: ['.ts', '.js'],
    alias: {
      'bootstrap': path.join(process.cwd(), 'node_modules/bootstrap/dist/js/npm.js'),
      'bootstrap.min.css': path.join(process.cwd(), 'node_modules/bootstrap/dist/css/bootstrap.min.css')
    },
  },
  devServer: {
    historyApiFallback: true,
    watchOptions: {aggregateTimeout: 300, poll: 1000 }
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      debug: true
    })
  ],
  node: {
    global: true,
    crypto: 'empty',
    module: false,
    Buffer: false,
    clearImmediate: false,
    setImmediate: false
  },
  stats: {
    errorDetails: true,
    cached: true,
  }
}
const webpackMerge = require('webpack-merge')
module.exports = webpackMerge(defaultConfig, webpackConfig)