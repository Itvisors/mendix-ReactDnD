import { Component, createElement } from "react";
import { CustomDragLayer } from "./components/CustomDragLayer";
import { DatasourceItem } from "./components/DatasourceItem";
import { DndProvider } from "react-dnd";
import { DragWrapper } from "./components/DragWrapper";
import { DropWrapper } from "./components/DropWrapper";
import { GlobalDropWrapper } from "./components/GlobalDropWrapper";
import { HTML5Backend } from "react-dnd-html5-backend";

// eslint-disable-next-line sort-imports
import "./ui/MendixReactDnD.css";
import { WidgetData } from "./utils/WidgetData";
import { snapToRotation } from "./utils/Utils";

export default class MendixReactDnD extends Component {
    constructor(props) {
        super(props);

        this.getDatasourceItemContent = this.getDatasourceItemContent.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleRotateHover = this.handleRotateHover.bind(this);
        this.handleRotateDrop = this.handleRotateDrop.bind(this);
        this.handleDragging = this.handleDragging.bind(this);
    }

    DROP_STATUS_NONE = "none";
    DROP_STATUS_DRAGGING = "dragging";
    DROP_STATUS_DROPPED = "dropped";

    state = {
        rotationDegree: 0,
        originalRotation: 0,
        rotateContainerID: null,
        rotateItemID: null,
        dropStatus: this.DROP_STATUS_NONE,
        dropContainerID: null,
        dropItemID: null,
        dropWithOffset: false,
        dropClientX: 0,
        dropClientY: 0,
        originalOffsetX: 0,
        originalOffsetY: 0,
        draggedDifferenceX: 0,
        draggedDifferenceY: 0,
        childIDs: null,
        selectionTriggerMillis: 0
    };

    selectedIDs = null;

    // Convert from radials to degrees.
    R2D = 180 / Math.PI;

    previousDataChangeDateMillis = 0;
    widgetData = null;
    datasourceItemContentMap = new Map();

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
        if (onClickAction?.isExecuting || onDropAction?.isExecuting || onRotateAction?.isExecuting) {
            console.info("MendixReactDnD.render: action still executing");
        } else {
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
                        this.widgetData.loadData(this.props);
                        if (this.widgetData.dataStatus === this.widgetData.DATA_COMPLETE) {
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
                        renderWidgetContent={this.getDatasourceItemContent}
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
            for (const datasourceItem of container.ds.items) {
                const mapItemID = containerID.value + "_" + datasourceItem.id;
                const itemContent = dsContent(datasourceItem);
                // Only add the widget content if it has children.
                // This prevents a lot of unnecessary empty elements when positioning markers with images
                if (itemContent?.props?.children && itemContent.props.children.length > 0) {
                    this.datasourceItemContentMap.set(mapItemID, itemContent);
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
        const rotationDegree = this.calculateRotationDegree(droppedItem, positionData);
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
            const className = "widget-cell widget-cell-r" + rowNumber + "-c" + columnNumber;
            cellArray.push(
                <div className={className} data-rownumber={rowNumber} data-columnnumber={columnNumber}>
                    {this.renderCell(rowNumber, columnNumber)}
                </div>
            );
        }
        return cellArray;
    }

    renderCell(rowNumber, columnNumber) {
        // console.info("MendixReactDnD: Render cells for column " + columnNumber);

        // Get the grid information for the row/column combination. There may be no data at all for that cell.
        const gridMapKey = "r" + rowNumber + "c" + columnNumber;
        const gridMapItem = this.widgetData.getGridMapValue(gridMapKey);
        if (!gridMapItem) {
            return null;
        }

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
        const { snapToSize, snapToGrid, zoomFactor } = this.widgetData;

        switch (dragDropType) {
            case "drag":
                return (
                    <DragWrapper
                        key={item.id}
                        item={item}
                        dropPos={this.getPendingDropPos(item)}
                        onDragStart={this.handleDragStart}
                        zoomFactor={zoomFactor}
                    >
                        {this.renderDatasourceItem(cellContainer, item)}
                    </DragWrapper>
                );

            case "drop":
                return (
                    <DropWrapper
                        key={item.id}
                        cellContainer={cellContainer}
                        item={item}
                        snapToGrid={snapToGrid}
                        snapToSize={snapToSize}
                        onDrop={(droppedItem, positionData) =>
                            this.handleDrop(droppedItem, positionData, cellContainer, item)
                        }
                    >
                        {this.renderDatasourceItem(cellContainer, item)}
                    </DropWrapper>
                );

            case "both":
                return (
                    <DropWrapper
                        key={item.id}
                        cellContainer={cellContainer}
                        item={item}
                        snapToGrid={snapToGrid}
                        snapToSize={snapToSize}
                        onDrop={(droppedItem, positionData) =>
                            this.handleDrop(droppedItem, positionData, cellContainer, item)
                        }
                    >
                        <DragWrapper
                            key={item.id}
                            item={item}
                            dropPos={this.getPendingDropPos(item)}
                            onDragStart={this.handleDragStart}
                            zoomFactor={zoomFactor}
                        >
                            {this.renderDatasourceItem(cellContainer, item)}
                        </DragWrapper>
                    </DropWrapper>
                );
            default:
                return this.renderDatasourceItem(cellContainer, item);
        }
    }

    handleDrop(droppedItem, positionData, cellContainer, item) {
        // console.info(
        //     "handleDrop: droppedItem: " +
        //         JSON.stringify(droppedItem) +
        //         ", positionData: " +
        //         JSON.stringify(positionData)
        // );
        const {
            eventContainerID,
            eventClientY,
            eventGuid,
            eventOffsetX,
            eventClientX,
            eventOffsetY,
            draggedDifferenceX,
            draggedDifferenceY,
            dropTargetContainerID,
            dropTargetGuid,
            onDropAction
        } = this.props;
        const { adjustOffset, zoomFactor } = this.widgetData;
        const { containerID } = cellContainer;

        // When using offset positions, set drop data in state for rendering while datasource has not yet updated itself
        if (this.state.dropWithOffset) {
            // console.info("handleDrop: store drop data in state for position info");
            this.setState({
                dropStatus: this.DROP_STATUS_DROPPED,
                dropClientX: Math.round(positionData.dropOffsetX / zoomFactor),
                dropClientY: Math.round(positionData.dropOffsetY / zoomFactor)
            });
        }

        eventContainerID.setValue(droppedItem.type);
        eventGuid.setTextValue(droppedItem.id);
        dropTargetContainerID.setValue(containerID);
        dropTargetGuid.setTextValue(item.id);
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
        if (eventOffsetX) {
            eventOffsetX.setTextValue("" + offsetX);
        }
        if (eventOffsetY) {
            eventOffsetY.setTextValue("" + offsetY);
        }
        if (draggedDifferenceX) {
            draggedDifferenceX.setTextValue("" + this.state.draggedDifferenceX);
        }
        if (draggedDifferenceY) {
            draggedDifferenceY.setTextValue("" + this.state.draggedDifferenceY);
        }
        if (onDropAction && onDropAction.canExecute && !onDropAction.isExecuting) {
            onDropAction.execute();
        }
    }

    handleDragStart({ containerID, itemID, itemOffsetX, itemOffsetY }) {
        // console.info("handleDragStart: " + containerID + " - " + itemID + ", offset: " + itemOffsetX + "/" + itemOffsetY);
        const newStateValue = {
            dropStatus: this.DROP_STATUS_DRAGGING,
            dropContainerID: containerID,
            dropItemID: itemID,
            dropWithOffset: itemOffsetX !== undefined && itemOffsetY !== undefined,
            originalOffsetX: itemOffsetX,
            originalOffsetY: itemOffsetY,
            childIDs: null
        };
        const dsItem = this.widgetData.getGridMapValue(containerID + "_" + itemID);
        if (dsItem && dsItem.childIDs) {
            newStateValue.childIDs = dsItem.childIDs;
        }
        this.setState(newStateValue);
    }

    handleDragging(draggedContainerID, draggedItemID, differenceFromInitialOffset) {
        // Handle only once in a specified interval to prevent a lot of state updates, renders and possible loops.
        // This method can be called really often so access properties as late as possible.
        const millisNow = new Date().getTime();
        const interval = millisNow - this.onDragStatusMillis;
        if (interval > this.onDragStatusIntervalValue) {
            this.onDragStatusMillis = millisNow;
            if (this.state.dropWithOffset) {
                // Adjust for zoomfactor
                const { zoomFactor } = this.widgetData;
                this.setState({
                    draggedDifferenceX: Math.round(differenceFromInitialOffset.x / zoomFactor),
                    draggedDifferenceY: Math.round(differenceFromInitialOffset.y / zoomFactor)
                });
            }
        }
    }

    getPendingDropPos(item) {
        let dropPos = null;

        // If the parent of the items is being dragged, reposition the child item as well.
        // When multiple items are being dragged, reposition these as well.
        if (this.state.dropStatus !== this.DROP_STATUS_NONE) {
            if (this.state.childIDs?.indexOf(item.id) >= 0 || this.selectedIDs?.indexOf(item.id) >= 0) {
                dropPos = {
                    x: item.offsetX,
                    y: item.offsetY
                };
            }
        }

        // If the datasource item has not yet been updated with the new position, use the state values to prevent briefly showing the item at the old position.
        if (this.state.dropStatus === this.DROP_STATUS_DROPPED && this.state.dropItemID === item.id) {
            // Only when dropping with an offset, as the offset is optional.
            if (this.state.dropWithOffset) {
                // As long as the datasource item has the old values
                if (this.state.originalOffsetX === item.offsetX && this.state.originalOffsetY === item.offsetY) {
                    dropPos = {
                        x: this.state.dropClientX,
                        y: this.state.dropClientY
                    };
                    // console.info("getPendingDropPos: pending drop offset X/Y: " + JSON.stringify(dropPos));
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
        this.setState({
            dropStatus: this.DROP_STATUS_NONE,
            dropContainerID: null,
            dropItemID: null,
            dropClientX: 0,
            dropClientY: 0,
            originalOffsetX: 0,
            originalOffsetY: 0,
            draggedDifferenceX: 0,
            draggedDifferenceY: 0,
            childIDs: null
        });
    }

    renderDatasourceItem(cellContainer, item) {
        let draggedRotationDegree = 0;
        // Use rotation degree if ID matches, rotateItemID is null if nothing is being rotated now.
        if (this.state.rotateItemID && this.state.rotateItemID === item.id) {
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

            const { selectedMarkerGuids } = this.props;
            if (selectedMarkerGuids) {
                selectedMarkerGuids.setTextValue(this.selectedIDs);
            }

            // If selection is allowed, update trigger date in state to force rerender.
            // Keeping the selection itself in state is not possible because it gets filled during rendering.
            // Setting the state during render can cause an infinite loop.
            if (allowSelection !== "none") {
                this.setState({
                    selectionTriggerMillis: new Date().getTime()
                });
            }

            const { selectedMarkerCount } = this.props;
            if (selectedMarkerCount) {
                if (this.selectedIDs) {
                    selectedMarkerCount.setTextValue("" + this.selectedIDs.split(",").length);
                } else {
                    selectedMarkerCount.setTextValue("0");
                }
            }

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
