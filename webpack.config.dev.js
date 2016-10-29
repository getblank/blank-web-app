/**
 * Created by kib357 on 30/10/15.
 */
const webpack = require("webpack");
const HOT_SERVER_URL = "http://localhost:2816/";
var baseConfig = require("./webpack.config");
baseConfig.entry = [
    "react-hot-loader/patch",
    `webpack-hot-middleware/client?reload=true&path=${HOT_SERVER_URL}__webpack_hmr`,
    "whatwg-fetch",
    "./src/js/app.js",
];
baseConfig.devtool = "inline-source-map";
baseConfig.output = {
    path: "/",
    filename: "bundle.js",
    publicPath: HOT_SERVER_URL,
};
baseConfig.plugins = [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
];
baseConfig.devServer = { inline: true };
module.exports = baseConfig;