import { ContainerData } from "./ContainerData";
import { ContainerItemData } from "./ContainerItemData";

/**
 * Widget data
 * Contains all dynamically loaded data like the containers and expression properties
 * These can be really expensive to retrieve for each render
 * Note that datasource item widget content is NOT loaded here.
 * This would make the widget data more complex for React to determine changes
 */
export class WidgetData {
    DATA_NONE = "none";
    DATA_LOADING = "loading";
    DATA_COMPLETE = "complete";
    DATA_INCOMPLETE = "incomplete";

    _widgetProps = null;

    maxRowNumber = 0;
    maxColumnNumber = 0;

    zoomPercentage = 0;
    zoomFactor = 0;
    adjustOffset = false;
    snapToGrid = false;
    snapToSize = 0;
    snapToRotate = false;
    rotationDragDegrees = 0;
    rotationButtonDegrees = 0;
    addToCurrentRotation = false;
    selectedMarkerGuids = null;
    selectedMarkerBorderSize = 2;

    _dataStatus = this.DATA_NONE;

    _containerMap = new Map();
    _itemMap = new Map();
    _gridMap = new Map();
    _rowMap = new Map();
    _additionalMarkerClassMap = new Map();

    get dataStatus() {
        return this._dataStatus;
    }

    getContainerMapValue(key) {
        return this._containerMap.get(key);
    }

    getContainerMapValues() {
        return this._containerMap.values();
    }

    getItemMapValue(key) {
        return this._itemMap.get(key);
    }

    getItemMapValues() {
        return this._itemMap.values();
    }

    getGridMapValue(key) {
        return this._gridMap.get(key);
    }

    getGridMapValues() {
        return this._gridMap.values();
    }

    getRowMapValue(key) {
        return this._rowMap.get(key);
    }

    getRowMapValues() {
        return this._rowMap.values();
    }

    getAdditionalMarkerClassMapValue(key) {
        return this._additionalMarkerClassMap.get(key);
    }

    /**
     * Load the data in the properties
     * If the data is loaded successfully, the data status will be DATA_COMPLETE
     */
    loadData(widgetProps) {
        // console.info("MendixReactDnD.WidgetData.loadData: Start");

        this._dataStatus = this.DATA_LOADING;

        // Store properties at class level for easy access.
        this._widgetProps = widgetProps;

        this._checkTopLevelProps();
        if (this._dataStatus === this.DATA_INCOMPLETE) {
            // console.info("MendixReactDnD.WidgetData.loadData: Some dynamic properties are not yet available");
            return;
        }

        this._checkContainers();
        if (this._dataStatus === this.DATA_INCOMPLETE) {
            // console.info("MendixReactDnD.WidgetData.loadData: Some containers are not yet available");
            return;
        }

        this._loadTopLevelProps();

        if (this._dataStatus === this.DATA_LOADING) {
            this._loadContainerList();
        }

        if (this._dataStatus === this.DATA_LOADING) {
            this._dataStatus = this.DATA_COMPLETE;
        }

        // Clear class level reference to the passed props.
        this._widgetProps = null;

        // console.info("MendixReactDnD.WidgetData.loadData: Done, result: " + this._dataStatus);
    }

    _loadTopLevelProps() {
        this.adjustOffset = !!this._widgetProps.adjustOffset?.value;
        this.snapToGrid = !!this._widgetProps.snapToGrid?.value;
        this.snapToSize = this._getNumberValue(this._widgetProps.snapToSize);
        this.zoomPercentage = this._getNumberValue(this._widgetProps.zoomPercentage);
        if (this.zoomPercentage > 0) {
            this.zoomFactor = this.zoomPercentage / 100;
        } else {
            this.zoomFactor = 1;
        }
        if (this.zoomFactor !== 1 && this.snapToSize > 0) {
            this.snapToSize = Math.round(this.snapToSize * this.zoomFactor);
        }
        this.snapToRotate = !!this._widgetProps.snapToRotate?.value;
        this.rotationDragDegrees = this._getNumberValue(this._widgetProps.rotationDragDegrees);
        this.rotationButtonDegrees = this._getNumberValue(this._widgetProps.rotationDragDegrees);
        this.addToCurrentRotation = !!this._widgetProps.addToCurrentRotation?.value;
        this.selectedMarkerGuids = this._widgetProps.selectedMarkerGuids?.value;
        this.selectedMarkerBorderSize = this._getNumberValue(this._widgetProps.selectedMarkerBorderSize);

        const additionalMarkerClassData = this._widgetProps.additionalMarkerClassData?.value;
        this._additionalMarkerClassMap.clear();
        if (additionalMarkerClassData) {
            const additionalMarkerClassArray = JSON.parse(additionalMarkerClassData);
            for (const arrayItem of additionalMarkerClassArray) {
                this._additionalMarkerClassMap.set(arrayItem.itemID, arrayItem.classes);
            }
        }
    }

    _loadContainerList() {
        // Reset/clear the values;
        this.maxRowNumber = 0;
        this.maxColumnNumber = 0;
        this._containerMap.clear();
        this._itemMap.clear();
        this._gridMap.clear();
        this._rowMap.clear();

        // Sort the containers on row/column.
        const containerListSorted = this._sortContainers();

        // Build a map of container to use in the custom drag layer
        // Break when a container could not be loaded.
        for (const container of containerListSorted) {
            this._loadContainerData(container);
            if (this._dataStatus !== this.DATA_LOADING) {
                break;
            }
        }
    }

    _loadContainerData(container) {
        const containerData = new ContainerData();
        const containerID = container.containerID.value;
        containerData.containerID = containerID;
        containerData.rowNumber = Number(container.rowNumber.value);
        containerData.columnNumber = Number(container.columnNumber.value);
        if (containerData.rowNumber > this.maxRowNumber) {
            this.maxRowNumber = containerData.rowNumber;
        }
        if (containerData.columnNumber > this.maxColumnNumber) {
            this.maxColumnNumber = containerData.columnNumber;
        }
        containerData.dragDropType = container.dragDropType;
        containerData.allowSelection = container.allowSelection;
        containerData.returnOnClick = !!container.returnOnClick.value;
        containerData.acceptsContainerIDs = container.acceptsContainerIDs ? container.acceptsContainerIDs.value : null;
        this._containerMap.set(containerID, containerData);

        // Add container data to the grid map, which contains an array holding all containers at a row/column combination
        const gridMapKey = "r" + containerData.rowNumber + "c" + containerData.columnNumber;
        let gridMapItem = this._gridMap.get(gridMapKey);
        if (!gridMapItem) {
            gridMapItem = {
                containerArray: []
            };
        }
        gridMapItem.containerArray.push(containerData);
        this._gridMap.set(gridMapKey, gridMapItem);

        // Update the row map, which contains the max column value for each row
        const rowMapKey = "r" + containerData.rowNumber;
        let rowMapItem = this._rowMap.get(rowMapKey);
        if (!rowMapItem) {
            rowMapItem = {
                maxColumnNumber: 0
            };
        }
        if (containerData.columnNumber > rowMapItem.maxColumnNumber) {
            rowMapItem.maxColumnNumber = containerData.columnNumber;
        }
        this._rowMap.set(rowMapKey, rowMapItem);

        for (const datasourceItem of container.ds.items) {
            this._loadContainerItemData(datasourceItem, container, containerData);
            if (this._dataStatus !== this.DATA_LOADING) {
                break;
            }
        }
    }

    _loadContainerItemData(dsItem, container, containerData) {
        const containerItemData = new ContainerItemData();
        const mapKey = containerData.containerID + "_" + dsItem.id;
        containerData.itemMap.set(mapKey, containerItemData);
        this._itemMap.set(mapKey, containerItemData);

        containerItemData.id = dsItem.id;
        containerItemData.containerID = containerData.containerID;

        const dsDisableDrag = this._getDsItemPropertyValue(dsItem, container.dsDisableDrag);
        containerItemData.disableDrag = dsDisableDrag ? !!dsDisableDrag.value : false;

        const dsNameAttribute = this._getDsItemPropertyValue(dsItem, container.dsNameAttribute);
        containerItemData.nameAttributeValue = dsNameAttribute?.value;

        const dsMarkerClassAttribute = this._getDsItemPropertyValue(dsItem, container.dsMarkerClassAttribute);
        containerItemData.markerClass = dsMarkerClassAttribute?.value;

        const dsChildIDs = this._getDsItemPropertyValue(dsItem, container.dsChildIDs);
        containerItemData.childIDs = dsChildIDs?.value;

        // Not only get the offset data but also whether there is an offset expression at all.
        if (container.dsOffsetX && container.dsOffsetY) {
            containerItemData.hasOffset = true;
            const dsOffsetX = this._getDsItemPropertyValue(dsItem, container.dsOffsetX);
            containerItemData.offsetX = this._getNumberValue(dsOffsetX);

            const dsOffsetY = this._getDsItemPropertyValue(dsItem, container.dsOffsetY);
            containerItemData.offsetY = this._getNumberValue(dsOffsetY);
        }

        const dsImageUrl = this._getDsItemPropertyValue(dsItem, container.dsImageUrl);
        containerItemData.imageUrl = dsImageUrl?.value;

        const dsImageHeight = this._getDsItemPropertyValue(dsItem, container.dsImageHeight);
        containerItemData.imageHeight = this._getNumberValue(dsImageHeight);

        const dsImageWidth = this._getDsItemPropertyValue(dsItem, container.dsImageWidth);
        containerItemData.imageWidth = this._getNumberValue(dsImageWidth);

        const dsScaleImage = this._getDsItemPropertyValue(dsItem, container.dsScaleImage);
        containerItemData.scaleImage = dsScaleImage ? !!dsScaleImage.value : false;

        const dsAdjustOffsetOnDrop = this._getDsItemPropertyValue(dsItem, container.dsAdjustOffsetOnDrop);
        containerItemData.adjustOffsetOnDrop = dsAdjustOffsetOnDrop ? !!dsAdjustOffsetOnDrop.value : false;

        const dsImageRotation = this._getDsItemPropertyValue(dsItem, container.dsImageRotation);
        containerItemData.imageRotation = this._getNumberValue(dsImageRotation);

        const dsAllowRotate = this._getDsItemPropertyValue(dsItem, container.dsAllowRotate);
        containerItemData.allowRotate = dsAllowRotate ? !!dsAllowRotate.value : false;

        const dsShowGrid = this._getDsItemPropertyValue(dsItem, container.dsShowGrid);
        containerItemData.showGrid = dsShowGrid ? !!dsShowGrid.value : false;

        const dsGridSize = this._getDsItemPropertyValue(dsItem, container.dsGridSize);
        containerItemData.gridSize = this._getNumberValue(dsGridSize);
        if (containerItemData.gridSize < 5) {
            containerItemData.gridSize = 5;
        }

        containerData.containerClass = container.containerClass ? container.containerClass.value : null;
        containerItemData.draggableClass = container.draggableClass;
        containerItemData.draggingClass = container.draggingClass;
        containerItemData.dropTargetClass = container.dropTargetClass;
        containerItemData.canDropClass = container.canDropClass;
        containerItemData.invalidDropClass = container.invalidDropClass;
    }

    _getDsItemPropertyValue(dsItem, prop) {
        if (!prop) {
            return null;
        }
        const dynamicValue = prop(dsItem);
        if (dynamicValue.status !== "available") {
            this._dataStatus = this.DATA_INCOMPLETE;
            return null;
        }
        return dynamicValue;
    }

    _sortContainers() {
        // Create a shallow copy, we want to sort the containers on row/column but not mess with the array in props.
        const containerListSorted = this._widgetProps.containerList.slice();
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

    /**
     * Check whether all top level dynamic properties are available.
     * @returns boolean
     */
    _checkTopLevelProps() {
        this._checkPropAvailable(this._widgetProps.zoomPercentage);
        this._checkPropAvailable(this._widgetProps.adjustOffset);
        this._checkPropAvailable(this._widgetProps.snapToGrid);
        this._checkPropAvailable(this._widgetProps.snapToSize);
        this._checkPropAvailable(this._widgetProps.snapToRotate);
        this._checkPropAvailable(this._widgetProps.rotationDragDegrees);
        this._checkPropAvailable(this._widgetProps.rotationButtonDegrees);
        this._checkPropAvailable(this._widgetProps.addToCurrentRotation);
        this._checkPropAvailable(this._widgetProps.selectedMarkerGuids);
    }

    /**
     * Check whether all container datasources are available.
     * @returns boolean
     */
    _checkContainers() {
        const { containerList } = this._widgetProps;
        for (const container of containerList) {
            this._checkContainerProps(container);
            const { dsImageUrl, dsImageHeight, dsImageWidth } = container;
            this._checkPropAvailable(container.ds);
            this._checkPropAvailable(container.rowNumber);
            this._checkPropAvailable(container.columnNumber);
            // When rendering images, check whether required attributes are available
            if (dsImageUrl) {
                if (!dsImageHeight) {
                    console.warn("For images, property Image height is required");
                    this._dataStatus = this.DATA_INCOMPLETE;
                }
                if (!dsImageWidth) {
                    console.warn("For images, property Image width is required");
                    this._dataStatus = this.DATA_INCOMPLETE;
                }
            }
            if (this._dataStatus !== this.DATA_LOADING) {
                break;
            }
        }
    }

    /**
     * Check whether all top level dynamic properties are available.
     * @returns boolean
     */
    _checkContainerProps(container) {
        this._checkPropAvailable(container.containerID);
        this._checkPropAvailable(container.rowNumber);
        this._checkPropAvailable(container.columnNumber);
        this._checkPropAvailable(container.returnOnClick);
        this._checkPropAvailable(container.acceptsContainerIDs);
        this._checkPropAvailable(container.ds);
    }

    /**
     * Checks whether property is avaiable. Note that required properties will always have a value, Studio Pro will check that.
     * @param {*} prop The expression or attribute property to check.
     * @returns boolean
     */
    _checkPropAvailable(prop) {
        if (!prop) {
            return;
        }
        if (prop.status !== "available") {
            this._dataStatus = this.DATA_INCOMPLETE;
        }
    }

    _getNumberValue(prop) {
        return prop?.value ? Number(prop.value) : 0;
    }
}
