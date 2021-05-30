import { Component, createElement } from "react";
import { CellContainer } from "./components/CellContainer";
import { CustomDragLayer } from "./components/CustomDragLayer";
import { DatasourceItem } from "./components/DatasourceItem";
import { DndProvider } from "react-dnd";
import { DragWrapper } from "./components/DragWrapper";
import { DropWrapper } from "./components/DropWrapper";
import { GlobalDropWrapper } from "./components/GlobalDropWrapper";
import { HTML5Backend } from "react-dnd-html5-backend";
import { WidgetData } from "./utils/WidgetData";
import { snapToRotation } from "./utils/Utils";

// eslint-disable-next-line sort-imports
import "./ui/MendixReactDnD.css";

export default class MendixReactDnD extends Component {
    constructor(props) {
        super(props);

        this.getDatasourceItemContent = this.getDatasourceItemContent.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleRotateHover = this.handleRotateHover.bind(this);
        this.handleRotateDrop = this.handleRotateDrop.bind(this);
        this.handleDragging = this.handleDragging.bind(this);
    }

    DROP_STATUS_NONE = "none";
    DROP_STATUS_DRAGGING = "dragging";
    DROP_STATUS_DROPPED = "dropped";

    // Interval used for updating the dragged difference values.
    DRAGGING_STATUS_UPDATE_INTERVAL = 100;

    state = {
        rotationDegree: 0,
        originalRotation: 0,
        rotateContainerID: null,
        rotateItemID: null,
        stateTriggerMillis: 0
    };

    dropStatus = this.DROP_STATUS_NONE;
    dropContainerID = null;
    dropItemID = null;
    dropWithOffset = false;
    dropClientX = 0;
    dropClientY = 0;
    originalOffsetX = 0;
    originalOffsetY = 0;
    draggedDifferenceX = 0;
    draggedDifferenceY = 0;
    childIDs = null;
    selectedIDs = null;
    additionalItemInfoForDragging = [];

    // Convert from radials to degrees.
    R2D = 180 / Math.PI;

    previousDataChangeDateMillis = 0;
    widgetData = null;
    datasourceItemContentMap = new Map(); // Holds the widget content for each datasource item
    cellContentMap = new Map(); // Holds the cell content (drag/drop wrappers with datasource item)
    containerCellRectMap = new Map(); // The rects by rXcY

    // Update state only every few times to prevent a LOT of state updates, renders and possibly loops.
    onDragStatusMillis = 0;
    onDragStatusIntervalValue = -1;

    render() {
        // Take the value for the on drag status interval only the first time the widget is rendered.
        if (this.onDragStatusIntervalValue === -1) {
            this.onDragStatusIntervalValue = this.props.onDragStatusInterval;
            if (this.onDragStatusIntervalValue < 10) {
                this.onDragStatusIntervalValue = 100;
            }
        }

        const { containerList } = this.props;
        if (!containerList) {
            console.warn("MendixReactDnD: No containers");
            return null;
        }
        // Check whether event properties are writable. Common mistake to place the widget in a readonly dataview.
        // Entity access issues are also hard to spot as the property update is ignored without error.
        if (
            this.isAttributeReadOnly("eventContainerID", this.props.eventContainerID) ||
            this.isAttributeReadOnly("selectedMarkerGuids", this.props.selectedMarkerGuids) ||
            this.isAttributeReadOnly("selectedMarkerCount", this.props.selectedMarkerCount) ||
            this.isAttributeReadOnly("eventClientX", this.props.eventClientX) ||
            this.isAttributeReadOnly("eventClientY", this.props.eventClientY) ||
            this.isAttributeReadOnly("eventOffsetX", this.props.eventOffsetX) ||
            this.isAttributeReadOnly("eventOffsetY", this.props.eventOffsetY) ||
            this.isAttributeReadOnly("draggedDifferenceX", this.props.draggedDifferenceX) ||
            this.isAttributeReadOnly("draggedDifferenceY", this.props.draggedDifferenceY) ||
            this.isAttributeReadOnly("eventGuid", this.props.eventGuid) ||
            this.isAttributeReadOnly("dropTargetContainerID", this.props.dropTargetContainerID) ||
            this.isAttributeReadOnly("dropTargetGuid", this.props.dropTargetGuid) ||
            this.isAttributeReadOnly("newRotation", this.props.newRotation)
        ) {
            return null;
        }
        if (!this.widgetData) {
            this.widgetData = new WidgetData();
        }
        const { dataChangeDateAttr, onClickAction, onDropAction, onRotateAction } = this.props;
        const actionExecuting = onClickAction?.isExecuting || onDropAction?.isExecuting || onRotateAction?.isExecuting;
        // if (actionExecuting) {
        //     console.info("MendixReactDnD.render: action still executing");
        // }
        if (!actionExecuting) {
            if (dataChangeDateAttr?.status === "available") {
                if (dataChangeDateAttr.value) {
                    // Only if the date is different to prevent processing the datasource(s) when the render is only about resizing etc.
                    // Due to an issue with datasources, after an update with refresh in client, the datasources will return stale data.
                    // Also, render will be called many times in a row until all updates are in.
                    // The dataChangeDateAttr value helps us to know that the backend wants the data to be reloaded.
                    // If render gets called again shortly after the dateChangedDate value, load the data again.
                    const currentDateMillis = new Date().getTime();
                    if (
                        this.previousDataChangeDateMillis === 0 ||
                        currentDateMillis - this.previousDataChangeDateMillis < 300 ||
                        dataChangeDateAttr.value.getTime() !== this.previousDataChangeDateMillis
                    ) {
                        // Store the date, also prevents multiple renders all triggering reload of the data.
                        // First load the data in a new object.
                        // If that is successful, save the new widgetData object.
                        // This prevents flickering when a datasource item value turns out to be unavailable.
                        const newWidgetData = new WidgetData();
                        newWidgetData.loadData(this.props);
                        if (newWidgetData.dataStatus === this.widgetData.DATA_COMPLETE) {
                            this.widgetData = newWidgetData;
                            this.cellContentMap.clear();
                            this.loadDatasourceItemContent();
                            this.previousDataChangeDateMillis = dataChangeDateAttr.value.getTime();
                            this.selectedIDs = this.widgetData.selectedMarkerGuids;
                        }
                    }
                } else {
                    console.error("MendixReactDnD: Data changed date is not set");
                    return null;
                }
            }
        }

        // Stop if no data has been loaded yet.
        if (this.widgetData.dataStatus !== this.widgetData.DATA_COMPLETE) {
            return null;
        }

        // console.info("MendixReactDnD.render");

        const className = "widget-container " + this.props.class;
        return (
            <DndProvider backend={HTML5Backend}>
                <div className={className}>
                    <GlobalDropWrapper
                        containerList={this.widgetData.getContainerMapValues()}
                        onRotateHover={this.handleRotateHover}
                        onRotateDrop={this.handleRotateDrop}
                    >
                        {this.renderGrid()}
                    </GlobalDropWrapper>
                    <CustomDragLayer
                        widgetData={this.widgetData}
                        containerCellRectMap={this.containerCellRectMap}
                        onDragStatusInterval={this.onDragStatusIntervalValue}
                        renderWidgetContent={this.getDatasourceItemContent}
                        additionalItemInfoForDragging={this.additionalItemInfoForDragging}
                        onDragging={this.handleDragging}
                    />
                </div>
            </DndProvider>
        );
    }

    /**
     * Loads the widget content for each datasource item.
     * Kept separate from the widgetData object to keep property values simple.
     */
    loadDatasourceItemContent() {
        this.datasourceItemContentMap.clear();
        for (const container of this.props.containerList) {
            const { containerID, dsContent } = container;
            if (dsContent) {
                for (const datasourceItem of container.ds.items) {
                    const mapItemID = containerID.value + "_" + datasourceItem.id;
                    // For Mendix 8, use dsContent as a function, for Mendix 9, dsContent is an object, call dsContent.get
                    const itemContent = this.widgetData.callDsPropDirectly
                        ? dsContent(datasourceItem)
                        : dsContent.get(datasourceItem);
                    // Only add the widget content if it has children.
                    // This prevents a lot of unnecessary empty elements when positioning markers with images
                    if (itemContent?.props?.children && itemContent.props.children.length > 0) {
                        this.datasourceItemContentMap.set(mapItemID, itemContent);
                    }
                }
            }
        }
    }

    getDatasourceItemContent(item) {
        return this.datasourceItemContentMap.get(item.containerID + "_" + item.id);
    }

    /**
     * Handle rotation drag
     *
     * @param {*} draggedItem The dragged item
     * @param {*} positionData The position of the drag
     */
    handleRotateHover(draggedItem, positionData) {
        const rotationDegree = this.calculateRotationDegree(draggedItem, positionData);
        this.setState({
            rotationDegree: rotationDegree,
            originalRotation: draggedItem.originalRotation,
            rotateContainerID: draggedItem.originalType,
            rotateItemID: draggedItem.originalId
        });
    }

    /**
     * Handle drop for rotation drag
     * @param {*} droppedItem The dropped item
     * @param {*} positionData The position of the drop
     */
    handleRotateDrop(droppedItem, positionData) {
        const { eventContainerID, eventGuid, newRotation, onRotateAction } = this.props;
        // Return the new rotation value, need to add current value to the dragged angle.
        // User might drag beyond full circle, prevent values beyond 360
        const rotationDegree =
            (this.calculateRotationDegree(droppedItem, positionData) + droppedItem.originalRotation) % 360;
        // console.info(
        //     "Handle rotation drop, container ID: " +
        //         droppedItem.originalType +
        //         ", id: " +
        //         droppedItem.originalId +
        //         ", rotation degree: " +
        //         rotationDegree +
        //         ", original rotation: " +
        //         droppedItem.originalRotation
        // );
        if (newRotation) {
            newRotation.setTextValue("" + rotationDegree);
            eventContainerID.setValue(droppedItem.originalType);
            eventGuid.setValue(droppedItem.originalId);
            if (onRotateAction && onRotateAction.canExecute && !onRotateAction.isExecuting) {
                onRotateAction.execute();
            }
        }
    }

    calculateRotationDegree(item, positionData) {
        const rotateX = positionData.dX + item.offsetX;
        let rotationDegree = Math.round(this.R2D * Math.atan2(positionData.dY, rotateX));
        const { snapToRotate, rotationDragDegrees } = this.widgetData;
        if (snapToRotate && rotationDragDegrees > 0 && rotationDragDegrees < 360) {
            rotationDegree = snapToRotation(rotationDegree, rotationDragDegrees);
        }
        return rotationDegree;
    }

    renderGrid() {
        // Render the rows
        const rowArray = [];
        for (let rowNumber = 1; rowNumber <= this.widgetData.maxRowNumber; rowNumber++) {
            rowArray.push(this.renderRow(rowNumber));
        }
        return rowArray;
    }

    renderRow(rowNumber) {
        // console.info("MendixReactDnD: Render row " + rowNumber);

        // Render one row.
        const className = "widget-row widget-row-" + rowNumber;
        return (
            <div className={className} data-rownumber={rowNumber}>
                {this.renderRowCells(rowNumber)}
            </div>
        );
    }

    renderRowCells(rowNumber) {
        const rowInfo = this.widgetData.getRowMapValue("r" + rowNumber);
        // console.info(
        //     "MendixReactDnD: Render cells for row " + rowNumber + ", maxColumnNumber: " + rowInfo.maxColumnNumber
        // );

        // Render the container(s) in each cell. Make sure that containers with the same column number end up in the same div.
        const cellArray = [];
        for (let columnNumber = 1; columnNumber <= rowInfo.maxColumnNumber; columnNumber++) {
            cellArray.push(this.renderCellContainer(rowNumber, columnNumber));
        }
        return cellArray;
    }

    renderCellContainer(rowNumber, columnNumber) {
        // console.info(
        //     "MendixReactDnD.renderCellContainer: Render cells for row " + rowNumber + ", column: " + columnNumber
        // );
        // Get the grid information for the row/column combination. There may be no data at all for that cell.
        const mapKey = "r" + rowNumber + "c" + columnNumber;
        const gridMapItem = this.widgetData.getGridMapValue(mapKey);
        if (!gridMapItem) {
            return null;
        }

        return (
            <CellContainer
                rowNumber={rowNumber}
                columnNumber={columnNumber}
                onBoundingClientRectUpdate={rect => {
                    // Store the rect in the widget data map for use while dragging
                    this.containerCellRectMap.set(mapKey, rect);
                }}
            >
                {this.renderCell(gridMapItem)}
            </CellContainer>
        );
    }

    renderCell(gridMapItem) {
        // console.info("MendixReactDnD.gridMapItem: Render cells");

        // Render each container.
        const cellArray = [];
        for (const cellContainer of gridMapItem.containerArray) {
            const { containerID, containerClass } = cellContainer;
            // console.info("MendixReactDnD: Render cell for column " + columnNumber + ", container ID " + containerID);
            const itemArray = [];
            for (const item of cellContainer.getItemMapValues()) {
                itemArray.push(this.renderCellItem(cellContainer, item));
            }
            const className = containerClass
                ? "widget-cell-content-container " + containerClass
                : "widget-cell-content-container";
            cellArray.push(
                <div className={className} data-containerid={containerID}>
                    {itemArray}
                </div>
            );
        }
        return cellArray;
    }

    renderCellItem(cellContainer, item) {
        const { dragDropType } = cellContainer;
        // console.info(
        //     "MendixReactDnD.renderCellItem: Render cell item " +
        //         item.nameAttributeValue +
        //         " at r" +
        //         cellContainer.rowNumber +
        //         "c" +
        //         cellContainer.columnNumber +
        //         " dragDropType: " +
        //         dragDropType
        // );

        switch (dragDropType) {
            case "drag":
                return this.renderDragWrapper(cellContainer, item);

            case "drop":
                return this.renderDropWrapper(cellContainer, item);

            case "both":
                return this.renderBothWrappers(cellContainer, item);

            default:
                return this.renderDatasourceItem(cellContainer, item);
        }
    }

    renderDropWrapper(cellContainer, item) {
        // Return the element created earlier when drag is active or another marker is being rotated
        const mapKey = item.containerID + "_" + item.id;
        if (this.cellContentMap.has(mapKey)) {
            if (this.dropStatus === this.DROP_STATUS_DRAGGING) {
                return this.cellContentMap.get(mapKey);
            }
            if (this.rotateItemID && this.rotateItemID !== item.id) {
                return this.cellContentMap.get(mapKey);
            }
        }
        const dropWrapper = (
            <DropWrapper
                key={item.id}
                cellContainer={cellContainer}
                item={item}
                snapToGrid={this.widgetData.snapToGrid}
                snapToSize={this.widgetData.snapToSize}
                onDrop={(droppedItem, positionData) => this.handleDrop(droppedItem, positionData, cellContainer, item)}
            >
                {this.renderDatasourceItem(cellContainer, item)}
            </DropWrapper>
        );
        this.cellContentMap.set(mapKey, dropWrapper);
        return dropWrapper;
    }

    renderBothWrappers(cellContainer, item) {
        const dropPos = this.getPendingDropPos(item);
        const mapKey = item.containerID + "_" + item.id;
        // console.info("renderBothWrappers");
        // While dragging, don't render any child items or additionally selected items.
        // The custom drag layer will render these along with the item being dragged.
        if (this.dropStatus === this.DROP_STATUS_DRAGGING && item.id !== this.dropItemID) {
            const { selectedIDs, childIDs } = this;
            if ((childIDs && childIDs.indexOf(item.id) >= 0) || (selectedIDs && selectedIDs.indexOf(item.id) >= 0)) {
                // console.info("MendixReactDnD.renderBothWrappers: Do not render " + item.nameAttributeValue);
                return null;
            }
        }
        // Return the element created earlier when drag is active or another marker is being rotated
        if (this.cellContentMap.has(mapKey)) {
            if (this.dropStatus === this.DROP_STATUS_DRAGGING && !dropPos) {
                return this.cellContentMap.get(mapKey);
            }
            if (this.rotateItemID && this.rotateItemID !== item.id) {
                return this.cellContentMap.get(mapKey);
            }
        }
        const bothWrappers = (
            <DropWrapper
                key={item.id}
                cellContainer={cellContainer}
                item={item}
                snapToGrid={this.widgetData.snapToGrid}
                snapToSize={this.widgetData.snapToSize}
                onDrop={(droppedItem, positionData) => this.handleDrop(droppedItem, positionData, cellContainer, item)}
            >
                {this.renderDragWrapper(cellContainer, item)}
            </DropWrapper>
        );
        this.cellContentMap.set(mapKey, bothWrappers);
        return bothWrappers;
    }

    renderDragWrapper(cellContainer, item) {
        const mapKey = item.containerID + "_" + item.id;
        // While dragging, don't render any child items or additionally selected items as the custom drag layer will render these
        if (this.dropStatus === this.DROP_STATUS_DRAGGING && item.id !== this.dropItemID) {
            const { selectedIDs, childIDs } = this;
            if ((childIDs && childIDs.indexOf(item.id) >= 0) || (selectedIDs && selectedIDs.indexOf(item.id) >= 0)) {
                return null;
            }
        }
        const dropPos = this.getPendingDropPos(item);
        // Return the element created earlier when drag is active or another marker is being rotated
        if (this.cellContentMap.has(mapKey)) {
            if (this.dropStatus === this.DROP_STATUS_DRAGGING && !dropPos) {
                return this.cellContentMap.get(mapKey);
            }
            if (this.rotateItemID && this.rotateItemID !== item.id) {
                return this.cellContentMap.get(mapKey);
            }
        }
        const dragWrapper = (
            <DragWrapper
                key={item.id}
                item={item}
                dropPos={dropPos}
                onDragStart={this.handleDragStart}
                onDragEnd={this.handleDragEnd}
                zoomFactor={this.widgetData.zoomFactor}
            >
                {this.renderDatasourceItem(cellContainer, item)}
            </DragWrapper>
        );
        this.cellContentMap.set(mapKey, dragWrapper);
        return dragWrapper;
    }

    handleDrop(droppedItem, positionData, cellContainer, item) {
        // console.info(
        //     "handleDrop: item: " +
        //         JSON.stringify(droppedItem) +
        //         " dropped on container " +
        //         cellContainer.containerID +
        //         ", item " +
        //         (item ? JSON.stringify(item) : "(none)") +
        //         ", positionData: " +
        //         JSON.stringify(positionData)
        // );
        const { adjustOffset, zoomFactor } = this.widgetData;
        const { containerID } = cellContainer;

        const { eventContainerID, eventGuid, dropTargetContainerID, dropTargetGuid } = this.props;
        eventContainerID.setValue(droppedItem.type);
        eventGuid.setTextValue(droppedItem.id);
        dropTargetContainerID.setValue(containerID);
        dropTargetGuid.setTextValue(item.id);

        const { eventClientX, eventClientY } = this.props;
        if (eventClientX) {
            eventClientX.setTextValue("" + positionData.dropClientX);
        }
        if (eventClientY) {
            eventClientY.setTextValue("" + positionData.dropClientY);
        }

        let offsetX = positionData.dropOffsetX;
        let offsetY = positionData.dropOffsetY;
        if (adjustOffset) {
            // Adjust offset values for zoom factor.
            offsetX = Math.round(offsetX / zoomFactor);
            offsetY = Math.round(offsetY / zoomFactor);
            // Adjust offset on drop when requested.
            const { imageWidth, imageHeight, adjustOffsetOnDrop } = droppedItem;
            if (adjustOffsetOnDrop && imageHeight && imageWidth && zoomFactor !== 1) {
                const widthDifference = Math.round(imageWidth - imageWidth * zoomFactor);
                const heightDifference = Math.round(imageHeight - imageHeight * zoomFactor);
                offsetX = Math.round(offsetX + widthDifference / 2);
                offsetY = Math.round(offsetY + heightDifference / 2);
            }
        }
        // When using offset positions, set drop data in state for rendering while datasource has not yet updated itself
        if (this.dropWithOffset) {
            // console.info("handleDrop: store drop data in state for position info");
            this.dropStatus = this.DROP_STATUS_DROPPED;
            this.dropClientX = offsetX;
            this.dropClientY = offsetY;
        }

        const { eventOffsetX, eventOffsetY } = this.props;
        if (eventOffsetX) {
            eventOffsetX.setTextValue("" + offsetX);
        }
        if (eventOffsetY) {
            eventOffsetY.setTextValue("" + offsetY);
        }

        // console.info(
        //     "handleDrop dragged difference this X/Y " +
        //         this.draggedDifferenceX +
        //         "/" +
        //         this.draggedDifferenceY +
        //         ", position data: " +
        //         JSON.stringify(positionData)
        // );
        const { draggedDifferenceX, draggedDifferenceY } = this.props;
        if (draggedDifferenceX) {
            draggedDifferenceX.setTextValue("" + this.draggedDifferenceX);
        }
        if (draggedDifferenceY) {
            draggedDifferenceY.setTextValue("" + this.draggedDifferenceY);
        }

        this.updateSelectionInContext();

        const { onDropAction } = this.props;
        if (onDropAction && onDropAction.canExecute && !onDropAction.isExecuting) {
            onDropAction.execute();
        }
    }

    handleDragStart({ containerID, itemID, itemOffsetX, itemOffsetY }) {
        // console.info("handleDragStart: " + containerID + " - " + itemID);
        this.dropStatus = this.DROP_STATUS_DRAGGING;
        this.dropContainerID = containerID;
        this.dropItemID = itemID;
        this.dropWithOffset = itemOffsetX !== undefined && itemOffsetY !== undefined;
        this.originalOffsetX = itemOffsetX;
        this.originalOffsetY = itemOffsetY;
        this.childIDs = null;
        const dsItem = this.widgetData.getItemMapValue(containerID + "_" + itemID);
        if (dsItem && dsItem.childIDs) {
            this.childIDs = dsItem.childIDs;
        }
        const { selectedIDs } = this;
        // Reset the selected IDs if user ctrl-clicks markers and then starts dragging another marker
        if (selectedIDs) {
            if (this.selectedIDs.indexOf(itemID) === -1) {
                this.selectedIDs = null;
            }
        }

        // Build list with markers that should move along with the dragged marker
        this.additionalItemInfoForDragging = [];
        const { childIDs } = this;
        for (const container of this.widgetData.getContainerMapValues()) {
            for (const containerItem of container.getItemMapValues()) {
                if (containerItem.id !== itemID) {
                    if (
                        (childIDs && childIDs.indexOf(containerItem.id) >= 0) ||
                        (selectedIDs && selectedIDs.indexOf(containerItem.id) >= 0)
                    ) {
                        this.additionalItemInfoForDragging.push({ container, item: containerItem });
                    }
                }
            }
        }

        // Force render by updating the state so custom drag layer will get the item info.
        this.setState({
            stateTriggerMillis: new Date().getTime()
        });
    }

    handleDragEnd({ didDrop }) {
        // Method also receives containerID and itemID in the parameter object
        // console.info("handleDragEnd, did drop: " + didDrop);
        // Clear the drop state if drop was not on acceptable drop target
        if (!didDrop) {
            this.clearDropState();
        }
    }

    handleDragging(draggedContainerID, draggedItemID, differenceFromInitialOffset) {
        // Handle only once in a specified interval to prevent a lot of state updates, renders and possible loops.
        // This method can be called really often so access properties as late as possible.
        const millisNow = new Date().getTime();
        const interval = millisNow - this.onDragStatusMillis;
        if (interval > this.DRAGGING_STATUS_UPDATE_INTERVAL) {
            this.onDragStatusMillis = millisNow;
            if (this.dropWithOffset) {
                // Adjust for zoomfactor
                const { zoomFactor } = this.widgetData;
                this.draggedDifferenceX = Math.round(differenceFromInitialOffset.x / zoomFactor);
                this.draggedDifferenceY = Math.round(differenceFromInitialOffset.y / zoomFactor);
            }
        }
    }

    getPendingDropPos(item) {
        if (this.dropStatus !== this.DROP_STATUS_DROPPED) {
            return null;
        }

        let dropPos = null;

        // If the parent of the items is being dragged, reposition the child item as well.
        // When multiple items are being dragged, reposition these as well.
        const { childIDs, selectedIDs } = this;
        if ((childIDs && childIDs.indexOf(item.id) >= 0) || (selectedIDs && selectedIDs.indexOf(item.id) >= 0)) {
            dropPos = {
                x: item.offsetX + this.draggedDifferenceX,
                y: item.offsetY + this.draggedDifferenceY
            };
            // console.info("getPendingDropPos: additional item pending drop offset X/Y: " + JSON.stringify(dropPos));
            return dropPos;
        }

        // If the datasource item has not yet been updated with the new position, use the state values to prevent briefly showing the item at the old position.
        if (this.dropItemID === item.id) {
            // Only when dropping with an offset, as the offset is optional.
            if (this.dropWithOffset) {
                // As long as the datasource item has the old values
                if (this.originalOffsetX === item.offsetX && this.originalOffsetY === item.offsetY) {
                    dropPos = {
                        x: this.dropClientX,
                        y: this.dropClientY
                    };
                    // console.info("getPendingDropPos: dropped item pending drop offset X/Y: " + JSON.stringify(dropPos));
                } else {
                    // console.info("getPendingDropPos: clear drop state with position offset");
                    this.clearDropState();
                }
            } else {
                // console.info("getPendingDropPos: clear drop state without postion offset");
                this.clearDropState();
            }
        }
        return dropPos;
    }

    clearDropState() {
        this.dropStatus = this.DROP_STATUS_NONE;
        this.dropContainerID = null;
        this.dropItemID = null;
        this.dropClientX = 0;
        this.dropClientY = 0;
        this.originalOffsetX = 0;
        this.originalOffsetY = 0;
        this.draggedDifferenceX = 0;
        this.draggedDifferenceY = 0;
        this.childIDs = null;
    }

    renderDatasourceItem(cellContainer, item) {
        let draggedRotationDegree = 0;
        // Use rotation degree if ID matches, rotateItemID is null if nothing is being rotated now.
        if (this.rotateItemID && this.rotateItemID === item.id) {
            // If the datasource item still returns the original value, use the rotation degree from the rotation drag.
            // If the datasource item has been updated, clear the state values.
            if (item.imageRotation === this.state.originalRotation) {
                draggedRotationDegree = this.state.rotationDegree;
            } else {
                // console.info("renderDatasourceItem: clear rotation state");
                this.setState({
                    rotationDegree: 0,
                    originalRotation: 0,
                    rotateContainerID: null,
                    rotateItemID: null
                });
            }
        }

        // Is marker selected?
        const isSelected = this.selectedIDs ? this.selectedIDs.indexOf(item.id) >= 0 : false;

        return (
            <DatasourceItem
                key={item.id}
                cellContainer={cellContainer}
                item={item}
                isSelected={isSelected}
                draggedRotationDegree={draggedRotationDegree}
                zoomPercentage={this.widgetData.zoomPercentage}
                additionalMarkerClasses={this.widgetData.getAdditionalMarkerClassMapValue(item.id)}
                selectedMarkerClass={this.props.selectedMarkerClass}
                selectedMarkerBorderSize={this.widgetData.selectedMarkerBorderSize}
                renderWidgetContent={this.getDatasourceItemContent}
                onClick={(evt, offsetX, offsetY) => this.handleClick(cellContainer, item, evt, offsetX, offsetY)}
                onRotateClick={rotatedForward => this.handleRotateClick(rotatedForward, cellContainer, item)}
            />
        );
    }

    handleClick(container, item, evt, offsetX, offsetY) {
        const { containerID, allowSelection, returnOnClick } = container;
        const { eventContainerID, eventGuid } = this.props;
        if (returnOnClick) {
            const isRightClick = evt.button !== 0;
            // console.info("MendixReactDnD onClick on " + containerID + " offset X/Y: " + offsetX + "/" + offsetY);
            // console.dir(evt);
            // Only select marker if not right-click event
            if (!isRightClick) {
                // Add item ID to selected IDs for ctrl-click
                if (allowSelection === "multiple" && evt.ctrlKey) {
                    if (this.selectedIDs) {
                        const idPos = this.selectedIDs.indexOf(item.id);
                        // Already selected? Then deselect
                        if (idPos >= 0) {
                            // Found? Split the selectedIDs string. Return new value
                            this.selectedIDs = this.selectedIDs.split(",").reduce((result, id) => {
                                if (item.id === id) {
                                    return result;
                                }
                                if (result) {
                                    return result + "," + id;
                                }
                                return id;
                            }, null);
                        } else {
                            this.selectedIDs += "," + item.id;
                        }
                    } else {
                        this.selectedIDs = item.id;
                    }
                } else {
                    // Set item as single selected item
                    if (allowSelection !== "none") {
                        this.selectedIDs = item.id;
                    }
                }
            }

            // If selection is allowed, update trigger date in state to force rerender.
            // Keeping the selection itself in state is not possible because it gets filled during rendering.
            // Setting the state during render can cause an infinite loop.
            if (allowSelection !== "none") {
                this.setState({
                    stateTriggerMillis: new Date().getTime()
                });
            }

            this.updateSelectionInContext();

            eventContainerID.setValue(containerID);
            eventGuid.setTextValue(item.id);

            // Client position
            const { eventClientX, eventClientY } = this.props;
            if (eventClientX) {
                eventClientX.setTextValue("" + Math.round(evt.clientX));
            }
            if (eventClientY) {
                eventClientY.setTextValue("" + Math.round(evt.clientY));
            }

            // Offset
            const { adjustOffset, zoomFactor } = this.widgetData;
            const { eventOffsetX, eventOffsetY } = this.props;
            if (adjustOffset) {
                // Adjust offset values for zoom factor.
                if (eventOffsetX) {
                    eventOffsetX.setTextValue("" + Math.round(offsetX / zoomFactor));
                }
                if (eventOffsetY) {
                    eventOffsetY.setTextValue("" + Math.round(offsetY / zoomFactor));
                }
            } else {
                if (eventOffsetX) {
                    eventOffsetX.setTextValue("" + offsetX);
                }
                if (eventOffsetY) {
                    eventOffsetY.setTextValue("" + offsetY);
                }
            }

            // Pass the state of the shift, ctrl and alt keys, if requested
            const { shiftKeyHeld } = this.props;
            if (shiftKeyHeld) {
                shiftKeyHeld.setValue(evt.shiftKey);
            }
            const { ctrlKeyHeld } = this.props;
            if (ctrlKeyHeld) {
                ctrlKeyHeld.setValue(evt.ctrlKey);
            }
            const { altKeyHeld } = this.props;
            if (altKeyHeld) {
                altKeyHeld.setValue(evt.altKey);
            }

            // Indicate whether this is a right click event. The button value is zero for normal click.
            const { isRightClickEvent } = this.props;
            if (isRightClickEvent) {
                isRightClickEvent.setValue(isRightClick);
            }

            // Call the action
            const { onClickAction } = this.props;
            if (onClickAction && onClickAction.canExecute && !onClickAction.isExecuting) {
                onClickAction.execute();
            }
        } else {
            // console.info("MendixReactDnD Ignored onClick on " + containerID);
        }
    }

    updateSelectionInContext() {
        const { selectedMarkerGuids } = this.props;
        if (selectedMarkerGuids) {
            selectedMarkerGuids.setTextValue(this.selectedIDs);
        }

        const { selectedMarkerCount } = this.props;
        if (selectedMarkerCount) {
            if (this.selectedIDs) {
                selectedMarkerCount.setTextValue("" + this.selectedIDs.split(",").length);
            } else {
                selectedMarkerCount.setTextValue("0");
            }
        }
    }

    handleRotateClick(rotatedForward, container, item) {
        const { containerID } = container;
        const { eventContainerID, eventGuid, newRotation, onRotateAction } = this.props;
        const { rotationButtonDegrees, addToCurrentRotation } = this.widgetData;
        if (newRotation && rotationButtonDegrees > 0) {
            // Get current rotation
            let newRotationDegree = item.imageRotation;
            // Get value for click
            // Add to current value?
            if (addToCurrentRotation) {
                if (rotatedForward) {
                    newRotationDegree += rotationButtonDegrees;
                    if (newRotationDegree >= 360) {
                        newRotationDegree -= 360;
                    }
                } else {
                    newRotationDegree -= rotationButtonDegrees;
                    if (newRotationDegree < 0) {
                        newRotationDegree += 360;
                    }
                }
            } else {
                // Snap to the next or previous step
                const currentRotationSteps = Math.floor(newRotationDegree / rotationButtonDegrees);
                if (rotatedForward) {
                    newRotationDegree = (currentRotationSteps + 1) * rotationButtonDegrees;
                    if (newRotationDegree >= 360) {
                        newRotationDegree -= 360;
                    }
                } else {
                    // If current value is not an exact multiple of the step value, round down to the previous step.
                    // Otherwise, take a full step back.
                    if (newRotationDegree % rotationButtonDegrees > 0) {
                        newRotationDegree = currentRotationSteps * rotationButtonDegrees;
                    } else {
                        newRotationDegree = (currentRotationSteps - 1) * rotationButtonDegrees;
                        if (newRotationDegree < 0) {
                            newRotationDegree += 360;
                        }
                    }
                }
            }
            newRotation.setTextValue("" + newRotationDegree);
            eventContainerID.setValue(containerID);
            eventGuid.setTextValue(item.id);
            if (onRotateAction && onRotateAction.canExecute && !onRotateAction.isExecuting) {
                onRotateAction.execute();
            }
        }
    }

    isAttributeReadOnly(propName, prop) {
        if (!prop) {
            return false;
        }
        if (prop.status !== "available") {
            return false;
        }
        if (prop.readOnly) {
            console.warn("MendixReactDnD: Property " + propName + " is readonly");
        }
        return prop.readOnly;
    }
}
