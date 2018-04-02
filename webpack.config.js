const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CheckerPlugin } = require('awesome-typescript-loader')

// Webpack Config
const webpackConfig = {
  entry: {
    'main': './src/main.ts'
  },

  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    publicPath: '/'
  },

  plugins: [
    new CheckerPlugin(),
    new webpack.HotModuleReplacementPlugin(),
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

  mode: 'development',

  module: {
    rules: [
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
        loaders: [
          'style-loader',
          'css-loader',
        ]
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