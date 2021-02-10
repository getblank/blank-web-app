import React from "react";
import classNames from "classnames";
import Notification from "./Notification";
import find from "utils/find";
import alerts from "../../utils/alertsEmitter";
import { systemStores } from "constants";
import configStore from "../../stores/configStore";

const _minSwipe = -60;
const _closeDelay = 7;

class Alerts extends React.Component {
    constructor(props) {
        super(props);
        this.timeOut = null;
        this.state = {
            hover: false,
            alerts: [],
        };

        this.startHideTimer = this.startHideTimer.bind(this);
        this.onNewAlert = this.onNewAlert.bind(this);
        this.onRemoveAlert = this.onRemoveAlert.bind(this);
        this.alertMouseEnter = this.alertMouseEnter.bind(this);
        this.alertMouseLeave = this.alertMouseLeave.bind(this);
        this.alertMouseDown = this.alertMouseDown.bind(this);
        this.alertMouseMove = this.alertMouseMove.bind(this);
        this.alertMouseUp = this.alertMouseUp.bind(this);
    }

    startHideTimer(alertObject) {
        const timeout = Math.max(alertObject.closeAfter - (Date.now() - alertObject.showedAt), 100);
        return setTimeout(() => {
            alertObject.show = false;
            this.setState({ alerts: this.state.alerts.slice() });
            alertObject.deleteTm = setTimeout(() => {
                const alerts = this.state.alerts.slice();
                const index = find.indexById(alerts, alertObject._id);
                alerts.splice(index, 1);
                this.setState({ alerts: alerts });
            }, 500);
        }, timeout);
    }

    alertMouseEnter(e) {
        const alerts = this.state.alerts.slice();
        const alert = find.itemById(alerts, e.currentTarget.getAttribute("id"));
        if (!alert.show) {
            return;
        }
        clearTimeout(alert.hideTm);
    }

    alertMouseLeave(e) {
        var alerts = this.state.alerts.slice();
        var alert = find.itemById(alerts, e.currentTarget.getAttribute("id"));
        if (!alert.show) {
            return;
        }
        alert.dragging = false;
        alert.x = 0;
        clearTimeout(alert.hideTm);
        if (alert.closeAfter !== -1) {
            alert.hideTm = this.startHideTimer(alert);
        }
        this.setState({ alerts: alerts });
    }
    alertMouseUp(e) {
        const alerts = this.state.alerts.slice();
        const alert = find.itemById(alerts, e.currentTarget.getAttribute("id"));
        if (!alert.show) {
            return;
        }
        alert.dragging = false;
        alert.x = 0;
        this.setState({ alerts: alerts });
    }
    alertMouseDown(e) {
        if (e.button !== 0 || e.target.className !== "thumb") {
            return;
        }
        const alerts = this.state.alerts.slice();
        const alert = find.itemById(alerts, e.currentTarget.getAttribute("id"));
        alert.dragging = true;
        alert.originX = e.clientX;
        this.setState({ alerts: alerts });
    }
    alertMouseMove(e) {
        const alerts = this.state.alerts.slice();
        const alert = find.itemById(alerts, e.currentTarget.getAttribute("id"));
        if (alert.dragging) {
            alert.x = Math.min(alert.originX - e.clientX, 0);
            if (alert.x < _minSwipe) {
                alert.drag = false;
                alert.show = false;
                alert.x = "-100%";
                alert.onMove = null;
                setTimeout(() => {
                    const alerts = this.state.alerts.slice();
                    const index = find.indexById(alerts, alert._id);
                    alerts.splice(index, 1);
                    this.setState({ alerts: alerts });
                }, 400);
            }
            this.setState({ alerts: alerts });
        }
    }
    componentDidMount() {
        alerts.on("add", this.onNewAlert);
        alerts.on("remove", this.onRemoveAlert);
    }
    componentWillUnmount() {
        alerts.removeListener("add", this.onNewAlert);
        alerts.removeListener("remove", this.onRemoveAlert);
    }
    onRemoveAlert(id) {
        const alertObject = find.item(this.state.alerts, id);
        if (alertObject !== null) {
            alertObject.closeAfter = 0;
            alertObject.hideTm = this.startHideTimer(alertObject);
        }
    }
    onNewAlert(message, alertType, time) {
        const id = "alert_" + Date.now();
        const alertObject = {
            _id: message._id || id,
            showedAt: Date.now(),
            closeAfter: time === -1 ? -1 : (time || _closeDelay) * 1000,
            x: 0,
            onMove: this.alertMouseMove,
        };

        if (alertType === "notification") {
            Object.assign(alertObject, message);
            alertObject.type = "notification";
        } else {
            if (typeof message === "string") {
                alertObject.message = message;
            } else {
                alertObject.message = message.message || false;
            }

            if (typeof alertType === "string") {
                alertObject.type = alertType;
            } else {
                alertObject.type = message.type || "info";
            }
        }

        const oldIndex = find.index(this.state.alerts, alertObject._id);
        if (oldIndex >= 0) {
            let alerts = this.state.alerts;
            clearTimeout(alerts[oldIndex].hideTm);
            clearTimeout(alerts[oldIndex].deleteTm);
            alerts[oldIndex] = Object.assign(alerts[oldIndex], alertObject, { show: true });
            this.setState({ alerts: alerts });
            return;
        }

        if (alertObject.message !== false) {
            alertObject.show = false;
            let alerts = this.state.alerts;
            alerts.unshift(alertObject);
            this.setState({ alerts: alerts }, () => {
                setTimeout(() => {
                    alertObject.show = true;
                    if (alertObject.closeAfter !== -1) {
                        alertObject.hideTm = this.startHideTimer(alertObject);
                    }
                    this.setState({ alerts: this.state.alerts.slice() });
                }, 0);
            });
        }
    }
    render() {
        const alerts = this.state.alerts.map((item, index) => {
            const className = classNames({
                alert: true,
                show: item.show,
                drag: item.dragging,
            });
            return (
                <div
                    id={item._id}
                    key={item._id}
                    className={className}
                    style={{ right: item.x }}
                    onMouseEnter={this.alertMouseEnter}
                    onMouseLeave={this.alertMouseLeave}
                    onMouseDown={this.alertMouseDown}
                    onMouseUp={this.alertMouseUp}
                    onMouseMove={item.onMove}
                >
                    <div className="alert-content">
                        {item.closeAfter === -1 ? null : <div className="thumb">&nbsp;</div>}
                        {item.type === "notification" ? (
                            <Notification item={item} container="toast" />
                        ) : (
                            <span className="alert-message">{item.message}</span>
                        )}
                    </div>
                </div>
            );
        }, this);

        const { entries } = configStore.getConfig(systemStores.settings);
        const bottom = entries && entries.notificationPosition === "bottom";
        const className = classNames("app-alerts", { "app-alerts-bottom": bottom, "app-alerts-top": !bottom });

        return <div className={className}>{alerts}</div>;
    }
}

export default Alerts;
