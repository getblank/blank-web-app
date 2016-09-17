/**
 * Created by kib357 on 30/10/15.
 */

var baseConfig = require("./webpack.config");
baseConfig.entry = ["whatwg-fetch", "./src/js/dev.js"];
baseConfig.devtool = "inline-source-map";
baseConfig.output = {
    path: "./dist",
    filename: "bundle.js",
    publicPath: "/blank/js/",
};
module.exports = baseConfig;