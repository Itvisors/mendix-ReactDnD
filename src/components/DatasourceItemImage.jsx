/*global mx */
import { Grid } from "./Grid";
import { RotationHandle } from "./RotationHandle";
import { createElement } from "react";

export function DatasourceItemImage({ cellContainer, item, draggedRotationDegree, zoomPercentage }) {
    const {
        dsImageUrl,
        dsImageHeight,
        dsImageWidth,
        dsScaleImage,
        dsImageRotation,
        dsAllowRotate,
        dsShowGrid,
        dsGridSize
    } = cellContainer;

    if (!dsImageUrl || !dsImageHeight || !dsImageWidth) {
        return null;
    }

    const imageUrl = dsImageUrl(item);
    const imageHeight = dsImageHeight(item);
    const imageWidth = dsImageWidth(item);
    // Values below are optional!
    const scaleImage = dsScaleImage ? dsScaleImage(item).value : false;
    const imageRotation = dsImageRotation ? dsImageRotation(item) : undefined;
    const allowRotate = dsAllowRotate ? dsAllowRotate(item).value : false;
    const showGrid = dsShowGrid ? dsShowGrid(item).value : false;
    if (
        imageUrl.status !== "available" ||
        imageHeight.status !== "available" ||
        imageWidth.status !== "available" ||
        (imageRotation && imageRotation.status !== "available")
    ) {
        return null;
    }
    const zoomFactor = calculateZoomFactor(zoomPercentage, scaleImage);
    const imageWidthValue = Math.round(Number(imageWidth.value) * zoomFactor);
    const imageHeightValue = Math.round(Number(imageHeight.value) * zoomFactor);
    const imageRotationValue = getImageRotation(draggedRotationDegree, imageRotation);
    // Image is rotated around the center. Rotation handle is on the right. Pass half the image width as offset to the rotation handle.
    const rotationHandleOffsetX = Math.round(imageWidth.value / 2);
    if (allowRotate) {
        const style = {};
        if (imageRotationValue !== 0) {
            style.transform = "rotate(" + imageRotationValue + "deg)";
        }
        return (
            <div className="item-image-rotation-container" style={style}>
                {renderImage(imageUrl, imageHeightValue, imageWidthValue)}
                <RotationHandle
                    cellContainer={cellContainer}
                    offsetX={rotationHandleOffsetX}
                    imageRotation={Number(imageRotation.value)}
                    item={item}
                />
            </div>
        );
    } else if (showGrid) {
        const gridSize = dsGridSize ? dsGridSize(item) : undefined;
        const gridSizeValue = gridSize?.value ? Number(gridSize.value) : 5;
        return (
            <div style={{ width: imageWidthValue, height: imageHeightValue }}>
                {renderImage(imageUrl, imageHeightValue, imageWidthValue)}
                <Grid gridSize={gridSizeValue} gridWidth={imageWidthValue} gridHeight={imageHeightValue} />
            </div>
        );
    } else {
        return renderImage(imageUrl, imageHeightValue, imageWidthValue);
    }
}

function renderImage(imageUrl, imageHeightValue, imageWidthValue) {
    const uri = getUri(imageUrl);
    return <img className="item-image" src={uri} style={{ width: imageWidthValue, height: imageHeightValue }} />;
}

function calculateZoomFactor(zoomPercentage, scaleImage) {
    if (!scaleImage) {
        return 1;
    }
    if (!zoomPercentage || zoomPercentage.status !== "available" || !zoomPercentage.value) {
        return 1;
    }
    const zoomFactor = zoomPercentage.value / 100;
    return zoomFactor;
}

function getImageRotation(draggedRotationDegree, imageRotation) {
    if (!imageRotation?.value) {
        return 0;
    }
    return Number(imageRotation.value) + draggedRotationDegree;
}

function getUri(imageUrl) {
    if (!imageUrl?.value) {
        return null;
    }
    // Full URL?
    if (imageUrl.value.indexOf("http") === 0) {
        return imageUrl.value;
    }
    return mx.remoteUrl + imageUrl.value;
}
