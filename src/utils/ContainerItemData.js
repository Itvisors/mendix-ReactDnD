/**
 * Container item data
 * No behaviour, just store data.
 */
export class ContainerItemData {
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

    // Styling
    containerClass = null;
    draggableClass = null;
    draggingClass = null;
    dropTargetClass = null;
    canDropClass = null;
    invalidDropClass = null;
}
