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
    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.searchText !== this.props.searchText;
    }

    render() {
        const { searchText, searchTextChangedHandler } = this.props;

        return (<div className="search-input">
            <input type="text"
                id="store-quicksearch"
                className={"form-control dark input-sm" + (searchText ? " open" : "")}
                onChange={searchTextChangedHandler}
                value={searchText}
                placeholder={i18n.get("filters.enterSearchText")} />
            <label htmlFor="store-quicksearch">
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
        this._onChange = this._onChange.bind(this);
        this._onPrefChange = this._onPrefChange.bind(this);
        this.searchTextChangedHandler = this.searchTextChangedHandler.bind(this);
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
        if (state.storeDesc && state.storeDesc.type === storeTypes.process && state.ready) {
            state.counters = listStore.getCounters();
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
        let shouldUpdate = this.state.counter != nextState.counter;

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

    searchTextChangedHandler(e) {
        const searchText = e.target.value;
        clearTimeout(this.state.timer);
        const timer = setTimeout(() => {
            filtersActions.setFilter(this.state.storeName, "_default", searchText);
        }, 500);

        this.setState({ timer, searchText, counter: this.state.counter - 1 });
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
        let component,
            componentProps = {
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

        let listView = false;
        switch (this.state.display) {
            case storeDisplayTypes.table:
                component = TableView;
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
                                    />
                                    : null}

                                <div className="fill"></div>

                                <FiltersToggle storeName={this.state.storeName} />

                                <LayoutToggle storeDesc={storeDesc}
                                    storeName={this.state.storeName} />

                                <ActionsMenu storeDesc={storeDesc}
                                    storeName={this.state.storeName}
                                    actions={itemsActions}
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
                {showHeader && <Filters storeName={this.state.storeName} show={showFilters} pin={pinFilters} />}
            </div>
        );
    }
}

StoreView.propTypes = {};
StoreView.defaultProps = { subscribe: true };

export default StoreView;
