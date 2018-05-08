/**
 * Created by kib357 on 30/10/15.
 */

const webpack = require("webpack");
const path = require("path");
const APP_DIR = path.resolve(__dirname, "./src");

console.log("Loading webpack config...");
module.exports = env => {
    const REMOTEDIR = env && env.REMOTEDIR ? path.resolve(env.REMOTEDIR) : false;
    return {
        mode: "production",
        entry: ["whatwg-fetch", "./src/js/app.js"],
        output: {
            path: path.resolve("release"),
            filename: "bundle.js",
            chunkFilename: "[name].js",
            publicPath: "/assets/blank/js/",
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
                        options: {
                            presets: ["react", "env", "stage-0"],
                            comments: true,
                        },
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
            new webpack.DefinePlugin({
                REMOTEDIR: JSON.stringify(REMOTEDIR),
            }),
        ],
    };
};