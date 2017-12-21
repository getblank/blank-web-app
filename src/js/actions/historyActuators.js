/**
 * Created by kib357 on 09/11/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import configStore from "../stores/configStore";
import appState from "../stores/appStateStore";
import { userActions } from "constants";
import path from "path";

const filterPrefix = "filter-";
const filterRgx = new RegExp(`$${filterPrefix}`);

class HistoryActuators {
    constructor() {
        window.onpopstate = () => this.routeChanged(this.getCurrentPath());
    }

    routeChanged(pathname) {
        setTimeout(() => {
            dispatcher.dispatch({
                action: {},
                actionType: userActions.ROUTE_CHANGE,
                path: pathname,
            });
        });
    }

    getCurrentFilter() {
        const { searchParams } = new URL(document.location);
        const filterString = searchParams.get("filter");
        let filter = {};
        if (filterString) {
            try {
                if (filterString.slice(0, 1) !== "{") {
                    throw new Error("filter is not JSON");
                }

                filter = JSON.parse(filterString);
            } catch (err) {
                console.error("Invalid filter in URLSearchParams, error: ", err);
            }
        }

        return filter;
    }

    getCurrentPath() {
        const rgx = /.*\/app\/(.*)/;
        const matched = window.location.pathname.match(rgx);
        const pathname = matched[1].replace(/\?.*/, "");

        return path.resolve(pathname);
    }

    goToStoreItem(storeName, itemId) {
        const currentStoreName = appState.getCurrentStore();
        const storePath = configStore.findRoute(storeName);
        const pathURI = `${storePath}${itemId ? "/" + itemId : ""}`;

        return this.pushState(pathURI, currentStoreName === storeName);
    }

    pushState(input, keepSearchParams) {
        if (typeof input !== "string") {
            console.error("Invalid route path requested: ", JSON.stringify(input));
        }

        if (this.getCurrentPath() === input) {
            return;
        }

        const pathname = path.resolve(`${this._getPrefix()}/${input}`) + (keepSearchParams ? document.location.search : "");
        window.history.pushState({ input }, "", pathname);
        this.routeChanged(input);
    }

    pushStore(storeName) {
        this.goToStoreItem(storeName, 1);
        if (typeof storeName !== "string") {
            console.error("Invalid store requested: ", JSON.stringify(storeName));
        }

        this.pushState(configStore.findRoute(storeName));
    }

    replaceState(input) {
        if (typeof input !== "string") {
            console.error("Invalid route path requested: ", JSON.stringify(input));
        }

        const pathname = path.resolve(`${this._getPrefix()}/${input}`);
        window.history.replaceState({ input }, "", pathname);
        this.routeChanged(input);
    }

    replaceStore(storeName) {
        if (typeof storeName !== "string") {
            console.error("Invalid store requested: ", JSON.stringify(storeName));
        }
        this.replaceState(configStore.findRoute(storeName));
    }

    setFilter(data) {
        const { search } = document.location;
        const searchParams = new URLSearchParams(search);
        searchParams.set("filter", JSON.stringify(data));
        const itemId = appState.getCurrentItemId();
        const storePath = configStore.findRoute(appState.getCurrentStore());
        const input = `${storePath}${itemId ? "/" + itemId : ""}`;
        let pathname = path.resolve(`${this._getPrefix()}/${input}`);
        if (Object.keys(data).length > 0) {
            pathname += `?${searchParams.toString()}`;
        }

        window.history.pushState({ input }, "", pathname);
        this.routeChanged(input);
    }

    _getPrefix() {
        const rgx = /(.*\/app\/)(.*)/;
        let pathname = window.location.pathname;
        let matched = pathname.match(rgx);
        if (!matched) {
            pathname += "/";
            matched = pathname.match(rgx);
        }

        return matched[1];
    }
}

export default new HistoryActuators();