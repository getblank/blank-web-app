/**
 * Created by kib357 on 04/02/16.
 */

import React from "react";
import ReactDOM from "react-dom";
import Loader from "../../../misc/Loader";

const splitChars = [" ", ",", ";"];

class Autocomplete extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            opened: false,
            value: "",
            i: 0,
        };
        if (props.load) {
            this.state.load = new Function("$value", props.load);
        }
        this.toggle = this.toggle.bind(this);
        this.removeValue = this.removeValue.bind(this);
        this.open = this.open.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.loadTimer = null;
        this.loadId = 0;
    }

    getOptions(props) {
        if (!this.state.opened) { return }
        props = props || this.props;

        let value = this.state.value;
        if (this.state.load) {
            clearTimeout(this.loadTimer);
            this.setState({ "options": null });
            this.loadTimer = setTimeout(() => {
                let l = ++this.loadId;
                let res = this.state.load(value);
                if (res && typeof res.then === "function") {
                    res.then((options) => {
                        if (l === this.loadId) {
                            this.setState({ "options": (options || []).map(o => ({ value: o.value || o, label: o.label || o })), "i": 0 });
                        }
                    });
                }
            }, 300);
        } else if (props.options) {
            let res = props.options.filter(o => !props.value || o.label.indexOf(value) === 0);
            this.setState({ "options": res, "i": 0 });
        }
    }

    componentWillReceiveProps(nextProps) {
        this.getOptions(nextProps);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.i !== this.state.i) {
            let root = this.refs.root;
            if (root) {
                let elements = root.getElementsByClassName("option selected");
                if (elements && elements.length > 0) {
                    let selected = elements[0];
                    let parent = selected.parentElement;
                    if (parent.scrollTop > selected.offsetTop) {
                        parent.scrollTop = selected.offsetTop;
                    } else if (selected.offsetTop >= (parent.scrollTop + parent.offsetHeight)) {
                        parent.scrollTop = selected.offsetTop + selected.offsetHeight - parent.offsetHeight;
                    }
                }
            }
        }
    }

    handleSelect(value) {
        this.addValue(value);
    }

    handleChange(e) {
        if (!this.state.opened) {
            this.toggle(true);
        }
        let v = e.target.value,
            res = (Array.isArray(this.props.value) ? this.props.value : []).slice();
        if (v) {
            for (let i = 0; i < v.length; i++) {
                let char = v[i];
                if (splitChars.indexOf(char) >= 0) {
                    let item = v.slice(0, i).trim();
                    if (item) { res.push(item) }
                    v = v.slice(i + 1);
                }
            }
        }
        this.setState({ "value": v }, () => {
            if ((this.props.value || []).length !== res.length) {
                this.props.onChange(res);
            } else {
                this.getOptions();
            }
        });
    }

    handleBlur(e) {
        clearTimeout(this.state.timer);
        let timer = setTimeout(() => {
            this.toggle(false);
        }, 100);
        this.setState({ "timer": timer });

        this.addValue(this.state.value);
    }

    onKeyDown(event) {
        let i;
        switch (event.code) {
            case "ArrowDown":
            case "ArrowUp":
                if (this.state.options.length > 0) {
                    event.preventDefault();
                    i = this.state.i + (event.code === "ArrowDown" ? 1 : -1);
                    if (i > this.state.options.length) {
                        i = 1;
                    }
                    if (i < 1) {
                        i = this.state.options.length;
                    }
                    this.setState({ "i": i });
                }
                break;
            case "Enter":
                event.preventDefault();
                event.stopPropagation();
                if (this.state.i > 0) {
                    this.addValue(this.state.options[this.state.i - 1].value);
                } else {
                    this.addValue(this.state.value);
                }
                break;
            case "Backspace":
                var res = (Array.isArray(this.props.value) ? this.props.value : []).slice();
                if (!this.state.value && res.length) {
                    event.preventDefault();
                    event.stopPropagation();
                    var v = res.pop();
                    this.setState({ "value": v }, () => this.props.onChange(res));
                }
                break;
            case "Escape":
                this.setState({ "value": "" }, this.toggle());
                break;
        }
    }

    addValue(newValue) {
        if (!newValue.trim()) { return }
        let res = (Array.isArray(this.props.value) ? this.props.value : []).slice();
        res.push(newValue);
        this.setState({ "value": "" }, () => {
            this.props.onChange(res);
        });
    }

    removeValue(e) {
        let res = (Array.isArray(this.props.value) ? this.props.value : []).slice();
        let index = e.target.getAttribute("data-index");
        res.splice(index, 1);
        this.props.onChange(res);
    }

    render() {
        let options;
        if (this.state.opened) {
            if (this.state.options) {
                options = [];
                for (let i = 0; i < this.state.options.length; i++) {
                    let option = this.state.options[i];
                    options.push(
                        <div className={"option" + (i + 1 === this.state.i ? " option-selected" : "") }
                            key={i}
                            onClick={this.handleSelect.bind(this, option.value) }>
                            <span>
                                {option.label}
                            </span>
                        </div>
                     );
                }
            } else {
                options = (<div><Loader/></div>);
            }
        }
        let chips = (Array.isArray(this.props.value) ? this.props.value : []).map((k, i) => (
            <div key={"chips-" + i} className="selected">
                <a>{k}</a>
                <i className="fa fa-remove" onClick={this.removeValue} data-index={i}/>
            </div>
        ));
        return (
            <div className="autocomplete search-box" ref="root">
                {chips}
                <input
                    ref="input"
                    autoComplete="false"
                    onChange={this.handleChange}
                    value={this.state.value}
                    onFocus={this.toggle}
                    onBlur={this.handleBlur}
                    className="search-box-input"
                    placeholder={this.props.placeholder}
                    disabled={this.props.disabled}
                    type="text"/>
                { this.state.opened && <div className="pd-picker">{options}</div> }
            </div>
        );
    }

    open() {
        this.toggle(true);
    }

    toggle(show) {
        if (this.props.disabled) {
            return;
        }
        let newState = { "i": 0 };
        var res = typeof show === "boolean" ? show : !this.state.opened;
        newState.opened = res;
        if (res) {
            if (typeof this.props.onFocus === "function") {
                this.props.onFocus();
            }
        } else {
            if (typeof this.props.onBlur === "function") {
                this.props.onBlur();
            }
        }
        this.setState(newState, () => {
            this.manageListeners();
            this.getOptions();
        });
    }

    handleDocumentClick(e) {
        var rootRef = this.refs["root"];
        if (rootRef == null) {
            this.toggle();
            return;
        }
        var root = ReactDOM.findDOMNode(rootRef);
        if (e.target === root || root.contains(e.target)) {
            return;
        }
        this.toggle();
    }

    componentWillUnmount() {
        clearTimeout(this.state.timer);
        clearTimeout(this.loadTimer);
        this.refs.input.removeEventListener("keydown", this.onKeyDown);
        document.removeEventListener("click", this.handleDocumentClick);
    }

    manageListeners() {
        if (this.state.opened) {
            this.refs.input.addEventListener("keydown", this.onKeyDown);
            document.addEventListener("click", this.handleDocumentClick);
        } else {
            this.refs.input.removeEventListener("keydown", this.onKeyDown);
            document.removeEventListener("click", this.handleDocumentClick);
        }
    }
}

Autocomplete.propTypes = {};
Autocomplete.defaultProps = {};

export default Autocomplete;
