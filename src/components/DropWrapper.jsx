import { createElement, useEffect, useRef, useState } from "react";
import { snapOffsetToGrid } from "../utils/Utils";
import { useDrop } from "react-dnd";

/** Drop target wrapper. */
export function DropWrapper({ cellContainer, onDrop, snapToGrid, snapToSize, children }) {
    const layoutRef = useRef(null);
    const [elementRect, setElementRect] = useState(null);

    const { containerID, acceptsContainerIDs, dropTargetClass, canDropClass, invalidDropClass } = cellContainer;
    if (!acceptsContainerIDs || !acceptsContainerIDs.value) {
        return (
            <span className="text-danger">
                Container {containerID.value} has no values set for the accept IDs to indicate which items may be
                dropped onto it.
            </span>
        );
    }
    const acceptArray = acceptsContainerIDs.value.split(",");

    const handleDrop = (droppedItem, monitor) => {
        const clientOffset = monitor.getSourceClientOffset();
        let dropClientX = Math.round(clientOffset.x);
        let dropClientY = Math.round(clientOffset.y);
        if (snapToSize >= 5 && snapToGrid) {
            dropClientX = snapOffsetToGrid(dropClientX, snapToSize);
            dropClientY = snapOffsetToGrid(dropClientY, snapToSize);
        }
        const positionData = {
            dropClientX,
            dropClientY,
            dropOffsetX: Math.round(dropClientX - elementRect.left),
            dropOffsetY: Math.round(dropClientY - elementRect.top)
        };
        onDrop(droppedItem, positionData);
    };

    const [{ canDrop, isOver }, drop] = useDrop({
        accept: acceptArray,
        drop: handleDrop,
        collect: monitor => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop()
        })
    });

    useEffect(() => {
        if (layoutRef.current) {
            const rect = layoutRef.current.getBoundingClientRect();
            setElementRect(rect);
        }
    });

    const isActive = canDrop && isOver;

    let className = dropTargetClass;
    if (isActive) {
        className += " " + canDropClass;
    }
    if (isOver && !canDrop) {
        className += " " + invalidDropClass;
    }

    return (
        <div ref={layoutRef}>
            <div ref={drop} className={className}>
                {children}
            </div>
        </div>
    );
}
