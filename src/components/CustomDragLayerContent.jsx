import { Component, createElement } from "react";
import { DatasourceItem } from "./DatasourceItem";
import { snapOffsetToGrid } from "../utils/Utils";

export class CustomDragLayerContent extends Component {
    render() {
        // Render the drag preview ourselves.
        // Take height and width from dragged item to render with correct width and height.
        let dragX = this.props.sourceClientOffset.x;
        let dragY = this.props.sourceClientOffset.y;
        if (this.props.widgetData.snapToSize >= 5 && this.props.widgetData.snapToGrid) {
            dragX = snapOffsetToGrid(dragX, this.props.widgetData.snapToSize);
            dragY = snapOffsetToGrid(dragY, this.props.widgetData.snapToSize);
        }

        const { itemWidth, itemHeight } = this.props.dragEventItem;
        const style = {
            transform: "translate(" + dragX + "px, " + dragY + "px)",
            width: itemWidth + "px",
            height: itemHeight + "px"
        };

        const hasAdditionalItems = this.props.additionalItemInfoForDragging.length > 0;

        return (
            <div className="custom-draglayer">
                <div className="custom-draglayer-item" style={style}>
                    <DatasourceItem
                        key={this.props.item.id}
                        cellContainer={this.props.container}
                        item={this.props.item}
                        isDragging={true}
                        draggedRotationDegree={0}
                        renderWidgetContent={this.props.renderWidgetContent}
                        zoomPercentage={this.props.widgetData.zoomPercentage}
                    />
                </div>
                {hasAdditionalItems && this.renderAdditionalItems()}
            </div>
        );
    }

    renderAdditionalItems() {
        const additionalItems = [];
        const { zoomFactor } = this.props.widgetData;

        for (const itemInfo of this.props.additionalItemInfoForDragging) {
            const { container, item } = itemInfo;
            const mapKey = "r" + container.rowNumber + "c" + container.columnNumber;

            // Get the absolute offset of the container
            const containerRect = this.props.containerCellRectMap.get(mapKey);
            const containerLeft = containerRect ? containerRect.left : 0;
            const containerTop = containerRect ? containerRect.top : 0;

            // Get the current scroll position of the container
            const containerScrollInfo = this.props.containerCellScrollMap.get(mapKey);
            const containerScrollTop = containerScrollInfo ? containerScrollInfo.scrollTop : 0;
            const containerScrollLeft = containerScrollInfo ? containerScrollInfo.scrollLeft : 0;

            // Calculate left and top position, taking into account the container offset and scroll position
            const offsetX = this.props.differenceFromInitialOffset.x;
            const offsetY = this.props.differenceFromInitialOffset.y;
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
                        renderWidgetContent={this.props.renderWidgetContent}
                        zoomPercentage={this.props.widgetData.zoomPercentage}
                    />
                </div>
            );
            additionalItems.push(additionalItem);
        }

        return additionalItems;
    }
}
