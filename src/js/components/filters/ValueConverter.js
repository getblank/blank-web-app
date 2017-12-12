/**
 * Created by kib357 on 15/06/15.
 */

const React = require("react");
const check = require("utils/check");
const find = require("utils/find");
const searchActions = require("../../actions/searchActuators");

var ValueConverter = React.createClass({
    getInitialState: function () {
        return {
            value: "",
        };
    },

    render: function () {
        return (
            <span>{this.state.value}</span>
        );
    },
    componentWillReceiveProps: function (nextProps) {
        if (this.props.value !== nextProps.value) {
            this.loadValue(nextProps);
        }
    },
    componentDidMount: function () {
        this.loadValue();
    },
    loadValue: function (nextProps) {
        const props = nextProps || this.props;
        if (props.value) {
            if (props.options == null) {
                this.setState({ value: "" }, function () {
                    const self = this;
                    const idWrapper = ([]).concat(props.value);
                    searchActions.searchByIds(props.storeName, idWrapper).then(function (value) {
                        if (props.value === self.props.value) {
                            if (value != null) {
                                value = value.map(e => e[props.valueField || "name"]).join(", ");
                            }

                            self.setState({ value: value });
                        }
                    }, function (error) {
                        console.log(error);
                    });
                });
            } else {
                let value = find.itemById(props.options, props.value, props.idField);
                if (value != null && props.valueField) {
                    value = value[props.valueField];
                }
                this.setState({ value: value || "" });
            }
        } else {
            this.setState({ value: "" });
        }
    },
});

module.exports = ValueConverter;