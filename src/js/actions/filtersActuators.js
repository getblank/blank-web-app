/**
 * Created by kib357 on 18/11/15.
 */

import dispatcher from "../dispatcher/blankDispatcher";
import { userActions } from "constants";

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

    clearFilter(storeName) {
        dispatcher.dispatch({
            actionType: userActions.CLEAR_FILTER,
            context: storeName,
            storeName,
        });

    }
}

let filterActions = new FilterActuators();

export default filterActions;