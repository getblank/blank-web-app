/**
 * Created by kib357 on 18/11/15.
 */

import BaseStore from "./baseStore.js";
import credentials from "./credentialsStore.js";
import config from "./configStore.js";
import historyActions from "../actions/historyActuators";
import appState from "./appStateStore";
import { userActions, serverActions, storeTypes, processStates, storeEvents } from "constants";
import check from "utils/check";
import moment from "moment";

class FiltersStore extends BaseStore {
    constructor(props) {
        super(props);
        this._savedFilters = [];
    }

    getOrder(storeName, defaultOrder) {
        const orderBy = historyActions.getCurrentOrderBy();
        if (orderBy) {
            return orderBy;
        }

        if (defaultOrder) {
            return defaultOrder;
        }

        const storeDesc = config.getConfig(storeName);
        return storeDesc.orderBy || "name";
    }

    getFilters(storeName, includeStateFilter) {
        if (!storeName) {
            storeName = appState.getCurrentStore();
        }

        if (credentials.getUser() == null) {
            console.warn("Attempt to get filter with no user");
            return {};
        }

        const currentFilters = historyActions.getCurrentFilter();
        if (!includeStateFilter) {
            delete currentFilters._state;
        }

        const storeDisplay = appState.getCurrentDisplay();
        const { filters } = config.getConfig(storeName);
        for (const filterName of Object.keys(filters || {})) {
            const filterDesc = filters[filterName];
            if (filterDesc.hideOnStoreDisplay && filterDesc.hideOnStoreDisplay.includes(storeDisplay)) {
                delete currentFilters[filterName];

                continue;
            }

            if (filterDesc.default && currentFilters[filterName] == null) {
                currentFilters[filterName] = filterDesc.default(moment);
            }
        }

        return currentFilters;
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
        }

        historyActions.setFilter(data);
        //Clearing current item
        // if (appState.itemId && !noResetItem) {
        //     historyActions.goToStoreItem(appState.getCurrentStore());
        // }

        this.__emitChange();
    }

    setFilters(filters) {
        const data = historyActions.getCurrentFilter();
        for (const propName of Object.keys(filters)) {
            const value = filters[propName];
            if (value) {
                data[propName] = value;
            } else {
                delete data[propName];
            }
        }

        historyActions.setFilter(data);
        this.__emitChange();
    }

    savedFilters() {
        return [...this._savedFilters];
    }

    __onDispatch(payload) {
        this._error = null;
        switch (payload.actionType) {
            case userActions.SET_ORDER: {
                historyActions.setOrderBy(payload.order);
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

            case storeEvents.FILTERS_LOADED:
                if (payload.storeName === appState.getCurrentStore()) {
                    this._savedFilters = payload.data;
                } else {
                    this._savedFilters.length = 0;
                }
                break;

            case userActions.LOAD_FILTERS:
                if (payload.storeName === appState.getCurrentStore()) {
                    this.setFilters(payload.filters);
                }
                break;

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

const store = new FiltersStore();

export default store;