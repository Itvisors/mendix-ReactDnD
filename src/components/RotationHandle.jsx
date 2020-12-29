import { createElement } from "react";
import { useDrag } from "react-dnd";

export function RotationHandle({ cellContainer, item }) {
    const { containerID } = cellContainer;

    const [{ isDragging }, drag] = useDrag({
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

    const className = isDragging ? "item-image-rotation-handle dragging" : "item-image-rotation-handle";
    return <div ref={drag} className={className} />;
}
