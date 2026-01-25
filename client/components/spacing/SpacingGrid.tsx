import { FC } from 'react';

interface SpacingGridProps {
    rowSpacing: number;
    plantSpacing: number;
    size?: number;
}

export const SpacingGrid: FC<SpacingGridProps> = ({
    rowSpacing,
    plantSpacing,
    size = 200
}) => {
    // Calculate how many rows and plants to show
    const gridSize = size;
    const maxRows = Math.min(Math.floor(gridSize / (rowSpacing * 0.8)), 8);
    const maxPlants = Math.min(Math.floor(gridSize / (plantSpacing * 0.8)), 8);

    // Scale factors
    const scaleX = gridSize / (maxPlants * plantSpacing);
    const scaleY = gridSize / (maxRows * rowSpacing);

    return (
        <div className="flex flex-col items-center gap-4">
            <svg
                width={gridSize}
                height={gridSize}
                className="border border-muted rounded-lg bg-white dark:bg-gray-900"
                viewBox={`0 0 ${gridSize} ${gridSize}`}
            >
                {/* Grid background */}
                <rect
                    width={gridSize}
                    height={gridSize}
                    fill="url(#grid-pattern)"
                    opacity="0.1"
                />

                {/* Define grid pattern */}
                <defs>
                    <pattern
                        id="grid-pattern"
                        width={plantSpacing * scaleX}
                        height={rowSpacing * scaleY}
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d={`M ${plantSpacing * scaleX} 0 L 0 0 0 ${rowSpacing * scaleY}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.5"
                            opacity="0.3"
                        />
                    </pattern>
                </defs>

                {/* Draw plants */}
                {Array.from({ length: maxRows }).map((_, rowIndex) =>
                    Array.from({ length: maxPlants }).map((_, plantIndex) => {
                        const x = (plantIndex + 0.5) * plantSpacing * scaleX;
                        const y = (rowIndex + 0.5) * rowSpacing * scaleY;

                        return (
                            <g key={`${rowIndex}-${plantIndex}`}>
                                {/* Plant circle */}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={Math.min(plantSpacing * scaleX, rowSpacing * scaleY) * 0.3}
                                    fill="#22c55e"
                                    opacity="0.7"
                                    className="transition-all duration-300"
                                />
                                {/* Plant stem */}
                                <line
                                    x1={x}
                                    y1={y}
                                    x2={x}
                                    y2={y - Math.min(plantSpacing * scaleX, rowSpacing * scaleY) * 0.2}
                                    stroke="#16a34a"
                                    strokeWidth="2"
                                    opacity="0.8"
                                />
                            </g>
                        );
                    })
                )}

                {/* Row spacing measurement */}
                {maxRows > 1 && (
                    <g>
                        <line
                            x1={gridSize - 30}
                            y1={rowSpacing * scaleY * 0.5}
                            x2={gridSize - 30}
                            y2={rowSpacing * scaleY * 1.5}
                            stroke="#f97316"
                            strokeWidth="2"
                            markerStart="url(#arrow-start)"
                            markerEnd="url(#arrow-end)"
                        />
                        <text
                            x={gridSize - 25}
                            y={rowSpacing * scaleY}
                            fill="#f97316"
                            fontSize="12"
                            fontWeight="bold"
                        >
                            {rowSpacing}cm
                        </text>
                    </g>
                )}

                {/* Plant spacing measurement */}
                {maxPlants > 1 && (
                    <g>
                        <line
                            x1={plantSpacing * scaleX * 0.5}
                            y1={gridSize - 30}
                            x2={plantSpacing * scaleX * 1.5}
                            y2={gridSize - 30}
                            stroke="#3b82f6"
                            strokeWidth="2"
                            markerStart="url(#arrow-start-blue)"
                            markerEnd="url(#arrow-end-blue)"
                        />
                        <text
                            x={plantSpacing * scaleX}
                            y={gridSize - 15}
                            fill="#3b82f6"
                            fontSize="12"
                            fontWeight="bold"
                            textAnchor="middle"
                        >
                            {plantSpacing.toFixed(0)}cm
                        </text>
                    </g>
                )}

                {/* Arrow markers */}
                <defs>
                    <marker
                        id="arrow-start"
                        markerWidth="10"
                        markerHeight="10"
                        refX="5"
                        refY="5"
                        orient="auto"
                    >
                        <polygon points="0,5 10,0 10,10" fill="#f97316" />
                    </marker>
                    <marker
                        id="arrow-end"
                        markerWidth="10"
                        markerHeight="10"
                        refX="5"
                        refY="5"
                        orient="auto"
                    >
                        <polygon points="10,5 0,0 0,10" fill="#f97316" />
                    </marker>
                    <marker
                        id="arrow-start-blue"
                        markerWidth="10"
                        markerHeight="10"
                        refX="5"
                        refY="5"
                        orient="auto"
                    >
                        <polygon points="0,5 10,0 10,10" fill="#3b82f6" />
                    </marker>
                    <marker
                        id="arrow-end-blue"
                        markerWidth="10"
                        markerHeight="10"
                        refX="5"
                        refY="5"
                        orient="auto"
                    >
                        <polygon points="10,5 0,0 0,10" fill="#3b82f6" />
                    </marker>
                </defs>
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span>Plant Position</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-orange-500"></div>
                    <span>Row Spacing</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-500"></div>
                    <span>Plant Spacing</span>
                </div>
            </div>

            {/* Plant density info */}
            <div className="text-center">
                <p className="text-sm font-medium">
                    Plant Density: {Math.round((10000 / rowSpacing) * (10000 / plantSpacing)).toLocaleString()} plants/ha
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {maxRows} rows × {maxPlants} plants shown (scaled for visualization)
                </p>
            </div>
        </div>
    );
};
