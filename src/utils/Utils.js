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
