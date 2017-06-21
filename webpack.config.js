const webpack = require('webpack')
const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CheckerPlugin } = require('awesome-typescript-loader')

// Webpack Config
const webpackConfig = {
  entry: {
    'main': './src/main.ts',
    'vendor': ['jquery', 'bootstrap', 'rxjs']
  },

  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    publicPath: '/'
  },

  plugins: [
    new CheckerPlugin(),
    new webpack.optimize.CommonsChunkPlugin({ name: 'vendor', filename: 'vendor.js' }),
    new ExtractTextPlugin('style.css'),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html',
      inject: true
    }),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery'
    })
  ],

  module: {
    loaders: [
      {
        test: /\.ts?$/,
        exclude: /node_modules/,
        loader: 'tslint-loader',
        options: {
          typeCheck: true
        },
        enforce: 'pre',
      },
      {
        test: /\.js$/,
        loader: 'source-map-loader',
        include: /rxjs/,
        enforce: 'pre',
      },
      {
        test: /\.ts$/,
        use: 'awesome-typescript-loader'
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
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
    ]
  }

}

const defaultConfig = {
  devtool: 'cheap-module-source-map',
  cache: true,

  resolve: {
    modules: [ path.join(__dirname, 'src'), 'node_modules' ],
    extensions: ['.ts', '.js'],
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
    global: true,
    crypto: false,
    module: false,
    Buffer: false,
    clearImmediate: false,
    setImmediate: false
  }
}

const webpackMerge = require('webpack-merge')
module.exports = webpackMerge(defaultConfig, webpackConfig)