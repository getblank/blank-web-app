import React from "react";
import Helmet from "./misc/Helmet";
import history from "../stores/historyStore";
import appState from "../stores/appStateStore";
import { storeEvents, userPreferences } from "constants";
import configStore from "../stores/configStore";
import Nav from "./nav/Nav";
import SideNav from "./nav/SideNav";
import Loader from "./misc/Loader";
import Notifications from "./notifications/Notifications";
import Alerts from "./notifications/Alerts";
import SignIn from "./auth/SignIn";
import ChangesTracker from "./forms/ChangesTracker";
import AudioPlayer from "./forms/viewers/audio/AudioPlayer";
import serverStateStore from "../stores/serverStateStore";
import credentialsStore from "../stores/credentialsStore";
import preferencesStore from "../stores/preferencesStore";
import configActions from "../actions/configActuators";
import preferencesActions from "../actions/preferencesActuators";
import classNames from "classnames";
import ErrorBoundary from "./ErrorBoundary";

export default class AppWrapper extends React.Component {
    render() {
        return (
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        );
    }
}

class App extends React.Component {
    constructor() {
        super();
        this.state = App.getStateFromStores();
        this._onChange = this._onChange.bind(this);
    }

    static getStateFromStores() {
        const state = serverStateStore.get();
        const credentials = credentialsStore.getState();
        state.signedIn = credentials.signedIn;
        state.pendingAutoLogin = credentials.pendingAutoLogin;
        state.baseConfigReady = configStore.isBaseReady();
        state.configReady = configStore.isReady();
        state.showNotifications = preferencesStore.getUserPreference(userPreferences.SHOW_NOTIFICATIONS);
        state.defaultLocale = configStore.getDefaultLocale();
        return state;
    }

    render() {
        var cn = classNames({
            app: true,
            "sign-in": !this.state.signedIn,
            "show-notifications": this.state.showNotifications,
        });

        return (
            <div className={cn} lang={this.state.defaultLocale}>
                <Alerts></Alerts>
                <Helmet />
                {this.state.signedIn ? (
                    this.state.connected && this.state.configReady ? (
                        <Home />
                    ) : (
                        <Loader className="center" />
                    )
                ) : this.state.baseConfigReady !== true ? (
                    <BaseConfigLoader />
                ) : (
                    <SignIn></SignIn>
                )}
            </div>
        );
    }

    componentDidMount() {
        serverStateStore.on(storeEvents.CHANGED, this._onChange);
        credentialsStore.on(storeEvents.CHANGED, this._onChange);
        preferencesStore.on(storeEvents.CHANGED, this._onChange);
        appState.on(storeEvents.CHANGED, this._onChange);
        configStore.on(storeEvents.CHANGED, this._onChange);
    }

    componentWillUnmount() {
        serverStateStore.removeListener(storeEvents.CHANGED, this._onChange);
        credentialsStore.removeListener(storeEvents.CHANGED, this._onChange);
        preferencesStore.removeListener(storeEvents.CHANGED, this._onChange);
        appState.removeListener(storeEvents.CHANGED, this._onChange);
        configStore.removeListener(storeEvents.CHANGED, this._onChange);
    }

    _onChange() {
        this.setState(App.getStateFromStores());
    }
}

class BaseConfigLoader extends React.Component {
    componentDidMount() {
        console.log("Loading base config...");
        configActions.getBaseConfig();
    }

    render() {
        return <Loader className="center" />;
    }
}

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.toggleSideNavPin = this.toggleSideNavPin.bind(this);
        this.toggleNotificationsPin = this.toggleNotificationsPin.bind(this);
    }

    sideNavAutoHidePrefName() {
        return (appState.navGroup || appState.store) + "-sidenav-auto-hide";
    }

    toggleSideNavPin() {
        preferencesActions.setPreference(
            this.sideNavAutoHidePrefName(),
            !preferencesStore.getUserPreference(this.sideNavAutoHidePrefName()),
        );
    }

    toggleNotificationsPin() {
        preferencesActions.setPreference("pin-notifications", !preferencesStore.getUserPreference("pin-notifications"));
    }

    render() {
        var cn = classNames("home");
        return (
            <div className={cn}>
                <Nav />
                <div className="flex row fill relative">
                    <SideNav
                        navGroup={appState.navGroup}
                        storeName={appState.store}
                        pinned={!preferencesStore.getUserPreference(this.sideNavAutoHidePrefName())}
                        onTogglePin={this.toggleSideNavPin}
                    />
                    {history.createChild()}
                </div>
                <Notifications
                    onTogglePin={this.toggleNotificationsPin}
                    pinned={preferencesStore.getUserPreference("pin-notifications")}
                />
                <ChangesTracker />
                <AudioPlayer />
            </div>
        );
    }
}
