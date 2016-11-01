import React, { Component } from "react";
import Labels from "./Labels";
import appState from "../../stores/appStateStore";
import configStore from "../../stores/configStore";

class LabelsContainer extends Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        // appState.on(storeEvents.CHANGED, this._onChange);
    }

    componentWillMount() {
        // appState.removeListener(storeEvents.CHANGED, this._onChange);
    }

    render() {
        const storeName = appState.getCurrentStore();
        const storeDesc = configStore.getConfig(storeName);
        return (
            <Labels item={this.props.item} storeDesc={storeDesc} storeName={storeName} container="list" />
        );
    }
}

export default LabelsContainer;