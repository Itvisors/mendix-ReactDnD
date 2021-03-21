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
