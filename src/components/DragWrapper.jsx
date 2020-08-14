import { createElement } from "react";
import { useDrag } from "react-dnd";

export function DragWrapper({ cellContainer, item, children }) {
    const { containerID, draggableClass, draggingClass } = cellContainer;

    const [{ isDragging }, drag] = useDrag({
        item: { type: containerID.value, id: item.id },
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    });

    const className = isDragging ? draggableClass + " " + draggingClass : draggableClass;

    return (
        <div
            ref={drag}
            className={className}
        >
            {children}
        </div>
    );
}
