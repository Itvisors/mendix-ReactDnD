/*global mx */
import { Grid } from "./Grid";
import { RotationHandle } from "./RotationHandle";
import { calculateZoomFactor } from "../utils/Utils";
import { createElement } from "react";

export function DatasourceItemImage({
    cellContainer,
    item,
    draggedRotationDegree,
    zoomPercentage,
    isSelected,
    selectedMarkerBorderSize,
    onRotateClick
}) {
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
    let imageWidthValue = Math.round(Number(imageWidth.value) * zoomFactor);
    let imageHeightValue = Math.round(Number(imageHeight.value) * zoomFactor);
    if (isSelected) {
        imageWidthValue += selectedMarkerBorderSize * 2;
        imageHeightValue += selectedMarkerBorderSize * 2;
    }
    const imageRotationValue = getImageRotation(draggedRotationDegree, imageRotation);
    // Image is rotated around the center. Rotation handle is on the right. Pass half the image width as offset to the rotation handle.
    const rotationHandleOffsetX = Math.round(imageWidth.value / 2);
    if (allowRotate) {
        return (
            <div className="item-image-rotation-container">
                {renderImage(imageUrl, imageHeightValue, imageWidthValue, imageRotationValue)}
                <div className="item-image-rotation-controls-container">
                    <div className="item-image-rotate-back" onClick={() => handleRotateClick(false, onRotateClick)} />
                    <RotationHandle
                        cellContainer={cellContainer}
                        offsetX={rotationHandleOffsetX}
                        imageRotation={Number(imageRotation.value)}
                        item={item}
                    />
                    <div className="item-image-rotate-forward" onClick={() => handleRotateClick(true, onRotateClick)} />
                </div>
            </div>
        );
    } else if (showGrid) {
        const gridSize = dsGridSize ? dsGridSize(item) : undefined;
        const gridSizeValue = gridSize?.value ? Number(gridSize.value) : 5;
        return (
            <div style={{ width: imageWidthValue, height: imageHeightValue }}>
                {renderImage(imageUrl, imageHeightValue, imageWidthValue, imageRotationValue)}
                <Grid gridSize={gridSizeValue} gridWidth={imageWidthValue} gridHeight={imageHeightValue} />
            </div>
        );
    } else {
        return renderImage(imageUrl, imageHeightValue, imageWidthValue, imageRotationValue);
    }
}

function handleRotateClick(rotatedForward, onRotateClick) {
    // console.info("handleRotateClick: " + rotatedForward);
    if (onRotateClick) {
        onRotateClick(rotatedForward);
    }
}

function renderImage(imageUrl, imageHeight, imageWidth, imageRotation, isSelected, selectedMarkerBorderSize) {
    const uri = getUri(imageUrl);
    const imageStyle = {
        width: imageWidth,
        height: imageHeight
    };
    // Dimensions of the container will be the same as the image, unless it is selected, then add the border size twice. (Top/left or left/right)
    const containerWidth = isSelected ? imageWidth + selectedMarkerBorderSize * 2 : imageWidth;
    const containerHeight = isSelected ? imageHeight + selectedMarkerBorderSize * 2 : imageHeight;
    const imageContainerStyle = {
        width: containerWidth,
        height: containerHeight
    };
    if (imageRotation !== 0) {
        imageContainerStyle.transform = "rotate(" + imageRotation + "deg)";
        // Set transform origin to the center of the image for proper rotation.
        const transformOriginX = Math.round(containerWidth / 2);
        const transformOriginY = Math.round(containerHeight / 2);
        imageContainerStyle.transformOrigin = transformOriginX + "px " + transformOriginY + "px";
    }

    return (
        <div className="item-image-container" style={imageContainerStyle}>
            <img className="item-image" src={uri} style={imageStyle} />
        </div>
    );
}

function getImageRotation(draggedRotationDegree, imageRotation) {
    // Just return null if image has no rotation attribute property set.
    if (!imageRotation?.value) {
        return 0;
    }
    // Return the actual database value plus the current rotation drag value.
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
