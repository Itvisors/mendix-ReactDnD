import { createElement, useRef } from "react";
import { snapOffsetToGrid } from "../utils/Utils";
import { useDrop } from "react-dnd";

/** Drop target wrapper. */
export function DropWrapper({ cellContainer, item, onDrop, snapToGrid, snapToSize, children }) {
    const layoutRef = useRef(null);

    const acceptArray = cellContainer.acceptsContainerIDs.split(",");

    const handleDrop = (droppedItem, monitor) => {
        const clientOffset = monitor.getSourceClientOffset();
        let dropClientX = Math.round(clientOffset.x);
        let dropClientY = Math.round(clientOffset.y);
        if (snapToSize >= 5 && snapToGrid) {
            dropClientX = snapOffsetToGrid(dropClientX, snapToSize);
            dropClientY = snapOffsetToGrid(dropClientY, snapToSize);
        }
        const rect = layoutRef.current ? layoutRef.current.getBoundingClientRect() : undefined;
        const left = rect ? rect.left : 0;
        const top = rect ? rect.top : 0;
        const positionData = {
            dropClientX,
            dropClientY,
            dropOffsetX: Math.round(dropClientX - left),
            dropOffsetY: Math.round(dropClientY - top)
        };
        onDrop(droppedItem, positionData);
    };

    const [{ canDrop, isOver }, drop] = useDrop(() => ({
        accept: acceptArray,
        drop: handleDrop,
        collect: monitor => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop()
        })
    }));

    const isActive = canDrop && isOver;

    let className = item.dropTargetClass;
    if (isActive) {
        className += " " + item.canDropClass;
    }
    if (isOver && !canDrop) {
        className += " " + item.invalidDropClass;
    }

    if (!cellContainer.acceptsContainerIDs) {
        const { containerID } = cellContainer;
        return (
            <span className="text-danger">
                Container {containerID} has no values set for the accept IDs to indicate which items may be dropped.
            </span>
        );
    }
    return (
        <div ref={layoutRef}>
            <div ref={drop} className={className}>
                {children}
            </div>
        </div>
    );
}
