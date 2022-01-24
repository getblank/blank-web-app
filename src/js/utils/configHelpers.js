/**
 * Created by kib357 on 21/01/16.
 */

import React from "react";
import find from "utils/find";
import { baseValidators, displayTypes } from "constants";
import i18n from "../stores/i18nStore";
import timeStore from "../stores/timeStore";
import template from "template";
import validation from "validation";
import moment from "moment";
import d3 from "d3";
import nvd3 from "nvd3";
import Loader from "../components/misc/Loader";
import NoComponent from "../components/misc/NoComponent";

const loadModule = (name) => {
    if (REMOTEDIR) {
        const Component = React.lazy(() => import(/* webpackChunkName: "[request]" */ `${REMOTEDIR}/${name}/index.js`));
        const AsyncComponent = (props) => {
            return (
                <React.Suspense fallback={<Loader />}>
                    <Component {...props} />
                </React.Suspense>
            );
        };
        return AsyncComponent;
    }
    return NoComponent;
};

export default class configHelpers {
    static prepareFormTabs(storeDesc) {
        let tabs = [],
            pushMore = false;
        for (let tabDesc of storeDesc.formTabs || []) {
            let tab = {};
            if (typeof tabDesc === "string") {
                tab._id = tabDesc;
                tab.label = tabDesc;
            } else {
                tab._id = tabDesc._id;
                tab.label = tabDesc.label;
                tab.hidden = configHelpers.__getConditionFunction(tabDesc.hidden);
            }
            tabs.push(tab);
        }
        for (let propName of Object.keys(storeDesc.props || {})) {
            let propsDesc = storeDesc.props[propName];
            if (propsDesc.display === "none" || propName === "name") {
                continue;
            }
            let tabId = propsDesc.formTab || "";
            if (find.index(tabs, tabId) < 0) {
                if (tabId) {
                    tabs.push({ _id: tabId, label: tabId, hidden: this.__returnFalse });
                } else {
                    pushMore = true;
                }
            }
        }
        if (pushMore) {
            tabs.push({ _id: "", label: '<i class="material-icons text">more_horiz</i>', hidden: this.__returnFalse });
        }
        if (tabs.length === 0) {
            tabs.push({ _id: "", label: "", hidden: this.__returnFalse });
        }
        storeDesc.formTabs = tabs;
    }

    static prepareFormGroups(storeDesc) {
        let groups = [];
        for (let groupDesc of storeDesc.formGroups || []) {
            let group = {};
            if (typeof groupDesc === "string") {
                group._id = groupDesc;
                group.label = groupDesc;
            } else {
                group._id = groupDesc._id;
                group.label = groupDesc.label;
                group.hidden = configHelpers.__getConditionFunction(groupDesc.hidden);
                group.style = groupDesc.style;
                group.className = groupDesc.className;
                group.formOrder = groupDesc.formOrder ? configHelpers.__getConditionFunction(groupDesc.formOrder) : 0;
            }
            groups.push(group);
        }

        for (let propName of Object.keys(storeDesc.props || {})) {
            let propsDesc = storeDesc.props[propName];
            if (propsDesc.display === "none" || propName === "name") {
                continue;
            }
            let groupId = propsDesc.formGroup || "";
            if (find.index(groups, groupId) < 0) {
                groups.push({ _id: groupId, label: groupId, hidden: this.__returnFalse });
            }
        }

        if (groups.length === 0) {
            groups.push({ _id: "", label: "", hidden: this.__returnFalse });
        }
        storeDesc.formGroups = groups;
    }

    static prepareActions(storeDesc, checkExists) {
        var descs = [].concat(storeDesc.actions || [], storeDesc.storeActions || []);
        for (let actionDesc of descs) {
            if (!checkExists || actionDesc.hidden) {
                actionDesc.hidden = configHelpers.__getConditionFunction(actionDesc.hidden);
            }
            if (!checkExists || actionDesc.disabled) {
                actionDesc.disabled = configHelpers.__getConditionFunction(actionDesc.disabled);
            }
            if (!checkExists || actionDesc.formLabel) {
                actionDesc.formLabel = template.compile(actionDesc.formLabel || actionDesc.label || "");
            }
            if (!checkExists || actionDesc.label) {
                actionDesc.label = template.compile(actionDesc.label || "", true);
            }
            if (!checkExists || actionDesc.icon) {
                actionDesc.icon = template.compile(actionDesc.icon || "", true);
            }
            if (!checkExists || actionDesc.wide) {
                actionDesc.wide = configHelpers.__getConditionFunction(actionDesc.wide);
            }
        }
    }

    static prepareTableView(storeDesc) {
        if (storeDesc.props == null) {
            return;
        }
        //If there is no tableColumns in storeDesc, creating default one
        if (storeDesc.tableColumns == null) {
            storeDesc.tableColumns = [{ prop: "name" }];
        }
        configHelpers.__prepareTableColumns(storeDesc.tableColumns, storeDesc);
    }

    static prepareCalendarView(storeDesc) {
        if (storeDesc.props == null) {
            return;
        }
        storeDesc.colorProp = storeDesc.colorProp || "color";
        storeDesc.dateProp = storeDesc.dateProp || "startTime";
        storeDesc.endDateProp = storeDesc.endDateProp || "endTime";
    }

    static prepareReactView(storeDesc) {
        if (!storeDesc.display.includes(displayTypes.react)) {
            return;
        }

        if (storeDesc.loadComponent) {
            const req = require.context("../components", true, /.+\.js(x)?$/);
            const blankRequire = require.context("..", true, /.+\.js(x)?$/);
            const loadComponent = new Function(
                "React",
                "i18n",
                "timeStore",
                "moment",
                "require",
                "blankRequire",
                storeDesc.loadComponent,
            );
            storeDesc.$component = loadComponent(React, i18n, timeStore, moment, req, blankRequire);
        } else if (storeDesc.loadModule) {
            storeDesc.$component = loadModule(storeDesc.loadModule);
        } else {
            console.error(
                "There is no loadComponent or loadModule for type:react in storeDesc for store: ",
                storeDesc.name,
            );
            storeDesc.$component = NoComponent;
        }
    }

    static __prepareTableColumns(columns, storeDesc) {
        for (let i = columns.length - 1; i >= 0; i--) {
            let columnDesc = columns[i];
            if (typeof columnDesc === "string") {
                columnDesc = { prop: columnDesc };
            }

            const propName = columnDesc.prop;
            let propDesc = null;

            if (storeDesc != null && storeDesc.props != null && storeDesc.props[propName] != null) {
                propDesc = storeDesc.props[propName];
            }

            if (propDesc == null) {
                columns.splice(i, 1);
                continue;
            }

            if (columnDesc.label) {
                columnDesc.label = template.compile(columnDesc.label, true);
            }

            if (columnDesc.display === displayTypes.react) {
                if (columnDesc.loadComponent) {
                    const req = require.context("../components", true, /.+\.js(x)?$/);
                    const blankRequire = require.context("..", true, /.+\.js(x)?$/);
                    const loadComponent = new Function(
                        "React",
                        "i18n",
                        "timeStore",
                        "moment",
                        "require",
                        "blankRequire",
                        columnDesc.loadComponent,
                    );
                    columnDesc.$component = loadComponent(React, i18n, timeStore, moment, req, blankRequire);
                } else if (columnDesc.loadModule) {
                    columnDesc.$component = loadModule(columnDesc.loadModule);
                } else {
                    console.error(
                        "There is no loadComponent or loadModule for display:react in tableColumn for column: ",
                        columnDesc.prop,
                    );
                    columnDesc.$component = NoComponent;
                }
            }

            configHelpers.__prepareOptions(columnDesc);
            columns[i] = Object.assign({}, propDesc, columnDesc);
        }
    }

    static prepareLabels(storeDesc) {
        if (storeDesc.labels == null) {
            return;
        }

        for (const labelDesc of storeDesc.labels) {
            labelDesc.hidden = configHelpers.__getConditionFunction(labelDesc.hidden);
            labelDesc.text = template.compile(labelDesc.text || "", true);
            labelDesc.color = template.compile(labelDesc.color || "", true);
            labelDesc.textColor = template.compile(labelDesc.textColor || "", true);
            labelDesc.icon = template.compile(labelDesc.icon || "");
            if (labelDesc.display === "react") {
                if (labelDesc.loadComponent) {
                    const req = require.context("../components", true, /.+\.js(x)?$/);
                    const blankRequire = require.context("..", true, /.+\.js(x)?$/);
                    const loadComponent = new Function(
                        "React",
                        "i18n",
                        "timeStore",
                        "moment",
                        "require",
                        "blankRequire",
                        "nvd3",
                        "d3",
                        labelDesc.loadComponent,
                    );
                    labelDesc.$component = loadComponent(React, i18n, timeStore, moment, req, blankRequire, nvd3, d3);
                } else if (labelDesc.loadModule) {
                    labelDesc.$component = loadModule(labelDesc.loadModule);
                } else {
                    console.error(
                        "There is no loadComponent or loadModule for display:react in label for store: ",
                        storeDesc.name,
                    );
                    labelDesc.$component = NoComponent;
                }
            }
        }
    }

    static prepareWidgets(storeDesc) {
        if (storeDesc.widgets == null) {
            return;
        }

        for (const widgetDesc of storeDesc.widgets) {
            if (widgetDesc.shouldReloadData && typeof widgetDesc.shouldReloadData === "string") {
                widgetDesc.shouldReloadData = new Function(
                    "$item",
                    "$prevItem",
                    "$data",
                    "$prevData",
                    widgetDesc.shouldReloadData,
                );
            }

            if (widgetDesc.type === "react") {
                if (widgetDesc.loadComponent) {
                    const req = require.context("../components", true, /.+\.js(x)?$/);
                    const blankRequire = require.context("..", true, /.+\.js(x)?$/);
                    const loadComponent = new Function(
                        "React",
                        "i18n",
                        "timeStore",
                        "moment",
                        "require",
                        "blankRequire",
                        "d3",
                        widgetDesc.loadComponent,
                    );
                    widgetDesc.$component = loadComponent(React, i18n, timeStore, moment, req, blankRequire, d3);
                } else if (widgetDesc.loadModule) {
                    widgetDesc.$component = loadModule(widgetDesc.loadModule);
                } else {
                    console.error(
                        "There is no loadComponent or loadModule for type:react in widget for store: ",
                        storeDesc.name,
                    );
                    widgetDesc.$component = NoComponent;
                }
            }
        }
    }

    static prepareFilters(storeDesc) {
        const { filters } = storeDesc;
        if (filters == null) {
            return;
        }

        for (const filterName of Object.keys(filters)) {
            const filterDesc = filters[filterName];
            if (filterDesc.default && typeof filterDesc.default === "string") {
                filterDesc.default = new Function("moment", filterDesc.default);
            }
        }
    }

    static prepareProps(storeDesc, storeName, config) {
        storeDesc.headerProperty = storeDesc.headerProperty || "name";
        if (storeDesc.props == null) {
            return;
        }

        for (const propName of Object.keys(storeDesc.props)) {
            const propDesc = storeDesc.props[propName];
            if (propDesc.props != null) {
                configHelpers.prepareProps(propDesc, storeName);
            }
            //Property prepairing
            propDesc.hidden = configHelpers.__getConditionFunction(propDesc.hidden);
            propDesc.disabled = configHelpers.__getConditionFunction(propDesc.disabled);

            if (propDesc.showAddAction) {
                propDesc.showAddAction = configHelpers.__getConditionFunction(propDesc.showAddAction);
            }

            propDesc.label = template.compile(
                propDesc.label || (propDesc.display === displayTypes.headerInput ? "" : propName),
            );
            if (propDesc.placeholder) {
                propDesc.placeholder = template.compile(propDesc.placeholder || "");
            }

            if (propDesc.tooltip) {
                propDesc.tooltip = template.compile(propDesc.tooltip || "", true);
            }

            for (let validatorName of Object.keys(baseValidators)) {
                propDesc[validatorName] = validation.getValidator(propDesc, validatorName, i18n.getForStore(storeName));
            }

            if (propDesc.tableColumns && propDesc.store && config) {
                configHelpers.__prepareTableColumns(propDesc.tableColumns, config[propDesc.store]);
            }

            if (propDesc.display === displayTypes.react) {
                if (propDesc.loadComponent) {
                    const req = require.context("../components", true, /.+\.js(x)?$/);
                    const blankRequire = require.context("..", true, /.+\.js(x)?$/);
                    let loadComponent = new Function(
                        "React",
                        "i18n",
                        "timeStore",
                        "moment",
                        "require",
                        "blankRequire",
                        propDesc.loadComponent,
                    );
                    propDesc.$component = loadComponent(React, i18n, timeStore, moment, req, blankRequire);
                } else if (propDesc.loadModule) {
                    propDesc.$component = loadModule(propDesc.loadModule);
                } else {
                    console.error(
                        "There is no loadComponent or loadModule for type:react in propDesc for prop: ",
                        propDesc.name,
                    );
                    propDesc.$component = NoComponent;
                }
            }

            if (propDesc.extraQuery && typeof propDesc.extraQuery === "string") {
                propDesc.extraQuery = new Function(
                    "$user",
                    "$item",
                    "$baseItem",
                    "$combinedBaseItem",
                    propDesc.extraQuery,
                );
            }

            if (propDesc.type === "virtual/client") {
                if (!propDesc.load) {
                    console.error(`load is not defined for prop: ${propName} in store: ${storeName}`);
                }

                propDesc.$load = new Function("$item", "$i18n", "$user", "$index", propDesc.load);
            }

            configHelpers.__prepareOptions(propDesc);

            if (propDesc.actions) {
                configHelpers.prepareActions(propDesc, true);
            }
        }

        if (storeDesc.filters != null) {
            configHelpers.prepareProps({ props: storeDesc.filters }, storeName);
        }

        for (const actionDesc of storeDesc.actions || []) {
            if (actionDesc.props != null) {
                configHelpers.prepareProps(actionDesc, storeName);
            }
        }

        for (const actionDesc of storeDesc.storeActions || []) {
            if (actionDesc.props != null) {
                configHelpers.prepareProps(actionDesc, storeName);
            }
        }

        configHelpers.prepareWidgets(storeDesc);
        configHelpers.prepareFilters(storeDesc);
    }

    static __prepareOptions(optionsWrapper) {
        if (Array.isArray(optionsWrapper.options)) {
            for (var i = 0; i < optionsWrapper.options.length; i++) {
                if (typeof optionsWrapper.options[i] === "string") {
                    optionsWrapper.options[i] = {
                        value: optionsWrapper.options[i],
                        label: optionsWrapper.options[i],
                    };
                }
                let option = optionsWrapper.options[i];
                option.label = template.compile(option.label || "");
            }
        }
    }

    static __returnFalse() {
        return false;
    }

    static __getConditionFunction(script) {
        if (!script) {
            return configHelpers.__returnFalse;
        }

        if (typeof script !== "string") {
            script = JSON.stringify(script);
        }

        try {
            return new Function(
                "$user",
                "$item",
                "$baseItem",
                "$combinedBaseItem",
                "$item = $item || {}; return " + script + ";",
            );
        } catch (err) {
            console.error("__getConditionFunction error: ", err, "on script: ", script);
            throw err;
        }
    }
}
