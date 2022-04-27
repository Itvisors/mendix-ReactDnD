import { createElement, useCallback, useLayoutEffect, useRef, useState } from "react";

export function CellContainer(props) {
    const [layoutRect, setLayoutRect] = useState(null);

    const layoutRef = useRef(null);

    const { cellKey, onBoundingClientRectUpdate, onContainerScroll } = props;

    useLayoutEffect(() => {
        if (layoutRef.current) {
            const newRect = layoutRef.current.getBoundingClientRect();
            if (
                !layoutRect ||
                newRect.top !== layoutRect.top ||
                newRect.left !== layoutRect.left ||
                newRect.width !== layoutRect.width ||
                newRect.height !== layoutRect.height
            ) {
                setLayoutRect(newRect);
                onBoundingClientRectUpdate(cellKey, newRect);
            }
        }
    }, [cellKey, layoutRect, onBoundingClientRectUpdate]);

    const handleScroll = useCallback(() => {
        if (layoutRef.current) {
            // console.info(
            //     "handleScroll T/L: " + this.layoutRef.current.scrollTop + "/" + this.layoutRef.current.scrollLeft
            // );
            if (onContainerScroll) {
                onContainerScroll(cellKey, {
                    scrollTop: layoutRef.current.scrollTop,
                    scrollLeft: layoutRef.current.scrollLeft
                });
            }
        }
    }, [cellKey, layoutRef, onContainerScroll]);

    const { rowNumber, columnNumber } = props;
    const className = "widget-cell widget-cell-r" + rowNumber + "-c" + columnNumber;

    return (
        <div
            ref={layoutRef}
            className={className}
            data-rownumber={rowNumber}
            data-columnnumber={columnNumber}
            onScroll={handleScroll}
        >
            {props.children}
        </div>
    );
}
