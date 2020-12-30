import { createElement } from "react";
import { useDrag } from "react-dnd";

export function RotationHandle({ cellContainer, offsetX, imageRotation, item }) {
    const { containerID } = cellContainer;

    // type and id must be unique so use a suffix
    // Also store original type, id and rotation in the item
    const rotationHandleDragType = containerID.value + "_rotationHandle";
    const [{ isDragging }, drag] = useDrag({
        item: {
            type: rotationHandleDragType,
            id: item.id + "_rotationHandle",
            originalType: containerID.value,
            originalId: item.id,
            originalRotation: imageRotation,
            offsetX
        },
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    });

    const className = isDragging ? "item-image-rotation-handle dragging" : "item-image-rotation-handle";
    return <div ref={drag} className={className} />;
}
