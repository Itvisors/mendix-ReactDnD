import React, { Component, createElement } from "react";
import { DatasourceItemImage } from "./DatasourceItemImage";
import { calculateZoomFactor } from "../utils/Utils";

export class DatasourceItem extends Component {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
        this.itemDivRef = React.createRef();
    }

    render() {
        const {
            cellContainer,
            item,
            draggedRotationDegree,
            zoomPercentage,
            additionalMarkerClasses,
            onRotateClick
        } = this.props;
        const {
            dsContent,
            dsNameAttribute,
            dsMarkerClassAttribute,
            dragDropType,
            dsOffsetX,
            dsOffsetY
        } = cellContainer;

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
        if (dsMarkerClassAttribute) {
            const markerClass = dsMarkerClassAttribute(item)?.value;
            if (markerClass) {
                className += " " + markerClass;
            }
        }
        if (additionalMarkerClasses) {
            className += " " + additionalMarkerClasses;
        }
        let style = null;
        // If the drag/drop type is none and the datasource item has position values, it means the floorplan is shown as view only.
        // Position the item the same way the drag wrapper does.
        if (dragDropType === "none") {
            const offsetX = dsOffsetX ? dsOffsetX(item) : undefined;
            const offsetY = dsOffsetY ? dsOffsetY(item) : undefined;
            if (offsetX && offsetX.value && offsetY && offsetY.value) {
                const zoomFactor = calculateZoomFactor(zoomPercentage, true);
                const offsetValueX = Number(offsetX.value);
                const offsetValueY = Number(offsetY.value);
                const top = Math.round(offsetValueY * zoomFactor);
                const left = Math.round(offsetValueX * zoomFactor);
                const transform = "translate(" + left + "px, " + top + "px)";
                style = {
                    position: "absolute",
                    transform: transform,
                    webkitTransform: transform
                };
            }
        }
        const nameValue = dsNameAttribute ? dsNameAttribute(item) : undefined;
        const hasNameValue = nameValue && nameValue.value;
        // console.info("DatasourceItem: ID: " + item.id);
        return (
            <div
                key={item.id}
                ref={this.itemDivRef}
                className={className}
                style={style}
                onClick={this.onClick}
                onContextMenu={this.onClick}
                data-Name={hasNameValue && nameValue.value}
            >
                <DatasourceItemImage
                    cellContainer={cellContainer}
                    item={item}
                    draggedRotationDegree={draggedRotationDegree}
                    zoomPercentage={zoomPercentage}
                    onRotateClick={onRotateClick}
                />
                {dsContent(item)}
            </div>
        );
    }

    onClick(evt) {
        // Persist the event or it will be nullified and reused.
        evt.persist();
        // Prevent other click handlers, like parent containers from receiving the event.
        evt.preventDefault();
        evt.stopPropagation();
        // Calculate offset from item position.
        const rect = this.itemDivRef.current.getBoundingClientRect();
        const offsetX = Math.round(evt.clientX - rect.left);
        const offsetY = Math.round(evt.clientY - rect.top);
        // Pass event.
        this.props.onClick(evt, offsetX, offsetY);
    }
}
