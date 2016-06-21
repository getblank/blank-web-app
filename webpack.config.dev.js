/**
 * Created by kib357 on 30/10/15.
 */

var baseConfig = require("./webpack.config");
baseConfig.entry = "./src/js/dev.js";
baseConfig.devtool = "inline-source-map";
baseConfig.output = {
    path: "./dist",
    filename: "bundle.js",
    publicPath: "/js/",
};
module.exports = baseConfig;