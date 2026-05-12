const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const isDev = process.env.NODE_ENV !== 'production';
const header = fs.readFileSync(path.resolve(__dirname, 'src/partials/header.html'), 'utf8');
const footer = fs.readFileSync(path.resolve(__dirname, 'src/partials/footer.html'), 'utf8');

const pages = [
  { template: 'src/pages/home.html', filename: 'index.html' },
  { template: 'src/pages/ajuda.html', filename: 'pages/ajuda.html' },
  { template: 'src/pages/aplicativo-movel-gratis.html', filename: 'pages/aplicativo-movel-gratis.html' },
  { template: 'src/pages/artistas.html', filename: 'pages/artistas.html' },
  { template: 'src/pages/baixar.html', filename: 'pages/baixar.html' },
  { template: 'src/pages/cookies.html', filename: 'pages/cookies.html' },
  { template: 'src/pages/desenvolvedores.html', filename: 'pages/desenvolvedores.html' },
  { template: 'src/pages/empregos.html', filename: 'pages/empregos.html' },
  { template: 'src/pages/entrar.html', filename: 'pages/entrar.html' },
  { template: 'src/pages/imprensa.html', filename: 'pages/imprensa.html' },
  { template: 'src/pages/inscrever-se.html', filename: 'pages/inscrever-se.html' },
  { template: 'src/pages/legal.html', filename: 'pages/legal.html' },
  { template: 'src/pages/lgpd.html', filename: 'pages/lgpd.html' },
  { template: 'src/pages/marcas.html', filename: 'pages/marcas.html' },
  { template: 'src/pages/novidades.html', filename: 'pages/novidades.html' },
  { template: 'src/pages/player.html', filename: 'pages/player.html' },
  { template: 'src/pages/premium.html', filename: 'pages/premium.html' },
  { template: 'src/pages/privacidade-termos.html', filename: 'pages/privacidade-termos.html' },
  { template: 'src/pages/privacidade.html', filename: 'pages/privacidade.html' },
  { template: 'src/pages/sobre.html', filename: 'pages/sobre.html' },
  { template: 'src/pages/suporte.html', filename: 'pages/suporte.html' },
  { template: 'src/pages/termos.html', filename: 'pages/termos.html' },
];

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: {
    app: './src/js/app.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[contenthash].js',
    publicPath: '/', 
    clean: true,
  },
  devtool: isDev ? 'eval-source-map' : false,
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
      publicPath: '/',
    },
    port: 3001,
    hot: true,
    open: true,
    compress: true,
    watchFiles: ['src/**/*'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      assets: path.resolve(__dirname, 'src/assets'),
      css: path.resolve(__dirname, 'src/css'),
      vendor: path.resolve(__dirname, 'src/vendor'),
      partials: path.resolve(__dirname, 'src/partials'),
      pages: path.resolve(__dirname, 'src/pages'),
      js: path.resolve(__dirname, 'src/js'),
    },
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        use: [{
          loader: 'html-loader',
          options: {
            esModule: false,
            sources: false,
            minimize: !isDev,
            preprocessor: (content) =>
              content
                .replace(/<div id="header-placeholder"><\/div>/g, header)
                .replace(/<div id="footer-placeholder"><\/div>/g, footer),
          },
        }],
      },
      {
        test: /\.css$/i,
        use: [isDev ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/imagens/[name].[contenthash][ext]',
        },
      },
      {
        test: /\.(mp3|wav|ogg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/media/[name].[contenthash][ext]',
        },
      },
      {
        test: /\.(woff2?|ttf|eot|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name].[contenthash][ext]',
        },
      },
    ],
  },
  plugins: [
    ...pages.map(
      (page) =>
        new HtmlWebpackPlugin({
          template: page.template,
          filename: page.filename,
          inject: 'body',
          scriptLoading: 'defer',
          minify: !isDev,
        })
    ),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
  ],
};