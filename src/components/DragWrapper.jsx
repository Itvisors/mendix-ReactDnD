import { DatasourceItem } from "./DatasourceItem";
import { createElement } from "react";
import { useDrag } from "react-dnd";

export function DragWrapper({ cellContainer, children }) {
    const { containerID } = cellContainer;

    const [{ isDragging }, drag] = useDrag({
        item: { type: containerID.value },
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    });

    const className = isDragging ? "draggable-container dragging-container" : "draggable-container";

    return (
        <div
            ref={drag}
            className={className}
        >
            {children}
        </div>
    );
}
