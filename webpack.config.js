const path = require('path');

module.exports = {
  entry: {
    index: './index.js',
    // md5: './md5.js',
    gcidWorker: './gcid.worker.ts',
    gcid: './gcid.ts'
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.worker\.js$/,
        loader: 'worker-loader',
        options: { inline: true, fallback: false }
      }
    ],
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
};