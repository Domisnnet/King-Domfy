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

const headerPartial = fs.readFileSync( 
  path.resolve(__dirname, 'src/partials/header.html'), 'utf8' );
const footerPartial = fs.readFileSync( 
  path.resolve(__dirname,  'src/partials/footer.html'), 'utf8' );
const htmlPages = pages.map((page) => {
  return new HtmlWebpackPlugin({
    template: path.resolve(__dirname, `src/pages/${page}`),
    filename: `pages/${page}`,
    inject: 'body',
    scriptLoading: 'defer',
    minify: !isDev,
    templateParameters: {
      header: headerPartial,
      footer: footerPartial,
    },
  });
});

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: path.resolve(__dirname, 'src/js/app.js'),
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
        loader: 'html-loader',
        options: {
          esModule: false,
          sources: { list: ['...'], },
          minimize: false,
        },
      },
      {
        test: /\.css$/i,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/imagens/[name].[contenthash][ext]', },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
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
    new HtmlWebpackPlugin({
      template: path.resolve( __dirname, 'src/pages/home.html' ),
      filename: 'index.html',
      inject: 'body',
      scriptLoading: 'defer',
      minify: !isDev,
      templateParameters: { header: headerPartial, footer: footerPartial, },
    }),
    ...htmlPages,
    new MiniCssExtractPlugin({ filename: 'css/[name].[contenthash].css', }),
    new webpack.ProvidePlugin({ $: 'jquery', jQuery: 'jquery', }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      jquery: path.resolve( __dirname, 'src/vendor/jquery/jquery.min.js' ),
    },
  },
};