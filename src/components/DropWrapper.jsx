import { createElement } from "react";
import { useDrop } from "react-dnd";
import React, { useRef } from 'react'

export function DropWrapper({ cellContainer, onDrop, children }) {
    const { acceptsContainerIDs, dropTargetClass, canDropClass, invalidDropClass } = cellContainer;
    const acceptArray = acceptsContainerIDs.value.split(",");
    const ref = useRef(null);

    const handleDrop = (droppedItem, monitor) => {
        const clientOffset = monitor.getClientOffset();
        onDrop(droppedItem, clientOffset);
    };

    const [{ canDrop, isOver }, drop] = useDrop({
        accept: acceptArray,
        drop: handleDrop,
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop()
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
    drop(ref);

    return (
        <div
            ref={ref}
            className={className}
        >
            {children}
        </div>
    );
}
