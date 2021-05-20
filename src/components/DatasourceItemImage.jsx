/*global mx */
import { Grid } from "./Grid";
import { RotationHandle } from "./RotationHandle";
import { calculateZoomFactor } from "../utils/Utils";
import { createElement } from "react";

export function DatasourceItemImage({
    item,
    draggedRotationDegree,
    zoomPercentage,
    isSelected,
    selectedMarkerBorderSize,
    onRotateClick
}) {
    const { imageUrl, imageWidth, imageHeight, imageRotation } = item;

    if (!imageUrl) {
        return null;
    }
    const zoomFactor = calculateZoomFactor(zoomPercentage, item.scaleImage);
    const imageWidthValue = Math.round(imageWidth * zoomFactor);
    const imageHeightValue = Math.round(imageHeight * zoomFactor);
    const imageRotationValue = imageRotation + draggedRotationDegree;

    // Image is rotated around the center. Rotation handle is on the right. Pass half the image width as offset to the rotation handle.
    const rotationHandleOffsetX = Math.round(imageWidth / 2);
    if (item.allowRotate) {
        return (
            <div className="item-image-rotation-container">
                {renderImage(
                    imageUrl,
                    imageHeightValue,
                    imageWidthValue,
                    imageRotationValue,
                    isSelected,
                    selectedMarkerBorderSize
                )}
                <div className="item-image-rotation-controls-container">
                    <div className="item-image-rotate-back" onClick={() => handleRotateClick(false, onRotateClick)} />
                    <RotationHandle offsetX={rotationHandleOffsetX} imageRotation={imageRotation} itemData={item} />
                    <div className="item-image-rotate-forward" onClick={() => handleRotateClick(true, onRotateClick)} />
                </div>
            </div>
        );
    } else if (item.showGrid) {
        return (
            <div style={{ width: imageWidthValue, height: imageHeightValue }}>
                {renderImage(
                    imageUrl,
                    imageHeightValue,
                    imageWidthValue,
                    imageRotationValue,
                    isSelected,
                    selectedMarkerBorderSize
                )}
                <Grid gridSize={item.gridSize} gridWidth={imageWidthValue} gridHeight={imageHeightValue} />
            </div>
        );
    } else {
        return renderImage(
            imageUrl,
            imageHeightValue,
            imageWidthValue,
            imageRotationValue,
            isSelected,
            selectedMarkerBorderSize
        );
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
    // Dimensions of the container will be the same as the image, unless it is selected, then add the border size twice. (Top/bottom or left/right)
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
    if (isSelected) {
        imageContainerStyle.margin = "-" + selectedMarkerBorderSize + "px";
        imageContainerStyle["border-width"] = selectedMarkerBorderSize + "px";
        imageContainerStyle["border-radius"] = selectedMarkerBorderSize + "px";
    }

    return (
        <div className="item-image-container" style={imageContainerStyle}>
            <img className="item-image" src={uri} style={imageStyle} />
        </div>
    );
}

function getUri(imageUrl) {
    if (!imageUrl) {
        return null;
    }
    // Full URL?
    if (imageUrl.indexOf("http") === 0) {
        return imageUrl;
    }
    return mx.remoteUrl + imageUrl;
}
