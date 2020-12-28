import { createElement } from "react";
import { useDrag } from "react-dnd";

export function RotationHandle({ cellContainer, item }) {
    const { containerID } = cellContainer;

    const [drag] = useDrag({
        item: { type: containerID.value + "_rotationHandle", id: item.id + "_rotationHandle" },
        begin: () => {
            console.info("Started dragging rotation handle for " + containerID.value);
        },
        end: () => {
            console.info("Ended dragging rotation handle for " + containerID.value);
        },
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    });

    return <div ref={drag} className="item-image-rotation-handle" />;
}
