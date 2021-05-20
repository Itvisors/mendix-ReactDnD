import { createElement, useEffect } from "react";
import { Constants } from "../utils/Constants";
import { getEmptyImage } from "react-dnd-html5-backend";
import { useDrag } from "react-dnd";

export function RotationHandle({ offsetX, imageRotation, itemData }) {
    // type and id must be unique so use a suffix
    // Also store original type, id and rotation in the item
    const rotationHandleDragType = itemData.containerID + Constants.ROTATION_HANDLE_ID_SUFFIX;
    const [{ isDragging }, drag, preview] = useDrag({
        item: {
            type: rotationHandleDragType,
            id: itemData.itemID + Constants.ROTATION_HANDLE_ID_SUFFIX,
            originalType: itemData.containerID,
            originalId: itemData.id,
            originalRotation: imageRotation,
            offsetX
        },
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    });

    // Turn off the default drag preview that the browser renders as we render our own in CustomDragLayer.
    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []);

    const className = isDragging ? "item-image-rotation-handle dragging" : "item-image-rotation-handle";
    return <div ref={drag} className={className} />;
}
