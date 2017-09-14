/**
 * Created by kib357 on 13/08/15.
 */

import React from "react";
import Icon from "../misc/Icon";
import credentialsStore from "../../stores/credentialsStore.js";
import i18n from "../../stores/i18nStore.js";
import classNames from "classnames";

class Labels extends React.Component {
    render() {
        const user = credentialsStore.getUser();
        const container = this.props.container;
        const labelsDescs = this.props.storeDesc.labels || [];
        //Creating map with groups of labels
        const labelGroups = [];
        for (let labelDesc of labelsDescs) {
            if (labelDesc.hideInForm && container === "form" ||
                labelDesc.hidden(user, this.props.item)) {
                continue;
            }
            let i = labelDesc.showInList || 0;
            if (!labelGroups[i]) {
                labelGroups[i] = [];
            }
            labelGroups[i].push(labelDesc);
        }
        const labelsControls = [];
        const model = { $i18n: i18n.getForStore(this.props.storeName), $user: credentialsStore.getUser(), $item: this.props.item };
        for (let i = 0; i < labelGroups.length; i++) {
            const labelGroup = labelGroups[i];
            if (!Array.isArray(labelGroup) || (i === 0 && container === "list")) {
                continue;
            }

            const labels = [];
            for (const labelDesc of labelGroup) {
                const text = labelDesc.text(model);
                console.info("TEXT", text);
                const color = labelDesc.color(model).trim();
                const icon = labelDesc.icon(model).trim();
                if (!text && !icon) {
                    continue;
                }
                switch (labelDesc.display) {
                    case "chip": {
                        const style = { background: color, borderColor: color };
                        if (labelDesc.textColor) {
                            style.color = labelDesc.textColor;
                        }

                        if (labelDesc.style) {
                            Object.assign(style, labelDesc.style);
                        }
                        labels.push((
                            <span className="item-label chip" style={style}
                                key={"label-" + labels.length}>
                                <Icon icon={icon} />
                                <span>{text}</span>
                            </span>
                        ));
                        break;
                    }
                    case "react": {
                        const Label = labelDesc.$component;
                        labels.push((
                            <span
                                key={"label-" + labels.length}>
                                <Label storeName={this.props.storeName}
                                    storeDesc={this.props.storeDesc}
                                    ready={this.props.ready}
                                    item={this.props.item}
                                />
                            </span>
                        ));
                        break;
                    }
                    case "text":
                    default: {
                        let labelContent;
                        if (labelDesc.noSanitize) {
                            labelContent = <span dangerouslySetInnerHTML={{ __html: text }}></span>;
                        } else {
                            labelContent = <span>{text}</span>;
                        }

                        labels.push((
                            <span className="item-label form" style={{ borderColor: color, color }}
                                key={"label-" + labels.length}>
                                <Icon icon={icon} />
                                {labelContent}
                            </span>
                        ));
                    }
                }
            }
            labelsControls.push((
                <span className="labels-group" key={"labels-group-" + i}>
                    {labels}
                </span>
            ));
        }

        const cn = classNames("item-labels", this.props.className, {
            form: this.props.container === "form",
            nav: this.props.container === "nav",
            list: this.props.container === "list",
        });
        return (
            <div className={cn}>
                {labelsControls}
            </div>
        );
    }
}

Labels.propTypes = {
    item: React.PropTypes.object.isRequired,
    storeDesc: React.PropTypes.object.isRequired,
    groupLabels: React.PropTypes.bool,
};
Labels.defaultProps = { groupLabels: false };

export default Labels;
