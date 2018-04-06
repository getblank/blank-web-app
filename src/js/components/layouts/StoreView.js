/**
 * Created by kib357 on 16/08/15.
 */

import React from "react";
import ListView from "./ListView";
import TableView from "./TableView";
import HtmlView from "./HtmlView";
import Grid from "./GridView";
import Dashboard from "./Dashboard";
import Calendar from "./Calendar";
import Filters from "../filters/Filters";
import FiltersSummary from "../filters/FiltersSummary";
import FiltersToggle from "../filters/FiltersToggle";
import SideNavToggle from "../nav/SideNavToggle";
import LayoutToggle from "./LayoutToggle";
import ActionsMenu from "../actions/ActionsMenu";
import configStore from "../../stores/configStore";
import listStore from "../../stores/listStore";
import currentItemStore from "../../stores/currentItemStore";
import preferencesStore from "../../stores/preferencesStore";
import filtersStore from "../../stores/filtersStore";
import appState from "../../stores/appStateStore";
import i18n from "../../stores/i18nStore";
import history from "../../stores/historyStore";
import itemsStoreGroup from "../../stores/itemsStoreGroup";
import filtersActions from "../../actions/filtersActuators";
import template from "template";
import { storeTypes, storeDisplayTypes, storeEvents, previewMinWidth } from "constants";
import itemsActions from "../../actions/itemsActuators";

class StoreViewSearchInput extends React.Component {
    constructor(props) {
        super(props);
        this.searchTextChangedHandler = this.searchTextChangedHandler.bind(this);
        this.searchTextonKeyDownHandler = this.searchTextonKeyDownHandler.bind(this);
        this.performSearch = this.performSearch.bind(this);
        this.searchTextonBlurHandler = this.searchTextonBlurHandler.bind(this);
        this.state = {
            searchText: this.props.searchText,
        };
    }

    searchTextChangedHandler(e) {
        const searchText = e.target.value;
        this.setState({ searchText });
        this.props.searchTextChangedHandler(searchText);
    }

    searchTextonKeyDownHandler(e) {
        if (e.keyCode == 13 && !this.props.enableLiveSearch) {
            this.props.searchTextonKeyDownHandler(this.state.searchText);
        }
    }

    performSearch() {
        this.props.searchWithText(this.state.searchText);
    }

    searchTextonBlurHandler() {
        if (this.state.searchText && !this.props.enableLiveSearch) {
            this.performSearch();
        }
    }

    render() {
        return (<div className="search-input">
            <input type="text"
                id="store-quicksearch"
                className={"form-control dark input-sm" + (this.state.searchText ? " open" : "")}
                onChange={this.searchTextChangedHandler}
                onKeyDown={this.searchTextonKeyDownHandler}
                onBlur={this.searchTextonBlurHandler}
                value={this.state.searchText}
                placeholder={i18n.get("filters.enterSearchText")} />
            <label htmlFor="store-quicksearch" onClick={this.performSearch}>
                <i className="material-icons text">search</i>
            </label>
        </div>);
    }
}

class StoreView extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getStateFromStore();
        this.state.store = listStore;
        this.actions = {
            performStoreAction: this.performStoreAction.bind(this),
        };
        this._onChange = this._onChange.bind(this);
        this._onPrefChange = this._onPrefChange.bind(this);
        this.searchTextChangedHandler = this.searchTextChangedHandler.bind(this);
        this.searchTextonKeyDownHandler = this.searchTextonKeyDownHandler.bind(this);
        this.setVisibleColumns = this.setVisibleColumns.bind(this);
        this.isSelected = this.isSelected.bind(this);
        this.handleRowSelect = this.handleRowSelect.bind(this);
        this.searchWithText = this.searchWithText.bind(this);
    }

    getStateFromStore() {
        const state = {};
        state.counter = this.state ? this.state.counter + 1 : 0;
        state.storeName = appState.store;
        state.storeDesc = configStore.getConfig(state.storeName);
        state.filters = filtersStore.getFilters(state.storeName, true);
        state.searchText = state.filters._default || "";
        state.order = filtersStore.getOrder(state.storeName, state.storeDesc.orderBy);
        state.item = currentItemStore.get();
        state.itemId = appState.getCurrentItemId();
        state.ready = listStore.isReady();
        state.items = state.ready ? listStore.get() : [];
        state.newItems = state.ready ? listStore.getNewItems(true) : [];
        state.tableColumns = this.state ? this.state.tableColumns : [];
        state.selected = this.state ? this.state.selected : [];
        state.enableLiveSearch = state.storeDesc.enableLiveSearch;
        if (state.storeDesc && state.storeDesc.type === storeTypes.process && state.ready) {
            state.counters = listStore.getCounters();
        }

        if (state.items.length > 0) {
            if (state.selected.length > 0) {
                for (let i = state.selected.length - 1; i >= 0; i--) {
                    const _id = state.selected[i];
                    if (!state.items.find(e => e && e._id === _id)) {
                        state.selected.splice(i, 1);
                    }
                }
            }
        } else {
            state.selected = [];
        }

        Object.assign(state, this.getUserPrefs(state));

        return state;
    }

    getUserPrefs(useState) {
        const state = useState || this.state;
        const newState = {};
        let showFilters = preferencesStore.getUserPreference(state.storeName + "-show-filters");
        if (showFilters == null) {
            const { storeDesc } = state;
            showFilters = storeDesc.showFilters === true;
            newState.pinFilters = storeDesc.showFilters === true;
        }

        newState.display = appState.getCurrentDisplay();

        newState.showFilters = showFilters === true;

        return newState;
    }

    componentDidMount() {
        itemsStoreGroup.on(storeEvents.CHANGED, this._onChange);
        preferencesStore.on(storeEvents.CHANGED, this._onPrefChange);
    }

    componentWillUnmount() {
        itemsStoreGroup.removeListener(storeEvents.CHANGED, this._onChange);
        preferencesStore.removeListener(storeEvents.CHANGED, this._onPrefChange);
    }

    shouldComponentUpdate(nextProps, nextState) {
        const shouldUpdate = this.state.counter != nextState.counter;

        return shouldUpdate;
    }

    _onPrefChange() {
        this.setState(Object.assign({ counter: this.state.counter + 1 }, this.getUserPrefs()));
    }

    _onChange() {
        this.setState(this.getStateFromStore());
    }

    requestItems(offset) {
        if (listStore.needLoadItems(offset)) {
            itemsActions.loadItems(offset);
        }
    }

    searchWithText(searchText) {
        filtersActions.setFilter(this.state.storeName, "_default", searchText);
    }

    searchTextonKeyDownHandler(searchText) {
        clearTimeout(this.state.timer);
        this.searchWithText(searchText);
    }

    searchTextChangedHandler(searchText) {
        if (searchText.length === 0 || this.state.enableLiveSearch) {
            clearTimeout(this.state.timer);
            const timer = setTimeout(() => {
                this.searchWithText(searchText);
            }, this.state.enableLiveSearch ? 500 : 1000);

            return this.setState({ timer, searchText, counter: this.state.counter - 1 });
        }

        this.setState({ searchText, counter: this.state.counter - 1 });
    }

    setVisibleColumns(tableColumns) {
        this.setState({ tableColumns });
    }

    performStoreAction(storeName, actionId, requestData = {}) {
        requestData.$columns = [...this.state.tableColumns];
        requestData.$filter = JSON.parse(JSON.stringify(this.state.filters));
        requestData.$selectedIds = [...this.state.selected];
        requestData.$orderBy = this.state.order;
        itemsActions.performStoreAction(storeName, actionId, requestData);
    }

    handleRowSelect(item) {
        const items = Array.isArray(item) ? item : [item];
        const selected = this.state.selected.slice();
        for (const { _id } of items) {
            const i = selected.findIndex(e => e === _id);
            if (i >= 0) {
                selected.splice(i, 1);
            } else {
                selected.push(_id);
            }
        }

        this.setState({ selected });
    }

    isSelected(item) {
        if (!item) {
            return;
        }

        return this.state.selected.includes(item._id);
    }

    render() {
        const storeDesc = this.state.storeDesc;
        if (!storeDesc.type) {
            return null;
        }

        let titleText = storeDesc.label || "";
        const filters = filtersStore.getFilters(this.state.storeName, true);
        if (storeDesc.type === storeTypes.process && filters._state) {
            let stateDesc = storeDesc.states[filters._state];
            titleText += " – " + stateDesc.label;
        }

        const title = template.render(titleText, { $i18n: i18n.getForStore(this.state.storeName) }) || "?";
        const componentProps = {
            ref: "itemsView",
            storeName: this.state.storeName,
            storeDesc: storeDesc,
            ready: this.state.ready,
            store: this.state.store,
            actions: itemsActions,
            items: this.state.items,
            item: this.state.item,
            newItems: this.state.newItems,
            itemId: this.state.itemId,
            counters: this.state.counters,
            saveDraft: this.saveDraft,
            requestItems: this.requestItems.bind(this),
            disableAutoSelect: storeDesc.disableAutoSelect || (window.innerWidth <= previewMinWidth),
            title: title,
            create: itemsActions.create.bind(this, this.state.storeName),
            select: itemsActions.select,
        };

        let component;

        let listView = false;
        switch (this.state.display) {
            case storeDisplayTypes.table:
                component = TableView;
                componentProps.setVisibleColumns = this.setVisibleColumns;
                componentProps.isSelected = this.isSelected;
                componentProps.onSelect = this.handleRowSelect;
                break;
            case storeDisplayTypes.grid:
                component = Grid;
                break;
            case storeDisplayTypes.html:
                component = HtmlView;
                break;
            case storeDisplayTypes.dashboard:
                component = Dashboard;
                break;
            case storeDisplayTypes.calendar:
                component = Calendar;
                break;
            case storeDisplayTypes.react:
                component = storeDesc.$component;
                componentProps.setVisibleColumns = this.setVisibleColumns;
                componentProps.isSelected = this.isSelected;
                componentProps.onSelect = this.handleRowSelect;
                break;
            default:
                component = ListView;
                listView = true;
                break;
        }

        const itemsContainer = React.createElement(component, componentProps);
        const showBackLink = this.state.display === storeDisplayTypes.grid ||
            this.state.display === storeDisplayTypes.table ||
            this.state.display === storeDisplayTypes.calendar ||
            window.innerWidth <= previewMinWidth;
        const preview = !showBackLink;
        const child = history.createChild(this, {
            storeDesc: storeDesc || {},
            storeName: this.state.storeName,
            ready: this.state.ready,
            item: this.state.item,
            actions: itemsActions,
            showBackLink: showBackLink,
        });

        const showHeader = !storeDesc.hideHeader;
        const showList = !this.state.itemId || (listView && (window.innerWidth > previewMinWidth));
        const showItem = this.state.itemId || (listView && (window.innerWidth > previewMinWidth));
        const showFilters = (!showItem || preview) && (this.state.showFilters);
        const { pinFilters } = this.state;

        return (
            <div className="flex row fill relative">
                <div className="flex column fill relative">
                    {showList && showHeader &&
                        <div className="store-header">
                            <div className="wrapper">
                                <div className="menu-btn">
                                    <SideNavToggle />
                                </div>
                                <span className="headline">{title}</span>

                                {!storeDesc.hideQuickSearch
                                    ? <StoreViewSearchInput
                                        searchText={this.state.searchText}
                                        searchTextChangedHandler={this.searchTextChangedHandler}
                                        searchTextonKeyDownHandler={this.searchTextonKeyDownHandler}
                                        searchWithText={this.searchWithText}
                                        enableLiveSearch={this.state.enableLiveSearch}
                                    />
                                    : null}

                                <div className="fill"></div>

                                <FiltersToggle storeName={this.state.storeName} />

                                <LayoutToggle storeDesc={storeDesc}
                                    storeName={this.state.storeName} />

                                <ActionsMenu storeDesc={storeDesc}
                                    storeName={this.state.storeName}
                                    actions={this.actions}
                                    selectedIds={this.state.selected}
                                    forStore={true} />
                            </div>
                        </div>}

                    {showHeader &&
                        <FiltersSummary storeName={this.state.storeName}
                            filters={this.state.filters}
                            filtersDesc={storeDesc.filters} />}

                    <div className="flex row fill">
                        {showList ? itemsContainer : null}
                        {showItem && this.state.ready ? (child ||
                            <div className="flex column fill relative">
                                <div className="item-header no-shrink">
                                    <div className="container item-name"><h2>{i18n.get("form.emptyPreview")}</h2></div>
                                </div>
                            </div>) : null}
                    </div>

                </div>
                {showHeader && <Filters storeName={this.state.storeName} show={showFilters} pin={pinFilters} enableLiveSearch={this.state.enableLiveSearch} />}
            </div>
        );
    }
}

StoreView.propTypes = {};
StoreView.defaultProps = { subscribe: true };

export default StoreView;
