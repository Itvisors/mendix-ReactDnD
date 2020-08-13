import { DatasourceItem } from "./DatasourceItem";
import { createElement } from "react";
import { useDrag } from "react-dnd";

export function DragDropWrapper(props) {
    const { item, cellContainer } = props;
    const { containerID } = cellContainer;

    const [{ isDragging }, itemRef] = useDrag({
        item: { type: containerID.value },
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    });

    return (
        <div
            ref={itemRef}
            style={{
                opacity: isDragging ? 0.5 : 1
            }}
        >
            <DatasourceItem
                cellContainer={cellContainer}
                item={item}
                onClick={(evt, offsetX, offsetY) => props.onClick(evt, offsetX, offsetY)}
            />
        </div>
    );
}
