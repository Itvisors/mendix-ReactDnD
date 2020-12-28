/*global mx */
import { RotationHandle } from "./RotationHandle";
import { createElement } from "react";

export function DatasourceItemImage({ cellContainer, item, zoomPercentage }) {
    const { dsImageUrl, dsImageHeight, dsImageWidth, dsScaleImage, dsImageRotation, dsAllowRotate } = cellContainer;

    if (!dsImageUrl || !dsImageHeight || !dsImageWidth) {
        return null;
    }

    const imageUrl = dsImageUrl(item);
    const imageHeight = dsImageHeight(item);
    const imageWidth = dsImageWidth(item);
    // Image rotation and zoom percentage are optional!
    const scaleImage = dsScaleImage ? dsScaleImage(item).value : false;
    const imageRotation = dsImageRotation ? dsImageRotation(item) : undefined;
    const allowRotate = dsAllowRotate ? dsAllowRotate(item).value : false;
    if (
        imageUrl.status !== "available" ||
        imageHeight.status !== "available" ||
        imageWidth.status !== "available" ||
        (imageRotation && imageRotation.status !== "available")
    ) {
        return null;
    }
    const zoomFactor = calculateZoomFactor(zoomPercentage, scaleImage);
    const imageRotationValue = getImageRotation(imageRotation);
    if (allowRotate) {
        return (
            <div className="item-image-rotation-container">
                {renderImage(imageUrl, imageHeight, imageWidth, imageRotationValue, zoomFactor)}
                <RotationHandle cellContainer={cellContainer} item={item} />
            </div>
        );
    } else {
        return renderImage(imageUrl, imageHeight, imageWidth, imageRotationValue, zoomFactor);
    }
}

function renderImage(imageUrl, imageHeight, imageWidth, imageRotationValue, zoomFactor) {
    const style = {
        width: Math.round(Number(imageWidth.value) * zoomFactor),
        height: Math.round(Number(imageHeight.value) * zoomFactor)
    };
    if (imageRotationValue !== 0) {
        style.transform = "rotate(" + imageRotationValue + "deg)";
    }
    const uri = getUri(imageUrl);
    return <img className="item-image" src={uri} style={style} />;
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

function getImageRotation(imageRotation) {
    if (!imageRotation?.value) {
        return 0;
    }
    return Number(imageRotation.value);
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
