/**
 * Created by kib357 on 05/03/16.
 */

import React from "react";
import Loader from "../../misc/Loader";
import widgetsDataStore from "../../../stores/widgetsDataStore";
import widgetsActuators from "../../../actions/widgetsActuators";
import NvChart from "./charts/NvChart";
import Table from "./Table";
import SimpleLabel from "../SimpleLabel";
import template from "template";
import { widgetTypes, storeEvents } from "constants";
import changesProcessor from "../../../utils/changesProcessor";

class Widget extends React.Component {
    constructor(props) {
        super(props);
        const { data, error } = widgetsDataStore.get(props.widgetId);
        this.state = {
            v: 1,
            wParams: {},
            loading: true,
            data,
            error,
        };

        this._onChange = this._onChange.bind(this);
    }

    componentDidMount() {
        widgetsDataStore.on(storeEvents.CHANGED, this._onChange);
        this._loadData();
    }

    componentWillUnmount() {
        widgetsDataStore.removeListener(storeEvents.CHANGED, this._onChange);
        clearTimeout(this.timer);
        clearInterval(this.interval);
    }

    componentWillReceiveProps(nextProps) {
        const { widgetDesc, params } = this.props;
        if (widgetDesc.shouldReloadData) {
            if (
                widgetDesc.shouldReloadData(
                    changesProcessor.combineItem(nextProps.item, true, true),
                    this.props.item,
                    nextProps.params,
                    params,
                )
            ) {
                this._loadData(nextProps);
            }

            return;
        }

        if (
            JSON.stringify(nextProps.filter) !== JSON.stringify(this.props.filter) ||
            (nextProps.itemId && nextProps.itemId !== this.props.itemId)
        ) {
            this._loadData(nextProps);
        }
    }

    _onChange() {
        if (widgetsDataStore.lastUpdatedWidgetId === this.props.widgetId) {
            const { data, error } = widgetsDataStore.get(this.props.widgetId);
            this.setState({ data, error, v: this.state.v + 1, loading: false });
        }
    }

    _loadData(props) {
        props = props || this.props;
        this.setState({ loading: true }, () => {
            console.log(
                "widgetsActuators.load",
                props.storeName,
                props.widgetId,
                Object.assign({}, props.filter, props.params, this.state.wParams),
                props.itemId,
            );
            widgetsActuators.load(
                props.storeName,
                props.widgetId,
                Object.assign({}, props.filter, props.params, this.state.wParams),
                props.itemId,
            );
        });
    }

    render() {
        const { widgetDesc } = this.props;
        const widget = this.state.data ? this.getWidget(widgetDesc.type) : null;
        const error = this.state.error ? (
            <div className="input-container">
                <br />
                <span className="error">{this.state.error.desc}</span>
            </div>
        ) : null;

        return (
            <div style={widgetDesc.style} className="widget">
                {widgetDesc.label && (
                    <SimpleLabel
                        name={widgetDesc._id}
                        text={widgetDesc.label}
                        changed={false}
                        tooltip={widgetDesc.tooltip}
                        storeName={this.props.storeName}
                        className={widgetDesc.labelClassName}
                    />
                )}

                {widget || error}

                {this.state.loading && (
                    <div className="loader-wrapper">
                        <Loader className="xs" />
                    </div>
                )}
            </div>
        );
    }

    setWParams(key, value) {
        const params = this.state.wParams;
        params[key] = value;
        this.setState({ wParams: params }, () => {
            this._loadData();
        });
    }

    getWidget(wType) {
        const widgetDesc = this.props.widgetDesc;
        switch (wType) {
            case widgetTypes.chartNvD3:
                return (
                    !this.state.loading && (
                        <NvChart
                            render={widgetDesc.render}
                            didLoadData={widgetDesc.didLoadData}
                            params={Object.assign({}, this.props.filter, this.state.wParams)}
                            v={this.state.v}
                            data={this.state.data}
                        />
                    )
                );
            case widgetTypes.table:
                return (
                    <Table
                        columns={widgetDesc.columns}
                        data={this.state.data}
                        v={this.state.v}
                        orderBy={this.state.wParams.$orderBy}
                        onOrder={this.setWParams.bind(this, "$orderBy")}
                    />
                );
            case widgetTypes.html: {
                const data = { $data: this.state.data, $item: this.props.item };
                const html = template.render(widgetDesc.html, data);

                return <div dangerouslySetInnerHTML={{ __html: html }} />;
            }
            case widgetTypes.react: {
                const ReactWidget = widgetDesc.$component;

                return (
                    <ReactWidget
                        didLoadData={widgetDesc.didLoadData}
                        data={this.state.data}
                        filter={this.props.filter}
                        storeDesc={this.props.storeDesc}
                        performAction={this.props.performAction}
                        readOnly={this.props.readOnly}
                    />
                );
            }
            default:
                return <p>Invalid widget type </p>;
        }
    }
}

Widget.propTypes = {};
Widget.defaultProps = {};

export default Widget;
