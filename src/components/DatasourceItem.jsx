import { createElement, useCallback, useRef } from "react";
import { DatasourceItemImage } from "./DatasourceItemImage";
import { calculateZoomFactor } from "../utils/Utils";

export function DatasourceItem({
    cellContainer,
    item,
    isSelected,
    isDragging,
    draggedRotationDegree,
    zoomPercentage,
    additionalMarkerClasses,
    selectedMarkerClass,
    selectedMarkerBorderSize,
    renderWidgetContent,
    onClick,
    onRotateClick
}) {
    const itemDivRef = useRef(null);

    const onClickHandler = useCallback(
        evt => {
            // Persist the event or it will be nullified and reused.
            evt.persist();
            // Prevent other click handlers, like parent containers from receiving the event.
            evt.preventDefault();
            evt.stopPropagation();
            // Calculate offset from item position.
            const rect = itemDivRef.current.getBoundingClientRect();
            const offsetX = Math.round(evt.clientX - rect.left);
            const offsetY = Math.round(evt.clientY - rect.top);
            // Pass event.
            onClick(evt, offsetX, offsetY);
        },
        [onClick]
    );

    const { dragDropType } = cellContainer;

    // Set the class name(s).
    let className = "widget-cell-content-container-item";
    if (dragDropType === "drop" || dragDropType === "both") {
        className += " dropTarget";
    }
    if (cellContainer.returnOnClick) {
        className += " clickableItem";
    }
    if (isSelected) {
        className += " " + selectedMarkerClass;
    }
    if (item.markerClass) {
        className += " " + item.markerClass;
    }
    if (additionalMarkerClasses) {
        className += " " + additionalMarkerClasses;
    }
    let style = null;
    // If the drag/drop type is none or drop only and the datasource item has position values, it means the marker is shown as view only.
    // Position the item the same way the drag wrapper does.
    if (dragDropType === "none" || dragDropType === "drop") {
        if (item.hasOffset) {
            const zoomFactor = calculateZoomFactor(zoomPercentage, true);
            const top = Math.round(item.offsetY * zoomFactor);
            const left = Math.round(item.offsetX * zoomFactor);
            const transform = "translate(" + left + "px, " + top + "px)";
            style = {
                position: "absolute",
                transform: transform,
                webkitTransform: transform
            };
        }
    }
    // console.info("DatasourceItem: ID: " + item.id);
    return (
        <div
            key={item.id}
            ref={itemDivRef}
            className={className}
            style={style}
            onClick={onClickHandler}
            onContextMenu={onClickHandler}
            data-Name={item.nameAttributeValue}
        >
            <DatasourceItemImage
                item={item}
                draggedRotationDegree={draggedRotationDegree}
                zoomPercentage={zoomPercentage}
                isSelected={isSelected}
                isDragging={isDragging}
                selectedMarkerBorderSize={selectedMarkerBorderSize}
                onRotateClick={onRotateClick}
            />
            {renderWidgetContent(item)}
        </div>
    );
}
