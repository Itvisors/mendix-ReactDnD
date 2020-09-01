import { createElement } from "react";
import { useDrop } from "react-dnd";

/** Drop target wrapper. */
export function DropWrapper({ cellContainer, onDrop, children }) {
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
        const positionData = {
            dropClientX: Math.round(clientOffset.x),
            dropClientY: Math.round(clientOffset.y)
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

    const isActive = canDrop && isOver;

    let className = dropTargetClass;
    if (isActive) {
        className += " " + canDropClass;
    }
    if (isOver && !canDrop) {
        className += " " + invalidDropClass;
    }

    return (
        <div ref={drop} className={className}>
            {children}
        </div>
    );
}
