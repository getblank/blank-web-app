/**
 * Created by kib357 on 30/10/15.
 */

const webpack = require("webpack");
const HOT_SERVER_URL = "http://localhost:2816/";
const path = require("path");
const APP_DIR = path.resolve(__dirname, "./src");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

console.log("Loading webpack config...");
const REMOTEDIR = process.env.REMOTEDIR ? path.resolve(process.env.REMOTEDIR) : false;
module.exports = {
    mode: "development",
    entry: [
        "react-hot-loader/patch",
        `webpack-hot-middleware/client?reload=true&path=${HOT_SERVER_URL}__webpack_hmr`,
        "whatwg-fetch",
        "./src/js/app.js",
    ],
    devtool: "eval",
    devServer: {
        inline: true,
    },
    output: {
        path: "/",
        filename: "bundle.js",
        chunkFilename: "[name].js",
        publicPath: HOT_SERVER_URL,
    },
    resolve: {
        modules: [
            path.resolve(APP_DIR, "js"),
            path.resolve(__dirname, "blank-js-core"),
            path.resolve(__dirname, "src/lib"),
            path.resolve(__dirname, "node_modules"),
            "node_modules",
        ],
        alias: {
            constants: path.resolve(__dirname, "blank-js-core/constants.js"),
        },
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
        ],
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendors",
                    chunks: "initial",
                },
            },
        },
    },
    plugins: [
        new webpack.ContextReplacementPlugin(/moment[\\\/]locale$/, /^\.\/(en|ru)$/),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            REMOTEDIR: JSON.stringify(REMOTEDIR),
            // REMOTEDIR: JSON.stringify(path.resolve("/Users/sclif/golang/src/bitbucket.org/sclif13/testError/lib/reactComponents")),

        }),
        new BundleAnalyzerPlugin({
            analyzerMode: "static",
            reportFilename: path.resolve(__dirname, "release", "stats.html"),
            openAnalyzer: false,
        }),
    ],
};