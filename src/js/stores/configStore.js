/**
 * Created by kib357 on 23/07/15.
 */

import BaseStore from "./baseStore.js";
import configHelpers from "../utils/configHelpers.js";
import i18n from "./i18nStore.js";
import credentialsStore from "./credentialsStore.js";
import configActions from "../actions/configActuators.js";
import { storeTypes, serverActions, systemStores, storeDisplayTypes, actionsBaseUrl, itemStates } from "constants";
import template from "template";
import find from "utils/find";
import moment from "moment";
import uuid from "uuid";

class ConfigStore extends BaseStore {
    constructor(props) {
        super(props);
        this.config = null;
        this._user = null;
        this._subscribed = false;
    }

    getRawConfig() {
        return this.config;
    }

    getConfig(entityName) {
        if (this.config == null) {
            return {};
        }

        if (entityName) {
            //return Object.assign({}, this.config[entityName]);
            return this.config[entityName] || {};
        }

        const config = {};
        for (var store of Object.keys(this.config)) {
            if (store.indexOf("_default") < 0 && store.indexOf("_profile") != 0) {
                //config[store] = Object.assign({}, this.config[store]);
                config[store] = this.config[store] || {};
            }
        }

        return config;
    }

    getBaseItem(storeName, item, actionId, storeAction, baseItem) {
        let storeDesc = this.config[storeName];
        //В store могут быть описаны свойства для конкретного action, пробуем найти их, если передан соответствующий параметр
        if (actionId) {
            storeDesc = find.item(storeAction ? storeDesc.storeActions : storeDesc.actions, actionId);
        }

        const res = this.__getBaseItem(
            storeDesc,
            i18n.getForStore(storeName),
            credentialsStore.getUser(),
            item,
            baseItem,
        );
        if (storeDesc.type === storeTypes.single || storeDesc.display === storeDisplayTypes.single) {
            res._id = storeName;
        }

        return res;
    }

    getItemName(item, storeName) {
        const storeDesc = this.config[storeName];
        if (storeDesc == null) {
            return "ERROR";
        }

        let nameText = item[storeDesc.headerProperty || "name"];
        const headerTemplate = storeDesc.headerTemplate;
        if (headerTemplate) {
            nameText = template.render(headerTemplate, { $item: item, $i18n: i18n.getForStore(storeName) });
        }

        if (!nameText && item.$state === itemStates.new) {
            return i18n.get("lists.new");
        }

        return nameText;
    }

    getMapStoreEntries(storeName) {
        const storeDesc = this.config[storeName];
        const res = [];
        if (storeDesc == null || storeDesc.entries == null) {
            return res;
        }

        for (const itemName of Object.keys(storeDesc.entries)) {
            const i = storeDesc.entries[itemName];
            if (i.display !== "none") {
                res.push(Object.assign({ _id: itemName }, i));
            }
        }

        res.sort((a, b) => a.formOrder - b.formOrder);

        return res;
    }

    getNotificationStoresNames() {
        const res = [];
        if (this.config == null) {
            return res;
        }

        for (const storeName of Object.keys(this.config)) {
            if (this.config[storeName].type === storeTypes.notification) {
                res.push(storeName);
            }
        }

        return res;
    }

    getByNavGroup(navGroup) {
        const res = {};
        for (const storeName of Object.keys(this.config)) {
            if (
                this.config[storeName].navGroup !== navGroup ||
                [storeTypes.directory, storeTypes.process, storeTypes.single].indexOf(this.config[storeName].type) <
                    0 ||
                this.config[storeName].display === "none" ||
                this.config[storeName].groupAccess.indexOf("v") < 0
            ) {
                continue;
            }

            res[storeName] = Object.assign({}, this.config[storeName]);
        }

        return res;
    }

    isReady() {
        return this.config != null && this._user != null;
    }

    isBaseReady() {
        return this.config != null;
    }

    findRoute(storeName) {
        if (this.config == null || this.config[storeName] == null) {
            return "/";
        }

        const store = this.config[storeName];
        if (store.navGroup && store.navGroup !== "none") {
            return "/" + store.navGroup + "/" + storeName;
        }

        return "/" + storeName;
    }

    isSingle(storeName) {
        if (this.config == null || this.config[storeName] == null) {
            return false;
        }

        const store = this.config[storeName];
        return store.type === storeTypes.single || store.display === storeDisplayTypes.single;
    }

    getLessVars() {
        if (this.config == null) {
            return null;
        }

        if (this.config[systemStores.settings] == null || this.config[systemStores.settings].entries == null) {
            console.warn("Config: _clientSettings store not configured correctly in config");
            return null;
        }

        return this.config[systemStores.settings].entries.lessVars;
    }

    getParameter(parameter) {
        return find.property(this.config, systemStores.settings + ".entries." + parameter);
    }

    getDefaultLocale() {
        return find.property(this.config, systemStores.settings + ".entries.defaultLocale") || "";
    }

    getLocales() {
        return find.property(this.config, systemStores.settings + ".entries.locales") || [];
    }

    getTitle() {
        return find.property(this.config, systemStores.settings + ".entries.title") || "No title";
    }

    getTitleHref() {
        return this.getParameter("titleHref") || "#";
    }

    getTitleIcon() {
        return this.getParameter("titleIcon") || "";
    }

    getTitleTarget() {
        return this.getParameter("titleTarget") || "";
    }

    getProfileLabel() {
        return find.property(this.config, systemStores.settings + ".entries.profileLabel") || "";
    }

    getProfileIcon() {
        return find.property(this.config, systemStores.settings + ".entries.profileIcon") || "";
    }

    isUserActivationNeeded() {
        return find.property(this.config, systemStores.settings + ".entries.userActivation") || false;
    }

    hideChangeLogin() {
        return this.getParameter("hideChangeLogin") || false;
    }

    hideChangeLanguage() {
        return this.getParameter("hideChangeLanguage") || false;
    }

    isActionHidden(actionDesc, user, item) {
        return actionDesc.hidden(user, item);
    }

    getActions(storeName, model, forStore) {
        const config = this.config[storeName];
        if (config == null) {
            console.warn("Attempt to get actions for unknown store: ", storeName);
            return [];
        }

        if (config.groupAccess.indexOf("x") < 0) {
            return [];
        }

        const actionsDesc = config[forStore ? "storeActions" : "actions"] || [];

        return actionsDesc.filter(
            actionDesc => actionDesc != null && !this.isActionHidden(actionDesc, model.$user, model.$item),
        );
    }

    getHttpActionHref(storeName, actionDesc, itemId, filtersStore, data) {
        let href = actionsBaseUrl + storeName + "/" + actionDesc._id;

        const params = [];
        if (itemId && itemId !== "undefined-new") {
            params.push({ key: "item-id", value: itemId });
        }

        if (actionDesc.forStore) {
            const filters = filtersStore.getFilters(storeName, true);
            const order = filtersStore.getOrder(storeName);
            params.push({ key: "filter", value: encodeURIComponent(JSON.stringify(filters)) });
            params.push({ key: "order", value: encodeURIComponent(order) });
        }

        params.push({ key: "data", value: encodeURIComponent(JSON.stringify(data)) });

        if (params.length > 0) {
            href +=
                "?" +
                params.reduce((res, param) => {
                    return res + (res ? "&" : "") + param.key + "=" + param.value;
                }, "");
        }

        return href;
    }

    getRoutes() {
        const routes = [];
        if (this.config == null) {
            return routes;
        }

        for (const storeName of Object.keys(this.config)) {
            if (
                storeName.indexOf("_") === 0 ||
                (this.config[storeName].type === storeTypes.map ||
                    this.config[storeName].type === storeTypes.notification) ||
                this.config[storeName].display === "none"
            ) {
                continue;
            }

            const route = {
                path: storeName,
                component: "StoreView",
            };
            if (
                this.config[storeName].type === storeTypes.single ||
                this.config[storeName].display === storeDisplayTypes.single
            ) {
                route.component = "SingleStoreView";
            } else {
                route.children = [
                    {
                        path: ":itemId",
                        component: "ItemView",
                    },
                ];
            }

            const group = this.config[storeName].navGroup;
            if (group && group !== "none") {
                let groupRoute = find.itemById(routes, group, "path");
                if (!groupRoute) {
                    groupRoute = {
                        path: group,
                        component: "NavGroup",
                        children: [],
                    };
                    routes.push(groupRoute);
                }
                groupRoute.children.push(route);
            } else {
                routes.push(route);
            }
        }

        return routes;
    }

    __setMomentLocale() {
        const newLocale = (this._user || {}).lang || this.getParameter("defaultLocale");
        if (newLocale) {
            console.log("Setting moment locale: ", newLocale);
            moment.locale(newLocale);
        }
    }

    __onDispatch(payload) {
        this.__dispatcher.waitFor([credentialsStore.getDispatchToken()]);
        switch (payload.actionType) {
            case serverActions.UPDATE_CONFIG:
                this._user = payload.user;
                this.config = payload.data;
                for (let storeName of Object.keys(this.config)) {
                    const storeDesc = this.config[storeName];
                    configHelpers.prepareFormTabs(storeDesc);
                    configHelpers.prepareFormGroups(storeDesc);
                    configHelpers.prepareProps(storeDesc, storeName, this.config);
                    configHelpers.prepareLabels(storeDesc, storeName);
                    configHelpers.prepareActions(storeDesc);
                    configHelpers.prepareTableView(storeDesc, storeName);
                    configHelpers.prepareReactView(storeDesc, storeName);
                }
                this.__setMomentLocale();
                this.__emitChange();
                break;
            case serverActions.DISCONNECTED_EVENT:
                this.config = null;
                this._subscribed = false;
                this._user = null;
                this.__emitChange();
                break;
            // case serverActions.SIGN_IN:
            // case serverActions.UPDATE_USER:
            // case serverActions.SIGN_OUT:
            //     if (credentialsStore.signedIn()) {
            //         if (!this._subscribed) {
            //             this._subscribed = true;
            //             this.config = null;
            //             this._user = credentialsStore.getUser();
            //             configActions.subscribe(credentialsStore.getUser());
            //             this.__emitChange();
            //         }
            //     } else {
            //         if (this._subscribed) {
            //             this._subscribed = false;
            //             this.config = null;
            //             this._user = null;
            //             configActions.unsubscribe();
            //             this.__emitChange();
            //         }
            //     }
            //     break;
            case serverActions.CONNECTED_EVENT:
                this._subscribed = true;
                this.config = null;
                configActions.subscribe(credentialsStore.getUser());
                this.__emitChange();
                break;
        }
    }

    __getBaseItem(storeDesc, currentI18n, currentUser, item, baseItem) {
        const res = {};
        if (storeDesc && storeDesc.props) {
            const { _id: propDesc } = storeDesc.props;
            switch ((propDesc || {}).type) {
                case "uuid":
                    res._id = uuid.v4();
                    break;
                default:
                    res._id = propDesc ? `${storeDesc.name}-new` : uuid.v4();
            }
        } else {
            res._id = uuid.v4();
        }

        if (storeDesc && storeDesc.props) {
            for (const prop of Object.keys(storeDesc.props)) {
                if (storeDesc.props[prop].default != null) {
                    const defaultValue = storeDesc.props[prop].default;

                    if (typeof defaultValue === "function") {
                        res[prop] = defaultValue(item || {}, baseItem, currentUser, currentI18n);

                        continue;
                    }

                    if (typeof defaultValue === "object" && typeof defaultValue.$expression === "string") {
                        const fn = new Function("$item", "$baseItem", "$user", "$i18n", defaultValue.$expression);
                        storeDesc.props[prop].default = fn;
                        res[prop] = fn(item || {}, baseItem, currentUser, currentI18n);

                        continue;
                    }

                    res[prop] = defaultValue;
                }
            }
        }

        return res;
    }
}

export default new ConfigStore();
