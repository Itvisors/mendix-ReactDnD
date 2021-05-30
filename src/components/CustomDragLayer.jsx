import { Constants } from "../utils/Constants";
import { CustomDragLayerContent } from "./CustomDragLayerContent";
import { createElement } from "react";
import { useDragLayer } from "react-dnd";

export function CustomDragLayer({
    widgetData,
    containerCellRectMap,
    onDragStatusInterval,
    renderWidgetContent,
    additionalItemInfoForDragging,
    onDragging
}) {
    const { itemType, isDragging, item, sourceClientOffset, differenceFromInitialOffset } = useDragLayer(monitor => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
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
            onDragStatusInterval={onDragStatusInterval}
            renderWidgetContent={renderWidgetContent}
        />
    );
}
