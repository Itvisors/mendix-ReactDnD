import { Constants } from "../utils/Constants";
import { DatasourceItem } from "./DatasourceItem";
import { createElement } from "react";
import { useDragLayer } from "react-dnd";

export function CustomDragLayer({ containerMap, itemMap, zoomPercentage }) {
    const { itemType, isDragging, item, currentOffset } = useDragLayer(monitor => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        currentOffset: monitor.getSourceClientOffset(),
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
    const container = containerMap.get(itemType);
    const dsItem = itemMap.get(itemType + "_" + item.id);
    // Render the drag preview ourselves.
    // Take height and width from dragged item to render with correct width and height.
    const { x, y } = currentOffset;
    const { itemWidth, itemHeight } = item;
    const style = {
        transform: "translate(" + x + "px, " + y + "px)",
        width: itemWidth + "px",
        height: itemHeight + "px"
    };
    return (
        <div className="custom-draglayer">
            <div className="custom-draglayer-item" style={style}>
                <DatasourceItem
                    key={item.id}
                    cellContainer={container}
                    item={dsItem}
                    draggedRotationDegree={0}
                    zoomPercentage={zoomPercentage}
                />
            </div>
        </div>
    );
}
