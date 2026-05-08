const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const isDev = process.env.NODE_ENV !== 'production';

const pages = [
  "ajuda.html", "aplicativo-movel-gratis.html", "artistas.html", "baixar.html",
  "cookies.html", "desenvolvedores.html", "empregos.html", "entrar.html",
  "imprensa.html", "inscrever-se.html", "legal.html", "lgpd.html", "marcas.html",
  "novidades.html", "player.html", "premium.html", "privacidade-termos.html",
  "privacidade.html", "sobre.html", "suporte.html", "termos.html"
];

const htmlPlugins = pages.map(page =>
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, 'src/pages', page),
    filename: `pages/${page}`,
    inject: 'body',
    minify: !isDev,
  })
);

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: path.resolve(__dirname, 'src/js/app.js'),
  output: {
    filename: 'js/[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.html$/i,
        exclude: /src\/pages/,
        use: [
          {
            loader: 'html-loader',
            options: {
              esModule: false, 
              sources: {
                list: ['...'],
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/imagens/[name].[contenthash][ext]',
        },
      },
      {
        test: /\.(mp3|wav)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/media/[name].[contenthash][ext]',
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]',
        },
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/pages/home.html'),
      filename: 'index.html',
      inject: 'body',
      minify: !isDev,
    }),

    ...htmlPlugins,
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),

    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'jquery': path.resolve(__dirname, 'src/vendor/jquery/jquery.min.js'),
    },
  },

  devServer: {
    port: 3001,
    open: true,
    hot: true,
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    watchFiles: ['src/**/*'],
  },
};