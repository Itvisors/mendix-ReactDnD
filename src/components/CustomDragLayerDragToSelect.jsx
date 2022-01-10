import { createElement } from "react";

export function CustomDragLayerDragToSelect({
    widgetData,
    containerCellRectMap,
    containerCellScrollMap,
    initialClientOffset,
    clientOffset
}) {
    const top = Math.round(initialClientOffset.y < clientOffset.y ? initialClientOffset.y : clientOffset.y);
    const left = Math.round(initialClientOffset.x < clientOffset.x ? initialClientOffset.x : clientOffset.x);
    const bottom = Math.round(initialClientOffset.y > clientOffset.y ? initialClientOffset.y : clientOffset.y);
    const right = Math.round(initialClientOffset.x > clientOffset.x ? initialClientOffset.x : clientOffset.x);
    const width = right - left;
    const height = bottom - top;
    const dragToSelectStyle = { top: top + "px", left: left + "px", width: width + "px", height: height + "px" };
    return (
        <div className="custom-draglayer">
            <div className="custom-draglayer-selection" style={dragToSelectStyle}></div>
        </div>
    );
}
