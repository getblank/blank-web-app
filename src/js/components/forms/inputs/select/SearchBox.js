import React from "react";
import configStore from "../../../../stores/configStore";
import searchActions from "../../../../actions/searchActuators";
import historyActions from "../../../../actions/historyActuators";
import check from "utils/check";
import find from "utils/find";
import template from "template";
import classnames from "classnames";
import i18n from "../../../../stores/i18nStore";

let baseUri;
let pathname = window.location.pathname;
const rgx = /^.*?\/app/;
const matched = pathname.match(rgx);
if (matched) {
    baseUri = location.origin + matched;
} else {
    console.error("Invalid url found, can't use links in searchBox");
}

export default class SearchBox extends React.Component {
    static defaultProps = {
        optionsOnPage: 5,
        viewProp: "name",
    };

    constructor(props) {
        super(props);
        const { propDesc } = this.props;

        this.state = {
            selectedOptions: null,
            searching: false,
            options: this.props.options || [],
            optionsCount: this.props.options ? this.props.options.length : 0,
            searchText: "",
            searchPage: 0,
            i: 0,
        };

        this.storeName = propDesc.store;
        this.multi = propDesc.type === "refList" || propDesc.multi;
        this.pages = propDesc.pages != null ? propDesc.pages : true;
        this.searchFields = propDesc.searchBy || ["name"];
        this.orderBy = propDesc.sortBy || (propDesc.searchBy ? propDesc.searchBy[0] : "name");
        this.extraQuery = () => {
            if (typeof propDesc.extraQuery === "function") {
                return propDesc.extraQuery(
                    this.props.user,
                    this.props.combinedItem || this.props.item,
                    this.props.baseItem,
                    this.props.combinedBaseItem,
                );
            }

            return propDesc.extraQuery;
        };
        this.disabledOptions = propDesc.disableCurrent ? [this.props.item._id] : [];

        this.showAddAction = () => {
            if (typeof propDesc.showAddAction === "function") {
                return propDesc.showAddAction(
                    this.props.user,
                    this.props.combinedItem || this.props.item,
                    this.props.baseItem,
                );
            }

            return propDesc.showAddAction === true;
        };
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.value !== nextProps.value) {
            this.loadSelectedOptions(nextProps);
        }
    }

    componentDidMount() {
        this.loadSelectedOptions();
    }

    componentWillUnmount() {
        if (this.searchInput) {
            this.searchInput.removeEventListener("keydown", this.onKeyDown);
            document.removeEventListener("click", this.handleDocumentClick);
        }
    }

    focus = e => {
        if (this.props.disabled) {
            return;
        }
        if (e.target.classList.contains("search-box")) {
            this.searchInput.focus();
        }
    };

    onFocus = e => {
        this.open();
        if (typeof this.props.onFocus === "function") {
            this.props.onFocus();
        }
    };

    onBlur = e => {
        if (typeof this.props.onBlur === "function") {
            this.props.onBlur();
        }
    };

    searchHandle = e => {
        var value = e.target.value;
        this.setState({ searchText: value, searchPage: 0, i: 0 }, this.search);
    };

    next = e => {
        if (this.nextEnabled()) {
            this.setState({ searchPage: this.state.searchPage + 1, i: 0 }, this.search);
        }
    };

    nextEnabled = () => {
        return this.state.optionsCount / this.props.optionsOnPage > this.state.searchPage + 1;
    };

    prev = e => {
        if (this.prevEnabled()) {
            this.setState({ searchPage: this.state.searchPage - 1, i: 0 }, this.search);
        }
    };

    prevEnabled = () => {
        return this.state.searchPage > 0;
    };

    search = () => {
        let self = this,
            searchText = this.state.searchText + (this.props.searchText ? " " + this.props.searchText : "");
        this.setState({ searching: true }, function() {
            let take, skip;
            if (this.pages) {
                take = this.props.optionsOnPage;
                skip = this.state.searchPage * this.props.optionsOnPage;
            }

            searchActions
                .search(this.storeName, searchText, this.searchFields, this.extraQuery(), take, skip, this.orderBy)
                .then(
                    function(res) {
                        if (
                            res.text !==
                            self.state.searchText + (self.props.searchText ? " " + self.props.searchText : "")
                        ) {
                            return;
                        }

                        self.setState({ optionsCount: res.count, options: res.items, searching: false });
                    },
                    function(error) {
                        console.error("Search error");
                        console.error(error);
                    },
                );
        });
    };
    open = () => {
        if (this.props.disabled) {
            return;
        }
        this.setState({ opened: true }, function() {
            this.manageListeners();
            this.search();
        });
    };

    close = () => {
        this.setState({ opened: false, searchText: "", i: 0 }, this.manageListeners);
    };

    onKeyDown = event => {
        switch (event.code) {
            case "ArrowLeft":
                event.preventDefault();
                this.prev();
                break;
            case "ArrowRight":
                event.preventDefault();
                this.next();
                break;
            case "ArrowDown":
            case "ArrowUp":
                if (this.state.options.length > 0) {
                    event.preventDefault();
                    this.setKeyboardIndex(0, event.code === "ArrowDown");
                }
                break;
            case "Enter":
                if (this.state.i > 0) {
                    event.preventDefault();
                    this.select(this.state.options[this.state.i - 1]);
                }
                break;
            case "Backspace":
                if (!this.state.searchText && Array.isArray(this.props.value) && this.props.value.length > 0) {
                    this.unSelect({ _id: this.props.value[this.props.value.length - 1] });
                }
                break;
            case "Escape":
            case "Tab":
                this.close();
                break;
        }
    };

    setKeyboardIndex = (iteration, inc, baseIndex) => {
        if (iteration > this.state.options.length) {
            return;
        }
        baseIndex = baseIndex == null ? this.state.i : baseIndex;
        let i = baseIndex + (inc ? 1 : -1);
        if (i > this.state.options.length) {
            i = 1;
        }
        if (i < 1) {
            i = this.state.options.length;
        }
        var item = this.state.options[i - 1];
        var goNext =
            check.any(this.state.selectedOptions, function(_item) {
                return _item._id === item._id;
            }) ||
            (this.disabledOptions && this.disabledOptions.indexOf(item._id) >= 0);
        if (goNext) {
            this.setKeyboardIndex(++iteration, inc, i);
        } else {
            this.setState({ i: i });
        }
    };

    select = (item, e) => {
        if (e) {
            e.preventDefault();
        }

        const id = item._id;
        if (typeof this.props.onChange === "function") {
            if (this.multi === true) {
                var propsValue = this.props.value;
                if (!Array.isArray(this.props.value)) {
                    propsValue = [];
                }
                var selectedOptions = propsValue.slice();
                if (propsValue.indexOf(id) < 0) {
                    selectedOptions.push(id);
                }
                this.props.onChange(selectedOptions);
            } else {
                this.close();
                this.props.onChange(id, item);
            }
        }
    };

    unSelect = (item, e) => {
        if (e) {
            e.preventDefault();
        }
        var id = item._id;
        if (typeof this.props.onChange === "function") {
            if (this.multi === true && Array.isArray(this.props.value)) {
                var index = this.props.value.indexOf(id);
                var selectedOptions = this.props.value.slice();
                selectedOptions.splice(index, 1);
                this.props.onChange(selectedOptions);
            } else {
                this.props.onChange(null, null);
            }
        }
    };

    clickHandler = (storeName, itemId) => {
        return e => {
            e.preventDefault();
            historyActions.goToStoreItem(storeName, itemId);
        };
    };

    handleDocumentClick = e => {
        var box = this.box;
        if (box == null) {
            this.close();
            return;
        }
        if (e.target === box || box.contains(e.target)) {
            return;
        }
        this.close();
    };

    manageListeners = () => {
        if (this.state.opened) {
            this.searchInput.addEventListener("keydown", this.onKeyDown);
            document.addEventListener("click", this.handleDocumentClick);
        } else {
            this.searchInput.removeEventListener("keydown", this.onKeyDown);
            document.removeEventListener("click", this.handleDocumentClick);
        }
    };

    loadSelectedOptions = nextProps => {
        const props = nextProps || this.props;
        if (props.value != null && props.value.length !== 0) {
            const self = this;
            const selectedIds = [];
            if (Array.isArray(props.value)) {
                for (var i = 0; i < props.value.length; i++) {
                    selectedIds.push(this._getId(props.value[i]));
                }
            } else {
                selectedIds[0] = this._getId(props.value);
            }

            searchActions
                .searchByIds(this.storeName, selectedIds)
                .then(res => {
                    var selectedOptions = [];
                    for (var i = 0; i < selectedIds.length; i++) {
                        var option = find.itemById(res, selectedIds[i]);
                        if (option == null) {
                            continue;
                        }
                        selectedOptions.push(option);
                    }
                    if (props.value === self.props.value) {
                        self.setState({ selectedOptions: selectedOptions, searchPage: 0, i: 0 });

                        if (typeof self.props.onOptionsLoaded === "function") {
                            self.props.onOptionsLoaded(selectedOptions);
                        }
                    }
                })
                .catch(err => {
                    this.setState({ err: err.message });
                    throw err;
                });
        } else {
            this.setState({ selectedOptions: [], searchPage: 0, i: 0 });
        }
    };

    _getId(item) {
        if (typeof item === "string" || Number.isInteger(item)) {
            return item;
        }
        if (typeof item === "object") {
            return item._id;
        }
        return null;
    }

    showNewItem = () => {
        this.props.performAction(`${this.props.propDesc.name}_${this.storeName}_create`);
    };

    render() {
        const { err } = this.state;
        const { propDesc } = this.props;
        const isEmpty = this.props.value == null || this.props.value.length === 0;
        const containerClass =
            "search-box" +
            (this.props.required && isEmpty && !this.props.disabled ? " required" : "") +
            (this.props.narrow ? " narrow" : "") +
            (this.props.wide ? " wide" : "") +
            (this.props.disabled ? " disabled" : "");

        if (err) {
            return (
                <div className={containerClass} title={err}>
                    <i className="fa fa-exclamation-triangle" style={{ margin: "7px 0" }} />
                    <span
                        style={{
                            verticalAlign: "sub",
                            fontSize: "12px",
                            color: "#000",
                            marginBottom: "5px",
                            marginLeft: "5px",
                            whiteSpace: "nowrap",
                            maxWidth: "90%",
                            overflow: "hidden",
                        }}
                    >
                        {err}
                    </span>
                </div>
            );
        }
        if (this.state.selectedOptions === null) {
            return (
                <div className={containerClass}>
                    <i className="fa fa-spin fa-spinner" style={{ margin: "7px 0" }} />
                </div>
            );
        }

        const selected = this.state.selectedOptions.map(function(option) {
            let text;
            const href = configStore.findRoute(this.storeName) + "/" + option._id;
            if (propDesc.selectedTemplate) {
                text = template.render(propDesc.selectedTemplate, option, true);
            } else {
                text = option[this.searchFields[0]];
            }
            return (
                <div key={"sb-s-" + option._id} className="selected">
                    <a
                        href={baseUri + href}
                        title={text}
                        onClick={this.clickHandler(this.storeName, option._id)}
                        tabIndex="-1"
                    >
                        {text}
                    </a>
                    {this.props.disabled ? null : (
                        <i className="fa fa-remove" onClick={this.unSelect.bind(this, option)} />
                    )}
                </div>
            );
        }, this);
        const options = this.state.options.map(function(item, index) {
            const active = check.any(this.state.selectedOptions, function(i) {
                return i._id === item._id;
            });
            const disabled = this.disabledOptions && this.disabledOptions.indexOf(item._id) >= 0;
            const info = this.searchFields.map(function(field) {
                return <span key={"sb-sf-" + field}>{item[field] ? item[field] : "-"}</span>;
            });
            const cn = classnames("search-box-option", {
                active,
                disabled,
                "keyboard-hover": index + 1 === this.state.i,
            });
            return (
                <div key={"sb-o-" + item._id} className={cn} onClick={disabled ? null : this.select.bind(this, item)}>
                    {info}
                </div>
            );
        }, this);
        const from = Math.min(this.state.optionsCount, this.state.searchPage * this.props.optionsOnPage + 1),
            to = Math.min(this.state.optionsCount, (this.state.searchPage + 1) * this.props.optionsOnPage),
            prevEnabled = this.prevEnabled(),
            nextEnabled = this.nextEnabled();
        return (
            <div
                key="searchBox"
                className={containerClass}
                ref={box => {
                    this.box = box;
                }}
                onClick={this.focus}
            >
                {selected}
                {this.props.disabled ? null : (
                    <input
                        className="search-box-input"
                        type="text"
                        ref={input => {
                            this.searchInput = input;
                        }}
                        value={this.state.searchText}
                        onChange={this.searchHandle}
                        onFocus={this.onFocus}
                        onBlur={this.onBlur}
                    />
                )}
                {this.state.opened ? (
                    <div className="results">
                        <div>
                            {this.pages ? (
                                <div className="header">
                                    <div className="current-items">
                                        {from}-{to}
                                    </div>
                                    &nbsp; /&nbsp;
                                    {this.state.optionsCount}&nbsp;
                                    <a
                                        className={prevEnabled ? "" : "disabled"}
                                        onClick={prevEnabled ? this.prev : null}
                                    >
                                        <i className="fa fa-chevron-left" />
                                    </a>
                                    <a
                                        className={nextEnabled ? "" : "disabled"}
                                        onClick={nextEnabled ? this.next : null}
                                    >
                                        <i className="fa fa-chevron-right" />
                                    </a>
                                    {this.state.searching ? <i className="fa fa-spin fa-spinner" /> : null}
                                    {this.showAddAction() && (
                                        <a className="add" onClick={this.showNewItem}>
                                            <i className="fa fa-plus-circle fa-lg" />
                                            {i18n.get("form.addToObjectList")}
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="header">{this.state.optionsCount}</div>
                            )}
                            <div className="options">
                                {this.state.searching ? <div className="overlay" /> : null}
                                {options}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }
}
