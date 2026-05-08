const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
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

const header = fs.readFileSync( path.resolve(__dirname, 'src/partials/header.html'), 'utf8' );
const footer = fs.readFileSync( path.resolve(__dirname, 'src/partials/footer.html'), 'utf8' );
const createPage = (template, output) =>
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, template),
    filename: output,
    inject: 'body',
    scriptLoading: 'defer',
    minify: !isDev,
  });

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: './src/js/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/main.[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  devtool: isDev ? 'eval-source-map' : false,
  devServer: {
    static: { directory: path.resolve(__dirname, 'dist'), },
    port: 3001,
    hot: true,
    open: true,
    compress: true,
    watchFiles: ['src/**/*'],
  },

  module: {
    rules: [
      {
        test: /\.html$/i,
        exclude: /node_modules/,
        use: [
          {
            loader: 'html-loader',
            options: {
              esModule: false,
              minimize: false,
              sources: {
                list: [ '...', ],
              },
              preprocessor: (content) => {
                return content
                  .replace(/<%=\s*require\(['"]\.\.\/partials\/header\.html['"]\)\s*%>/g, header )
                  .replace(/<%=\s*require\(['"]\.\.\/partials\/footer\.html['"]\)\s*%>/g, footer );
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader',
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/imagens/[name].[contenthash][ext]', },
      },
      {
        test: /\.(woff2?|ttf|eot|otf)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/fonts/[name][ext]', },
      },
      {
        test: /\.(mp3|wav)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/media/[name].[contenthash][ext]', },
      },
    ],
  },

  plugins: [
    createPage( 'src/pages/home.html', 'index.html' ),
    ...pages.map((page) => createPage( `src/pages/${page}`, `pages/${page}` )),
    new MiniCssExtractPlugin({ filename: 'css/[name].[contenthash].css', }),
    new webpack.ProvidePlugin({ $: 'jquery', jQuery: 'jquery', }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      jquery: path.resolve(__dirname, 'src/vendor/jquery/jquery.min.js' ),
    },
  },
};