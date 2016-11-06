const webpack = require('webpack')
const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// Webpack Config
const webpackConfig = {
  entry: {
    'main': './src/main.ts',
    'vendor': ['jquery', 'bootstrap', 'rxjs']
  },

  output: {
    path: './dist',
  },

  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(true),
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.js'),
    new ExtractTextPlugin('style.css'),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html',
      inject: true
    }),
    new webpack.ProvidePlugin({
      jQuery: 'jquery'
    })
  ],

  module: {
    loaders: [
      // .ts files for TypeScript
      { test: /\.ts$/, loader: 'ts' },
      { test: /\.css$/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader') },
      { test: /\.(eot|svg|ttf|woff|woff2)$/, loader: 'file-loader' },
      { test: /\.html$/, loader: 'raw-loader' }
    ]
  }

}

// Our Webpack Defaults
const defaultConfig = {
  devtool: 'cheap-module-source-map',
  cache: true,
  debug: true,
  output: {
    filename: '[name].js'
  },

  resolve: {
    root: [ path.join(__dirname, 'src') ],
    extensions: ['', '.ts', '.js'],
    alias: {
      'bootstrap': path.join(process.cwd(), 'node_modules/bootstrap/dist/js/npm.js'),
      'bootstrap.min.css': path.join(process.cwd(), 'node_modules/bootstrap/dist/css/bootstrap.min.css')
    }
  },

  devServer: {
    historyApiFallback: true,
    watchOptions: { aggregateTimeout: 300, poll: 1000 }
  },

  node: {
    global: 1,
    crypto: 'empty',
    module: 0,
    Buffer: 0,
    clearImmediate: 0,
    setImmediate: 0
  }
}

const webpackMerge = require('webpack-merge')
module.exports = webpackMerge(defaultConfig, webpackConfig)