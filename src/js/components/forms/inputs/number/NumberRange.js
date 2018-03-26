/**
 * Created by kib357 on 08/02/16.
 */

import React from "react";

const rgx = /[^0-9.]/g;

class NumberRange extends React.Component {
    constructor(props) {
        super(props);
        if (Array.isArray(props.value)) {
            const [from, to] = props.value;
            this.state = { from, to };
            return;
        }

        this.state = { from: "", to: "" };
    }

    updateValues(props) {
        if (Array.isArray(props.value)) {
            const [from, to] = props.value;
            this.setState({ from, to });

            return;
        }

        this.setState({ from: "", to: "" });
    }

    componentWillReceiveProps(props) {
        if (JSON.stringify(props.value) !== JSON.stringify(this.props.value)) {
            this.updateValues(props);
        }

        return false;
    }

    isValidValue(v) {
        return v.length === 0 || (!isNaN(parseFloat(v)) && isFinite(v));
    }

    handleChange(e) {
        const from = this.refs.from.value.replace(",", ".").replace(rgx, "");
        const to = this.refs.to.value.replace(",", ".").replace(rgx, "");
        if (!this.isValidValue(from) || !this.isValidValue(to)) {
            return;
        }

        if (from.length === 0 && to.length === 0) {
            this.props.onChange(null);
            return;
        }

        this.props.onChange([from, to]);
    }

    render() {
        const { from, to } = this.state;

        return (
            <div className="flex align-center">
                <input type="text"
                    ref="from"
                    value={from}
                    onChange={this.handleChange.bind(this)}
                    className="form-control"
                    disabled={this.props.disabled}
                    style={{ textAlign: "right", overflow: "hidden" } /*overflow:hidden fixes FF bug*/} />
                <span>&nbsp;&mdash;&nbsp;</span>
                <input type="text"
                    ref="to"
                    value={to}
                    onChange={this.handleChange.bind(this)}
                    className="form-control"
                    disabled={this.props.disabled}
                    style={{ overflow: "hidden" }} />
            </div>
        );
    }
}

NumberRange.propTypes = {};
NumberRange.defaultProps = {};

export default NumberRange;
