import { createElement } from "react";
import { useDrop } from "react-dnd";
export function GlobalDropWrapper({ onRotateHover, onRotateDrop, children }) {
    const acceptArray = ["FloorplanMarker_rotationHandle"];

    const handleHover = (draggedItem, monitor) => {
        const clientOffset = monitor.getSourceClientOffset();
        const positionData = {
            itemX: Math.round(clientOffset.x),
            itemY: Math.round(clientOffset.y)
        };
        onRotateHover(draggedItem, positionData);
    };

    const handleDrop = (droppedItem, monitor) => {
        const clientOffset = monitor.getSourceClientOffset();
        const positionData = {
            itemX: Math.round(clientOffset.x),
            itemY: Math.round(clientOffset.y)
        };
        onRotateDrop(droppedItem, positionData);
    };

    // Without collectedProps it no longer works
    // eslint-disable-next-line no-unused-vars
    const [collectedProps, drop] = useDrop({
        accept: acceptArray,
        hover: handleHover,
        drop: handleDrop
    });

    return (
        <div ref={drop} className="globalDropWrapper">
            {children}
        </div>
    );
}
