import { Component, createElement } from "react";
import { DatasourceItem } from "./components/DatasourceItem";
import { DragWrapper } from "./components/DragWrapper";
import { DropWrapper } from "./components/DropWrapper";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// eslint-disable-next-line sort-imports
import "./ui/MendixReactDnD.css";

export default class MendixReactDnD extends Component {
    render() {
        const { containerList } = this.props;
        if (!containerList) {
            // console.info("MendixReactDnD: No containers");
            return null;
        }
        let allContainersAvailable = true;
        for (let containerIndex = 0; containerIndex < containerList.length; containerIndex++) {
            const containerItem = containerList[containerIndex];
            if (
                !containerItem.ds ||
                containerItem.ds.status !== "available" ||
                !containerItem.rowNumber ||
                containerItem.rowNumber.status !== "available" ||
                !containerItem.columnNumber ||
                containerItem.columnNumber.status !== "available"
            ) {
                allContainersAvailable = false;
            }
        }
        if (!allContainersAvailable) {
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
            this.isAttributeReadOnly("dropTargetGuid", this.props.dropTargetGuid)
        ) {
            return null;
        }
        // console.info("MendixReactDnD: All containers are now available");
        const className = "widget-container " + this.props.class;
        return (
            <DndProvider backend={HTML5Backend}>
                <div className={className}>{this.renderGrid()}</div>
            </DndProvider>
        );
    }

    renderGrid() {
        // Sort the containers on row/column.
        const containerListSorted = this.sortContainers();

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
                <div className={className} data-containerid={containerID.value}>{ds.items.map(item => this.renderCellItem(cellContainer, item))}</div>
            );
        }
        return cellArray;
    }

    renderCellItem(cellContainer, item) {
        const { dragDropType } = cellContainer;
        switch (dragDropType) {
            case "drag":
                return (
                    <DragWrapper
                        key={item.id}
                        cellContainer={cellContainer}
                        item={item}
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
                        onDrop={(droppedItem, positionData) => this.handleDrop(droppedItem, positionData, cellContainer, item)}
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
                        onDrop={(droppedItem, positionData) => this.handleDrop(droppedItem, positionData, cellContainer, item)}
                    >
                        <DragWrapper
                            key={item.id}
                            cellContainer={cellContainer}
                            item={item}
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
        console.info("handleDrop: Dropped container ID: " + droppedItem.type + ", item ID: " + droppedItem.id + " on item ID: " + item.id);
        const { eventContainerID, eventGuid, eventClientX, eventClientY, eventOffsetX, eventOffsetY, dropTargetContainerID, dropTargetGuid, onDropAction } = this.props;
        const { containerID } = cellContainer;

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
        if (eventOffsetX) {
            eventOffsetX.setTextValue("" + positionData.dropOffsetX);
        }
        if (eventOffsetY) {
            eventOffsetY.setTextValue("" + positionData.dropOffsetY);
        }
        if (onDropAction && onDropAction.canExecute && !onDropAction.isExecuting) {
            onDropAction.execute();
        }

    }

    renderDatasourceItem(cellContainer, item) {
        return (
            <DatasourceItem
                key={item.id}
                cellContainer={cellContainer}
                item={item}
                onClick={(evt, offsetX, offsetY) => this.handleClick(cellContainer, item, evt, offsetX, offsetY)}
            />
        );
    }

    handleClick(container, item, evt, offsetX, offsetY) {
        const { containerID, returnOnClick } = container;
        const {
            eventContainerID,
            eventGuid,
            eventClientX,
            eventClientY,
            eventOffsetX,
            eventOffsetY,
            onClickAction
        } = this.props;
        if (returnOnClick && returnOnClick.value) {
            console.info("MendixReactDnD onClick on " + containerID.value + " offset X/Y: " + offsetX + "/" + offsetY);
            console.dir(evt);
            eventContainerID.setValue(containerID.value);
            eventGuid.setTextValue(item.id);
            if (eventClientX) {
                eventClientX.setTextValue("" + Math.round(evt.clientX));
            }
            if (eventClientY) {
                eventClientY.setTextValue("" + Math.round(evt.clientY));
            }
            if (eventOffsetX) {
                eventOffsetX.setTextValue("" + offsetX);
            }
            if (eventOffsetY) {
                eventOffsetY.setTextValue("" + offsetY);
            }
            if (onClickAction && onClickAction.canExecute && !onClickAction.isExecuting) {
                onClickAction.execute();
            }
        } else {
            console.info("MendixReactDnD Ignored onClick on " + containerID.value);
        }
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
