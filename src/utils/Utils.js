/**
 * Calculate the zoom factor
 *
 * @param {*} zoomPercentage    The zoomPercentage value
 * @param {boolean} scaleImage  Scale image?
 * @returns {number}            The zoom factor
 */
export const calculateZoomFactor = (zoomPercentage, scaleImage) => {
    if (!scaleImage) {
        return 1;
    }
    const zoomFactor = zoomPercentage / 100;
    return zoomFactor;
};

/**
 * Snap offset to grid zize
 * @param {number} offset       The offset value
 * @param {number} gridSize     The grid size value
 * @returns {number}            The new offset value
 */
export const snapOffsetToGrid = (offset, gridSize) => {
    const mod = offset % gridSize;
    if (mod === 0) {
        return offset;
    }
    const halfWay = gridSize / 2;
    if (mod < halfWay) {
        return offset - mod;
    } else {
        return offset - mod + gridSize;
    }
};

/**
 * Snap rotation to supplied rotation step value
 * @param {number} rotationDegree       Rotation degree value
 * @param {number} rotationDragDegrees  The value to add with each step while dragging
 * @returns {number}                    New rotation degree value
 */
export const snapToRotation = (rotationDegree, rotationDragDegrees) => {
    const mod = rotationDegree % rotationDragDegrees;
    if (mod === 0) {
        return rotationDegree;
    }
    const halfWay = rotationDragDegrees / 2;
    if (mod < halfWay) {
        return rotationDegree - mod;
    } else {
        return rotationDegree - mod + rotationDragDegrees;
    }
};
