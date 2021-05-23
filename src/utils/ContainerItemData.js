/**
 * Container item data
 * No behaviour, just store data.
 */
export class ContainerItemData {
    /*

    !!! IMPORTANT !!!

    Be sure to add any relevant new properties to the shouldRender function.
    Anything that should trigger a new render should be checked in shouldRender.

    */

    // Common
    containerID = null;
    id = null;
    disableDrag = false;
    nameAttributeValue = null;
    markerClass = null;
    childIDs = null;

    // Image item
    hasOffset = false;
    offsetX = 0;
    offsetY = 0;
    imageUrl = null;
    imageHeight = 0;
    imageWidth = 0;
    scaleImage = false;
    adjustOffsetOnDrop = false;
    imageRotation = 0;
    allowRotate = false;
    showGrid = false;
    gridSize = 5;

    // Styling, expression
    containerClass = null;
    // Static properties
    draggableClass = null;
    draggingClass = null;
    dropTargetClass = null;
    canDropClass = null;
    invalidDropClass = null;

    /**
     * Whether the two items have differences that relevent for shouldComponentUpdate
     * Deliberately not called shouldComponentUpdate as this is not a component
     *
     * @param {ContainerItemData} otherItem The item to compare with
     * @returns boolean
     */
    shouldRender(otherItem) {
        return (
            otherItem.containerID !== this.containerID ||
            otherItem.id !== this.id ||
            otherItem.disableDrag !== this.disableDrag ||
            otherItem.nameAttributeValue !== this.nameAttributeValue ||
            otherItem.markerClass !== this.markerClass ||
            otherItem.childIDs !== this.childIDs ||
            otherItem.hasOffset !== this.hasOffset ||
            otherItem.offsetX !== this.offsetX ||
            otherItem.offsetY !== this.offsetY ||
            otherItem.imageUrl !== this.imageUrl ||
            otherItem.imageHeight !== this.imageHeight ||
            otherItem.imageWidth !== this.imageWidth ||
            otherItem.scaleImage !== this.scaleImage ||
            otherItem.adjustOffsetOnDrop !== this.adjustOffsetOnDrop ||
            otherItem.imageRotation !== this.imageRotation ||
            otherItem.allowRotate !== this.allowRotate ||
            otherItem.showGrid !== this.showGrid ||
            otherItem.gridSize !== this.gridSize ||
            otherItem.containerClass !== this.containerClass
        );
    }
}
