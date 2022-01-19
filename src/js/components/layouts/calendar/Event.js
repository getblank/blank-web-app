import React from "react";
import itemActions from "../../../actions/itemsActuators";

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

const Event = ({ style, name, _id }) => {
    const clickHandler = (e) => {
        e.stopPropagation();
        itemActions.select(_id);
    };
    return (
        <div style={Object.assign({}, s.wrapper, style)} onClick={clickHandler}>
            <div className="width100 o-hidden ellipsis nowrap">{name || "–"}</div>
        </div>
    );
};

export default Event;
