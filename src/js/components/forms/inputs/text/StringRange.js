/**
 * Created by ivahaev at 2018-03-26.
 */

import React from "react";

class StringRange extends React.Component {
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


    handleChange(e) {
        const from = this.refs.from.value || "";
        const to = this.refs.to.value || "";
        if (from.length === 0 && to.length === 0) {
            this.props.onChange(null);
            return;
        }

        this.props.onChange([from, to]);
    }

    render() {
        const { from, to } = this.state;
        const { type = "text" } = this.props;

        return (
            <div className="flex align-center">
                <input type={type}
                    ref="from"
                    value={from}
                    onChange={this.handleChange.bind(this)}
                    className="form-control"
                    disabled={this.props.disabled}
                    style={{ overflow: "hidden" } /*overflow:hidden fixes FF bug*/} />
                <span>&nbsp;&mdash;&nbsp;</span>
                <input type={type}
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

StringRange.propTypes = {};
StringRange.defaultProps = {};

export default StringRange;
