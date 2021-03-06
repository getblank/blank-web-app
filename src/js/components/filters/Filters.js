import React from "react";
import PropTypes from "prop-types";
import SimpleInput from "../forms/inputs/SimpleInput";
import SimpleForm from "../forms/SimpleForm";
import PinToggle from "../misc/Pin";
import i18n from "../../stores/i18nStore";
import filtersStore from "../../stores/filtersStore";
import filtersActions from "../../actions/filtersActuators.js";
import preferencesActions from "../../actions/preferencesActuators";
import configStore from "../../stores/configStore.js";
import credentialsStore from "../../stores/credentialsStore";
import alerts from "../../utils/alertsEmitter";
import { storeEvents, displayTypes } from "constants";
import order from "utils/order";
import classnames from "classnames";

class SavedFiltersView extends React.Component {
    render() {
        const list = this.props.items.map((item) => {
            const labels = item.labels.join(", ");

            const className = classnames("item", "selectable", "item-action-icons", {
                active: this.props.selectedFilters.includes(item.name),
            });
            return (
                <div
                    key={item.name}
                    className={className}
                    style={{ width: "241px" }}
                    data-id={item.name}
                    onClick={this.props.selectItem}
                >
                    <a>
                        <div className="item-name" title={item.name}>
                            {item.name}
                        </div>
                        <div className="item-extra">{labels}</div>
                    </a>
                </div>
            );
        });

        const containerStyle = {
            width: "230px",
            marginLeft: "-12px",
            marginRight: "-12px",
            borderRight: 0,
        };
        return (
            <div className={"list-view-container"} style={containerStyle}>
                <div className={"items-list"} style={{ overflowY: "hidden" }}>
                    {list}
                </div>
            </div>
        );
    }
}

export default class Filters extends React.Component {
    constructor(props) {
        super(props);
        this.state = { savedFilters: [], selectedFilters: [] };
        this.state.filtersDesc = configStore.getConfig(this.props.storeName).filters || [];
        this.state.enableSavingFilters = configStore.getConfig(this.props.storeName).enableSavingFilters || false;
        this.state.filters = filtersStore.getFilters(this.props.storeName);
        this.state.pin = this.props.pin === true;
        this.state.overflow = "auto";
        this._onFilterChange = this._onFilterChange.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.cancelSavingFilter = this.cancelSavingFilter.bind(this);
        this.selectFilter = this.selectFilter.bind(this);
        this.deleteFilter = this.deleteFilter.bind(this);
        this.loadFilter = this.loadFilter.bind(this);
        this.openLoadingForm = this.openLoadingForm.bind(this);
        this.openSavingForm = this.openSavingForm.bind(this);
        this.clear = this.clear.bind(this);
        this.applyFilters = this.applyFilters.bind(this);

        filtersActions.loadSavedFilters(this.props.storeName);
    }

    handleFilterChange(filterName, value) {
        if (this.props.enableLiveSearch) {
            clearTimeout(this.state.timer);
            const timer = setTimeout(() => {
                filtersActions.setFilter(this.props.storeName, filterName, value);
            }, 500);

            return this.setState({ timer });
        }
        const { filters } = this.state;
        filters[filterName] = value;
        this.setState({ filters });
    }

    clear(e) {
        e.preventDefault();
        filtersActions.clearFilter(this.props.storeName);
        if (typeof this.props.onClear === "function") {
            this.props.onClear();
        }
    }

    openLoadingForm(e) {
        e.preventDefault();
        this.setState({ showFilterLoadForm: true, selectedFilters: [] });
    }

    openSavingForm(e) {
        e.preventDefault();
        this.setState({ showFilterSaverForm: true });
        this.handleFilterSavingDataChange({ filters: [] });
    }

    pin(e) {
        this.setState({ pin: !this.state.pin });
    }

    handleFocus(fieldDisplay) {
        if (fieldDisplay === displayTypes.dateRange) {
            this.setState({ overflow: "visible" });
        }
    }

    handleBlur(fieldDisplay) {
        if (fieldDisplay === displayTypes.dateRange) {
            this.setState({ overflow: "auto" });
        }
    }

    cancelSavingFilter(e) {
        e && e.preventDefault();
        if (!e || e.target === this.filterLoadForm || e.target === this.cancelSavingButton) {
            this.setState({ showFilterSaverForm: false, showFilterLoadForm: false, filterToLoad: null });
            this.handleFilterSavingDataChange({ filters: [] });
        }
    }

    handleFilterSavingDataChange(data) {
        this.setState({ selectedFilters: data });
    }

    handleFilterLoadChange(data) {
        this.setState({ filterToLoad: data.name });
    }

    saveFilter() {
        const { name, filters } = this.state.selectedFilters;
        if (filters.length === 0) {
            alerts.error(i18n.get("filters.noFiltersError"));

            return;
        }

        if (!name) {
            alerts.error(i18n.get("filters.noFilterNameError"));

            return;
        }

        const { storeName } = this.props;
        const currentFilters = filtersStore.getFilters(storeName);
        const filtersToSave = {};
        for (const propName of filters) {
            filtersToSave[propName] = currentFilters[propName] || null;
        }

        filtersActions.saveFilter(storeName, name, filtersToSave);
        this.cancelSavingFilter();
        alerts.info(i18n.get("filters.filterSaved"));
    }

    applyFilters() {
        filtersActions.loadFilters(this.props.storeName, this.state.filters);
    }

    loadFilter() {
        const { selectedFilters } = this.state;
        if (selectedFilters.length === 0 || selectedFilters.length > 1) {
            alerts.error(i18n.get("filters.noFilterSelectedForLoading"));

            return;
        }

        const filterName = selectedFilters[0];

        const savedFilters = filtersStore.savedFilters();
        for (const f of savedFilters) {
            if (f.name === filterName) {
                const { storeName } = this.props;
                filtersActions.loadFilters(storeName, f.filter);

                this.cancelSavingFilter();
                alerts.info(i18n.get("filters.filterLoaded"));

                return;
            }
        }

        alerts.error(i18n.get("filters.filterNotFound"));
    }

    deleteFilter() {
        const { selectedFilters } = this.state;
        if (selectedFilters.length === 0) {
            alerts.error(i18n.get("filters.noFiltersError"));

            return;
        }

        const { storeName } = this.props;
        for (const name of selectedFilters) {
            filtersActions.deleteFilter(storeName, name);
        }

        this.setState({ deletedAt: new Date() });
    }

    selectFilter(e) {
        const selectedFilters = [...this.state.selectedFilters];
        const itemId = e.currentTarget.getAttribute("data-id");
        const idx = selectedFilters.indexOf(itemId);

        if (idx >= 0) {
            selectedFilters.splice(idx, 1);
        } else {
            selectedFilters.push(itemId);
        }

        this.setState({ selectedFilters });
    }

    getFilterSavingProps(filters) {
        return {
            name: {
                type: "string",
                display: "textInput",
                label: () => i18n.get("filters.filterName"),
                hidden: () => false,
                disabled: () => false,
                required: () => true,
                groupAccess: "ru",
                ownerAccess: "ru",
                formOrder: 10,
                style: { width: "150px" },
            },
            filters: {
                type: "any",
                display: "checkList",
                label: () => i18n.get("filters.paramsToSave"),
                hidden: () => false,
                disabled: () => false,
                required: () => true,
                groupAccess: "ru",
                ownerAccess: "ru",
                options: filters.filter((e) => e.name !== "_default").map((e) => ({ label: e.label, value: e.name })),
                formOrder: 20,
            },
        };
    }

    getFilterLoadingProps(filters) {
        const savedFilters = filtersStore.savedFilters();

        return {
            name: {
                type: "any",
                display: "select",
                label: () => i18n.get("filters.filterToLoad"),
                hidden: () => false,
                disabled: () => false,
                required: () => true,
                groupAccess: "ru",
                ownerAccess: "ru",
                options: savedFilters.map((e) => ({ label: () => e.name, value: e.name })),
                formOrder: 10,
                style: { width: "150px" },
            },
        };
    }

    render() {
        const filters = Object.keys(this.state.filtersDesc).map((filterName) => {
            const filter = Object.assign({}, this.state.filtersDesc[filterName]);
            filter.name = filterName;
            return filter;
        });

        order.by(filters, "formOrder");
        const user = credentialsStore.getUser();
        const filterControls = filters.map((filter, index) => {
            if (
                filter.hidden(user, this.state.filters) ||
                filter.display === "none" ||
                filter.name.indexOf("_") === 0
            ) {
                return null;
            }

            return (
                <SimpleInput
                    fieldName={filter.name}
                    key={filter.name + "-" + index}
                    field={filter}
                    storeName={this.props.storeName}
                    item={this.state.filters}
                    timeout={this.props.enableLiveSearch ? 1000 : 0}
                    onChange={this.handleFilterChange.bind(this)}
                    value={this.state.filters[filter.name]}
                    onFocus={this.handleFocus.bind(this, filter.display)}
                    onBlur={this.handleBlur.bind(this, filter.display)}
                    className="filter"
                ></SimpleInput>
            );
        });

        const filterSavingProps = this.getFilterSavingProps(filters);

        const style = { paddingLeft: 0, paddingRight: 0 };
        const filterSaverForm = this.state.showFilterSaverForm ? (
            <div className="item-actions">
                <div
                    className="action-form-modal"
                    ref={(e) => (this.filterSaverForm = e)}
                    style={style}
                    onClick={this.cancelSavingFilter}
                >
                    <div className="action-form">
                        <span className="title m-b-14">{i18n.get("filters.saveFilterTitle")}</span>
                        <SimpleForm
                            storeDesc={{ props: filterSavingProps }}
                            storeName={this.props.storeName}
                            item={Object.assign({}, this.state.selectedFilters)}
                            onChange={this.handleFilterSavingDataChange.bind(this)}
                            cancel={this.cancelSavingFilter}
                            onSubmit={this.saveFilter.bind(this)}
                            // onSubmitError={this.setDataTouched.bind(this)}
                            saveClass={"btn-flat last" + (this.props.dark ? " btn-flat-dark" : "")}
                            saveIcon={null}
                            saveText={i18n.get("form.save")}
                            cancelClass={"btn-flat first" + (this.props.dark ? " btn-flat-dark" : "")}
                            cancelIcon={null}
                            cancelText={i18n.get("form.cancel")}
                            buttonsContainerClassName="action-buttons"
                            directWrite={true}
                            user={user}
                            dark={this.props.dark}
                        />
                    </div>
                </div>
            </div>
        ) : null;

        const savedFilters = filtersStore.savedFilters().map((e) => {
            e = Object.assign({}, e);
            e.labels = Object.keys(e.filter)
                .map((filterName) => {
                    const filterDesc = this.state.filtersDesc[filterName];
                    if (!filterDesc) {
                        return;
                    }

                    return filterDesc.label({ $i18n: i18n.getForStore(this.props.storeName), $user: user });
                })
                .filter((e) => e);

            return e;
        });

        const filterLoadForm = this.state.showFilterLoadForm ? (
            <div className="item-actions">
                <div
                    className="action-form-modal"
                    ref={(e) => (this.filterLoadForm = e)}
                    style={style}
                    onClick={this.cancelSavingFilter}
                >
                    <div className="action-form">
                        <span className="title m-b-14">{i18n.get("filters.loadFilterTitle")}</span>

                        <SavedFiltersView
                            items={savedFilters}
                            selectItem={this.selectFilter}
                            currentId={1}
                            selectedFilters={this.state.selectedFilters}
                        />

                        <button
                            onClick={this.deleteFilter}
                            tabIndex="-1"
                            key="filterDelete"
                            className="btn-flat first btn-accent"
                        >
                            {i18n.get("form.delete")}
                        </button>
                        <button onClick={this.loadFilter} tabIndex="-1" key="loadFilter" className="btn-flat last">
                            {i18n.get("filters.loadButton")}
                        </button>

                        <button
                            onClick={this.cancelSavingFilter}
                            ref={(e) => (this.cancelSavingButton = e)}
                            tabIndex="-1"
                            key="filterLoadCancel"
                            className="btn-flat first"
                        >
                            {i18n.get("form.cancel")}
                        </button>
                    </div>
                </div>
            </div>
        ) : null;

        const filtersSaverControls = this.state.enableSavingFilters
            ? [
                  <button onClick={this.openLoadingForm} tabIndex="-1" key="b-2" className="btn-flat first">
                      {i18n.get("filters.loadButton")}
                  </button>,
                  <button onClick={this.openSavingForm} tabIndex="-1" key="b-3" className="btn-flat last">
                      {i18n.get("filters.saveButton")}
                  </button>,
              ]
            : null;

        const cn = classnames("filters", {
            show: this.props.show,
            pinned: this.state.pin,
        });

        const showFiltersControl = !filterLoadForm && !filterSaverForm;
        return (
            <div className={cn} ref={(e) => (this.mainForm = e)}>
                <div className="relative">
                    <PinToggle onClick={this.pin.bind(this)} pinned={this.state.pin} />
                </div>
                <div style={{ margin: "14px 0 0 20px", flexShrink: "0" }}>
                    <span className="subheading light-secondary">{i18n.get("filters.title")}</span>
                </div>
                {filterSaverForm}
                {filterLoadForm}
                {showFiltersControl
                    ? [
                          <div className="pd-filters" key="f-1">
                              <div>{filterControls}</div>
                          </div>,
                          <div className="bottom-btn-filters" key="f-2">
                              <button
                                  onClick={this.clear}
                                  tabIndex="-1"
                                  key="b-0"
                                  className="btn-flat first btn-accent"
                              >
                                  {i18n.get("filters.clear")}
                              </button>
                              <button onClick={this.applyFilters} tabIndex="-1" key="b-1" className="btn-flat last">
                                  {i18n.get("common.apply")}
                              </button>

                              {filtersSaverControls}
                          </div>,
                      ]
                    : null}
            </div>
        );
    }

    handleDocumentClick(e) {
        if (this.props.show && !this.state.pin) {
            var root = this.mainForm;
            if (e.target === root || root.contains(e.target) || e.defaultPrevented) {
                return;
            }

            preferencesActions.setPreference(this.props.storeName + "-show-filters", false);
        }
    }

    handleKeyDown(e) {
        if (e.keyCode == 13) {
            this.applyFilters();
        }
    }

    componentDidMount() {
        filtersStore.on(storeEvents.CHANGED, this._onFilterChange);
        if (this.props.show) {
            document.addEventListener("click", this.handleDocumentClick);
            document.addEventListener("keydown", this.handleKeyDown);
        }
    }

    componentWillUnmount() {
        filtersStore.removeListener(storeEvents.CHANGED, this._onFilterChange);
        document.removeEventListener("click", this.handleDocumentClick);
        document.removeEventListener("keydown", this.handleKeyDown);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.storeName !== nextProps.storeName) {
            this.setState({
                filtersDesc: configStore.getConfig(nextProps.storeName).filters || [],
                filters: filtersStore.getFilters(nextProps.storeName),
            });
        }

        if (nextProps.show && !this.props.show) {
            document.addEventListener("click", this.handleDocumentClick);
            document.addEventListener("keydown", this.handleKeyDown);
        }

        if (!nextProps.show && this.props.show) {
            document.removeEventListener("click", this.handleDocumentClick);
            document.removeEventListener("keydown", this.handleKeyDown);
            this.cancelSavingFilter();
        }

        if (nextProps.pin === true && this.state.pin !== true) {
            this.setState({ pin: true });
        }
    }

    _onFilterChange() {
        this.setState({ filters: filtersStore.getFilters(this.props.storeName) });
    }
}

Filters.propTypes = {
    storeName: PropTypes.string.isRequired,
    show: PropTypes.bool,
    onClear: PropTypes.func,
};
Filters.defaultProps = {};
