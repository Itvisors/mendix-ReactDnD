/**
 * Calculate the zoom factor
 *
 * @param {*} zoomPercentage    The zoomPercentage expression property
 * @param {boolean} scaleImage  Scale image?
 * @returns {number}            The zoom factor
 */
export const calculateZoomFactor = (zoomPercentage, scaleImage) => {
    if (!scaleImage) {
        return 1;
    }
    if (!zoomPercentage || zoomPercentage.status !== "available" || !zoomPercentage.value) {
        return 1;
    }
    const zoomFactor = zoomPercentage.value / 100;
    return zoomFactor;
};

/**
 * Calculate the snap to size value, taking zoom percentage into account
 *
 * @param {*} snapToSize        The snap to size expression property
 * @param {*} zoomPercentage    The zoomPercentage expression property
 * @returns {number}            The snap to size to use
 */
export const calculateSnapToSize = (snapToSize, zoomPercentage) => {
    let snapToSizeValue = snapToSize?.value ? Number(snapToSize.value) : 1;

    const zoomFactor = calculateZoomFactor(zoomPercentage, true);
    if (zoomPercentage !== 1) {
        snapToSizeValue = Math.round(snapToSizeValue * zoomFactor);
    }

    return snapToSizeValue;
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
