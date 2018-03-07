/**
 * Created by kib357 on 23/09/15.
 */

import BaseStore from "./baseStore.js";
import { serverActions, systemStores } from "constants";
import find from "utils/find";

class i18nStore extends BaseStore {
    constructor() {
        super();
        this.locale = { $stores: {}, $settings: {} };
        this.cache = new Map();
        this.get = this.get.bind(this);
    }

    get(prop) {
        return find.property(this.locale.$settings, prop);
    }

    getError(error) {
        if (typeof error === "object") {
            error = error.desc;
        }

        const { errors = {} } = this.locale.$settings;
        return find.property(this.locale.$settings, "errors." + error) || (errors.common || "") + " " + error;
    }

    getForStore(storeName) {
        if (typeof storeName !== "string") {
            storeName = "";
        }
        if (this.cache.has(storeName)) {
            return this.cache.get(storeName);
        }

        const copy = JSON.parse(JSON.stringify(this.locale));
        const res = copy.$stores[storeName] || {};
        res.$settings = copy.$settings;
        res.$stores = copy.$stores;
        this.cache.set(storeName, res);
        return res;
    }

    __onDispatch(payload) {
        switch (payload.actionType) {
            case serverActions.UPDATE_CONFIG: {
                const config = payload.data;
                this.locale = { $stores: {}, $settings: {} };
                this.cache.clear();
                if (config != null) {
                    for (const storeName of Object.keys(config)) {
                        const store = config[storeName];
                        if (store.i18n) {
                            if (storeName != systemStores.settings) {
                                this.locale.$stores[storeName] = store.i18n;
                            } else {
                                this.locale.$settings = store.i18n;
                            }
                        }
                    }
                }

                this.__emitChange();
                break;
            }
            case serverActions.DISCONNECTED_EVENT:
                this.locale = { $stores: {}, $settings: {} };
                break;
        }
    }
}

var store = new i18nStore();
export default store;