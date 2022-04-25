import { createElement, useMemo } from "react";
import { DatasourceItem } from "./DatasourceItem";
import { snapOffsetToGrid } from "../utils/Utils";

export function CustomDragLayerContent(props) {
    const { zoomFactor } = props.widgetData;
    const renderAdditionalItems = () => {
        const additionalItems = [];

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

    const { item, container, dragEventItem, renderWidgetContent, sourceClientOffset } = props;
    const { snapToGrid, snapToSize, zoomPercentage } = props.widgetData;
    const hasAdditionalItems = props.additionalItemInfoForDragging.length > 0;

    // Render the drag preview ourselves.
    // Take height and width from dragged item to render with correct width and height.
    let dragX = sourceClientOffset.x;
    let dragY = sourceClientOffset.y;
    if (snapToSize >= 5 && snapToGrid) {
        dragX = snapOffsetToGrid(dragX, snapToSize);
        dragY = snapOffsetToGrid(dragY, snapToSize);
    }

    return useMemo(() => {
        const { itemWidth, itemHeight } = dragEventItem;
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
                        item={item}
                        isDragging={true}
                        draggedRotationDegree={0}
                        renderWidgetContent={renderWidgetContent}
                        zoomPercentage={zoomPercentage}
                    />
                </div>
                {hasAdditionalItems && renderAdditionalItems()}
            </div>
        );
    }, [
        container,
        dragEventItem,
        dragX,
        dragY,
        hasAdditionalItems,
        item,
        renderAdditionalItems,
        renderWidgetContent,
        zoomPercentage
    ]);
}
