import { createElement } from "react";

export function Grid({ gridSize, gridWidth, gridHeight }) {
    const largeSize = gridSize * 10;
    const smallPath = "M " + gridSize + " 0 L 0 0 0 " + gridSize + "";
    const largePath = "M " + largeSize + " 0 L 0 0 0 " + largeSize + "";
    return (
        <div style={{ width: gridWidth, height: gridHeight }} className="grid-container">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="smallGrid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                        <path d={smallPath} fill="none" stroke="gray" strokeWidth="0.5" />
                    </pattern>
                    <pattern id="grid" width={largeSize} height={largeSize} patternUnits="userSpaceOnUse">
                        <rect width={largeSize} height={largeSize} fill="url(#smallGrid)" />
                        <path d={largePath} fill="none" stroke="gray" strokeWidth="1" />
                    </pattern>
                </defs>

                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
        </div>
    );
}
