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

    return (
        <div
            ref={drag}
            style={{
                opacity: isDragging ? 0.5 : 1
            }}
        >
            {children}
        </div>
    );
}
