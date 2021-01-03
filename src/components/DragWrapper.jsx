import { createElement, useEffect, useRef, useState } from "react";
import { getEmptyImage } from "react-dnd-html5-backend";
import { useDrag } from "react-dnd";

export function DragWrapper({ cellContainer, item, dropPos, zoomPercentage, onDragStart, children }) {
    const layoutRef = useRef(null);
    const [elementRect, setElementRect] = useState(null);

    const {
        containerID,
        dsOffsetX,
        dsOffsetY,
        dsImageHeight,
        dsImageWidth,
        dsAdjustOffsetOnDrop,
        draggableClass,
        draggingClass
    } = cellContainer;

    // Offset values are optional! Only check the status when there is a value.
    const offsetX = dsOffsetX ? dsOffsetX(item) : undefined;
    const offsetY = dsOffsetY ? dsOffsetY(item) : undefined;
    const imageHeight = dsImageHeight ? dsImageHeight(item).value : undefined;
    const imageWidth = dsImageWidth ? dsImageWidth(item).value : undefined;
    const adjustOffsetOnDrop = dsAdjustOffsetOnDrop ? dsAdjustOffsetOnDrop(item).value : false;

    const startDrag = () => {
        if (onDragStart) {
            onDragStart({
                containerID: containerID.value,
                itemID: item.id,
                itemOffsetX: offsetX && offsetX.value ? Number(offsetX.value) : undefined,
                itemOffsetY: offsetY && offsetY.value ? Number(offsetY.value) : undefined
            });
        }
    };

    // Offset values are optional! Only take the values when they
    const [{ isDragging }, drag, preview] = useDrag({
        item: {
            type: containerID.value,
            id: item.id,
            imageHeight,
            imageWidth,
            adjustOffsetOnDrop,
            itemWidth: elementRect ? elementRect.width : undefined,
            itemHeight: elementRect ? elementRect.height : undefined
        },
        begin: startDrag,
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
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

    if (
        (offsetX && offsetX.status !== "available") ||
        (offsetY && offsetY.status !== "available") ||
        (zoomPercentage && zoomPercentage.status !== "available")
    ) {
        return null;
    }

    const style = {};
    if (offsetX && offsetX.value && offsetY && offsetY.value) {
        let zoomFactor = 1;
        if (zoomPercentage && zoomPercentage.status === "available" && zoomPercentage.value) {
            zoomFactor = zoomPercentage.value / 100;
        }
        // If the drop position has not yet been updated in the datasource, use the pending drop position values.
        const offsetValueX = dropPos ? dropPos.x : Number(offsetX.value);
        const offsetValueY = dropPos ? dropPos.y : Number(offsetY.value);
        const top = Math.round(offsetValueY * zoomFactor);
        const left = Math.round(offsetValueX * zoomFactor);
        const transform = "translate(" + left + "px, " + top + "px)";
        style.position = "absolute";
        style.transform = transform;
        style.webkitTransform = transform;
    } else {
        style.position = "relative";
    }

    const className = isDragging ? draggableClass + " " + draggingClass : draggableClass;
    return (
        <div ref={drag} style={style} className={className}>
            <div ref={layoutRef}>{children}</div>
        </div>
    );
}
