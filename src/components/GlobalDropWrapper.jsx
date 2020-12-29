import { createElement } from "react";
import { useDrop } from "react-dnd";
export function GlobalDropWrapper({ onHover, children }) {
    const acceptArray = ["FloorplanMarker_rotationHandle"];

    const handleHover = (droppedItem, monitor) => {
        const clientOffset = monitor.getSourceClientOffset();
        const positionData = {
            hoverX: Math.round(clientOffset.x),
            hoverY: Math.round(clientOffset.y)
        };
        onHover(droppedItem, positionData);
    };

    const [collectedProps, drop] = useDrop({
        accept: acceptArray,
        hover: handleHover
    });

    return (
        <div ref={drop} className="globalDropWrapper">
            {children}
        </div>
    );
}
