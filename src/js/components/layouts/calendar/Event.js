import React from "react";
import itemActions from "actions/itemsActuators";
import { useCurrentStore } from "hooks/useCurrentStore";

const s = {
    wrapper: {
        marginTop: "2px",
        padding: "4px",
        backgroundColor: "#E8F5E9",
        borderRadius: "5px",
        cursor: "pointer",
        minWidth: 0,
    },
};

const Event = ({ style, event }) => {
    const { storeDesc } = useCurrentStore();
    const label = event[storeDesc.headerProperty];

    const clickHandler = (e) => {
        e.stopPropagation();
        itemActions.select(event._id);
    };

    return (
        <div style={Object.assign({}, s.wrapper, style)} onClick={clickHandler}>
            <div className="width100 o-hidden ellipsis nowrap">{label || "–"}</div>
        </div>
    );
};

export default Event;
