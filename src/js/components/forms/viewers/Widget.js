/**
 * Created by kib357 on 05/03/16.
 */

import React from "react";
import Loader from "../../misc/Loader";
import widgetsDataStore from "../../../stores/widgetsDataStore";
import widgetsActuators from "../../../actions/widgetsActuators";
import NvChart from "./charts/NvChart";
import Table from "./Table";
import {widgetTypes, storeEvents} from "constants";

var data = [
    {
        "key": "Перерывы",
        "color": "#d67777",
        "values": [
            {
                "label": "Кошкин Павел",
                "value": 1.8746444827653
            },
            {
                "label": "Мышкин Князь",
                "value": 8.0961543492239
            },
            {
                "label": "Склиф",
                "value": 0.57072943117674
            },
            {
                "label": "Рябченко Виолетта",
                "value": 2.4174010336624
            },
            {
                "label": "Человек Людина",
                "value": 0.72009071426284
            },
            {
                "label": "Машина Паша",
                "value": 0.77154485523777
            },
            {
                "label": "Александр Прибой",
                "value": 0.90152097798131
            },
            {
                "label": "Николай Предпоследний",
                "value": 0.91445417330854
            },
            {
                "label": "Цыгане",
                "value": 0.055746319141851
            },
        ]
    },
    {
        "key": "Разговоры",
        "color": "#4f99b4",
        "values": [
            {
                "label": "Кошкин Павел",
                "value": 25.307646510375
            },
            {
                "label": "Мышкин Князь",
                "value": 16.756779544553
            },
            {
                "label": "Склиф",
                "value": 18.451534877007
            },
            {
                "label": "Рябченко Виолетта",
                "value": 8.6142352811805
            },
            {
                "label": "Человек Людина",
                "value": 7.8082472075876
            },
            {
                "label": "Машина Паша",
                "value": 5.259101026956
            },
            {
                "label": "Александр Прибой",
                "value": 0.30947953487127
            },
            {
                "label": "Николай Предпоследний",
                "value": 0
            },
            {
                "label": "Цыгане",
                "value": 0
            },
        ]
    }
];

function rndInt(max) {
    return Math.floor(Math.random() * (max + 1));
}

class Widget extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.wParams = {};
        this.state.data = widgetsDataStore.get(props.widgetId);
        // this.timer = setTimeout(() => {
        //     this.setState({"data": data});
        //     this.interval = setInterval(() => {
        //         let d = this.state.data;
        //         for (var i = 0; i < 5; i++) {
        //             d[rndInt(1)].values[rndInt(8)].value = (Math.random() * 25);
        //         }
        //         this.setState({"data": d});
        //     }, 2000);
        // }, 4000);
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
        if (JSON.stringify(nextProps.params) !== JSON.stringify(this.props.params) ||
            (nextProps.itemId && nextProps.itemId !== this.props.itemId)) {
            this._loadData(nextProps);
        }
    }

    _onChange() {
        this.setState({ "data": widgetsDataStore.get(this.props.widgetId) });
    }

    _loadData(props) {
        props = props || this.props;
        widgetsActuators.load(props.storeName, props.widgetId, Object.assign({}, props.params, this.state.wParams), props.itemId);
    }

    render() {
        let widget = this.getWidget(this.props.widgetDesc.type);
        return (
            <div style={this.props.widgetDesc.style}>
                {this.props.widgetDesc.label && <h3>{this.props.widgetDesc.label}</h3>}
                {this.state.data != null ?
                    widget :
                    <Loader className="xs"/>}
            </div>
        );
    }

    setWParams(key, value) {
        let params = this.state.wParams;
        params[key] = value;
        this.setState({ "wParams": params }, () => {
            this._loadData();
        });
    }

    getWidget(wType) {
        switch (wType) {
            case widgetTypes.chartNvD3:
                return <NvChart render={this.props.widgetDesc.render} data={this.state.data}/>;
            case widgetTypes.table:
                return <Table columns={this.props.widgetDesc.columns}
                    data={this.state.data}
                    orderBy={this.state.wParams.$orderBy}
                    onOrder={this.setWParams.bind(this, "$orderBy") }/>;
            default:
                return <p>Invalid widget type </p>;
        }
    }
}

Widget.propTypes = {};
Widget.defaultProps = {};

export default Widget;
