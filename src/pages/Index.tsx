
import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import GraphCanvas from '@/components/GraphCanvas';
import ControlPanel from '@/components/ControlPanel';
import Graph from '@/models/Graph';
import { dijkstra, aStar } from '@/utils/graphUtils';
import { toast } from 'sonner';

interface PathResult {
  path: string[];
  visited: string[];
  distance: number;
}

const Index = () => {
  const [graph, setGraph] = useState<Graph>(new Graph());
  const [mode, setMode] = useState('add-node');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [algorithm, setAlgorithm] = useState('astar');
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(5);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Grid mode state
  const [isGridMode, setIsGridMode] = useState(false);
  const [gridSize, setGridSize] = useState(15);  // Default grid size
  const cellSize = 30;  // Size of each grid cell in pixels
  
  // Initialize grid when grid mode is enabled
  useEffect(() => {
    if (isGridMode) {
      const newGraph = new Graph();
      newGraph.initGrid(gridSize, cellSize);
      setGraph(newGraph);
      setPathResult(null);
      setSelectedNodes([]);
    } else {
      const newGraph = new Graph();
      setGraph(newGraph);
      setPathResult(null);
      setSelectedNodes([]);
    }
    
    // Reset animation and selection state when switching modes
    setIsAnimating(false);
  }, [isGridMode, gridSize]);

  // Handle adding a node to the graph
  const handleNodeAdd = useCallback((x: number, y: number) => {
    const newGraph = new Graph();
    Object.assign(newGraph, graph); // Create a copy
    const id = newGraph.addNode(x, y);
    setGraph(newGraph);
    toast.success(`Node ${newGraph.nodes[id].label} added`);
  }, [graph]);

  // Handle adding an edge to the graph
  const handleEdgeAdd = useCallback((fromId: string, toId: string, weight: number) => {
    const newGraph = new Graph();
    Object.assign(newGraph, graph); // Create a copy
    const edge = newGraph.addEdge(fromId, toId, Number(weight));
    
    if (edge) {
      setGraph(newGraph);
      const fromLabel = newGraph.nodes[fromId].label;
      const toLabel = newGraph.nodes[toId].label;
      toast.success(`Edge ${fromLabel}-${toLabel} added with weight ${weight}`);
    }
  }, [graph]);
  
  // Handle updating a grid cell (for grid mode)
  const handleCellUpdate = useCallback((row: number, col: number, cellType: number) => {
    const newGraph = new Graph();
    Object.assign(newGraph, graph); // Create a copy
    
    // Ensure grid exists before using it
    if (!newGraph.grid) {
      newGraph.initGrid(gridSize, cellSize);
    }
    
    if (newGraph.setCellType(row, col, cellType)) {
      setGraph(newGraph);
      
      // Show appropriate toast based on cell type
      if (cellType === -1) {
        toast.info(`Added obstacle at position (${row}, ${col})`);
      } else if (cellType === 0) {
        toast.info(`Cleared cell at position (${row}, ${col})`);
      } else if (cellType === 1) {
        toast.info(`Added road at position (${row}, ${col})`);
      } else {
        toast.info(`Added traffic weight ${cellType} at position (${row}, ${col})`);
      }
    }
  }, [graph, gridSize, cellSize]);

  // Handle selecting a node (for pathfinding)
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
      // If node already selected, remove it
      if (prev.includes(nodeId)) {
        return prev.filter(id => id !== nodeId);
      }
      
      // Otherwise add it (max 2 nodes)
      const newSelected = [...prev, nodeId].slice(0, 2);
      return newSelected;
    });
  }, []);

  // Add a new state for path analysis
  const [pathAnalysis, setPathAnalysis] = useState({
    totalCost: 0,
    pathLength: 0,
    coordinates: [],
    visitedCount: 0
  });
  
  // Run the selected pathfinding algorithm
  const runPathfinding = useCallback(() => {
    if (selectedNodes.length !== 2) {
      toast.error('Please select a start and end node first');
      return;
    }
    
    const [startId, endId] = selectedNodes;
    let result;
    
    try {
      if (algorithm === 'dijkstra') {
        result = dijkstra(graph, startId, endId);
      } else {
        result = aStar(graph, startId, endId);
      }
      
      if (result.path.length === 0) {
        toast.error('No path found between selected nodes');
        return;
      }
      
      // Store the path and visited cells in the graph for highlighting
      const newGraph = new Graph();
      Object.assign(newGraph, graph); // Create a copy
      newGraph.setFinalPath(result.path);
      newGraph.setVisitedCells(result.visited);
      setGraph(newGraph);
      
      // Start animation
      setPathResult(result);
      setIsAnimating(true);
      
      // Update path analysis
      setPathAnalysis({
        totalCost: result.distance,
        pathLength: result.path.length,
        coordinates: result.path,
        visitedCount: result.visited.length
      });
      
    } catch (error) {
      console.error('Pathfinding error:', error);
      toast.error('Error occurred during pathfinding. Please try again.');
    }
    
  }, [algorithm, graph, selectedNodes]);

  // Generate a random grid with roads and obstacles
  const generateRandomGrid = useCallback(() => {
    const newGraph = new Graph();
    newGraph.initGrid(gridSize, cellSize);
    
    // For each cell in the grid
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Generate a random number between 0 and 1
        const random = Math.random();
        
        // 70% chance for road, 30% chance for obstacle
        if (random < 0.7) {
          newGraph.setCellType(row, col, 1); // Road
        } else {
          newGraph.setCellType(row, col, -1); // Obstacle
        }
      }
    }
    
    setGraph(newGraph);
    setSelectedNodes([]);
    setPathResult(null);
    setIsAnimating(false);
    
    toast.success('Random grid generated with roads and obstacles');
  }, [gridSize, cellSize]);

  // Reset the graph to empty state
  const resetGraph = useCallback(() => {
    if (isGridMode) {
      const newGraph = new Graph();
      newGraph.initGrid(gridSize, cellSize);
      setGraph(newGraph);
    } else {
      setGraph(new Graph());
    }
    setSelectedNodes([]);
    setPathResult(null);
    setIsAnimating(false);
  }, [isGridMode, gridSize, cellSize]);

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Interactive Route Planning for Autonomous Vehicles
        </h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left panel - Controls */}
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <ControlPanel
              mode={mode}
              setMode={setMode}
              runPathfinding={runPathfinding}
              selectedNodes={selectedNodes}
              setSelectedNodes={setSelectedNodes}
              resetGraph={resetGraph}
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              animationSpeed={animationSpeed}
              setAnimationSpeed={setAnimationSpeed}
              isGridMode={isGridMode}
              setIsGridMode={setIsGridMode}
              gridSize={gridSize}
              setGridSize={setGridSize}
              generateRandomGrid={generateRandomGrid}
            />
          </div>
          
          {/* Right panel - Graph visualization */}
          <div className="w-full md:w-2/3">
            <Card className="overflow-hidden">
              <div className="h-[600px] flex items-center justify-center">
                <GraphCanvas
                  graph={graph}
                  mode={mode}
                  onNodeAdd={handleNodeAdd}
                  onEdgeAdd={handleEdgeAdd}
                  selectedNodes={selectedNodes}
                  onNodeSelect={handleNodeSelect}
                  pathResult={pathResult}
                  animationSpeed={animationSpeed}
                  isAnimating={isAnimating}
                  setIsAnimating={setIsAnimating}
                  isGridMode={isGridMode}
                  gridSize={gridSize}
                  cellSize={cellSize}
                  onCellUpdate={handleCellUpdate}
                />
              </div>
            </Card>
            
            {/* Path Analysis Section */}
            {pathResult && pathResult.path.length > 0 && (
              <Card className="mt-4 p-4">
                <h3 className="text-lg font-semibold mb-2">Path Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Cost</p>
                    <p className="font-medium">{pathAnalysis.totalCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Path Length</p>
                    <p className="font-medium">{pathAnalysis.pathLength} cells</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cells Visited</p>
                    <p className="font-medium">{pathAnalysis.visitedCount} cells</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Algorithm</p>
                    <p className="font-medium">{algorithm === 'astar' ? 'A* Search' : 'Dijkstra'}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">Path Coordinates</p>
                  <div className="bg-gray-100 p-2 rounded-md text-xs max-h-32 overflow-y-auto">
                    {pathAnalysis.coordinates.map((coord, index) => (
                      <div key={index} className="mb-1">
                        <span className="font-medium">Step {index + 1}:</span> {coord}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
