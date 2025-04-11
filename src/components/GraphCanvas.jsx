
import React, { useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';

const NODE_RADIUS = 20;

const GraphCanvas = ({ 
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
  const svgRef = useRef(null);
  const [dragStartNode, setDragStartNode] = useState(null);
  const [edgeWeightInput, setEdgeWeightInput] = useState({ visible: false, from: null, to: null, x: 0, y: 0 });
  const [animationTimer, setAnimationTimer] = useState(null);
  const [agentPosition, setAgentPosition] = useState(null);
  const [cellWeightInput, setCellWeightInput] = useState({ visible: false, row: -1, col: -1, x: 0, y: 0 });
  
  // Current animation state
  const [animationState, setAnimationState] = useState({
    visitedIndex: 0,
    pathIndex: 0
  });
  
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
  
  const handleCanvasClick = (e) => {
    if (isGridMode) {
      handleGridClick(e);
      return;
    }
    
    if (mode !== 'add-node') return;
    
    // Get coordinates relative to SVG
    const svgRect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    
    // Check if clicked on empty space
    const clickedOnNode = Object.values(graph.nodes).some(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS;
    });
    
    if (!clickedOnNode) {
      onNodeAdd(x, y);
    }
  };
  
  // Grid mode click handler
  const handleGridClick = (e) => {
    // Get coordinates relative to SVG
    const svgRect = svgRef.current.getBoundingClientRect();
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
  
  const promptForCellWeight = (row, col, x, y) => {
    setCellWeightInput({
      visible: true,
      row,
      col,
      x,
      y
    });
  };
  
  const handleCellWeightSubmit = (weight) => {
    const { row, col } = cellWeightInput;
    onCellUpdate(row, col, weight);
    setCellWeightInput({ visible: false, row: -1, col: -1, x: 0, y: 0 });
  };
  
  const handleCellWeightCancel = () => {
    setCellWeightInput({ visible: false, row: -1, col: -1, x: 0, y: 0 });
  };
  
  const handleNodeClick = (e, nodeId) => {
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
  
  const promptForEdgeWeight = (fromId, toId) => {
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
  
  const handleEdgeWeightSubmit = (weight) => {
    const { from, to } = edgeWeightInput;
    onEdgeAdd(from, to, weight);
    setEdgeWeightInput({ visible: false, from: null, to: null, x: 0, y: 0 });
  };
  
  const handleEdgeWeightCancel = () => {
    setEdgeWeightInput({ visible: false, from: null, to: null, x: 0, y: 0 });
  };

  // GRID RENDERING FUNCTIONS
  const getCellColor = (row, col, cellType) => {
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
    
    // Check if cell is in the final path
    if (pathResult && isAnimating) {
      const pathCells = pathResult.path.slice(0, animationState.pathIndex + 1);
      if (pathCells.includes(`${row},${col}`)) {
        return '#ff3333'; // Path - red
      }
      
      // Check if cell is visited
      const visitedCells = pathResult.visited.slice(0, animationState.visitedIndex);
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
  
  const getEdgeClass = (edge) => {
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
  
  const getNodeClass = (nodeId) => {
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
  
  const getNodeFill = (nodeId) => {
    if (selectedNodes.includes(nodeId)) {
      return '#ff3333';
    }
    
    if (!pathResult || !isAnimating) return '#3388ff';
    
    const { visited, path } = pathResult;
    const visitedNodes = visited.slice(0, animationState.visitedIndex);
    const animatedPath = path.slice(0, animationState.pathIndex + 1);
    
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
    const { grid } = graph;
    const gridContent = [];
    
    // Render grid cells
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellType = grid[row][col];
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
      
      // Simple car representation (can be replaced with a better SVG icon)
      gridContent.push(
        <g 
          key="agent" 
          transform={`translate(${agentCoords.x}, ${agentCoords.y})`}
        >
          <circle
            r={cellSize / 4}
            fill="#ff0000"
            stroke="#000"
            strokeWidth="1"
          />
          <polygon
            points={`0,-${cellSize/6} ${cellSize/6},${cellSize/6} -${cellSize/6},${cellSize/6}`}
            fill="#ffffff"
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
            {Object.values(graph.edges).map((edge, index) => {
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
                    backgroundColor="#fff"
                  >
                    {edge.weight}
                  </text>
                </React.Fragment>
              );
            })}
            
            {/* Nodes */}
            {Object.values(graph.nodes).map(node => (
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEdgeWeightSubmit(Number(e.target.value) || 1);
                } else if (e.key === 'Escape') {
                  handleEdgeWeightCancel();
                }
              }}
            />
            <button
              className="bg-primary text-white px-2 py-1 rounded"
              onClick={(e) => {
                const input = e.target.parentNode.querySelector('input');
                handleEdgeWeightSubmit(Number(input.value) || 1);
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCellWeightSubmit(Number(e.target.value) || 1);
                } else if (e.key === 'Escape') {
                  handleCellWeightCancel();
                }
              }}
            />
            <button
              className="bg-primary text-white px-2 py-1 rounded"
              onClick={(e) => {
                const input = e.target.parentNode.querySelector('input');
                handleCellWeightSubmit(Number(input.value) || 1);
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
