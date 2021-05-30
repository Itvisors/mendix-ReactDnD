import { Component, createElement } from "react";
import { DatasourceItem } from "./DatasourceItem";
import { snapOffsetToGrid } from "../utils/Utils";

export class CustomDragLayerContent extends Component {
    // Preparation to move additional markers only every few times to prevent a LOT of state updates, renders and possibly loops.
    onDragStatusMillis = 0;
    draggedDifferenceX = 0;
    draggedDifferenceY = 0;

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

        // If performance becomes an issue, insert logic here to update the values every x ms, resulting in the same positions for x ms.
        // Currently performance seems no issue here.
        if (hasAdditionalItems) {
            this.draggedDifferenceX = this.props.differenceFromInitialOffset.x;
            this.draggedDifferenceY = this.props.differenceFromInitialOffset.y;
        }

        return (
            <div className="custom-draglayer">
                <div className="custom-draglayer-item" style={style}>
                    <DatasourceItem
                        key={this.props.item.id}
                        cellContainer={this.props.container}
                        item={this.props.item}
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

        for (const itemInfo of this.props.additionalItemInfoForDragging) {
            const { zoomFactor } = this.props.widgetData;
            const { container, item } = itemInfo;
            const mapKey = "r" + container.rowNumber + "c" + container.columnNumber;
            const containerRect = this.props.containerCellRectMap.get(mapKey);
            const containerLeft = containerRect ? containerRect.left : 0;
            const containerTop = containerRect ? containerRect.top : 0;
            const left = Math.round(item.offsetX * zoomFactor) + this.draggedDifferenceX + containerLeft;
            const top = Math.round(item.offsetY * zoomFactor) + this.draggedDifferenceY + containerTop;
            const style = {
                top: top + "px",
                left: left + "px"
            };
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
