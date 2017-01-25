import React from "react";
import ItemActions from "../../../actions/itemsActuators";

const s = {
    wrapper: {
        marginTop: "2px",
        padding: "4px",
        backgroundColor: "#E8F5E9",
        borderRadius: "5px",
        cursor: "pointer",
    },
    name: {
        display: "block",
        width: "100%",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
    },
};

const Event = ({style, name, _id}) => {
    const clickHandler = (e) => {
        e.stopPropagation();
        ItemActions.select(_id);
    };
    return (
        <div style={Object.assign({}, s.wrapper, style)} onClick={clickHandler}>
            <span style={s.name}>{name || "–"}</span>
        </div>
    );
};

export default Event;