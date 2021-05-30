import React, { Component, createElement } from "react";

export class CellContainer extends Component {
    layoutRef = React.createRef();

    // Keep track of container absolute position and size for use in the custom drag layer.
    currentRect = null;

    componentDidMount() {
        const { onBoundingClientRectUpdate } = this.props;
        if (onBoundingClientRectUpdate && this.layoutRef.current) {
            this.rect = this.layoutRef.current.getBoundingClientRect();
            onBoundingClientRectUpdate(this.rect);
        }
    }

    componentDidUpdate() {
        const { onBoundingClientRectUpdate } = this.props;
        if (onBoundingClientRectUpdate && this.layoutRef.current) {
            const newRect = this.layoutRef.current.getBoundingClientRect();
            if (
                newRect.top !== this.rect.top ||
                newRect.left !== this.rect.left ||
                newRect.width !== this.rect.width ||
                newRect.height !== this.rect.height
            ) {
                this.rect = newRect;
                onBoundingClientRectUpdate(this.rect);
            }
        }
    }

    render() {
        const { rowNumber, columnNumber } = this.props;
        const className = "widget-cell widget-cell-r" + rowNumber + "-c" + columnNumber;

        return (
            <div
                ref={this.layoutRef}
                className={className}
                data-rownumber={rowNumber}
                data-columnnumber={columnNumber}
                onScroll={evt => {
                    const { onContainerScroll } = this.props;
                    if (onContainerScroll) {
                        onContainerScroll(evt);
                    }
                }}
            >
                {this.props.children}
            </div>
        );
    }
    // export function CellContainer({ rowNumber, columnNumber, onBoundingClientRectUpdate, children }) {

    // useEffect(() => {
    //     if (layoutRef.current) {
    //         const rect = layoutRef.current.getBoundingClientRect();
    //         if (onBoundingClientRectUpdate) {
    //             onBoundingClientRectUpdate(rect);
    //         }
    //     }
    // });
}
