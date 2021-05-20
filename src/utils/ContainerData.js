/**
 * Data for one container
 */
export class ContainerData {
    containerID = null;
    rowNumber = 0;
    columnNumber = 0;
    dragDropType = null;
    allowSelection = null;
    returnOnClick = false;
    acceptsContainerIDs = null;

    _itemMap = new Map();

    get itemMap() {
        return this._itemMap;
    }

    getItemMapValues() {
        return this._itemMap.values();
    }

    getItemMapValue(key) {
        return this._itemMap.get(key);
    }
}
