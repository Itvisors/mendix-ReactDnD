import { Constants } from "../utils/Constants";
import { CustomDragLayerContent } from "./CustomDragLayerContent";
import { createElement } from "react";
import { useDragLayer } from "react-dnd";

export function CustomDragLayer({
    widgetData,
    containerCellRectMap,
    containerCellScrollMap,
    renderWidgetContent,
    additionalItemInfoForDragging,
    onDragging
}) {
    const {
        itemType,
        isDragging,
        item,
        initialClientOffset,
        clientOffset,
        sourceClientOffset,
        differenceFromInitialOffset
    } = useDragLayer(monitor => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialClientOffset: monitor.getInitialClientOffset(),
        clientOffset: monitor.getClientOffset(),
        sourceClientOffset: monitor.getSourceClientOffset(),
        differenceFromInitialOffset: monitor.getDifferenceFromInitialOffset(),
        isDragging: monitor.isDragging()
    }));

    // Don't render anything unless something is being dragged.
    if (!isDragging || !sourceClientOffset) {
        return null;
    }

    // Don't render anything when an item is being rotated by dragging the rotation handler.
    if (itemType.endsWith(Constants.ROTATION_HANDLE_ID_SUFFIX)) {
        return null;
    }

    // Handle render of drag to select.
    if (itemType.endsWith(Constants.DRAG_TO_SELECT_ID_SUFFIX)) {
        const top = Math.round(initialClientOffset.y < clientOffset.y ? initialClientOffset.y : clientOffset.y);
        const left = Math.round(initialClientOffset.x < clientOffset.x ? initialClientOffset.x : clientOffset.x);
        const bottom = Math.round(initialClientOffset.y > clientOffset.y ? initialClientOffset.y : clientOffset.y);
        const right = Math.round(initialClientOffset.x > clientOffset.x ? initialClientOffset.x : clientOffset.x);
        const width = right - left;
        const height = bottom - top;
        const dragToSelectStyle = { top: top + "px", left: left + "px", width: width + "px", height: height + "px" };
        return (
            <div className="custom-draglayer">
                <div className="custom-draglayer-selection" style={dragToSelectStyle}></div>
            </div>
        );
    }

    const container = widgetData.getContainerMapValue(itemType);
    const containerItemData = widgetData.getItemMapValue(itemType + "_" + item.id);
    if (onDragging) {
        onDragging(itemType, item.id, differenceFromInitialOffset);
    }
    return (
        <CustomDragLayerContent
            dragEventItem={item}
            container={container}
            item={containerItemData}
            additionalItemInfoForDragging={additionalItemInfoForDragging}
            sourceClientOffset={sourceClientOffset}
            differenceFromInitialOffset={differenceFromInitialOffset}
            widgetData={widgetData}
            containerCellRectMap={containerCellRectMap}
            containerCellScrollMap={containerCellScrollMap}
            renderWidgetContent={renderWidgetContent}
        />
    );
}
