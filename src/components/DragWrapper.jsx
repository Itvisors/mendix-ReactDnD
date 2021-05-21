import { createElement, useEffect, useRef, useState } from "react";
import { getEmptyImage } from "react-dnd-html5-backend";
import { useDrag } from "react-dnd";

export function DragWrapper({ item, dropPos, zoomFactor, onDragStart, onDragEnd, children }) {
    const layoutRef = useRef(null);
    const [elementRect, setElementRect] = useState(null);

    const startDrag = () => {
        if (onDragStart) {
            onDragStart({
                containerID: item.containerID,
                itemID: item.id,
                itemOffsetX: item.hasOffset ? item.offsetX : undefined,
                itemOffsetY: item.hasOffset ? item.offsetY : undefined
            });
        }
    };

    // Include widht and height from state elementRect so drag layer can render element correctly.
    // Without these values, the dragged item would always extend to the right end of the viewport.
    const [{ isDragging }, drag, preview] = useDrag({
        item: {
            type: item.containerID,
            id: item.id,
            imageHeight: item.imageHeight,
            imageWidth: item.imageWidth,
            adjustOffsetOnDrop: item.adjustOffsetOnDrop,
            itemWidth: elementRect ? elementRect.width : undefined,
            itemHeight: elementRect ? elementRect.height : undefined
        },
        begin: startDrag,
        end: (draggedItem, monitor) => {
            onDragEnd({
                containerID: item.containerID,
                itemID: item.id,
                didDrop: monitor.didDrop()
            });
        },
        canDrag: !item.disableDrag,
        collect: monitor => ({
            isDragging: !!monitor.isDragging(),
            didDrop: !!monitor.didDrop()
        })
    });

    // Turn off the default drag preview that the browser renders as we render our own in CustomDragLayer.
    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []);

    useEffect(() => {
        if (layoutRef.current) {
            const rect = layoutRef.current.getBoundingClientRect();
            setElementRect(rect);
        }
    });

    const style = {};
    if (item.hasOffset) {
        // If the drop position has not yet been updated in the datasource, use the pending drop position values.
        const offsetValueX = dropPos ? dropPos.x : item.offsetX;
        const offsetValueY = dropPos ? dropPos.y : item.offsetY;
        const top = Math.round(offsetValueY * zoomFactor);
        const left = Math.round(offsetValueX * zoomFactor);
        const transform = "translate(" + left + "px, " + top + "px)";
        style.position = "absolute";
        style.transform = transform;
        style.webkitTransform = transform;
    } else {
        style.position = "relative";
    }

    const { draggableClass, draggingClass } = item;
    const className = isDragging ? draggableClass + " " + draggingClass : draggableClass;
    return (
        <div ref={drag} style={style} className={className}>
            <div ref={layoutRef}>{children}</div>
        </div>
    );
}
