import React, { useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';

const NODE_RADIUS = 20;

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
}

interface PathResult {
  path: string[];
  visited: string[];
  distance: number;
}

interface GraphCanvasProps {
  graph: any; 
  mode: string;
  onNodeAdd: (x: number, y: number) => void;
  onEdgeAdd: (fromId: string, toId: string, weight: number) => void;
  selectedNodes: string[];
  onNodeSelect: (nodeId: string) => void;
  pathResult: PathResult | null;
  animationSpeed: number;
  isAnimating: boolean;
  setIsAnimating: (isAnimating: boolean) => void;
  isGridMode: boolean;
  gridSize: number;
  cellSize: number;
  onCellUpdate: (row: number, col: number, cellType: number) => void;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ 
  graph, 
  mode, 
  onNodeAdd, 
  onEdgeAdd,
  selectedNodes,
  onNodeSelect,
  pathResult,
  animationSpeed,
  isAnimating,
  setIsAnimating,
  isGridMode,
  gridSize,
  cellSize,
  onCellUpdate
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragStartNode, setDragStartNode] = useState<string | null>(null);
  const [edgeWeightInput, setEdgeWeightInput] = useState({ visible: false, from: null as string | null, to: null as string | null, x: 0, y: 0 });
  const [animationTimer, setAnimationTimer] = useState<NodeJS.Timeout | null>(null);
  const [agentPosition, setAgentPosition] = useState<{row: number, col: number} | null>(null);
  const [cellWeightInput, setCellWeightInput] = useState({ visible: false, row: -1, col: -1, x: 0, y: 0 });
  
  // Current animation state
  const [animationState, setAnimationState] = useState({
    visitedIndex: 0,
    pathIndex: 0
  });
  
  // Add a state to track if animation has completed
  const [animationCompleted, setAnimationCompleted] = useState(false);
  
  useEffect(() => {
    // Reset animation when pathResult changes
    if (pathResult) {
      setAnimationState({
        visitedIndex: 0,
        pathIndex: 0
      });
      
      if (isGridMode && pathResult.path.length > 0) {
        // Set agent at the starting position for grid mode
        const [startRow, startCol] = pathResult.path[0].split(',').map(Number);
        setAgentPosition({ row: startRow, col: startCol });
      }
    }
  }, [pathResult, isGridMode]);
  
  // Run the path animation
  useEffect(() => {
    if (!pathResult || !isAnimating) return;
    
    // Reset animation completed state when starting a new animation
    setAnimationCompleted(false);
    
    // Clear any existing animation
    if (animationTimer) {
      clearTimeout(animationTimer);
    }
    
    const step = () => {
      setAnimationState(prev => {
        // First animate visited nodes
        if (prev.visitedIndex < pathResult.visited.length) {
          return { ...prev, visitedIndex: prev.visitedIndex + 1 };
        } 
        // Then animate the final path
        else if (prev.pathIndex < pathResult.path.length - 1) {
          const nextIndex = prev.pathIndex + 1;
          
          // Update agent position for grid mode
          if (isGridMode && pathResult.path[nextIndex]) {
            const [row, col] = pathResult.path[nextIndex].split(',').map(Number);
            setAgentPosition({ row, col });
          }
          
          return { ...prev, pathIndex: nextIndex };
        } 
        // Animation complete
        else {
          setIsAnimating(false);
          setAnimationCompleted(true); // Mark animation as completed
          toast.success(`Route found! Total cost: ${pathResult.distance.toFixed(2)}`);
          return prev;
        }
      });
    };
    
    // Schedule the next animation step
    const timer = setTimeout(() => {
      step();
    }, 1000 / animationSpeed);
    
    setAnimationTimer(timer);
    
    // Cleanup
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [animationState, pathResult, isAnimating, animationSpeed, setIsAnimating, isGridMode]);
  
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isGridMode) {
      handleGridClick(e);
      return;
    }
    
    if (mode !== 'add-node') return;
    
    // Get coordinates relative to SVG
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    
    // Check if clicked on empty space
    const clickedOnNode = Object.values(graph.nodes).some((node: Node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS;
    });
    
    if (!clickedOnNode) {
      onNodeAdd(x, y);
    }
  };
  
  // Grid mode click handler
  const handleGridClick = (e: React.MouseEvent) => {
    // Get coordinates relative to SVG
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    
    // Convert to grid position
    const { row, col } = graph.coordToGrid(x, y);
    
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      if (mode === 'add-road') {
        onCellUpdate(row, col, 1); // Add/mark as road
      } else if (mode === 'add-obstacle') {
        onCellUpdate(row, col, -1); // Mark as obstacle
      } else if (mode === 'add-weight') {
        promptForCellWeight(row, col, x, y);
      } else if (mode === 'select') {
        onNodeSelect(`${row},${col}`); // Select as start/end
      } else if (mode === 'clear') {
        onCellUpdate(row, col, 0); // Clear cell
      }
    }
  };
  
  const promptForCellWeight = (row: number, col: number, x: number, y: number) => {
    setCellWeightInput({
      visible: true,
      row,
      col,
      x,
      y
    });
  };
  
  const handleCellWeightSubmit = (weight: number) => {
    const { row, col } = cellWeightInput;
    onCellUpdate(row, col, weight);
    setCellWeightInput({ visible: false, row: -1, col: -1, x: 0, y: 0 });
  };
  
  const handleCellWeightCancel = () => {
    setCellWeightInput({ visible: false, row: -1, col: -1, x: 0, y: 0 });
  };
  
  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    if (mode === 'add-edge') {
      if (!dragStartNode) {
        // First node selection
        setDragStartNode(nodeId);
      } else if (dragStartNode !== nodeId) {
        // Second node selection - create edge
        promptForEdgeWeight(dragStartNode, nodeId);
        setDragStartNode(null);
      }
    } else if (mode === 'select') {
      onNodeSelect(nodeId);
    }
  };
  
  const promptForEdgeWeight = (fromId: string, toId: string) => {
    // Position the weight input near the middle of the edge
    const fromNode = graph.nodes[fromId];
    const toNode = graph.nodes[toId];
    
    const x = (fromNode.x + toNode.x) / 2;
    const y = (fromNode.y + toNode.y) / 2;
    
    setEdgeWeightInput({
      visible: true,
      from: fromId,
      to: toId,
      x,
      y
    });
  };
  
  const handleEdgeWeightSubmit = (weight: number) => {
    const { from, to } = edgeWeightInput;
    if (from && to) {
      onEdgeAdd(from, to, weight);
    }
    setEdgeWeightInput({ visible: false, from: null, to: null, x: 0, y: 0 });
  };
  
  const handleEdgeWeightCancel = () => {
    setEdgeWeightInput({ visible: false, from: null, to: null, x: 0, y: 0 });
  };

  // GRID RENDERING FUNCTIONS
  const getCellColor = (row: number, col: number, cellType: number) => {
    // Handle start/end positions
    if (selectedNodes.length > 0 && selectedNodes[0] === `${row},${col}`) {
      return '#33cc33'; // Start position - green
    }
    
    if (selectedNodes.length > 1 && selectedNodes[1] === `${row},${col}`) {
      return '#cc3333'; // End position - red
    }
    
    // Handle agent position during animation
    if (agentPosition && agentPosition.row === row && agentPosition.col === col) {
      return '#ff3333'; // Agent - bright red
    }
    
    // Check if cell is in the final path - keep highlighted after animation completes
    if (pathResult && (isAnimating || animationCompleted)) {
      // For completed animation, show the entire path
      const pathIndex = animationCompleted ? pathResult.path.length - 1 : animationState.pathIndex;
      const pathCells = pathResult.path.slice(0, pathIndex + 1);
      
      if (pathCells.includes(`${row},${col}`)) {
        return '#ff3333'; // Path - red
      }
      
      // For visited cells, show all if animation completed
      const visitedIndex = animationCompleted ? pathResult.visited.length : animationState.visitedIndex;
      const visitedCells = pathResult.visited.slice(0, visitedIndex);
      
      if (visitedCells.includes(`${row},${col}`)) {
        return '#ff9933'; // Visited - orange
      }
    }
    
    // Default colors based on cell type
    switch (cellType) {
      case -1: return '#555555'; // Obstacle - dark gray
      case 0: return '#f9fafb'; // Empty - light gray
      case 1: return '#3388ff'; // Road - blue
      default: return `rgba(255, 160, 0, ${Math.min(1, cellType / 10)})`; // Weighted road - orange with intensity
    }
  };
  
  const getEdgeClass = (edge: Edge) => {
    if (!pathResult || !isAnimating) return 'edge';
    
    const { path } = pathResult;
    const animatedPathLength = animationState.pathIndex + 1;
    
    // Check if this edge is in the final path
    for (let i = 0; i < animatedPathLength && i < path.length - 1; i++) {
      if ((edge.from === path[i] && edge.to === path[i+1]) || 
          (edge.from === path[i+1] && edge.to === path[i])) {
        return 'edge path-edge';
      }
    }
    
    return 'edge';
  };
  
  const getNodeClass = (nodeId: string) => {
    if (!pathResult || !isAnimating) return 'node';
    
    const { visited, path } = pathResult;
    const visitedNodes = visited.slice(0, animationState.visitedIndex);
    const animatedPath = path.slice(0, animationState.pathIndex + 1);
    
    // Start node
    if (path.length > 0 && nodeId === path[0]) {
      return 'node start-node';
    }
    
    // End node
    if (path.length > 0 && nodeId === path[path.length - 1]) {
      return 'node end-node';
    }
    
    // Node in final path
    if (animatedPath.includes(nodeId)) {
      return 'node path-node';
    }
    
    // Visited node
    if (visitedNodes.includes(nodeId)) {
      return 'node visited-node';
    }
    
    return 'node';
  };
  
  const getNodeFill = (nodeId: string) => {
    if (selectedNodes.includes(nodeId)) {
      return '#ff3333';
    }
    
    if (!pathResult || (!isAnimating && !animationCompleted)) return '#3388ff';
    
    const { visited, path } = pathResult;
    // For completed animation, show the entire path and visited nodes
    const visitedIndex = animationCompleted ? visited.length : animationState.visitedIndex;
    const pathIndex = animationCompleted ? path.length - 1 : animationState.pathIndex;
    
    const visitedNodes = visited.slice(0, visitedIndex);
    const animatedPath = path.slice(0, pathIndex + 1);
    
    // Start node
    if (path.length > 0 && nodeId === path[0]) {
      return '#33cc33';
    }
    
    // End node
    if (path.length > 0 && nodeId === path[path.length - 1]) {
      return '#cc3333';
    }
    
    // Node in final path
    if (animatedPath.includes(nodeId)) {
      return '#ff3333';
    }
    
    // Visited node
    if (visitedNodes.includes(nodeId)) {
      return '#ff9933';
    }
    
    return '#3388ff';
  };
  
  const renderGrid = () => {
    // Ensure grid is defined before attempting to render
    if (!graph.grid || graph.grid.length === 0) {
      return null;
    }
    
    const gridContent = [];
    
    // Render grid cells
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Safe access to cell type with fallback to 0
        const cellType = graph.grid[row] && graph.grid[row][col] !== undefined ? graph.grid[row][col] : 0;
        const coords = graph.gridToCoord(row, col);
        
        // Cell background
        gridContent.push(
          <rect
            key={`cell-${row}-${col}`}
            x={col * cellSize}
            y={row * cellSize}
            width={cellSize}
            height={cellSize}
            fill={getCellColor(row, col, cellType)}
            stroke="#ccc"
            strokeWidth="1"
            onClick={(e) => {
              e.stopPropagation();
              handleGridClick(e);
            }}
          />
        );
        
        // Cell text (weight)
        if (cellType > 1) {
          gridContent.push(
            <text
              key={`text-${row}-${col}`}
              x={coords.x}
              y={coords.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#000"
              fontSize="12"
            >
              {cellType}
            </text>
          );
        }
      }
    }
    
    // Agent rendering (car/agent icon)
    if (agentPosition) {
      const agentCoords = graph.gridToCoord(agentPosition.row, agentPosition.col);
      
      // Car SVG representation
      gridContent.push(
        <g 
          key="agent" 
          transform={`translate(${agentCoords.x}, ${agentCoords.y})`}
        >
          {/* Car body */}
          <rect
            x={-cellSize/3}
            y={-cellSize/4}
            width={cellSize/1.5}
            height={cellSize/2}
            rx={cellSize/10}
            fill="#ff0000"
            stroke="#000"
            strokeWidth="1"
          />
          {/* Car roof */}
          <rect
            x={-cellSize/5}
            y={-cellSize/4}
            width={cellSize/2.5}
            height={cellSize/5}
            rx={cellSize/20}
            fill="#880000"
            stroke="#000"
            strokeWidth="1"
          />
          {/* Wheels */}
          <circle
            cx={-cellSize/5}
            cy={cellSize/6}
            r={cellSize/10}
            fill="#333"
            stroke="#000"
            strokeWidth="1"
          />
          <circle
            cx={cellSize/5}
            cy={cellSize/6}
            r={cellSize/10}
            fill="#333"
            stroke="#000"
            strokeWidth="1"
          />
          {/* Headlights */}
          <circle
            cx={cellSize/3}
            cy={-cellSize/8}
            r={cellSize/20}
            fill="#ffff00"
            stroke="#000"
            strokeWidth="0.5"
          />
          <circle
            cx={cellSize/3}
            cy={cellSize/8}
            r={cellSize/20}
            fill="#ffff00"
            stroke="#000"
            strokeWidth="0.5"
          />
        </g>
      );
    }
    
    return gridContent;
  };
  
  return (
    <div className="canvas-container">
      <svg 
        ref={svgRef} 
        id="graph-canvas" 
        onClick={handleCanvasClick}
        width={isGridMode ? gridSize * cellSize : "100%"}
        height={isGridMode ? gridSize * cellSize : "100%"}
      >
        {isGridMode ? (
          // Grid-based rendering
          renderGrid()
        ) : (
          // Graph-based rendering
          <>
            {/* Edges */}
            {Object.values(graph.edges).map((edge: Edge, index: number) => {
              const fromNode = graph.nodes[edge.from];
              const toNode = graph.nodes[edge.to];
              
              // Only render each edge once (since we store both directions)
              if (edge.from > edge.to) return null;
              
              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2;
              
              return (
                <React.Fragment key={`edge-${index}`}>
                  <line
                    className={getEdgeClass(edge)}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                  />
                  <text
                    className="edge-weight"
                    x={midX}
                    y={midY - 5}
                    dy="-0.5em"
                    fill="#666"
                  >
                    {edge.weight}
                  </text>
                </React.Fragment>
              );
            })}
            
            {/* Nodes */}
            {Object.values(graph.nodes).map((node: Node) => (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <circle
                  className={getNodeClass(node.id)}
                  r={NODE_RADIUS}
                  fill={getNodeFill(node.id)}
                  stroke="#005588"
                  strokeWidth="2"
                  onClick={(e) => handleNodeClick(e, node.id)}
                />
                <text
                  className="node-label"
                  y="5"
                  fill="#fff"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </>
        )}
        
        {/* Edge creation in progress */}
        {!isGridMode && dragStartNode && mode === 'add-edge' && (
          <line
            className="edge-preview"
            x1={graph.nodes[dragStartNode].x}
            y1={graph.nodes[dragStartNode].y}
            x2={0}
            y2={0}
            stroke="#aaa"
            strokeWidth="2"
            strokeDasharray="5,5"
            style={{
              display: 'none',
              pointerEvents: 'none'
            }}
          />
        )}
      </svg>
      
      {/* Edge weight input */}
      {edgeWeightInput.visible && (
        <div
          style={{
            position: 'absolute',
            left: `${edgeWeightInput.x}px`,
            top: `${edgeWeightInput.y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
          className="p-3 bg-white rounded shadow"
        >
          <div className="text-center mb-2">Enter edge weight:</div>
          <div className="flex gap-2">
            <input
              type="number"
              className="w-20 h-8 border rounded px-2"
              min="1"
              defaultValue={1}
              autoFocus
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  handleEdgeWeightSubmit(Number(target.value) || 1);
                } else if (e.key === 'Escape') {
                  handleEdgeWeightCancel();
                }
              }}
            />
            <button
              className="bg-primary text-white px-2 py-1 rounded"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                const parentNode = (e.target as HTMLElement).parentNode as HTMLElement;
                const input = parentNode.querySelector('input') as HTMLInputElement;
                handleEdgeWeightSubmit(Number(input?.value) || 1);
              }}
            >
              OK
            </button>
            <button
              className="bg-gray-200 px-2 py-1 rounded"
              onClick={handleEdgeWeightCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Cell weight input */}
      {cellWeightInput.visible && (
        <div
          style={{
            position: 'absolute',
            left: `${cellWeightInput.x}px`,
            top: `${cellWeightInput.y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
          className="p-3 bg-white rounded shadow"
        >
          <div className="text-center mb-2">Enter traffic weight (1-10):</div>
          <div className="flex gap-2">
            <input
              type="number"
              className="w-20 h-8 border rounded px-2"
              min="1"
              max="10"
              defaultValue={2}
              autoFocus
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  handleCellWeightSubmit(Number(target.value) || 1);
                } else if (e.key === 'Escape') {
                  handleCellWeightCancel();
                }
              }}
            />
            <button
              className="bg-primary text-white px-2 py-1 rounded"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                const parentNode = (e.target as HTMLElement).parentNode as HTMLElement;
                const input = parentNode.querySelector('input') as HTMLInputElement;
                handleCellWeightSubmit(Number(input?.value) || 1);
              }}
            >
              OK
            </button>
            <button
              className="bg-gray-200 px-2 py-1 rounded"
              onClick={handleCellWeightCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphCanvas;

// Remove these lines that are causing the error
// In your rendering function for grid mode
// Draw visited cells
// ctx.fillStyle = 'rgba(173, 216, 230, 0.5)'; // Light blue
// for (let row = 0; row < gridSize; row++) {
//   for (let col = 0; col < gridSize; col++) {
//     if (graph.isVisitedCell(row, col)) {
//       const { x, y } = graph.gridToCoord(row, col);
//       ctx.fillRect(
//         x - cellSize / 2, 
//         y - cellSize / 2, 
//         cellSize, 
//         cellSize
//       );
//     }
//   }
// }

// // Draw the final path
// if (graph.isPathHighlighted) {
//   ctx.strokeStyle = '#FF4500'; // Orange-red
//   ctx.lineWidth = 4;
//   
//   // Draw path between cells
//   for (let i = 0; i < graph.finalPath.length - 1; i++) {
//     const [row1, col1] = graph.finalPath[i].split(',').map(Number);
//     const [row2, col2] = graph.finalPath[i + 1].split(',').map(Number);
//     
//     const { x: x1, y: y1 } = graph.gridToCoord(row1, col1);
//     const { x: x2, y: y2 } = graph.gridToCoord(row2, col2);
//     
//     ctx.beginPath();
//     ctx.moveTo(x1, y1);
//     ctx.lineTo(x2, y2);
//     ctx.stroke();
//     
//     // Draw circles at each path point
//     ctx.fillStyle = '#FF4500';
//     ctx.beginPath();
//     ctx.arc(x1, y1, cellSize / 6, 0, Math.PI * 2);
//     ctx.fill();
//   }
//   
//   // Draw the last point
//   if (graph.finalPath.length > 0) {
//     const lastCell = graph.finalPath[graph.finalPath.length - 1];
//     const [lastRow, lastCol] = lastCell.split(',').map(Number);
//     const { x, y } = graph.gridToCoord(lastRow, lastCol);
//     
//     ctx.beginPath();
//     ctx.arc(x, y, cellSize / 6, 0, Math.PI * 2);
//     ctx.fill();
//   }
// }
