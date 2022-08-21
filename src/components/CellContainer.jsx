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
            // console.info("handleScroll T/L: " + layoutRef.current.scrollTop + "/" + layoutRef.current.scrollLeft);
            if (onContainerScroll) {
                onContainerScroll(cellKey, {
                    scrollTop: layoutRef.current.scrollTop,
                    scrollLeft: layoutRef.current.scrollLeft
                });
            }
        }
    }, [cellKey, layoutRef, onContainerScroll]);

    const { rowNumber, columnNumber, scrollToX, scrollToY, onScrollToHandled } = props;
    useLayoutEffect(() => {
        if (scrollToX && scrollToY) {
            if (layoutRef) {
                if (layoutRef.current) {
                    // console.info(
                    //     "CellContainer row " +
                    //         rowNumber +
                    //         ", col " +
                    //         columnNumber +
                    //         ": scroll to " +
                    //         scrollToX +
                    //         "/" +
                    //         scrollToY
                    // );
                    layoutRef.current.scrollTo(scrollToX, scrollToY);
                    if (onScrollToHandled) {
                        onScrollToHandled();
                    }
                    // } else {
                    //     console.info(
                    //         "CellContainer row " + rowNumber + ", col " + columnNumber + ": no layout ref current"
                    //     );
                }
                // } else {
                //     console.info("CellContainer row " + rowNumber + ", col " + columnNumber + ": no layout ref");
            }
        }
    }, [columnNumber, layoutRect, onScrollToHandled, rowNumber, scrollToX, scrollToY]);

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
