import { createElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Constants } from "../utils/Constants";
import { getEmptyImage } from "react-dnd-html5-backend";
import { useDrag } from "react-dnd";

export function DragWrapper({ item, dropPos, zoomFactor, onDragStart, onDragEnd, renderDragHandleContent, children }) {
    const layoutRef = useRef(null);
    const [elementRect, setElementRect] = useState(null);

    // Include width and height from state elementRect so drag layer can render element correctly.
    // Without these values, the dragged item would always extend to the right end of the viewport.
    const [{ isDragging }, drag, preview] = useDrag(
        () => ({
            type: item.containerID,
            item: () => {
                if (onDragStart) {
                    onDragStart({
                        containerID: item.containerID,
                        itemID: item.id,
                        dragType: Constants.DRAG_TYPE_NORMAL,
                        itemOffsetX: item.hasOffset ? item.offsetX : undefined,
                        itemOffsetY: item.hasOffset ? item.offsetY : undefined
                    });
                }
                return {
                    type: item.containerID,
                    id: item.id,
                    imageHeight: item.imageHeight,
                    imageWidth: item.imageWidth,
                    itemWidth: elementRect ? elementRect.width : undefined,
                    itemHeight: elementRect ? elementRect.height : undefined
                };
            },
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
        }),
        [item, elementRect]
    );

    useLayoutEffect(() => {
        if (layoutRef.current) {
            const rect = layoutRef.current.getBoundingClientRect();
            setElementRect(rect);
        }
    }, [item]);

    // Turn off the default drag preview that the browser renders as we render our own in CustomDragLayer.
    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

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

    const dragHandle = renderDragHandleContent(item);
    const { draggableClass, draggingClass } = item;
    let contentClassName = isDragging ? draggableClass + " " + draggingClass : draggableClass;
    if (dragHandle) {
        contentClassName += " draggableItemContent";
        return (
            <div ref={preview} style={style} className="draggableItemContainer">
                <div ref={drag} className="draggableItemHandle">
                    {dragHandle}
                </div>
                <div ref={layoutRef} className={contentClassName}>
                    {children}
                </div>
            </div>
        );
    } else {
        contentClassName += " draggableItem";
        return (
            <div ref={drag} style={style} className={contentClassName}>
                <div ref={layoutRef}>{children}</div>
            </div>
        );
    }
}
