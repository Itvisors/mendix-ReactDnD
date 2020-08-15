import React, { Component, createElement } from "react";

export class DatasourceItem extends Component {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
        this.itemDivRef = React.createRef();
    }

    render() {
        const { cellContainer, item } = this.props;
        const { dsContent, dsNameAttribute, dragDropType } = cellContainer;

        // Convert Mendix properties to form that is easier to use.
        const returnOnClick = cellContainer.returnOnClick && cellContainer.returnOnClick.value;

        // Set the class name(s).
        let className = "widget-cell-content-container-item";
        if (dragDropType === "drag" || dragDropType === "both") {
            className += " draggableItem";
        }
        if (dragDropType === "drop" || dragDropType === "both") {
            className += " dropTarget";
        }
        if (returnOnClick) {
            className += " clickableItem";
        }
        const nameValue = (dsNameAttribute) ? dsNameAttribute(item) : undefined;
        const hasNameValue = nameValue && nameValue.value;
        // console.info("DatasourceItem: ID: " + item.id);
        return (
            <div key={item.id} ref={this.itemDivRef} className={className} onClick={this.onClick} data-Name={hasNameValue && nameValue.value}>
                {dsContent(item)}
            </div>
        );
    }

    onClick(evt) {
        // Persist the event or it will be nullified and reused.
        evt.persist();
        // Prevent other click handlers, like parent containers from receiving the event.
        evt.stopPropagation();
        // Calculate offset from item position.
        const rect = this.itemDivRef.current.getBoundingClientRect();
        const offsetX = Math.round(evt.clientX - rect.left);
        const offsetY = Math.round(evt.clientY - rect.top);
        // Pass event.
        this.props.onClick(evt, offsetX, offsetY);
    }
}
