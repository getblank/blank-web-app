import React from "react";
import appState from "stores/appStateStore";
import configStore from "stores/configStore";

export const useCurrentStore = () => {
    const storeName = appState.getCurrentStore();
    const storeDesc = React.useMemo(() => configStore.getConfig(appState.getCurrentStore()), [storeName]);

    return {
        storeName,
        storeDesc,
    };
};
