import { createElement } from "react";

export function CustomDragLayerDragToSelect({
    item,
    containerCellRectMap,
    containerCellScrollMap,
    initialClientOffset,
    clientOffset
}) {
    const mapKey = "r" + item.rowNumber + "c" + item.columnNumber;

    // Get the absolute offset of the container
    const containerRect = containerCellRectMap.get(mapKey);
    const containerLeft = containerRect ? containerRect.left : 0;
    const containerTop = containerRect ? containerRect.top : 0;

    // Get the current scroll position of the container
    const containerScrollInfo = containerCellScrollMap.get(mapKey);
    const containerScrollTop = containerScrollInfo ? containerScrollInfo.scrollTop : 0;
    const containerScrollLeft = containerScrollInfo ? containerScrollInfo.scrollLeft : 0;

    const minTop = containerTop - containerScrollTop;
    const minLeft = containerLeft - containerScrollLeft;
    const maxBottom = containerTop - containerScrollTop + item.itemHeight;
    const maxRight = containerLeft - containerScrollLeft + item.itemWidth;

    let divTop = Math.round(initialClientOffset.y < clientOffset.y ? initialClientOffset.y : clientOffset.y);
    let divLeft = Math.round(initialClientOffset.x < clientOffset.x ? initialClientOffset.x : clientOffset.x);
    let divBottom = Math.round(initialClientOffset.y > clientOffset.y ? initialClientOffset.y : clientOffset.y);
    let divRight = Math.round(initialClientOffset.x > clientOffset.x ? initialClientOffset.x : clientOffset.x);

    if (divTop < minTop) {
        divTop = minTop;
    }
    if (divLeft < minLeft) {
        divLeft = minLeft;
    }
    if (divBottom > maxBottom) {
        divBottom = maxBottom;
    }
    if (divRight > maxRight) {
        divRight = maxRight;
    }

    const width = divRight - divLeft;
    const height = divBottom - divTop;
    const dragToSelectStyle = { top: divTop + "px", left: divLeft + "px", width: width + "px", height: height + "px" };
    return (
        <div className="custom-draglayer">
            <div className="custom-draglayer-selection" style={dragToSelectStyle}></div>
        </div>
    );
}
