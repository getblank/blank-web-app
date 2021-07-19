/**
 * Created by kib357 on 04/02/16.
 */

import BaseStore from "./baseStore.js";
import configStore from "./configStore";
import fileUploadsStore from "./fileUploadStore";
import { userActions, serverActions, propertyTypes, itemStates } from "constants";
import find from "utils/find";
import historyActions from "../actions/historyActuators.js";

class CurrentActionStore extends BaseStore {
    constructor(props) {
        super(props);
        this.data = this.getBaseItem();
    }

    get() {
        return this.data;
    }

    getCurrentDesc() {
        return this.actionDesc;
    }

    getInfo() {
        return {
            storeName: this.storeName,
            itemId: this.itemId,
            actionId: this.actionId,
        };
    }

    getBaseItem() {
        let res = {
            $state: itemStates.new,
        };
        return res;
    }

    __handleSaveDraft(payload) {
        this.data = JSON.parse(JSON.stringify(payload.data));
    }

    __handleSelect(payload) {
        this.storeName = payload.storeName;
        this.itemId = payload.itemId;
        this.actionId = payload.actionId;
        const storeDesc = configStore.getConfig(this.storeName);
        const allActionsDesc = (storeDesc.storeActions || []).concat(storeDesc.actions || []);
        this.actionDesc = find.itemById(allActionsDesc, this.actionId);
        this.data = payload.data || {};
        if (this.actionDesc != null) {
            this.actionDesc.groupAccess = "cru";
            for (const propName of Object.keys(this.actionDesc.props || {})) {
                this.actionDesc.props[propName].groupAccess = "cru";
            }
        }
    }

    __handleUploadChanges(actionDesc, data) {
        data = data || this.data;
        actionDesc = actionDesc || this.actionDesc;
        if (data == null || actionDesc == null) {
            return;
        }

        const upload = fileUploadsStore.getLastModified();
        const props = (actionDesc || this.actionDesc).props || {};
        for (const propName of Object.keys(props)) {
            const propDesc = props[propName];
            if (propDesc.type === propertyTypes.file || propDesc.type === propertyTypes.fileList) {
                const files = Array.isArray(data[propName]) ? data[propName] : [data[propName]];
                for (const file of files) {
                    if (file && file._id === upload._id) {
                        file.$uploadState = upload.state;
                        file.$progress = upload.progress;
                        file.error = upload.error;
                    }
                }
            }

            if (propDesc.type === propertyTypes.object || propDesc.type === propertyTypes.objectList) {
                this.__handleUploadChanges(propDesc, data[propName]);
            }
        }

        this.__emitChange();
    }

    __handleActionResponse(payload) {
        //Clearing current action if successfully performed
        if (
            payload.error == null &&
            payload.actionId === this.actionId &&
            payload.storeName === this.storeName &&
            (payload.itemId == null || payload.itemId === this.itemId)
        ) {
            this.storeName = null;
            this.itemId = null;
            this.actionId = null;
            this.actionDesc = null;
            this.data = null;
        }
    }

    __handleStoreActionResponse(payload) {
        const { data, error, actionId, storeName } = payload;
        const actionDesc = find.itemById(configStore.getConfig(storeName).storeActions, actionId);

        if (actionDesc && actionDesc.clientPostScript) {
            const script = new Function("$result", "$error", "$history", actionDesc.clientPostScript);
            try {
                script(data, error, historyActions);
            } catch (e) {
                console.error("Action postScript error: ", e);
            }
        }
        //Clearing current action if successfully performed
        if (
            payload.actionId === this.actionId &&
            payload.storeName === this.storeName &&
            (payload.itemId == null || payload.itemId === this.itemId)
        ) {
            if (payload.error == null) {
                this.storeName = null;
                this.itemId = null;
                this.actionId = null;
                this.actionDesc = null;
                this.data = null;
            } else {
                this.data = { ...this.data, $error: payload.error };
            }
        }
    }

    __handleStoreActionRequest() {
        this.data = { ...this.data, $error: null };
    }

    __onDispatch(payload) {
        this.__dispatcher.waitFor([fileUploadsStore.getDispatchToken()]);
        switch (payload.actionType) {
            case serverActions.SIGN_OUT:
                this.data = this.getBaseItem();
                break;
            case userActions.ACTION_SAVE_DRAFT:
                this.__handleSaveDraft(payload);
                this.__emitChange();
                break;
            case userActions.ACTION_SELECT:
                this.__handleSelect(payload);
                this.__emitChange();
                break;
            case serverActions.ITEM_ACTION_RESPONSE:
                this.__handleActionResponse(payload);
                this.__emitChange();
                break;
            case userActions.STORE_ACTION_REQUEST:
                this.__handleStoreActionRequest();
                this.__emitChange();
                break;
            case serverActions.STORE_ACTION_RESPONSE:
                this.__handleStoreActionResponse(payload);
                this.__emitChange();
                break;
            case serverActions.FILE_UPLOAD_RESPONSE:
                if (fileUploadsStore.hasChanged()) {
                    this.__handleUploadChanges();
                }
                break;
        }
    }
}

export default new CurrentActionStore();
