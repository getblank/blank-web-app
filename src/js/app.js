"use strict";

import React from "react";
import { render } from "react-dom";
import App from "./components/App";
import timeStore from "./stores/timeStore";
import history from "./stores/historyStore";
import NavGroup from "./components/layouts/NavGroup";
import StoreView from "./components/layouts/StoreView";
import SingleStoreView from "./components/layouts/SingleStoreView";
import ItemView from "./components/item/ItemView";
import ConfigViewer from "./components/config/ConfigViewer";

var NotFoundHandler = React.createClass({
    render: function () {
        return (
            <div className="container">
                <h2>Страница не найдена</h2>
            </div>
        );
    },
});

//Registering route components from app.js to resolve circular dependency
history.__componentsMap = new Map([
    ["StoreView", StoreView],
    ["SingleStoreView", SingleStoreView],
    ["NavGroup", NavGroup],
    ["ItemView", ItemView],
    ["ConfigViewer", ConfigViewer],
    ["NotFoundHandler", NotFoundHandler],
]);

render(<App />, document.getElementById("app-container"));

if (module.hot) {
    module.hot.accept("./components/App", () => {
        const AppContainer = require("./components/App").default;
        render(
            <AppContainer />,
            document.getElementById("app-container")
        );
    });
}

if (!String.prototype.repeat) {
    String.prototype.repeat = function (count) {
        "use strict";
        if (this == null) {
            throw new TypeError("can't convert " + this + " to object");
        }
        var str = "" + this;
        count = +count;
        if (count != count) {
            count = 0;
        }
        if (count < 0) {
            throw new RangeError("repeat count must be non-negative");
        }
        if (count == Infinity) {
            throw new RangeError("repeat count must be less than infinity");
        }
        count = Math.floor(count);
        if (str.length == 0 || count == 0) {
            return "";
        }
        // Обеспечение того, что count является 31-битным целым числом, позволяет нам значительно
        // соптимизировать главную часть функции. Впрочем, большинство современных (на август
        // 2014 года) браузеров не обрабатывают строки, длиннее 1 << 28 символов, так что:
        if (str.length * count >= 1 << 28) {
            throw new RangeError("repeat count must not overflow maximum string size");
        }
        var rpt = "";
        for (; ;) {
            if ((count & 1) == 1) {
                rpt += str;
            }
            count >>>= 1;
            if (count == 0) {
                break;
            }
            str += str;
        }
        return rpt;
    };
}