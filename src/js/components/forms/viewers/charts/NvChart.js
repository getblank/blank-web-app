/**
 * Created by kib357 on 03/03/16.
 */

import React from "react";

class NvChart extends React.Component {
    constructor(props) {
        super(props);
        let didLoad = () => { }, render = () => { };
        if (props.didLoadData) {
            didLoad = new Function("d3", "nvd3", "data", "chart", "params", props.didLoadData);
        }
        if (props.render) {
            render = new Function("d3", "nvd3", "data", props.render);
        }
        this.state = {
            didLoad: didLoad,
            render: render,
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return false;
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.chart != null) {
            if (this.state.selection != null) {
                this.state.selection.datum(nextProps.data);
            }
            if (this.props.v !== nextProps.v) {
                this.state.didLoad(require("d3"), require("nvd3"), nextProps.data, this.state.chart, nextProps.params);
            }
            if (typeof this.state.chart.update === "function") {
                this.state.chart.update();
            }
        }
    }

    componentDidMount() {
        require.ensure(["d3", "nvd3"], () => {
            let d3 = require("d3"),
                nv = require("nvd3"),
                data = this.props.data;
            let chart = this.state.render(d3, nv, data || {});
            this.setState({ chart: chart }, () => {
                nv.addGraph({
                    generate: () => {
                        if (this.unmounted) { return }
                        let selection = d3.select(this.refs.svg)
                            .datum(data)
                            .call(chart);
                        this.setState({ selection: selection });
                        nv.utils.windowResize(chart.update);
                    },
                    callback: () => {
                        if (this.unmounted) { return }
                        var updateHeight = () => {
                            let svg = this.refs.svg;
                            let group = svg.children[0];
                            if (group) {
                                let box = svg.getBBox();
                                let height = box.y + box.height + 5;
                                svg.setAttribute("height", height + "px");
                            }
                        };
                        this.hInterval = setInterval(() => {
                            updateHeight();
                        }, 1000);
                        updateHeight();
                        if (this.props.data != null) {
                            this.state.didLoad(require("d3"), require("nvd3"), this.props.data, this.state.chart, this.props.params);
                            this.state.chart.update();
                        }
                    },
                });
            });
        });
    }

    componentWillUnmount() {
        clearInterval(this.hInterval);
        this.unmounted = true;
    }


    render() {
        return (
            <div>
                <svg id="chart" ref="svg"></svg>
            </div>
        );
    }
}

NvChart.propTypes = {};
NvChart.defaultProps = {};

export default NvChart;
