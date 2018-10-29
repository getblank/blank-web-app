/**
 * Created by kib357 on 09/11/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import configStore from "../stores/configStore";
import appState from "../stores/appStateStore";
import { userActions, propertyTypes, displayTypes } from "constants";
import path from "path";

const dataOrderBy = "dataOrderBy";
const filterRgx = /^f_(.+)$/;

class HistoryActuators {
    constructor() {
        window.onpopstate = () => this.routeChanged(this.getCurrentPath());
    }

    routeChanged(pathname, itemVersion, itemVersionDisplay) {
        setTimeout(() => {
            dispatcher.dispatch({
                action: {},
                actionType: userActions.ROUTE_CHANGE,
                path: pathname,
                itemVersion,
                itemVersionDisplay,
            });
        });
    }

    getCurrentFilter() {
        const { searchParams } = new URL(document.location);
        const allSearchParams = {};
        for (const p of searchParams) {
            allSearchParams[p[0]] = p[1];
        }

        return this._unmarshalFilter(searchParams);
    }

    getCurrentOrderBy() {
        const { searchParams } = new URL(document.location);
        return searchParams.get(dataOrderBy);
    }

    getCurrentPath() {
        const rgx = /.*\/app\/(.*)/;
        const matched = window.location.pathname.match(rgx);
        const pathname = matched[1].replace(/\?.*/, "");

        return path.resolve(pathname);
    }

    goToStoreItem(storeName, itemId, itemVersion, itemVersionDisplay) {
        const currentStoreName = appState.getCurrentStore();
        const storePath = configStore.findRoute(storeName);
        const pathURI = `${storePath}${itemId ? "/" + itemId : ""}`;

        return this.pushState(pathURI, currentStoreName === storeName, itemVersion, itemVersionDisplay);
    }

    pushState(input, keepSearchParams, itemVersion, itemVersionDisplay) {
        if (typeof input !== "string") {
            console.error("Invalid route path requested: ", JSON.stringify(input));
        }

        if (this.getCurrentPath() === input && !itemVersion) {
            return;
        }

        const searchParams = new URLSearchParams(window.location.search);
        if (!keepSearchParams) {
            for (const p of searchParams) {
                searchParams.delete(p[0]);
            }
        }

        if (itemVersion != null && itemVersion !== "latest") {
            searchParams.set("__v", itemVersion);
        } else {
            searchParams.delete("__v");
        }
        if (itemVersionDisplay != null && itemVersion !== "latest") {
            searchParams.set("__vd", itemVersionDisplay);
        } else {
            searchParams.delete("__vd");
        }

        const searchStr = searchParams.toString();
        const pathname = path.resolve(`${this._getPrefix()}/${input}`) + (searchStr.length > 0 ? "?" + searchStr : "");
        window.history.pushState({ input }, "", pathname);
        this.routeChanged(input, itemVersion, itemVersionDisplay);
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
        this._marshalFilter(data);
        const { search } = document.location;
        const searchParams = new URLSearchParams(search);
        const filtersToDelete = [];
        for (const p of searchParams) {
            if (p[0].match(filterRgx)) {
                filtersToDelete.push(p[0]);
            }
        }

        filtersToDelete.forEach(e => searchParams.delete(e));

        const marshaled = this._marshalFilter(data);
        for (const f of marshaled) {
            searchParams.append(f.key, f.value);
        }

        const itemId = appState.getCurrentItemId();
        const storePath = configStore.findRoute(appState.getCurrentStore());
        const input = `${storePath}${itemId ? "/" + itemId : ""}`;
        let pathname = path.resolve(`${this._getPrefix()}/${input}?${searchParams.toString()}`);
        window.history.pushState({ input }, "", pathname);

        this.routeChanged(input);
    }

    setOrderBy(data) {
        const { search } = document.location;
        const searchParams = new URLSearchParams(search);
        searchParams.set(dataOrderBy, data);
        const itemId = appState.getCurrentItemId();
        const storePath = configStore.findRoute(appState.getCurrentStore());
        const input = `${storePath}${itemId ? "/" + itemId : ""}`;
        let pathname = path.resolve(`${this._getPrefix()}/${input}?${searchParams.toString()}`);
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

    _marshalFilter(data) {
        const res = [];
        for (const key of Object.keys(data)) {
            const resKey = `f_${key}`;
            const value = data[key];
            if (Array.isArray(value)) {
                for (const v of value) {
                    res.push({ key: resKey, value: v.toISOString ? v.toISOString() : v });
                }
            } else {
                res.push({ key: resKey, value: value.toISOString ? value.toISOString() : value });
            }
        }

        return res;
    }

    _unmarshalFilter(data) {
        const res = {};
        const storeDesc = configStore.getConfig(appState.getCurrentStore());
        const { filters } = storeDesc;
        if (!filters || Object.keys(filters).length === 0) {
            return res;
        }

        for (const p of data) {
            const [key, val] = p;
            const matched = key.match(filterRgx);
            if (!matched) {
                continue;
            }

            const resKey = matched[1];
            const filterDesc = filters[resKey];
            if (!filterDesc) {
                continue;
            }

            let value = val;
            switch (filterDesc.type) {
                case propertyTypes.bool:
                    value = value === "true";
                    break;
                case propertyTypes.int:
                case propertyTypes.float:
                    value = value * 1;
            }

            switch (filterDesc.display) {
                case displayTypes.checkList:
                    value = [value];
            }

            const oldValue = res[resKey];
            if (oldValue != null) {
                if (Array.isArray(oldValue)) {
                    res[resKey] = oldValue.concat(value);
                } else {
                    res[resKey] = [oldValue, value];
                }
            } else {
                res[resKey] = value;
            }
        }

        return res;
    }
}

export default new HistoryActuators();
