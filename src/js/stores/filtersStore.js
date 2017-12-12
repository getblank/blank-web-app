/**
 * Created by kib357 on 18/11/15.
 */

import BaseStore from "./baseStore.js";
import credentials from "./credentialsStore.js";
import config from "./configStore.js";
import appState from "./appStateStore";
import historyActions from "../actions/historyActuators";
import { userActions, serverActions, storeTypes, processStates } from "constants";
import check from "utils/check";

class FiltersStore extends BaseStore {
    constructor(props) {
        super(props);
    }

    getOrder(storeName, defaultOrder) {
        if (credentials.getUser() == null) {
            console.warn("Attempt to get order with no user");
            return "name";
        }

        if (!defaultOrder) {
            let storeDesc = config.getConfig(storeName);
            defaultOrder = storeDesc.orderBy || "name";
        }

        const sessionOrder = sessionStorage.getItem(credentials.getUser()._id + "-" + storeName + "-order");

        return sessionOrder || defaultOrder;
    }

    getFilters(storeName, includeStateFilter) {
        if (credentials.getUser() == null) {
            console.warn("Attempt to get filter with no user");
            return {};
        }

        const filters = historyActions.getCurrentFilter();
        if (!includeStateFilter) {
            delete filters._state;
        }

        return filters;
    }

    match(item, storeName, excludeFilters) {
        const filters = this.getFilters(storeName, true);
        const storeDesc = config.getConfig(storeName);

        //Скрываем архивные элементы для процессов
        if (storeDesc.type === storeTypes.process &&
            filters._state == null &&
            item._state === processStates._archive) {
            return false;
        }

        for (const filterName of Object.keys(filters)) {
            if (excludeFilters != null) {
                if (typeof excludeFilters === "string") {
                    excludeFilters = [excludeFilters];
                }
                if (excludeFilters.indexOf(filterName) >= 0) {
                    continue;
                }
            }

            const filterDesc = storeDesc.filters[filterName] || {};
            const filterValue = filters[filterName];
            const conditions = (filterDesc.conditions || []).map(c => Object.assign({}, c, {
                value: filterValue,
            }));

            const ok = check.conditions(conditions, item, true);
            if (!ok) {
                return false;
            }
        }
        return true;
    }

    setFilter(storeName, property, filter, noResetItem) {
        const data = historyActions.getCurrentFilter();
        if (filter && (!Array.isArray(filter) || filter.length > 0)) {
            data[property] = filter;
        } else {
            delete data[property];
            console.log("Cleared property filter: ", property);
        }

        historyActions.setFilter(data);
        //Clearing current item
        // if (appState.itemId && !noResetItem) {
        //     historyActions.goToStoreItem(appState.getCurrentStore());
        // }
        this.__emitChange();
    }

    __onDispatch(payload) {
        this._error = null;
        switch (payload.actionType) {
            case userActions.SET_ORDER: {
                let lsKey = credentials.getUser()._id + "-" + payload.storeName + "-order";
                sessionStorage.setItem(lsKey, payload.order);
                this.__emitChange();
                break;
            }
            case userActions.SET_FILTER:
                this.setFilter(payload.storeName, payload.property, payload.filter, payload.noResetItem);
                break;
            case userActions.CLEAR_FILTER: {
                historyActions.setFilter({});
                this.__emitChange();
                break;
            }

            case userActions.ITEM_CREATE:
            case userActions.ITEM_SAVE_DRAFT:
            case userActions.ITEM_SAVE_REQUEST:
            case serverActions.ITEM_SAVE_RESPONSE:
            case userActions.ITEM_DELETE_REQUEST:
            case serverActions.ITEM_DELETE_RESPONSE:
            case userActions.ITEM_ACTION_REQUEST:
            case serverActions.ITEM_ACTION_RESPONSE:
            case serverActions.ITEMS_UPDATED:
                //Changing state filter if state of item changed;
                //Temporary disabled
                //if (modifiedItemsStore.hasChanged()) {
                //    let modified = modifiedItemsStore.getLastModified();
                //    if (modified._state !== modified._prevState) {
                //        this.setFilter(modified.$store, '_state', modified._state || null);
                //    }
                //}
                break;
        }
    }
}

var store = new FiltersStore();

export default store;