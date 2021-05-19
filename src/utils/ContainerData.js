/**
 * Data for one container
 */
export class ContainerData {
    containerID = null;
    rowNumber = 0;
    columnNumber = 0;
    dragDropType = null;
    allowSelection = false;
    returnOnClick = false;
    acceptsContainerIDs = null;

    _itemMap = new Map();

    get itemMap() {
        return this._itemMap;
    }
}
