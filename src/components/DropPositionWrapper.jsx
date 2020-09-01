import React, { Component, createElement } from "react";
import { DropWrapper } from "./DropWrapper";

/** We need to get the current position of a drop target.
 *  For that we need a class component so it can have a ref to receive the current position.
 *  Function components cannot do that, while react-dnd relies on function components, so the drop is split in two components. */
export class DropPositionWrapper extends Component {
    constructor(props) {
        super(props);

        this.handleDrop = this.handleDrop.bind(this);
        this.itemDivRef = React.createRef();
    }

    render() {
        const { cellContainer, children } = this.props;
        return (
            <div ref={this.itemDivRef}>
                <DropWrapper cellContainer={cellContainer} onDrop={this.handleDrop}>
                    {children}
                </DropWrapper>
            </div>
        );
    }

    handleDrop(droppedItem, dropWrapperPositionData) {
        const { onDrop } = this.props;
        // Enhance the drop position with offset data.
        const rect = this.itemDivRef.current.getBoundingClientRect();
        const positionData = {
            dropClientX: dropWrapperPositionData.dropClientX,
            dropClientY: dropWrapperPositionData.dropClientY,
            dropOffsetX: Math.round(dropWrapperPositionData.dropClientX - rect.left),
            dropOffsetY: Math.round(dropWrapperPositionData.dropClientY - rect.top)
        };
        onDrop(droppedItem, positionData);
    }
}
