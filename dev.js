const webpack = require("webpack");
const webpackConfig = require("./webpack.config.dev");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const compiler = webpack(webpackConfig);
const app = require("express")();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
}));
app.use(webpackHotMiddleware(compiler));

app.listen(2816, (err) => {
    if (err) {
        return console.error(err.message);
    }
});