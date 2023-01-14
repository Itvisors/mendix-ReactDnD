import { Component, createElement } from "react";
import { CellContainer } from "./components/CellContainer";
import { CustomDragLayer } from "./components/CustomDragLayer";
import { DatasourceItem } from "./components/DatasourceItem";
import { DndProvider } from "react-dnd";
import { DragWrapper } from "./components/DragWrapper";
import { DropWrapper } from "./components/DropWrapper";
import { GlobalDropWrapper } from "./components/GlobalDropWrapper";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { WidgetData } from "./utils/WidgetData";
import { snapToRotation } from "./utils/Utils";

// eslint-disable-next-line sort-imports
import "./ui/MendixReactDnD.css";

export default class MendixReactDnD extends Component {
    constructor(props) {
        super(props);

        this.getDatasourceItemContent = this.getDatasourceItemContent.bind(this);
        this.getDatasourceItemDragHandleContent = this.getDatasourceItemDragHandleContent.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleRotateHover = this.handleRotateHover.bind(this);
        this.handleRotateDrop = this.handleRotateDrop.bind(this);
        this.handleDragToSelectDrop = this.handleDragToSelectDrop.bind(this);
        this.handleDragging = this.handleDragging.bind(this);
        this.handleBoundingClientRectUpdate = this.handleBoundingClientRectUpdate.bind(this);
        this.handleContainerScroll = this.handleContainerScroll.bind(this);
        this.handleOnScrollToHandled = this.handleOnScrollToHandled.bind(this);
    }

    DROP_STATUS_NONE = "none";
    DROP_STATUS_DRAGGING = "dragging";
    DROP_STATUS_DROPPED = "dropped";

    DATASOURCE_STATUS_PENDING = "pending";
    DATASOURCE_STATUS_AVAILABLE = "available";
    DATASOURCE_STATUS_LOADED = "loaded";

    state = {
        rotationDegree: 0,
        originalRotation: 0,
        rotateContainerID: null,
        rotateItemID: null,
        stateTriggerMillis: 0,
        scrollToContainerRow: 0,
        scrollToContainerColumn: 0,
        scrollToX: 0,
        scrollToY: 0
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
    // Convert from degrees to radials.
    D2R = Math.PI / 180;

    previousDataChangeDateMillis = 0;
    widgetData = null;
    datasourceItemContentMap = new Map(); // Holds the widget content for each datasource item
    containerCellRectMap = new Map(); // The rect for each container by rXcY
    containerCellScrollMap = new Map(); // The scroll position for each container by rXcY
    containerDatasourceItemsMap = new Map(); // The datasource item array for each container by container ID
    containerDatasourceStatus = this.DATASOURCE_STATUS_PENDING;

    render() {
        const { containerList } = this.props;
        if (!containerList) {
            console.warn("MendixReactDnD: No containers");
            return null;
        }

        // console.info("MendixReactDnD.render");

        if (!this.widgetData) {
            this.widgetData = new WidgetData();
        }
        const { dataChangeDateAttr, onClickAction, onDropAction, onRotateAction, onDragToSelect } = this.props;
        const actionExecuting =
            onClickAction?.isExecuting ||
            onDropAction?.isExecuting ||
            onRotateAction?.isExecuting ||
            onDragToSelect?.isExecuting;
        // if (actionExecuting) {
        //     console.info("MendixReactDnD.render: action still executing");
        // }
        if (!actionExecuting) {
            if (dataChangeDateAttr?.status === "available") {
                if (dataChangeDateAttr.value) {
                    // Only if the date is different to prevent processing the datasource(s) when the render is only about resizing etc.
                    // The dataChangeDateAttr value helps us to know that the backend wants the data to be reloaded.
                    if (
                        this.previousDataChangeDateMillis === 0 ||
                        dataChangeDateAttr.value.getTime() !== this.previousDataChangeDateMillis
                    ) {
                        // if (this.previousDataChangeDateMillis === 0) {
                        //     console.info("MendixReactDnD.render: no data changed date set yet");
                        // } else {
                        //     console.info("MendixReactDnD.render: different data changed date");
                        // }
                        this.setDatasourceUpdateStatus(this.DATASOURCE_STATUS_PENDING);
                        // Store the date, also prevents multiple renders all triggering reload of the data.
                        this.previousDataChangeDateMillis = dataChangeDateAttr.value.getTime();
                    }
                    // console.info("MendixReactDnD.render: Check datasource pending status");
                    this.checkDatasourceStatus();
                    if (this.containerDatasourceStatus === this.DATASOURCE_STATUS_AVAILABLE) {
                        // console.info("MendixReactDnD.render: Datasource update complete, load data");
                        this.loadWidgetData();
                    }
                } else {
                    console.error("MendixReactDnD: Data changed date is not set");
                    return null;
                }
                // } else {
                //     console.info("MendixReactDnD.render: data changed date not available");
            }
        }

        // Stop if no data has been loaded yet.
        if (this.widgetData.dataStatus !== this.widgetData.DATA_COMPLETE) {
            return null;
        }

        this.checkPendingDropPos();

        const backend = this.props.useTouchBackend?.value ? TouchBackend : HTML5Backend;

        const className = "widget-container " + this.props.class;
        return (
            <DndProvider backend={backend}>
                <div className={className}>
                    <GlobalDropWrapper
                        containerList={this.widgetData.getContainerMapValues()}
                        onRotateHover={this.handleRotateHover}
                        onRotateDrop={this.handleRotateDrop}
                        onDragToSelectDrop={this.handleDragToSelectDrop}
                    >
                        {this.renderGrid()}
                    </GlobalDropWrapper>
                    <CustomDragLayer
                        widgetData={this.widgetData}
                        containerCellRectMap={this.containerCellRectMap}
                        containerCellScrollMap={this.containerCellScrollMap}
                        renderWidgetContent={this.getDatasourceItemContent}
                        additionalItemInfoForDragging={this.additionalItemInfoForDragging}
                        onDragging={this.handleDragging}
                    />
                </div>
            </DndProvider>
        );
    }

    setDatasourceUpdateStatus(newStatus) {
        this.containerDatasourceStatus = newStatus;
        for (const mapItem of this.containerDatasourceItemsMap.values()) {
            mapItem.updatePending = newStatus;
        }
    }

    checkDatasourceStatus() {
        let hasAvailable = false;
        let hasUnavailable = false;
        for (const container of this.props.containerList) {
            const { ds } = container;
            const containerID = container.containerID.value;
            if (this.containerDatasourceItemsMap.has(containerID)) {
                const mapItem = this.containerDatasourceItemsMap.get(containerID);
                if (ds.status === "available") {
                    // When the datasource content has been refreshed, the items array will be a different object
                    // So update is pending when array object is the same as the one in the map.
                    if (ds.items === mapItem.dsItems) {
                        // console.info("MendixReactDnD: Datasource " + containerID + ": item array already cached");
                    } else {
                        // console.info("MendixReactDnD: Datasource " + containerID + ": new item array received");
                        mapItem.updatePending = this.DATASOURCE_STATUS_AVAILABLE;
                        mapItem.dsItems = ds.items;
                        hasAvailable = true;
                    }
                } else {
                    // console.info("MendixReactDnD: Datasource " + containerID + " is not available: " + ds.status);
                    mapItem.dsItems = ds.items;
                    mapItem.updatePending = this.DATASOURCE_STATUS_PENDING;
                    hasUnavailable = true;
                }
                this.containerDatasourceItemsMap.set(containerID, mapItem);
            } else {
                // console.info("MendixReactDnD: Item array not yet in map, status: " + ds.status);
                if (ds.status === "available") {
                    hasAvailable = true;
                } else {
                    hasUnavailable = true;
                }
                const updatePending =
                    ds.status === "available" ? this.DATASOURCE_STATUS_AVAILABLE : this.DATASOURCE_STATUS_PENDING;
                this.containerDatasourceItemsMap.set(containerID, {
                    dsItems: ds.items,
                    updatePending: updatePending
                });
            }
        }

        // Set the status depending on what we found.
        if (hasUnavailable) {
            this.containerDatasourceStatus = this.DATASOURCE_STATUS_PENDING;
        } else if (hasAvailable) {
            this.containerDatasourceStatus = this.DATASOURCE_STATUS_AVAILABLE;
        }
    }

    loadWidgetData() {
        // First load the data in a new object.
        // If that is successful, save the new widgetData object.
        // This prevents flickering when a datasource item value turns out to be unavailable.
        const newWidgetData = new WidgetData();
        newWidgetData.loadData(this.props);
        if (newWidgetData.dataStatus === this.widgetData.DATA_COMPLETE) {
            this.widgetData = newWidgetData;
            this.loadDatasourceItemContent();
            this.selectedIDs = this.widgetData.selectedMarkerGuids;
            this.setScrollToValuesInState();
            this.setDatasourceUpdateStatus(this.DATASOURCE_STATUS_LOADED);
            // console.info("MendixReactDnD.render: new data loaded");
        }
    }

    /**
     * Loads the widget content for each datasource item.
     * Kept separate from the widgetData object to keep property values simple.
     */
    loadDatasourceItemContent() {
        this.datasourceItemContentMap.clear();
        for (const container of this.props.containerList) {
            const { containerID, dsContent, dsDragHandleContent } = container;
            if (dsContent) {
                for (const datasourceItem of container.ds.items) {
                    const mapItemID = containerID.value + "_" + datasourceItem.id;
                    const itemContent = {
                        content: dsContent.get(datasourceItem),
                        dragHandleContent: dsDragHandleContent ? dsDragHandleContent.get(datasourceItem) : undefined
                    };
                    this.datasourceItemContentMap.set(mapItemID, itemContent);
                }
            }
        }
    }

    /**
     * If scrolling a cell container is requested, put the values in state for later.
     * Cannot be done directly as the container data may not be visible yet.
     * Also, a change in zoom percentage must be processed first.
     */
    setScrollToValuesInState() {
        const { scrollToContainerRow, scrollToContainerColumn, scrollToX, scrollToY, scrollToDelay } = this.props;
        if (scrollToContainerRow?.value && scrollToContainerColumn?.value && scrollToX?.value && scrollToY?.value) {
            // console.info("MendixReactDnD.render: Set timeout for updating scroll to values in state");
            setTimeout(() => {
                const scrollToContainerRowValue = Number(scrollToContainerRow.value);
                const scrollToContainerColumnValue = Number(scrollToContainerColumn.value);
                const scrollToXValue = Number(scrollToX.value);
                const scrollToYValue = Number(scrollToY.value);
                // console.info(
                //     "MendixReactDnD: Set scroll to values in state for row " +
                //         scrollToContainerRowValue +
                //         ", col " +
                //         scrollToContainerColumnValue +
                //         ", x " +
                //         scrollToXValue +
                //         ", y " +
                //         scrollToYValue
                // );
                this.setState({
                    scrollToContainerRow: scrollToContainerRowValue,
                    scrollToContainerColumn: scrollToContainerColumnValue,
                    scrollToX: scrollToXValue,
                    scrollToY: scrollToYValue
                });
            }, scrollToDelay);
        }
    }

    getDatasourceItemContent(item) {
        const itemContent = this.datasourceItemContentMap.get(item.containerID + "_" + item.id);
        return itemContent?.content;
    }

    getDatasourceItemDragHandleContent(item) {
        const itemContent = this.datasourceItemContentMap.get(item.containerID + "_" + item.id);
        return itemContent?.dragHandleContent;
    }

    /**
     * Handle rotation drag
     *
     * @param {*} draggedItem The dragged item
     * @param {*} positionData The position of the drag
     */
    handleRotateHover(draggedItem, positionData) {
        const rotationDegree = this.calculateRotationDegree(draggedItem, positionData);
        // console.info("handleRotateHover, rotation degree: " + rotationDegree);
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
            if (
                !this.isAttributeReadOnly("eventContainerID", eventContainerID) &&
                !this.isAttributeReadOnly("eventGuid", eventGuid) &&
                !this.isAttributeReadOnly("newRotation", newRotation)
            ) {
                newRotation.setTextValue("" + rotationDegree);
                eventContainerID.setValue(droppedItem.originalType);
                eventGuid.setValue(droppedItem.originalId);
                if (onRotateAction && onRotateAction.canExecute && !onRotateAction.isExecuting) {
                    onRotateAction.execute();
                }
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

    /**
     * Handle drop for drag to select
     * @param {*} droppedItem The item the drag to select was performed on, a background or floorplan
     * @param {*} positionData The position of the drop
     */
    handleDragToSelectDrop(droppedItem, positionData) {
        const mapKey = "r" + droppedItem.rowNumber + "c" + droppedItem.columnNumber;

        // Get the absolute offset of the container
        const containerRect = this.containerCellRectMap.get(mapKey);
        const containerLeft = Math.round(containerRect ? containerRect.left : 0);
        const containerTop = Math.round(containerRect ? containerRect.top : 0);

        // Get the current scroll position of the container
        const containerScrollInfo = this.containerCellScrollMap.get(mapKey);
        const containerScrollTop = Math.round(containerScrollInfo ? containerScrollInfo.scrollTop : 0);
        const containerScrollLeft = Math.round(containerScrollInfo ? containerScrollInfo.scrollLeft : 0);

        // When dragging from top to bottom or from left to right, the dX/dY value will be positive, negative otherwise.
        // The values are screen values so the zoom factor must be applied on them.
        let selectionTop = positionData.initialY - containerTop + containerScrollTop;
        selectionTop = Math.round(selectionTop / this.widgetData.zoomFactor);
        let selectionLeft = positionData.initialX - containerLeft + containerScrollLeft;
        selectionLeft = Math.round(selectionLeft / this.widgetData.zoomFactor);
        let selectionRight = selectionLeft;
        let selectionBottom = selectionTop;
        if (positionData.dX > 0) {
            selectionRight += Math.round(positionData.dX / this.widgetData.zoomFactor);
        } else {
            selectionLeft += Math.round(positionData.dX / this.widgetData.zoomFactor);
        }
        if (positionData.dY > 0) {
            selectionBottom += Math.round(positionData.dY / this.widgetData.zoomFactor);
        } else {
            selectionTop += Math.round(positionData.dY / this.widgetData.zoomFactor);
        }
        if (selectionTop < 0) {
            selectionTop = 0;
        }
        if (selectionLeft < 0) {
            selectionLeft = 0;
        }
        // console.info(
        //     "handleDragToSelectDrop, top: " +
        //         selectionTop +
        //         ", left: " +
        //         selectionLeft +
        //         ", right: " +
        //         selectionRight +
        //         ", bottom: " +
        //         selectionBottom
        // );

        // Get the containers in the same grid cell.
        // Only process those with multiple selection allowed. (Background, current 'dropped' item will be skipped automatically)
        // Search for image items that fit in the selection area
        const gridMapItem = this.widgetData.getGridMapValue(mapKey);
        this.selectedIDs = null;
        for (const cellContainer of gridMapItem.containerArray) {
            if (cellContainer.allowSelection === "multiple") {
                for (const item of cellContainer.getItemMapValues()) {
                    if (item.imageUrl && item.hasOffset) {
                        if (
                            this.isItemInSelectionArea(
                                item,
                                selectionTop,
                                selectionLeft,
                                selectionRight,
                                selectionBottom
                            )
                        ) {
                            if (this.selectedIDs) {
                                this.selectedIDs += "," + item.id;
                            } else {
                                this.selectedIDs = item.id;
                            }
                        }
                    }
                }
            }
        }
        this.updateSelectionInContext();

        const { onDragToSelect } = this.props;
        if (onDragToSelect && onDragToSelect.canExecute && !onDragToSelect.isExecuting) {
            onDragToSelect.execute();
        }
    }

    isItemInSelectionArea(item, selectionTop, selectionLeft, selectionRight, selectionBottom) {
        // No rotation, easy
        const checkWidth = item.offsetX + item.imageWidth;
        const checkHeight = item.offsetY + item.imageHeight;
        if (item.imageRotation === 0) {
            return (
                item.offsetX > selectionLeft &&
                item.offsetY > selectionTop &&
                checkWidth < selectionRight &&
                checkHeight < selectionBottom
            );
        }

        // Rotation, difficult.
        // 1. Determine the center coordinate of the image rect.
        // 2. Calculate the coordinate of each corner of the rotated image rect.
        // 3. Determine whether the rotated image fits in the selection area
        // Source: https://stackoverflow.com/questions/41898990/find-corners-of-a-rotated-rectangle-given-its-center-point-and-rotation

        /*
        Center point = (center.x, center.y)
        Angle        = angle
        Height       = height
        Width        = width

        TOP RIGHT VERTEX:
        Top_Right.x = center.x + ((width / 2) * cos(angle)) - ((height / 2) * sin(angle))
        Top_Right.y = center.y + ((width / 2) * sin(angle)) + ((height / 2) * cos(angle))

        TOP LEFT VERTEX:
        Top_Left.x = center.x - ((width / 2) * cos(angle)) - ((height / 2) * sin(angle))
        Top_Left.y = center.y - ((width / 2) * sin(angle)) + ((height / 2) * cos(angle))

        BOTTOM LEFT VERTEX:
        Bot_Left.x = center.x - ((width / 2) * cos(angle)) + ((height / 2) * sin(angle))
        Bot_Left.y = center.y - ((width / 2) * sin(angle)) - ((height / 2) * cos(angle))

        BOTTOM RIGHT VERTEX:
        Bot_Right.x = center.x + ((width / 2) * cos(angle)) + ((height / 2) * sin(angle))
        Bot_Right.y = center.y + ((width / 2) * sin(angle)) - ((height / 2) * cos(angle))
        */

        // Calculate half of width/height values, used a lot.
        const halfWidth = item.imageWidth / 2;
        const halfHeight = item.imageHeight / 2;

        // Determine the center coordinate
        const centerX = item.offsetX + halfWidth;
        const centerY = item.offsetY + halfHeight;

        // The cos and sin values are used a lot so calculate them only once. (Need to convert to radians!)
        const sinAngle = Math.sin(item.imageRotation * this.D2R);
        const cosAngle = Math.cos(item.imageRotation * this.D2R);

        // Determine coordinates after rotation
        const topRightX = Math.round(centerX + halfWidth * cosAngle - halfHeight * sinAngle);
        const topRightY = Math.round(centerY + halfWidth * sinAngle + halfHeight * cosAngle);

        const topLeftX = Math.round(centerX - halfWidth * cosAngle - halfHeight * sinAngle);
        const topLeftY = Math.round(centerY - halfWidth * sinAngle + halfHeight * cosAngle);

        const bottomLeftX = Math.round(centerX - halfWidth * cosAngle + halfHeight * sinAngle);
        const bottomLeftY = Math.round(centerY - halfWidth * sinAngle - halfHeight * cosAngle);

        const bottomRightX = Math.round(centerX + halfWidth * cosAngle + halfHeight * sinAngle);
        const bottomRightY = Math.round(centerY + halfWidth * sinAngle - halfHeight * cosAngle);

        const xValues = [topRightX, topLeftX, bottomLeftX, bottomRightX];
        const yValues = [topRightY, topLeftY, bottomLeftY, bottomRightY];

        const minX = xValues.reduce((previousValue, currentValue) =>
            currentValue < previousValue ? currentValue : previousValue
        );

        const minY = yValues.reduce((previousValue, currentValue) =>
            currentValue < previousValue ? currentValue : previousValue
        );

        const maxX = xValues.reduce((previousValue, currentValue) =>
            currentValue > previousValue ? currentValue : previousValue
        );

        const maxY = yValues.reduce((previousValue, currentValue) =>
            currentValue > previousValue ? currentValue : previousValue
        );

        return minX > selectionLeft && minY > selectionTop && maxX < selectionRight && maxY < selectionBottom;
    }

    checkPendingDropPos() {
        if (this.dropStatus !== this.DROP_STATUS_DROPPED) {
            return;
        }

        const item = this.widgetData.getItemMapValue(this.dropContainerID + "_" + this.dropItemID);
        if (item) {
            // Only when dropping with an offset, as the offset is optional.
            if (this.dropWithOffset) {
                // When the datasource item no longer has the old values
                if (this.originalOffsetX !== item.offsetX || this.originalOffsetY !== item.offsetY) {
                    // console.info("checkPendingDropPos: clear drop state with position offset");
                    this.clearDropState();
                }
            } else {
                // console.info("checkPendingDropPos: clear drop state without postion offset");
                this.clearDropState();
            }
        }
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
            <div key={"row-" + rowNumber} className={className} data-rownumber={rowNumber}>
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

        const { scrollToContainerRow, scrollToContainerColumn, scrollToX, scrollToY } = this.state;
        const scrollTo = scrollToContainerRow === rowNumber && scrollToContainerColumn === columnNumber;
        // if (scrollTo) {
        //     console.info(
        //         "MendixReactDnD: Scroll container r " +
        //             rowNumber +
        //             ", c " +
        //             columnNumber +
        //             " to " +
        //             scrollToX +
        //             "/" +
        //             scrollToY
        //     );
        // }

        return (
            <CellContainer
                key={mapKey}
                cellKey={mapKey}
                rowNumber={rowNumber}
                columnNumber={columnNumber}
                scrollToX={scrollTo ? scrollToX : undefined}
                scrollToY={scrollTo ? scrollToY : undefined}
                onBoundingClientRectUpdate={this.handleBoundingClientRectUpdate}
                onContainerScroll={this.handleContainerScroll}
                onScrollToHandled={this.handleOnScrollToHandled}
            >
                {this.renderCell(gridMapItem)}
            </CellContainer>
        );
    }

    handleBoundingClientRectUpdate(mapKey, rect) {
        // Store the rect in the map for use while dragging
        this.containerCellRectMap.set(mapKey, rect);
    }

    handleContainerScroll(mapKey, scrollInfo) {
        // Store the scroll info in the map to take scroll position into account for event data
        this.containerCellScrollMap.set(mapKey, scrollInfo);
    }

    handleOnScrollToHandled() {
        const { scrollToContainerRow, scrollToContainerColumn, scrollToX, scrollToY } = this.props;
        if (scrollToContainerRow && scrollToContainerColumn && scrollToX && scrollToY) {
            // console.info("MendixReactDnD: container onScrollTo handled");
            this.setState({
                scrollToContainerRow: 0,
                scrollToContainerColumn: 0,
                scrollToX: 0,
                scrollToY: 0
            });
            scrollToContainerRow.setValue(undefined);
            scrollToContainerColumn.setValue(undefined);
            scrollToX.setValue(undefined);
            scrollToY.setValue(undefined);
            const { onScrollToHandledAction } = this.props;
            if (onScrollToHandledAction && onScrollToHandledAction.canExecute && !onScrollToHandledAction.isExecuting) {
                onScrollToHandledAction.execute();
            }
        }
    }

    renderCell(gridMapItem) {
        // console.info("MendixReactDnD.gridMapItem: Render cells");

        // Render each container.
        const cellArray = [];
        let cellIndex = 0;
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
            cellIndex++;
            cellArray.push(
                <div key={"cell-" + cellIndex} className={className} data-containerid={containerID}>
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
        // While dragging, don't render any child items or additionally selected items as the custom drag layer will render these
        if (this.dropStatus === this.DROP_STATUS_DRAGGING && item.id !== this.dropItemID) {
            const { selectedIDs, childIDs } = this;
            if ((childIDs && childIDs.indexOf(item.id) >= 0) || (selectedIDs && selectedIDs.indexOf(item.id) >= 0)) {
                return null;
            }
        }
        return (
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
    }

    renderBothWrappers(cellContainer, item) {
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
        return (
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
    }

    renderDragWrapper(cellContainer, item) {
        // While dragging, don't render any child items or additionally selected items as the custom drag layer will render these
        if (this.dropStatus === this.DROP_STATUS_DRAGGING && item.id !== this.dropItemID) {
            const { selectedIDs, childIDs } = this;
            if ((childIDs && childIDs.indexOf(item.id) >= 0) || (selectedIDs && selectedIDs.indexOf(item.id) >= 0)) {
                return null;
            }
        }
        const dropPos = this.getPendingDropPos(item);
        return (
            <DragWrapper
                key={item.id}
                item={item}
                dropPos={dropPos}
                onDragStart={this.handleDragStart}
                onDragEnd={this.handleDragEnd}
                zoomFactor={this.widgetData.zoomFactor}
                renderDragHandleContent={this.getDatasourceItemDragHandleContent}
            >
                {this.renderDatasourceItem(cellContainer, item)}
            </DragWrapper>
        );
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

        const {
            eventContainerID,
            eventGuid,
            eventClientX,
            eventClientY,
            eventOffsetX,
            eventOffsetY,
            dropTargetContainerID,
            dropTargetGuid
        } = this.props;
        if (
            this.isAttributeReadOnly("eventContainerID", eventContainerID) ||
            this.isAttributeReadOnly("eventClientX", eventClientX) ||
            this.isAttributeReadOnly("eventClientY", eventClientY) ||
            this.isAttributeReadOnly("eventOffsetX", eventOffsetX) ||
            this.isAttributeReadOnly("eventOffsetY", eventOffsetY) ||
            this.isAttributeReadOnly("eventGuid", eventGuid) ||
            this.isAttributeReadOnly("dropTargetContainerID", dropTargetContainerID) ||
            this.isAttributeReadOnly("dropTargetGuid", dropTargetGuid)
        ) {
            return;
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

        // The react-dnd library already adjusts for scroll offset here.

        if (adjustOffset) {
            // Adjust offset values for zoom factor.
            offsetX = Math.round(offsetX / zoomFactor);
            offsetY = Math.round(offsetY / zoomFactor);
        }
        // When using offset positions, set drop data in state for rendering while datasource has not yet updated itself
        this.dropStatus = this.DROP_STATUS_DROPPED;
        if (this.dropWithOffset) {
            // console.info("handleDrop: store drop data in state for position info");
            this.dropClientX = offsetX;
            this.dropClientY = offsetY;
        }

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
        // Reset the selected IDs if user ctrl-clicks markers and then starts dragging another marker
        if (this.selectedIDs) {
            if (this.selectedIDs.indexOf(itemID) === -1) {
                this.selectedIDs = null;
            }
        }

        // Add child IDs of any multiselected markers
        const selectedIDArray = this.selectedIDs ? this.selectedIDs.split(",") : [];
        for (const selectedID of selectedIDArray) {
            const selectedItem = this.widgetData.getSelectableItemMapValue(selectedID);
            if (selectedItem) {
                if (this.childIDs) {
                    this.childIDs += "," + selectedItem.childIDs;
                } else {
                    this.childIDs = selectedItem.childIDs;
                }
            } else {
                console.error("MendixReactDnD: Selected item not found for " + selectedID);
            }
        }

        let additionalItemIDArray = this.selectedIDs ? this.selectedIDs.split(",") : [];
        if (this.childIDs) {
            additionalItemIDArray = additionalItemIDArray.concat(this.childIDs.split(","));
        }

        // Build list with markers that should move along with the dragged marker
        this.additionalItemInfoForDragging = [];
        for (const additionalItemID of additionalItemIDArray) {
            const additionalItem = this.widgetData.getSelectableItemMapValue(additionalItemID);
            if (additionalItem) {
                const container = this.widgetData.getContainerMapValue(additionalItem.containerID);
                this.additionalItemInfoForDragging.push({ container, item: additionalItem });
            } else {
                console.error("MendixReactDnD: Additional item not found for " + additionalItemID);
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
        if (this.dropWithOffset) {
            // Adjust for zoomfactor
            const { zoomFactor } = this.widgetData;
            this.draggedDifferenceX = Math.round(differenceFromInitialOffset.x / zoomFactor);
            this.draggedDifferenceY = Math.round(differenceFromInitialOffset.y / zoomFactor);
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
        // Only when dropping with an offset, as the offset is optional.
        if (this.dropItemID === item.id && this.dropWithOffset) {
            dropPos = {
                x: item.offsetX + this.draggedDifferenceX,
                y: item.offsetY + this.draggedDifferenceY
            };
            // console.info("getPendingDropPos: dropped item pending drop offset X/Y: " + JSON.stringify(dropPos));
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
        const {
            eventContainerID,
            eventClientX,
            eventClientY,
            eventOffsetX,
            eventOffsetY,
            shiftKeyHeld,
            ctrlKeyHeld,
            altKeyHeld,
            isRightClickEvent,
            eventGuid
        } = this.props;
        if (
            this.isAttributeReadOnly("eventContainerID", eventContainerID) ||
            this.isAttributeReadOnly("eventGuid", eventGuid) ||
            this.isAttributeReadOnly("eventClientX", eventClientX) ||
            this.isAttributeReadOnly("eventClientY", eventClientY) ||
            this.isAttributeReadOnly("eventOffsetX", eventOffsetX) ||
            this.isAttributeReadOnly("eventOffsetY", eventOffsetY) ||
            this.isAttributeReadOnly("shiftKeyHeld", shiftKeyHeld) ||
            this.isAttributeReadOnly("ctrlKeyHeld", ctrlKeyHeld) ||
            this.isAttributeReadOnly("altKeyHeld", altKeyHeld) ||
            this.isAttributeReadOnly("isRightClickEvent", isRightClickEvent)
        ) {
            return;
        }
        if (returnOnClick) {
            const isRightClick = evt.button !== 0;
            // console.info("MendixReactDnD onClick on " + containerID + " offset X/Y: " + offsetX + "/" + offsetY);
            // console.dir(evt);
            // Only select marker if not right-click event
            if (isRightClick) {
                // Reset the selected IDs if user ctrl-clicks markers and then right-clicks another marker
                if (this.selectedIDs) {
                    if (this.selectedIDs.indexOf(item.id) === -1) {
                        this.selectedIDs = null;
                    }
                }
            } else {
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
            if (eventClientX) {
                eventClientX.setTextValue("" + Math.round(evt.clientX));
            }
            if (eventClientY) {
                eventClientY.setTextValue("" + Math.round(evt.clientY));
            }

            // Offset
            const { adjustOffset, zoomFactor } = this.widgetData;
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
            if (shiftKeyHeld) {
                shiftKeyHeld.setValue(evt.shiftKey);
            }
            if (ctrlKeyHeld) {
                ctrlKeyHeld.setValue(evt.ctrlKey);
            }
            if (altKeyHeld) {
                altKeyHeld.setValue(evt.altKey);
            }

            // Indicate whether this is a right click event. The button value is zero for normal click.
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
        if (
            this.isAttributeReadOnly("eventContainerID", eventContainerID) ||
            this.isAttributeReadOnly("eventGuid", eventGuid) ||
            this.isAttributeReadOnly("newRotation", newRotation)
        ) {
            return;
        }
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
        // Check whether event properties are writable. Common mistake to place the widget in a readonly dataview.
        // Entity access issues are also hard to spot as the property update is ignored without error.
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
