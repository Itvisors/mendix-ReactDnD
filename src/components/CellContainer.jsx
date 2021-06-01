import React, { Component, createElement } from "react";

export class CellContainer extends Component {
    constructor(props) {
        super(props);

        this.layoutRef = React.createRef();

        this.handleScroll = this.handleScroll.bind(this);
    }

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
                onScroll={this.handleScroll}
            >
                {this.props.children}
            </div>
        );
    }

    handleScroll() {
        if (this.layoutRef.current) {
            // console.info(
            //     "handleScroll T/L: " + this.layoutRef.current.scrollTop + "/" + this.layoutRef.current.scrollLeft
            // );
            const { onContainerScroll } = this.props;
            if (onContainerScroll) {
                onContainerScroll({
                    scrollTop: this.layoutRef.current.scrollTop,
                    scrollLeft: this.layoutRef.current.scrollLeft
                });
            }
        }
    }
}
