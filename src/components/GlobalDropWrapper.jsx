import { Constants } from "../utils/Constants";
import { createElement } from "react";
import { useDrop } from "react-dnd";

export function GlobalDropWrapper({ containerList, onRotateHover, onRotateDrop, children }) {
    // Any item that allows rotation will render a rotation handle. The drag type will be the container ID with the rotation handle suffix.
    // We capture these drag/drop actions here.
    const acceptArray = [];
    for (const container of containerList) {
        const { containerID, dragDropType } = container;
        if (containerID && containerID.value && (dragDropType === "drag" || dragDropType === "both")) {
            acceptArray.push(containerID.value + Constants.ROTATION_HANDLE_ID_SUFFIX);
        }
    }

    const handleHover = (draggedItem, monitor) => {
        const differenceFromOrigin = monitor.getDifferenceFromInitialOffset();
        const positionData = {
            dX: Math.round(differenceFromOrigin.x),
            dY: Math.round(differenceFromOrigin.y)
        };
        onRotateHover(draggedItem, positionData);
    };

    const handleDrop = (droppedItem, monitor) => {
        const differenceFromOrigin = monitor.getDifferenceFromInitialOffset();
        const positionData = {
            dX: Math.round(differenceFromOrigin.x),
            dY: Math.round(differenceFromOrigin.y)
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
