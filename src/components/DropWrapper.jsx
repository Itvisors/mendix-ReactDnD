import { createElement } from "react";
import { useDrop } from "react-dnd";

export function DropWrapper({ cellContainer, onDrop, children }) {
    const { acceptsContainerIDs, dropTargetClass, canDropClass, invalidDropClass } = cellContainer;
    const acceptArray = acceptsContainerIDs.value.split(",");

    const [{ canDrop, isOver, clientOffset }, drop] = useDrop({
        accept: acceptArray,
        drop: onDrop,
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
            clientOffset: monitor.getClientOffset()
        }),
    })

    const isActive = canDrop && isOver;
    
    let className = dropTargetClass;
    if (isActive) {
        className += " " + canDropClass;
    }
    if (isOver && !canDrop) {
        className += " " + invalidDropClass;
    }

    return (
        <div
            ref={drop}
            className={className}
        >
            {children}
        </div>
    );
}
