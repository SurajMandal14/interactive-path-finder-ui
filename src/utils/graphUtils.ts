
// Helper functions for graph operations

// Calculate Euclidean distance between two nodes
export function euclideanDistance(node1: any, node2: any) {
  return Math.sqrt(Math.pow(node2.x - node1.x, 2) + Math.pow(node2.y - node1.y, 2));
}

// Calculate Manhattan distance between two grid cells
export function manhattanDistance(cell1: {row: number, col: number}, cell2: {row: number, col: number}) {
  return Math.abs(cell1.row - cell2.row) + Math.abs(cell1.col - cell2.col);
}

// Implementation of Dijkstra's algorithm
export function dijkstra(graph: any, startNodeId: string, endNodeId: string) {
  if (graph.isGridMode) {
    return dijkstraGrid(graph, startNodeId, endNodeId);
  }
  
  const distances: {[key: string]: number} = {};
  const previous: {[key: string]: string | null} = {};
  const unvisited = new Set<string>();
  const visited = new Set<string>();
  
  // Initialize distances
  Object.keys(graph.nodes).forEach(nodeId => {
    distances[nodeId] = nodeId === startNodeId ? 0 : Infinity;
    previous[nodeId] = null;
    unvisited.add(nodeId);
  });
  
  while (unvisited.size > 0) {
    // Find the unvisited node with minimum distance
    let current: string | null = null;
    let minDistance = Infinity;
    
    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        current = nodeId;
      }
    }
    
    // If we can't find a node to process or we've reached the destination
    if (current === null || current === endNodeId) break;
    
    // Mark as visited
    unvisited.delete(current);
    visited.add(current);
    
    // Check neighbors
    const neighbors = graph.getNeighbors(current);
    
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      
      // Calculate potential new distance
      const edge = graph.getEdge(current, neighbor);
      const weight = edge ? edge.weight : Infinity;
      const newDistance = distances[current] + weight;
      
      // Update if we found a better path
      if (newDistance < distances[neighbor]) {
        distances[neighbor] = newDistance;
        previous[neighbor] = current;
      }
    }
  }
  
  // Reconstruct path
  const path: string[] = [];
  let current = endNodeId;
  
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }
  
  return {
    path: path.length > 1 ? path : [],
    distance: distances[endNodeId],
    visited: Array.from(visited)
  };
}

// Dijkstra for grid-based graph
function dijkstraGrid(graph: any, startCell: string, endCell: string) {
  const distances: {[key: string]: number} = {};
  const previous: {[key: string]: string | null} = {};
  const unvisited = new Set<string>();
  const visited = new Set<string>();
  
  // Parse start and end cells
  const [startRow, startCol] = startCell.split(',').map(Number);
  const [endRow, endCol] = endCell.split(',').map(Number);
  
  // Initialize for all cells
  for (let row = 0; row < graph.gridSize; row++) {
    for (let col = 0; col < graph.gridSize; col++) {
      const cellKey = `${row},${col}`;
      const isStart = row === startRow && col === startCol;
      
      // Only include roads (type 1 or greater) and the start/end cells
      const cellType = graph.grid[row][col];
      if (cellType >= 1 || (row === startRow && col === startCol) || (row === endRow && col === endCol)) {
        distances[cellKey] = isStart ? 0 : Infinity;
        previous[cellKey] = null;
        unvisited.add(cellKey);
      }
    }
  }
  
  while (unvisited.size > 0) {
    // Find cell with minimum distance
    let current: string | null = null;
    let minDistance = Infinity;
    
    for (const cellKey of unvisited) {
      if (distances[cellKey] < minDistance) {
        minDistance = distances[cellKey];
        current = cellKey;
      }
    }
    
    // If no path found or reached destination
    if (current === null || current === endCell) break;
    
    // Mark as visited
    unvisited.delete(current);
    visited.add(current);
    
    // Get current cell coordinates
    const [currentRow, currentCol] = current.split(',').map(Number);
    
    // Check all neighbors
    const neighbors = graph.getGridNeighbors(currentRow, currentCol);
    
    for (const neighbor of neighbors) {
      const { row, col, weight } = neighbor;
      const neighborKey = `${row},${col}`;
      
      if (visited.has(neighborKey)) continue;
      
      // Calculate new distance
      const newDistance = distances[current] + weight;
      
      // Update if better path found
      if (newDistance < distances[neighborKey]) {
        distances[neighborKey] = newDistance;
        previous[neighborKey] = current;
      }
    }
  }
  
  // Reconstruct path
  const path: string[] = [];
  let current = endCell;
  
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }
  
  return {
    path: path.length > 1 ? path : [],
    distance: distances[endCell] || Infinity,
    visited: Array.from(visited)
  };
}

// Implementation of A* algorithm
export function aStar(graph: any, startNodeId: string, endNodeId: string) {
  if (graph.isGridMode) {
    return aStarGrid(graph, startNodeId, endNodeId);
  }
  
  const openSet = new Set<string>([startNodeId]);
  const closedSet = new Set<string>();
  
  const gScore: {[key: string]: number} = {}; // Cost from start to current node
  const fScore: {[key: string]: number} = {}; // Estimated cost from start to end through current node
  const previous: {[key: string]: string | null} = {};
  
  // Initialize scores
  Object.keys(graph.nodes).forEach(nodeId => {
    gScore[nodeId] = nodeId === startNodeId ? 0 : Infinity;
    fScore[nodeId] = nodeId === startNodeId ? 
      heuristic(graph.nodes[nodeId], graph.nodes[endNodeId]) : Infinity;
    previous[nodeId] = null;
  });
  
  while (openSet.size > 0) {
    // Find node in openSet with lowest fScore
    let current: string | null = null;
    let minFScore = Infinity;
    
    for (const nodeId of openSet) {
      if (fScore[nodeId] < minFScore) {
        minFScore = fScore[nodeId];
        current = nodeId;
      }
    }
    
    // If we've reached the end
    if (current === endNodeId) {
      // Reconstruct path
      const path: string[] = [];
      let temp = current;
      
      while (temp !== null) {
        path.unshift(temp);
        temp = previous[temp];
      }
      
      return {
        path,
        distance: gScore[endNodeId],
        visited: Array.from(closedSet)
      };
    }
    
    if (!current) break;
    
    // Move current from open to closed
    openSet.delete(current);
    closedSet.add(current);
    
    // Process neighbors
    const neighbors = graph.getNeighbors(current);
    
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) continue;
      
      // Get edge weight
      const edge = graph.getEdge(current, neighbor);
      const weight = edge ? edge.weight : Infinity;
      
      // Calculate tentative gScore
      const tentativeGScore = gScore[current] + weight;
      
      // If this path is better than any previous one
      if (tentativeGScore < gScore[neighbor]) {
        // Update neighbor
        previous[neighbor] = current;
        gScore[neighbor] = tentativeGScore;
        fScore[neighbor] = gScore[neighbor] + heuristic(graph.nodes[neighbor], graph.nodes[endNodeId]);
        
        // Add to open set if not there
        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        }
      }
    }
  }
  
  // No path found
  return {
    path: [],
    distance: Infinity,
    visited: Array.from(closedSet)
  };
}

// A* for grid-based graph
function aStarGrid(graph: any, startCell: string, endCell: string) {
  const openSet = new Set<string>([startCell]);
  const closedSet = new Set<string>();
  
  const gScore: {[key: string]: number} = {}; // Cost from start
  const fScore: {[key: string]: number} = {}; // Estimated total cost
  const previous: {[key: string]: string | null} = {};
  
  // Parse start and end cells
  const [startRow, startCol] = startCell.split(',').map(Number);
  const [endRow, endCol] = endCell.split(',').map(Number);
  
  // End position as object for heuristic calculation
  const endPosition = { row: endRow, col: endCol };
  
  // Initialize for all cells
  for (let row = 0; row < graph.gridSize; row++) {
    for (let col = 0; col < graph.gridSize; col++) {
      const cellKey = `${row},${col}`;
      const isStart = row === startRow && col === startCol;
      
      // Only include roads (type 1 or greater) and the start/end cells
      const cellType = graph.grid[row][col];
      if (cellType >= 1 || (row === startRow && col === startCol) || (row === endRow && col === endCol)) {
        gScore[cellKey] = isStart ? 0 : Infinity;
        
        // For start cell, calculate heuristic
        if (isStart) {
          fScore[cellKey] = gridHeuristic({ row, col }, endPosition);
        } else {
          fScore[cellKey] = Infinity;
        }
        
        previous[cellKey] = null;
      }
    }
  }
  
  while (openSet.size > 0) {
    // Find cell with minimum fScore
    let current: string | null = null;
    let minFScore = Infinity;
    
    for (const cellKey of openSet) {
      if (fScore[cellKey] < minFScore) {
        minFScore = fScore[cellKey];
        current = cellKey;
      }
    }
    
    // If reached destination
    if (current === endCell) {
      // Reconstruct path
      const path: string[] = [];
      let temp = current;
      
      while (temp !== null) {
        path.unshift(temp);
        temp = previous[temp];
      }
      
      return {
        path,
        distance: gScore[endCell],
        visited: Array.from(closedSet)
      };
    }
    
    if (!current) break;
    
    // Move from open to closed
    openSet.delete(current);
    closedSet.add(current);
    
    // Process neighbors
    const [currentRow, currentCol] = current.split(',').map(Number);
    const neighbors = graph.getGridNeighbors(currentRow, currentCol);
    
    for (const neighbor of neighbors) {
      const { row, col, weight } = neighbor;
      const neighborKey = `${row},${col}`;
      
      if (closedSet.has(neighborKey)) continue;
      
      // Calculate tentative gScore
      const tentativeGScore = gScore[current] + weight;
      
      // If new path is better
      if (tentativeGScore < gScore[neighborKey]) {
        // Update neighbor
        previous[neighborKey] = current;
        gScore[neighborKey] = tentativeGScore;
        fScore[neighborKey] = gScore[neighborKey] + gridHeuristic({ row, col }, endPosition);
        
        // Add to open set if not already there
        if (!openSet.has(neighborKey)) {
          openSet.add(neighborKey);
        }
      }
    }
  }
  
  // No path found
  return {
    path: [],
    distance: Infinity,
    visited: Array.from(closedSet)
  };
}

// Heuristic function for A* (Euclidean distance)
function heuristic(a: any, b: any) {
  return euclideanDistance(a, b);
}

// Heuristic for grid-based A* (Manhattan distance)
function gridHeuristic(cell1: {row: number, col: number}, cell2: {row: number, col: number}) {
  return manhattanDistance(cell1, cell2);
}

// Helper for generating unique IDs
export function generateId(prefix = 'node') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
