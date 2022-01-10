import { Constants } from "../utils/Constants";
import { createElement } from "react";
import { useDrop } from "react-dnd";

export function GlobalDropWrapper({ containerList, onRotateHover, onRotateDrop, onDragToSelectDrop, children }) {
    // Any item that allows rotation will render a rotation handle. The drag type will be the container ID with the rotation handle suffix.
    // We capture these drag/drop actions here.
    // Similar for drag to select
    const acceptArray = [];
    for (const container of containerList) {
        const { containerID, dragDropType, allowDragToSelect } = container;
        if (dragDropType === "drag" || dragDropType === "both") {
            acceptArray.push(containerID + Constants.ROTATION_HANDLE_ID_SUFFIX);
        }
        if (dragDropType === "drop" && allowDragToSelect) {
            acceptArray.push(containerID + Constants.DRAG_TO_SELECT_ID_SUFFIX);
        }
    }

    const handleHover = (draggedItem, monitor) => {
        if (draggedItem.dragType === Constants.DRAG_TYPE_ROTATE) {
            const differenceFromOrigin = monitor.getDifferenceFromInitialOffset();
            const positionData = {
                dX: Math.round(differenceFromOrigin.x),
                dY: Math.round(differenceFromOrigin.y)
            };
            onRotateHover(draggedItem, positionData);
        }
    };

    const handleRotateDrop = (droppedItem, monitor) => {
        const differenceFromOrigin = monitor.getDifferenceFromInitialOffset();
        const positionData = {
            dX: Math.round(differenceFromOrigin.x),
            dY: Math.round(differenceFromOrigin.y)
        };
        onRotateDrop(droppedItem, positionData);
    };

    const handleDragToSelectDrop = (droppedItem, monitor) => {
        const differenceFromInitialOffset = monitor.getDifferenceFromInitialOffset();
        const InitialClientOffset = monitor.getInitialClientOffset();
        const positionData = {
            initialX: Math.round(InitialClientOffset.x),
            initialY: Math.round(InitialClientOffset.y),
            dX: Math.round(differenceFromInitialOffset.x),
            dY: Math.round(differenceFromInitialOffset.y)
        };
        onDragToSelectDrop(droppedItem, positionData);
    };

    const handleDrop = (droppedItem, monitor) => {
        switch (droppedItem.dragType) {
            case Constants.DRAG_TYPE_ROTATE:
                handleRotateDrop(droppedItem, monitor);

                break;

            case Constants.DRAG_TYPE_DRAG_TO_SELECT:
                handleDragToSelectDrop(droppedItem, monitor);

                break;

            default:
                break;
        }
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
