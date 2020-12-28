import { createElement } from "react";
import { useDrag } from "react-dnd";

export function RotationHandle({ cellContainer, item }) {
    const { containerID } = cellContainer;

    const [{ isDragging }, drag] = useDrag({
        item: { type: containerID.value + "_rotationHandle", id: item.id + "_rotationHandle" },
        begin: () => {
            onRotateDragStart();
        },
        end: () => {
            onRotateDragEnd();
        },
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    });

    return <div ref={drag} className="item-image-rotation-handle" />;
}
