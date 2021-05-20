import { Constants } from "../utils/Constants";
import { DatasourceItem } from "./DatasourceItem";
import { createElement } from "react";
import { snapOffsetToGrid } from "../utils/Utils";
import { useDragLayer } from "react-dnd";

export function CustomDragLayer({ widgetData, renderWidgetContent, onDragging }) {
    const { itemType, isDragging, item, currentOffset, differenceFromInitialOffset } = useDragLayer(monitor => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        currentOffset: monitor.getSourceClientOffset(),
        differenceFromInitialOffset: monitor.getDifferenceFromInitialOffset(),
        isDragging: monitor.isDragging()
    }));

    // Don't render anything unless something is being dragged.
    if (!isDragging || !currentOffset) {
        return null;
    }
    // Don't render anything when an item is being rotated by dragging the rotation handler.
    if (itemType.endsWith(Constants.ROTATION_HANDLE_ID_SUFFIX)) {
        return null;
    }
    const container = widgetData.getContainerMapValue(itemType);
    const containerItemData = widgetData.getItemMapValue(itemType + "_" + item.id);
    // Render the drag preview ourselves.
    // Take height and width from dragged item to render with correct width and height.
    let dragX = currentOffset.x;
    let dragY = currentOffset.y;
    if (widgetData.snapToSize >= 5 && widgetData.snapToGrid) {
        dragX = snapOffsetToGrid(dragX, widgetData.snapToSize);
        dragY = snapOffsetToGrid(dragY, widgetData.snapToSize);
    }
    if (onDragging) {
        onDragging(itemType, item.id, differenceFromInitialOffset);
    }
    const { itemWidth, itemHeight } = item;
    const style = {
        transform: "translate(" + dragX + "px, " + dragY + "px)",
        width: itemWidth + "px",
        height: itemHeight + "px"
    };
    return (
        <div className="custom-draglayer">
            <div className="custom-draglayer-item" style={style}>
                <DatasourceItem
                    key={item.id}
                    cellContainer={container}
                    item={containerItemData}
                    draggedRotationDegree={0}
                    renderWidgetContent={renderWidgetContent}
                    zoomPercentage={widgetData.zoomPercentage}
                />
            </div>
        </div>
    );
}
