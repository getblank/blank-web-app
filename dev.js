const webpack = require("webpack");
const webpackConfig = require("./webpack.config.dev");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const compiler = webpack(webpackConfig);
const app = require("express")();

app.use(webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
}));
app.use(webpackHotMiddleware(compiler));

app.listen(2816, (err) => {
    if (err) {
        return console.error(err.message);
    }
});