const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const isDev = process.env.NODE_ENV !== 'production';
const pages = [
  'ajuda.html',
  'aplicativo-movel-gratis.html',
  'artistas.html',
  'baixar.html',
  'cookies.html',
  'desenvolvedores.html',
  'empregos.html',
  'entrar.html',
  'imprensa.html',
  'inscrever-se.html',
  'legal.html',
  'lgpd.html',
  'marcas.html',
  'novidades.html',
  'player.html',
  'premium.html',
  'privacidade-termos.html',
  'privacidade.html',
  'sobre.html',
  'suporte.html',
  'termos.html',
];

const header = fs.readFileSync(path.resolve(__dirname, 'src/partials/header.html'), 'utf8');
const footer = fs.readFileSync(path.resolve(__dirname, 'src/partials/footer.html'), 'utf8');

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: './src/js/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 3001,
    hot: true,
    open: true,
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        use: [{
          loader: 'html-loader',
          options: {
            preprocessor: (content) => content
              .replace(/<id>header-placeholder<\/id>/g, header)
              .replace(/<id>footer-placeholder<\/id>/g, footer)
          }
        }]
      },
      {
        test: /\.css$/i,
        use: [isDev ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/imagens/[name].[contenthash][ext]' },
      },
      {
        test: /\.(mp3|wav)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/media/[name].[contenthash][ext]' },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/pages/home.html',
      filename: 'index.html',
      inject: true,
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/player.html',
      filename: 'pages/player.html',
      inject: true,
    }),
    new MiniCssExtractPlugin({ filename: 'css/[name].[contenthash].css' }),
  ],
};