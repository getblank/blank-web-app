"use strict";

// Object.defineProperty(exports, "__esModule", {
//     value: true,
// });

const _createClass = (function() {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }
    return function(Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
})();

var _get = function get(_x, _x2, _x3) {
    var _again = true;
    _function: while (_again) {
        var object = _x,
            property = _x2,
            receiver = _x3;
        desc = parent = getter = undefined;
        _again = false;
        if (object === null) object = Function.prototype;
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (desc === undefined) {
            var parent = Object.getPrototypeOf(object);
            if (parent === null) {
                return undefined;
            } else {
                _x = parent;
                _x2 = property;
                _x3 = receiver;
                _again = true;
                continue _function;
            }
        } else if ("value" in desc) {
            return desc.value;
        } else {
            var getter = desc.get;
            if (getter === undefined) {
                return undefined;
            }
            return getter.call(receiver);
        }
    }
};

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: { value: subClass, enumerable: false, writable: true, configurable: true },
    });
    if (superClass)
        Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : (subClass.__proto__ = superClass);
}

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _ObjectDescription = require("./ObjectDescription");

var _ObjectDescription2 = _interopRequireDefault(_ObjectDescription);

var _ObjectPreview = require("./ObjectPreview");

var _ObjectPreview2 = _interopRequireDefault(_ObjectPreview);

var ObjectInspector = (function(_Component) {
    _inherits(ObjectInspector, _Component);

    _createClass(ObjectInspector, null, [
        {
            key: "defaultProps",
            value: {
                name: void 0,
                data: undefined,
                depth: 0,
                objectinspectorid: String(void 0),
            },
            enumerable: true,
        },
    ]);

    function ObjectInspector(props) {
        _classCallCheck(this, ObjectInspector);

        _get(Object.getPrototypeOf(ObjectInspector.prototype), "constructor", this).call(this, props);

        if (props.depth === 0) {
            this.state = { expandedTree: {} };
            this.state.expandedTree[props.objectinspectorid] = false;
        }
    }

    _createClass(
        ObjectInspector,
        [
            {
                key: "getExpanded",
                value: function getExpanded(objectinspectorid) {
                    var expandedTree = this.state.expandedTree;
                    if (typeof expandedTree[objectinspectorid] !== "undefined") {
                        return expandedTree[objectinspectorid];
                    }
                    return false;
                },
            },
            {
                key: "setExpanded",
                value: function setExpanded(objectinspectorid, expanded) {
                    var expandedTree = this.state.expandedTree;
                    expandedTree[objectinspectorid] = expanded;
                    this.setState({ expandedTree: expandedTree });
                },
            },
            {
                key: "handleClick",
                value: function handleClick() {
                    // console.log(this.props.data);
                    if (ObjectInspector.isExpandable(this.props.data)) {
                        if (this.props.depth > 0) {
                            this.props.setExpanded(
                                this.props.objectinspectorid,
                                !this.props.getExpanded(this.props.objectinspectorid),
                            );
                        } else {
                            this.setExpanded(
                                this.props.objectinspectorid,
                                !this.getExpanded(this.props.objectinspectorid),
                            );
                        }
                    }
                },
            },
            {
                key: "componentWillMount",
                value: function componentWillMount() {},
            },
            {
                key: "render",
                value: function render() {
                    var data = this.props.data;
                    var name = this.props.name;

                    var setExpanded = this.props.depth === 0 ? this.setExpanded.bind(this) : this.props.setExpanded;
                    var getExpanded = this.props.depth === 0 ? this.getExpanded.bind(this) : this.props.getExpanded;
                    var expanded = getExpanded(this.props.objectinspectorid);

                    var expandGlyph = ObjectInspector.isExpandable(data)
                        ? expanded
                            ? "▼"
                            : "▶"
                        : typeof name === "undefined"
                        ? ""
                        : " ";

                    var propertyNodesContainer = undefined;
                    if (expanded) {
                        var propertyNodes = [];

                        for (var propertyName in data) {
                            var propertyValue = data[propertyName];
                            if (data.hasOwnProperty(propertyName)) {
                                propertyNodes.push(
                                    _react2["default"].createElement(ObjectInspector, {
                                        getExpanded: getExpanded,
                                        setExpanded: setExpanded,
                                        objectinspectorid: this.props.objectinspectorid + "." + propertyName,
                                        depth: this.props.depth + 1,
                                        key: propertyName,
                                        name: propertyName,
                                        data: propertyValue,
                                    }),
                                );
                            }
                        }
                        propertyNodesContainer = _react2["default"].createElement(
                            "div",
                            { style: { paddingLeft: "12px" }, className: "ObjectInspector-property-nodes-container" },
                            propertyNodes,
                        );
                    }

                    return _react2["default"].createElement(
                        "div",
                        { className: "ObjectInspector" },
                        _react2["default"].createElement(
                            "span",
                            {
                                className: "ObjectInspector-property",
                                onTouchStart: this.handleClick.bind(this),
                                onClick: this.handleClick.bind(this),
                            },
                            _react2["default"].createElement(
                                "span",
                                { className: "ObjectInspector-expand-control ObjectInspector-unselectable" },
                                expandGlyph,
                            ),
                            (function() {
                                if (typeof name !== "undefined") {
                                    return _react2["default"].createElement(
                                        "span",
                                        null,
                                        _react2["default"].createElement(
                                            "span",
                                            { className: "ObjectInspector-object-name" },
                                            name,
                                        ),
                                        _react2["default"].createElement("span", null, ": "),
                                        _react2["default"].createElement(_ObjectDescription2["default"], {
                                            object: data,
                                        }),
                                    );
                                } else {
                                    return _react2["default"].createElement(_ObjectPreview2["default"], {
                                        object: data,
                                    });
                                }
                            })(),
                        ),
                        propertyNodesContainer,
                    );
                },
            },
        ],
        [
            {
                key: "isExpandable",
                value: function isExpandable(data) {
                    return typeof data === "object" && data !== null && Object.keys(data).length > 0;
                },
            },
        ],
    );

    return ObjectInspector;
})(_react.Component);

export default ObjectInspector;
