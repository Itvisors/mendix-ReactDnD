import { createElement, useEffect } from "react";
import { Constants } from "../utils/Constants";
import { getEmptyImage } from "react-dnd-html5-backend";
import { useDrag } from "react-dnd";

export function DragToSelect({ itemData, containerWidth, containerHeight }) {
    const itemType = itemData.containerID + Constants.DRAG_TO_SELECT_ID_SUFFIX;
    const [{ isDragging }, drag, preview] = useDrag(() => ({
        type: itemType,
        item: {
            type: itemType,
            id: itemData.id + Constants.DRAG_TO_SELECT_ID_SUFFIX,
            dragType: Constants.DRAG_TYPE_DRAG_TO_SELECT,
            rowNumber: itemData.rowNumber,
            columnNumber: itemData.columnNumber,
            originalType: itemData.containerID,
            originalId: itemData.id,
            imageHeight: itemData.imageHeight,
            imageWidth: itemData.imageWidth,
            itemWidth: containerWidth,
            itemHeight: containerHeight
        },
        collect: monitor => ({
            isDragging: !!monitor.isDragging(),
            didDrop: !!monitor.didDrop()
        })
    }));

    // Turn off the default drag preview that the browser renders as we render our own in CustomDragLayer.
    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    // If dragging, render the selection area
    const className = isDragging ? "drag-to-select-container dragging" : "drag-to-select-container";
    return <div ref={drag} style={{ width: containerWidth, height: containerHeight }} className={className}></div>;
}
