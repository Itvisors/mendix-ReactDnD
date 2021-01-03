import { Component, createElement } from "react";
import { CustomDragLayer } from "./components/CustomDragLayer";
import { DatasourceItem } from "./components/DatasourceItem";
import { DndProvider } from "react-dnd";
import { DragWrapper } from "./components/DragWrapper";
import { DropPositionWrapper } from "./components/DropPositionWrapper";
import { GlobalDropWrapper } from "./components/GlobalDropWrapper";
import { HTML5Backend } from "react-dnd-html5-backend";

// eslint-disable-next-line sort-imports
import "./ui/MendixReactDnD.css";

export default class MendixReactDnD extends Component {
    constructor(props) {
        super(props);

        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleRotateHover = this.handleRotateHover.bind(this);
        this.handleRotateDrop = this.handleRotateDrop.bind(this);
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
        originalOffsetY: 0
    };

    // Convert from radials to degrees.
    R2D = 180 / Math.PI;

    containerMap = new Map();
    itemMap = new Map();

    render() {
        const { containerList } = this.props;
        if (!containerList) {
            // console.info("MendixReactDnD: No containers");
            return null;
        }
        if (!this.checkProperties()) {
            // console.info("MendixReactDnD: Some containers are not yet available");
            return null;
        }
        // Check whether event properties are writable. Common mistake to place the widget in a readonly dataview.
        if (
            this.isAttributeReadOnly("eventContainerID", this.props.eventContainerID) ||
            this.isAttributeReadOnly("eventClientX", this.props.eventClientX) ||
            this.isAttributeReadOnly("eventClientY", this.props.eventClientY) ||
            this.isAttributeReadOnly("eventOffsetX", this.props.eventOffsetX) ||
            this.isAttributeReadOnly("eventOffsetY", this.props.eventOffsetY) ||
            this.isAttributeReadOnly("eventGuid", this.props.eventGuid) ||
            this.isAttributeReadOnly("dropTargetContainerID", this.props.dropTargetContainerID) ||
            this.isAttributeReadOnly("dropTargetGuid", this.props.dropTargetGuid) ||
            this.isAttributeReadOnly("newRotation", this.props.newRotation)
        ) {
            return null;
        }
        // console.info("MendixReactDnD: All containers are now available");
        const className = "widget-container " + this.props.class;

        return (
            <DndProvider backend={HTML5Backend}>
                <div className={className}>
                    <GlobalDropWrapper
                        containerList={containerList}
                        onRotateHover={this.handleRotateHover}
                        onRotateDrop={this.handleRotateDrop}
                    >
                        {this.renderGrid()}
                    </GlobalDropWrapper>
                    <CustomDragLayer
                        containerMap={this.containerMap}
                        itemMap={this.itemMap}
                        zoomPercentage={this.props.zoomPercentage}
                    />
                </div>
            </DndProvider>
        );
    }

    handleRotateHover(draggedItem, positionData) {
        const rotationDegree = this.calculateRotationDegree(draggedItem, positionData);
        this.setState({
            rotationDegree: rotationDegree,
            originalRotation: draggedItem.originalRotation,
            rotateContainerID: draggedItem.originalType,
            rotateItemID: draggedItem.originalId
        });
    }

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
            eventGuid.setTextValue(droppedItem.originalId);
            if (onRotateAction && onRotateAction.canExecute && !onRotateAction.isExecuting) {
                onRotateAction.execute();
            }
        }
    }

    calculateRotationDegree(item, positionData) {
        const rotateX = positionData.dX + item.offsetX;
        const rotationDegree = Math.round(this.R2D * Math.atan2(positionData.dY, rotateX));
        return rotationDegree;
    }

    renderGrid() {
        // Clear the maps
        this.containerMap.clear();
        this.itemMap.clear();

        // Sort the containers on row/column.
        const containerListSorted = this.sortContainers();
        // Build a map of container to use in the custom drag layer
        for (const container of containerListSorted) {
            this.containerMap.set(container.containerID.value, container);
        }
        // Get the highest row number.
        const maxRowNumber = this.getMaxRowNumber(containerListSorted);

        // Render the rows
        const rowArray = [];
        for (let rowNumber = 1; rowNumber <= maxRowNumber; rowNumber++) {
            rowArray.push(this.renderRow(containerListSorted, rowNumber));
        }
        return rowArray;
    }

    renderRow(containerList, rowNumber) {
        // console.info("MendixReactDnD: Render row " + rowNumber);

        // Filter the full container list on the current row number.
        const rowContainers = containerList.filter(currentValue => Number(currentValue.rowNumber.value) === rowNumber);

        // Render one row.
        const className = "widget-row widget-row-" + rowNumber;
        return (
            <div className={className} data-rownumber={rowNumber}>
                {this.renderRowCells(rowContainers, rowNumber)}
            </div>
        );
    }

    renderRowCells(rowContainers, rowNumber) {
        // Get the highest column number in this row.
        const maxColumnNumber = this.getMaxColumnNumber(rowContainers);
        // console.info("MendixReactDnD: Render cells for row " + rowNumber + ", maxColumnNumber: " + maxColumnNumber);

        // Render the container(s) in each cell. Make sure that containers with the same column number end up in the same div.
        const cellArray = [];
        for (let columnNumber = 1; columnNumber <= maxColumnNumber; columnNumber++) {
            const className = "widget-cell widget-cell-r" + rowNumber + "-c" + columnNumber;
            cellArray.push(
                <div className={className} data-rownumber={rowNumber} data-columnnumber={columnNumber}>
                    {this.renderCell(rowContainers, columnNumber)}
                </div>
            );
        }
        return cellArray;
    }

    renderCell(rowContainers, columnNumber) {
        // console.info("MendixReactDnD: Render cells for column " + columnNumber);

        // Filter the row container list on the current column number.
        // The developer may place multiple containers in the same cell so there can be multiple.
        const cellContainers = rowContainers.filter(
            currentValue => Number(currentValue.columnNumber.value) === columnNumber
        );

        // Render each container.
        const cellArray = [];
        for (let containerIndex = 0; containerIndex < cellContainers.length; containerIndex++) {
            const cellContainer = cellContainers[containerIndex];
            const { containerID, ds, containerClass } = cellContainer;
            // console.info(
            //     "MendixReactDnD: Render cell for column " + columnNumber + ", container ID " + containerID.value
            // );
            const className =
                containerClass && containerClass.value
                    ? "widget-cell-content-container " + containerClass.value
                    : "widget-cell-content-container";
            cellArray.push(
                <div className={className} data-containerid={containerID.value}>
                    {ds.items.map(item => this.renderCellItem(cellContainer, item))}
                </div>
            );
        }
        return cellArray;
    }

    renderCellItem(cellContainer, item) {
        const { containerID, dragDropType } = cellContainer;
        const { zoomPercentage } = this.props;

        // Add the item to the map for use in the custom drag layer
        this.itemMap.set(containerID.value + "_" + item.id, item);

        // Render the item
        switch (dragDropType) {
            case "drag":
                return (
                    <DragWrapper
                        key={item.id}
                        cellContainer={cellContainer}
                        item={item}
                        dropPos={this.getPendingDropPos(cellContainer, item)}
                        onDragStart={this.handleDragStart}
                        zoomPercentage={zoomPercentage}
                    >
                        {this.renderDatasourceItem(cellContainer, item)}
                    </DragWrapper>
                );

            case "drop":
                return (
                    <DropPositionWrapper
                        key={item.id}
                        cellContainer={cellContainer}
                        onDrop={(droppedItem, positionData) =>
                            this.handleDrop(droppedItem, positionData, cellContainer, item)
                        }
                    >
                        {this.renderDatasourceItem(cellContainer, item)}
                    </DropPositionWrapper>
                );

            case "both":
                return (
                    <DropPositionWrapper
                        key={item.id}
                        cellContainer={cellContainer}
                        onDrop={(droppedItem, positionData) =>
                            this.handleDrop(droppedItem, positionData, cellContainer, item)
                        }
                    >
                        <DragWrapper
                            key={item.id}
                            cellContainer={cellContainer}
                            item={item}
                            dropPos={this.getPendingDropPos(cellContainer, item)}
                            onDragStart={this.handleDragStart}
                            zoomPercentage={zoomPercentage}
                        >
                            {this.renderDatasourceItem(cellContainer, item)}
                        </DragWrapper>
                    </DropPositionWrapper>
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
            adjustOffset,
            eventContainerID,
            eventGuid,
            eventClientX,
            eventClientY,
            eventOffsetX,
            eventOffsetY,
            dropTargetContainerID,
            dropTargetGuid,
            onDropAction,
            zoomPercentage
        } = this.props;
        const { containerID } = cellContainer;

        // When using offset positions, set drop data in state for rendering while datasource has not yet updated itself
        if (this.state.dropWithOffset) {
            // console.info("handleDrop: store drop data in state for position info");
            // Adjust offset values for zoom factor.
            const zoomFactor = this.calculateZoomFactor(zoomPercentage);
            this.setState({
                dropStatus: this.DROP_STATUS_DROPPED,
                dropClientX: Math.round(positionData.dropOffsetX / zoomFactor),
                dropClientY: Math.round(positionData.dropOffsetY / zoomFactor)
            });
        }

        eventContainerID.setValue(droppedItem.type);
        eventGuid.setTextValue(droppedItem.id);
        dropTargetContainerID.setValue(containerID.value);
        dropTargetGuid.setTextValue(item.id);
        if (eventClientX) {
            eventClientX.setTextValue("" + positionData.dropClientX);
        }
        if (eventClientY) {
            eventClientY.setTextValue("" + positionData.dropClientY);
        }
        let offsetX = positionData.dropOffsetX;
        let offsetY = positionData.dropOffsetY;
        if (adjustOffset && adjustOffset.value) {
            // Adjust offset values for zoom factor.
            const zoomFactor = this.calculateZoomFactor(zoomPercentage);
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
        if (onDropAction && onDropAction.canExecute && !onDropAction.isExecuting) {
            onDropAction.execute();
        }
    }

    handleDragStart({ containerID, itemID, itemOffsetX, itemOffsetY }) {
        // console.info("handleDragStart: " + containerID + " - " + itemID + ", offset: " + itemOffsetX + "/" + itemOffsetY);
        this.setState({
            dropStatus: this.DROP_STATUS_DRAGGING,
            dropContainerID: containerID,
            dropItemID: itemID,
            dropWithOffset: itemOffsetX !== undefined && itemOffsetY !== undefined,
            originalOffsetX: itemOffsetX,
            originalOffsetY: itemOffsetY
        });
    }

    getPendingDropPos(cellContainer, item) {
        const { dsOffsetX, dsOffsetY } = cellContainer;
        // If the datasource item has not yet been updated with the new position, use the state values to prevent briefly showing the item at the old position.
        let dropPos = null;
        if (this.state.dropStatus === this.DROP_STATUS_DROPPED && this.state.dropItemID === item.id) {
            // Only when dropping with an offset, as the offset is optional.
            if (this.state.dropWithOffset) {
                const offsetX = dsOffsetX ? Number(dsOffsetX(item).value) : 0;
                const offsetY = dsOffsetY ? Number(dsOffsetY(item).value) : 0;
                // As long as the datasource item has the old values
                if (this.state.originalOffsetX === offsetX && this.state.originalOffsetY === offsetY) {
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
            originalOffsetY: 0
        });
    }

    renderDatasourceItem(cellContainer, item) {
        const { zoomPercentage } = this.props;
        const { dsImageRotation } = cellContainer;

        let draggedRotationDegree = 0;
        // Use rotation degree if ID matches, rotateItemID is null if nothing is being rotated now.
        if (this.state.rotateItemID && this.state.rotateItemID === item.id) {
            const imageRotation = dsImageRotation ? dsImageRotation(item) : undefined;
            // If the datasource item still returns the original value, use the rotation degree from the rotation drag.
            // If the datasource item has been updated, clear the state values.
            if (Number(imageRotation.value) === this.state.originalRotation) {
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

        return (
            <DatasourceItem
                key={item.id}
                cellContainer={cellContainer}
                item={item}
                draggedRotationDegree={draggedRotationDegree}
                zoomPercentage={zoomPercentage}
                onClick={(evt, offsetX, offsetY) => this.handleClick(cellContainer, item, evt, offsetX, offsetY)}
            />
        );
    }

    handleClick(container, item, evt, offsetX, offsetY) {
        const { containerID, returnOnClick } = container;
        const {
            adjustOffset,
            eventContainerID,
            eventGuid,
            eventClientX,
            eventClientY,
            eventOffsetX,
            eventOffsetY,
            onClickAction,
            zoomPercentage
        } = this.props;
        if (returnOnClick && returnOnClick.value) {
            // console.info("MendixReactDnD onClick on " + containerID.value + " offset X/Y: " + offsetX + "/" + offsetY);
            // console.dir(evt);
            eventContainerID.setValue(containerID.value);
            eventGuid.setTextValue(item.id);
            if (eventClientX) {
                eventClientX.setTextValue("" + Math.round(evt.clientX));
            }
            if (eventClientY) {
                eventClientY.setTextValue("" + Math.round(evt.clientY));
            }
            if (adjustOffset && adjustOffset.value) {
                // Adjust offset values for zoom factor.
                const zoomFactor = this.calculateZoomFactor(zoomPercentage);
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
            if (onClickAction && onClickAction.canExecute && !onClickAction.isExecuting) {
                onClickAction.execute();
            }
        } else {
            // console.info("MendixReactDnD Ignored onClick on " + containerID.value);
        }
    }

    calculateZoomFactor(zoomPercentage) {
        if (!zoomPercentage || zoomPercentage.status !== "available" || !zoomPercentage.value) {
            return 1;
        }
        const zoomFactor = zoomPercentage.value / 100;
        return zoomFactor;
    }

    sortContainers() {
        // Create a shallow copy, we want to sort the containers on row/column but not mess with the array in props.
        const containerListSorted = this.props.containerList.slice();
        containerListSorted.sort((a, b) => {
            const rowA = Number(a.rowNumber.value);
            const rowB = Number(b.rowNumber.value);
            const columnA = Number(a.columnNumber.value);
            const columnB = Number(b.columnNumber.value);
            if (rowA < rowB) {
                return -1;
            }
            if (rowA === rowB) {
                return columnA - columnB;
            }
            return 1;
        });
        return containerListSorted;
    }

    getMaxRowNumber(containerList) {
        let maxRowNumber = 1;
        for (let containerIndex = 0; containerIndex < containerList.length; containerIndex++) {
            const containerItem = containerList[containerIndex];
            const rowNumber = Number(containerItem.rowNumber.value);
            if (rowNumber > maxRowNumber) {
                maxRowNumber = rowNumber;
            }
        }
        return maxRowNumber;
    }

    getMaxColumnNumber(containerList) {
        let maxColumnNumber = 1;
        for (let containerIndex = 0; containerIndex < containerList.length; containerIndex++) {
            const containerItem = containerList[containerIndex];
            const columnNumber = Number(containerItem.columnNumber.value);
            if (columnNumber > maxColumnNumber) {
                maxColumnNumber = columnNumber;
            }
        }
        return maxColumnNumber;
    }

    checkProperties() {
        const { containerList } = this.props;
        let result = true;
        for (let containerIndex = 0; containerIndex < containerList.length; containerIndex++) {
            const containerItem = containerList[containerIndex];
            const { ds, rowNumber, columnNumber, dsImageUrl, dsImageHeight, dsImageWidth } = containerItem;
            if (
                !ds ||
                ds.status !== "available" ||
                !rowNumber ||
                rowNumber.status !== "available" ||
                !columnNumber ||
                columnNumber.status !== "available"
            ) {
                result = false;
            }
            // When rendering images, check whether required attributes are available
            if (dsImageUrl) {
                if (!dsImageHeight) {
                    console.warn("For images, property Image height is required");
                    result = false;
                }
                if (!dsImageWidth) {
                    console.warn("For images, property Image width is required");
                    result = false;
                }
            }
        }
        return result;
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
