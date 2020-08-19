import { createElement } from "react";
import { useDrag } from "react-dnd";

export function DragWrapper({ cellContainer, item, children }) {
    const { containerID, dsOffsetX, dsOffsetY, zoomPercentage, draggableClass, draggingClass } = cellContainer;

    // Offset values are optional! Only check the status when there is a value.
    const offsetX = (dsOffsetX) ? dsOffsetX(item) : undefined;
    const offsetY = (dsOffsetY) ? dsOffsetY(item) : undefined;
    if ((offsetX && offsetX.status !== "available") || 
        (offsetY && offsetY.status !== "available") || 
        (zoomPercentage && zoomPercentage.status !== "available")) {
        return null;
    }

    const [{ isDragging }, drag] = useDrag({
        item: { type: containerID.value, id: item.id },
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    });

    const style = {};
    if (offsetX && offsetX.value && offsetY && offsetY.value) {
        let zoomFactor = 1;
        if (zoomPercentage && zoomPercentage.status === "available" && zoomPercentage.value) {
            zoomFactor = zoomPercentage.value / 100;
        }
        const top = Math.round(Number(offsetY.value) * zoomFactor);
        const left = Math.round(Number(offsetX.value) * zoomFactor);
        const transform = "translate3d(" + left + "px, " + top + "px, 0)";
        style.position = "absolute";
        style.transform = transform;
        style.webkitTransform = transform;
    } else {
        style.position = "relative";
    }

    const className = isDragging ? draggableClass + " " + draggingClass : draggableClass;
    return (
        <div
            ref={drag}
            style={style}
            className={className}
        >
            {children}
        </div>
    );
}
