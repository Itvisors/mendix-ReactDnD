import { DatasourceItem } from "./DatasourceItem";
import { createElement } from "react";
import { snapOffsetToGrid } from "../utils/Utils";

export function CustomDragLayerContent(props) {
    const renderAdditionalItems = () => {
        const additionalItems = [];
        const { zoomFactor } = props.widgetData;

        for (const itemInfo of props.additionalItemInfoForDragging) {
            const { container, item } = itemInfo;
            const mapKey = "r" + container.rowNumber + "c" + container.columnNumber;

            // Get the absolute offset of the container
            const containerRect = props.containerCellRectMap.get(mapKey);
            const containerLeft = containerRect ? containerRect.left : 0;
            const containerTop = containerRect ? containerRect.top : 0;

            // Get the current scroll position of the container
            const containerScrollInfo = props.containerCellScrollMap.get(mapKey);
            const containerScrollTop = containerScrollInfo ? containerScrollInfo.scrollTop : 0;
            const containerScrollLeft = containerScrollInfo ? containerScrollInfo.scrollLeft : 0;

            // Calculate left and top position, taking into account the container offset and scroll position
            const offsetX = props.differenceFromInitialOffset.x;
            const offsetY = props.differenceFromInitialOffset.y;
            const left = Math.round(item.offsetX * zoomFactor) + offsetX + containerLeft - containerScrollLeft;
            const top = Math.round(item.offsetY * zoomFactor) + offsetY + containerTop - containerScrollTop;
            const style = {
                top: top + "px",
                left: left + "px"
            };

            // Create the item
            const additionalItem = (
                <div className="custom-draglayer-item" style={style}>
                    <DatasourceItem
                        key={item.id}
                        cellContainer={container}
                        item={item}
                        draggedRotationDegree={0}
                        renderWidgetContent={props.renderWidgetContent}
                        zoomPercentage={props.widgetData.zoomPercentage}
                    />
                </div>
            );
            additionalItems.push(additionalItem);
        }

        return additionalItems;
    };

    // Render the drag preview ourselves.
    // Take height and width from dragged item to render with correct width and height.
    let dragX = props.sourceClientOffset.x;
    let dragY = props.sourceClientOffset.y;
    if (props.widgetData.snapToSize >= 5 && props.widgetData.snapToGrid) {
        dragX = snapOffsetToGrid(dragX, props.widgetData.snapToSize);
        dragY = snapOffsetToGrid(dragY, props.widgetData.snapToSize);
    }

    const { itemWidth, itemHeight } = props.dragEventItem;
    const style = {
        transform: "translate(" + dragX + "px, " + dragY + "px)",
        width: itemWidth + "px",
        height: itemHeight + "px"
    };

    const hasAdditionalItems = props.additionalItemInfoForDragging.length > 0;

    return (
        <div className="custom-draglayer">
            <div className="custom-draglayer-item" style={style}>
                <DatasourceItem
                    key={props.item.id}
                    cellContainer={props.container}
                    item={props.item}
                    isDragging={true}
                    draggedRotationDegree={0}
                    renderWidgetContent={props.renderWidgetContent}
                    zoomPercentage={props.widgetData.zoomPercentage}
                />
            </div>
            {hasAdditionalItems && renderAdditionalItems()}
        </div>
    );
}
