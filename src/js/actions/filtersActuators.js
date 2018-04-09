/**
 * Created by kib357 on 18/11/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import { userActions, storeEvents } from "constants";
import credentials from "../stores/credentialsStore.js";

class FilterActuators {
    setOrder(storeName, order) {
        dispatcher.dispatch({
            actionType: userActions.SET_ORDER,
            context: storeName,
            storeName,
            order,
        });
    }

    setFilter(storeName, property, filter, noResetItem, noReloadItems) {
        dispatcher.dispatch({
            actionType: userActions.SET_FILTER,
            context: storeName,
            storeName: storeName,
            property: property,
            filter: filter,
            noResetItem,
            noReloadItems,
        });
    }

    loadFilters(storeName, filters) {
        dispatcher.dispatch({
            actionType: userActions.LOAD_FILTERS,
            storeName: storeName,
            filters,
        });
    }

    clearFilter(storeName) {
        dispatcher.dispatch({
            actionType: userActions.CLEAR_FILTER,
            context: storeName,
            storeName,
        });

    }

    getFilterStorename(storeName) {
        const { _id: userId } = credentials.getUser();
        return `${userId}-${storeName}-filters`;
    }

    deleteFilter(storeName, name) {
        const key = this.getFilterStorename(storeName);
        const currentSavedFiltersString = localStorage.getItem(key);
        let currentSavedFilters = [];
        if (currentSavedFiltersString) {
            currentSavedFilters = JSON.parse(currentSavedFiltersString);
        }

        const idx = currentSavedFilters.findIndex(e => e.name == name);
        if (idx === -1) {
            return;
        }

        currentSavedFilters.splice(idx, 1);
        localStorage.setItem(key, JSON.stringify(currentSavedFilters));

        dispatcher.dispatch({
            actionType: storeEvents.FILTERS_LOADED,
            data: currentSavedFilters,
            storeName,
        });
    }

    loadSavedFilters(storeName) {
        const key = this.getFilterStorename(storeName);
        const currentSavedFiltersString = localStorage.getItem(key);
        let filters = [];
        if (currentSavedFiltersString) {
            filters = JSON.parse(currentSavedFiltersString);
        }

        // async emulation
        setTimeout(() => {
            dispatcher.dispatch({
                actionType: storeEvents.FILTERS_LOADED,
                data: filters,
                storeName,
            });
        });
    }

    saveFilter(storeName, name, filter) {
        const key = this.getFilterStorename(storeName);
        const currentSavedFiltersString = localStorage.getItem(key);
        let currentSavedFilters = [];
        if (currentSavedFiltersString) {
            currentSavedFilters = JSON.parse(currentSavedFiltersString);
        }

        for (const f of currentSavedFilters) {
            if (f.name === name) {
                f.filter = filter;
                localStorage.setItem(key, JSON.stringify(currentSavedFilters));

                dispatcher.dispatch({
                    actionType: storeEvents.FILTERS_LOADED,
                    data: currentSavedFilters,
                    storeName,
                });

                return;
            }
        }

        currentSavedFilters.push({ name, filter });
        localStorage.setItem(key, JSON.stringify(currentSavedFilters));

        dispatcher.dispatch({
            actionType: storeEvents.FILTERS_LOADED,
            data: currentSavedFilters,
            storeName,
        });
    }
}

const filterActions = new FilterActuators();

export default filterActions;