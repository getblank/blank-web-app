/**
 * Created by kib357 on 02/11/15.
 */

import createReactClass from "create-react-class";
import history from "../../stores/historyStore";

const NavGroup = createReactClass({
    render: function () {
        var child = history.createChild(this);
        return child;
    },
});

export default NavGroup;