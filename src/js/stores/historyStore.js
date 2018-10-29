/**
 * Created by kib357 on 16/09/15.
 */

import React from "react";
import BaseStore from "./baseStore.js";
import configStore from "./configStore.js";
import { serverActions, userActions } from "constants";
import uuid from "uuid";
import path from "path";

class History extends BaseStore {
    constructor() {
        super();
        const matched = window.location.pathname.match(/.*\/app\/(.*)/);
        if (!matched) {
            window.location.pathname = window.location.pathname + "/";
        }

        this.__componentsMap = new Map();
        this.getCurrentPath = this.getCurrentPath.bind(this);
        this.params = new Map();
        this.routes = null;
        this.currentRoute = null;
        this.currentPath = this.getCurrentPath();
        this.createChild = this.createChild.bind(this);
        this.updateCurrentRoute = this.updateCurrentRoute.bind(this);
    }

    __onDispatch(payload) {
        this.__dispatcher.waitFor([configStore.getDispatchToken()]);
        switch (payload.actionType) {
            case userActions.ROUTE_CHANGE: {
                const { path: newPath, itemVersion, itemVersionDisplay } = payload;
                if (this.currentPath === newPath && !itemVersion) {
                    return;
                }

                this.currentPath = newPath;
                this.itemVersion = itemVersion === "latest" ? null : itemVersion;
                this.itemVersionDisplay = itemVersion === "latest" ? null : itemVersionDisplay;
                this.updateCurrentRoute();
                return;
            }
            case serverActions.UPDATE_CONFIG:
                this.setRoutes();
                this.__emitChange();
                break;
        }
    }

    updateCurrentRoute() {
        this.params.clear();
        const { currentPath: path, itemVersion, itemVersionDisplay } = this;
        if (itemVersion) {
            this.params.set("itemVersion", itemVersion);
        }
        if (itemVersionDisplay) {
            this.params.set("itemVersionDisplay", itemVersionDisplay);
        }

        const levels = path.split("/").filter(e => e);
        let res = { components: [], rendered: [], levels: [] };
        let levelRoutes = this.routes.children || [];
        if (levels.length === 0) {
            if (this.routes.component) {
                levels.push("/");
                levelRoutes = [this.routes];
            }
        }

        for (const level of levels) {
            res.levels.push(level);
            let match = null;
            for (const route of levelRoutes) {
                if (route.path === level || route.path.indexOf(":") === 0) {
                    match = route;
                    levelRoutes = route.children || [];
                    if (route.path.indexOf(":") === 0) {
                        this.params.set(route.path.slice(1), level);
                    }
                    break;
                }
            }
            if (match == null) {
                res = null;
                break;
            } else {
                res.components.push(match.component);
            }
        }

        const changed =
            (this.currentRoute && JSON.stringify(this.currentRoute.components)) !==
            (res && JSON.stringify(res.components));
        if (!changed && this.currentRoute != null) {
            res.rendered = this.currentRoute.rendered;
        }
        this.currentRoute = res;
        if (changed) {
            this.__emitChange();
        }
    }

    createChild(parent, props) {
        if (this.currentRoute == null) {
            return null;
        }
        var element = null;
        if (parent == null) {
            this.currentRoute.rendered.length = 0;
        }
        for (var i = -1; i < this.currentRoute.rendered.length; i++) {
            var e = this.currentRoute.rendered[i];
            if (
                (parent == null || (e != null && parent.props.rId === e.props.rId)) &&
                i + 1 < this.currentRoute.components.length
            ) {
                element = React.createElement(
                    this.__componentsMap.get(this.currentRoute.components[i + 1]),
                    Object.assign(
                        {
                            routePath: this.currentRoute.levels[i + 1],
                            rId: uuid.v4(),
                        },
                        props,
                    ),
                );
                this.currentRoute.rendered.push(element);
                break;
            }
        }
        return element;
    }

    getHttpActionURL(storeName, actionId, itemId) {
        const href = `${this.getPrefixURL()}actions/${storeName}/${actionId}`;

        if (!itemId) {
            return href;
        }

        return `${href}?itemId=${itemId}`;
    }

    getCurrentPath() {
        const rgx = /.*\/app\/(.*)/;
        const matched = window.location.pathname.match(rgx);
        if (!matched) {
            return path.resolve("");
        }

        return path.resolve(matched[1]);
    }

    getItemVersion() {
        const search = new URLSearchParams(window.location.search);
        try {
            const v = search.get("__v");
            if (v == null) {
                return null;
            }

            return parseInt(v);
        } catch (err) {
            console.error("version parsing error", err);
        }
    }

    getItemVersionDisplay() {
        const search = new URLSearchParams(window.location.search);
        return search.get("__vd");
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    getPrefixURL() {
        const rgx = /^(.*)\/app\/(.*)/;
        const { location } = window;
        const base = `${location.protocol}//${location.host}`;
        const matched = window.location.pathname.match(rgx);
        if (!matched) {
            return base;
        }

        return `${base}${path.resolve(matched[1])}`;
    }

    isActive(path) {
        const currentPath = this.getCurrentPath();
        return (
            currentPath.indexOf(path) === 0 && (currentPath.length === path.length || currentPath[path.length] === "/")
        );
    }

    setRoutes() {
        this.routes = this.getRoutes();
        if (this.routes != null) {
            this.currentPath = this.getCurrentPath();
            this.itemVersion = this.getItemVersion();
            this.itemVersionDisplay = this.getItemVersionDisplay();
            this.updateCurrentRoute();
        }
    }

    getRoutes() {
        var baseRoute = {
            path: "/",
            children: [],
        };
        baseRoute.children = configStore.getRoutes();
        baseRoute.children.push({
            path: "__config",
            component: "ConfigViewer",
        });
        baseRoute.children.push({
            path: "_profile",
            component: "Profile",
        });
        baseRoute.children.push({
            path: "*",
            component: "NotFoundHandler",
        });

        return baseRoute;
    }
}

const store = new History();

export default store;
