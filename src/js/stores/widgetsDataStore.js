/**
 * Created by kib357 on 18/11/15.
 */

import BaseStore from "./baseStore.js";
import appStateStore from "./appStateStore";
import { serverActions, userActions } from "constants";

class WidgetsDataStore extends BaseStore {
    constructor(props) {
        super(props);
        this.data = {};
        this.lastUpdatedWidgetId = null;
        this.get = this.get.bind(this);
    }

    get(widgetId) {
        return this.data[widgetId] || null;
    }

    __handleDataUpdate(payload) {
        if (payload.error == null) {
            this.data[payload.widgetId] = payload.data;
        } else {
            this.data[payload.widgetId] = null;
            console.error(`Error while loading widget ${payload.widgetId} data:`, payload.error);
        }
        this.lastUpdatedWidgetId = payload.widgetId;
        this.__emitChange();
    }

    __onDispatch(payload) {
        this.__dispatcher.waitFor([appStateStore.getDispatchToken()]);
        switch (payload.actionType) {
            case serverActions.SIGN_OUT:
            case userActions.ROUTE_CHANGE:
            case serverActions.UPDATE_CONFIG:
                this.data = {};
                this.__emitChange();
                break;
            case serverActions.WIDGET_DATA_LOADED:
                this.__handleDataUpdate(payload);
                break;
        }
    }
}

export default new WidgetsDataStore();