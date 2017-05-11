/**
 * Created by kib357 on 09/11/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import configStore from "../stores/configStore";
import { userActions } from "constants";
import path from "path";

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

    getCurrentPath() {
        const rgx = /.*\/app\/(.*)/;
        const matched = window.location.pathname.match(rgx);
        const pathname = matched[1].replace(/\?.*/, "");
        return path.resolve(pathname);
    }

    pushState(input) {
        if (typeof input !== "string") {
            console.error("Invalid route path requested: ", JSON.stringify(input));
        }

        const rgx = /(.*\/app\/)(.*)/;
        const matched = window.location.pathname.match(rgx);
        const pathname = path.resolve(`${matched[1]}/${input}`);
        window.history.pushState({ input }, "", pathname);
        this.routeChanged(input);
    }

    pushStore(storeName) {
        if (typeof storeName !== "string") {
            console.error("Invalid store requested: ", JSON.stringify(storeName));
        }

        this.pushState(configStore.findRoute(storeName));
    }

    replaceState(input) {
        if (typeof input !== "string") {
            console.error("Invalid route path requested: ", JSON.stringify(input));
        }

        const rgx = /(.*\/app\/)(.*)/;
        const matched = window.location.pathname.match(rgx);
        const pathname = path.resolve(`${matched[1]}/${input}`);
        window.history.replaceState({ input }, "", pathname);
        this.routeChanged(input);
    }

    replaceStore(storeName) {
        if (typeof storeName !== "string") {
            console.error("Invalid store requested: ", JSON.stringify(storeName));
        }
        this.replaceState(configStore.findRoute(storeName));
    }
}

export default new HistoryActuators();