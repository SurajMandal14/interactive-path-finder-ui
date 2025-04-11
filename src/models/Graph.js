
import { generateId } from '../utils/graphUtils';

class Graph {
  constructor() {
    this.nodes = {};  // nodeId -> {id, x, y, label}
    this.edges = {};  // `${fromId}-${toId}` -> {from, to, weight}
    this.nodeCounter = 0;
    
    // Grid-specific properties
    this.grid = [];
    this.gridSize = 0;
    this.cellSize = 0;
    this.isGridMode = false;
  }

  // Initialize grid with size and cell dimensions
  initGrid(gridSize, cellSize) {
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.isGridMode = true;
    
    // Create empty grid (0 = empty, 1 = road, -1 = obstacle, >1 = weighted road)
    this.grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    
    // Reset existing graph
    this.nodes = {};
    this.edges = {};
    this.nodeCounter = 0;
  }
  
  // Set a specific grid cell type
  setCellType(row, col, type) {
    if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
      this.grid[row][col] = type;
      return true;
    }
    return false;
  }
  
  // Get a specific grid cell type
  getCellType(row, col) {
    if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
      return this.grid[row][col];
    }
    return null;
  }
  
  // Convert grid position to canvas coordinates
  gridToCoord(row, col) {
    return {
      x: col * this.cellSize + this.cellSize / 2,
      y: row * this.cellSize + this.cellSize / 2
    };
  }
  
  // Convert canvas coordinates to grid position
  coordToGrid(x, y) {
    return {
      row: Math.floor(y / this.cellSize),
      col: Math.floor(x / this.cellSize)
    };
  }

  // Add a node to the graph
  addNode(x, y) {
    const nextLabel = String.fromCharCode(65 + this.nodeCounter); // A, B, C...
    const id = generateId();
    
    this.nodes[id] = {
      id,
      x,
      y,
      label: nextLabel
    };
    
    this.nodeCounter++;
    return id;
  }
  
  // Remove a node and all its connected edges
  removeNode(nodeId) {
    if (!this.nodes[nodeId]) return;
    
    // Remove all edges connected to this node
    Object.keys(this.edges).forEach(edgeKey => {
      const [from, to] = edgeKey.split('-');
      if (from === nodeId || to === nodeId) {
        delete this.edges[edgeKey];
      }
    });
    
    // Remove the node
    delete this.nodes[nodeId];
  }
  
  // Add an edge between two nodes
  addEdge(fromId, toId, weight = 1) {
    if (!this.nodes[fromId] || !this.nodes[fromId]) return null;
    
    const edgeKey1 = `${fromId}-${toId}`;
    const edgeKey2 = `${toId}-${fromId}`;
    
    // Check if edge already exists
    if (this.edges[edgeKey1] || this.edges[edgeKey2]) {
      return null;
    }
    
    const edge = {
      from: fromId,
      to: toId,
      weight
    };
    
    this.edges[edgeKey1] = edge;
    
    // For undirected graph, add the reverse edge too
    this.edges[edgeKey2] = {
      from: toId,
      to: fromId,
      weight
    };
    
    return edge;
  }
  
  // Update the weight of an existing edge
  updateEdgeWeight(fromId, toId, weight) {
    const edgeKey1 = `${fromId}-${toId}`;
    const edgeKey2 = `${toId}-${fromId}`;
    
    if (this.edges[edgeKey1]) {
      this.edges[edgeKey1].weight = weight;
    }
    
    if (this.edges[edgeKey2]) {
      this.edges[edgeKey2].weight = weight;
    }
  }
  
  // Remove an edge between two nodes
  removeEdge(fromId, toId) {
    const edgeKey1 = `${fromId}-${toId}`;
    const edgeKey2 = `${toId}-${fromId}`;
    
    delete this.edges[edgeKey1];
    delete this.edges[edgeKey2];
  }
  
  // Get all neighbors of a node
  getNeighbors(nodeId) {
    const neighbors = [];
    
    Object.values(this.edges).forEach(edge => {
      if (edge.from === nodeId) {
        neighbors.push(edge.to);
      }
    });
    
    return neighbors;
  }
  
  // Get grid neighbors for pathfinding (for grid mode)
  getGridNeighbors(row, col) {
    const neighbors = [];
    const directions = [
      [-1, 0],  // Up
      [1, 0],   // Down
      [0, -1],  // Left
      [0, 1],   // Right
    ];
    
    for (let [dr, dc] of directions) {
      const r = row + dr;
      const c = col + dc;
      
      // Check if within grid bounds
      if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
        const cellType = this.grid[r][c];
        // Only add if not an obstacle (-1)
        if (cellType !== -1) {
          neighbors.push({row: r, col: c, weight: cellType || 1});  // Default to 1 if cellType is 0
        }
      }
    }
    
    return neighbors;
  }
  
  // Get an edge between two nodes
  getEdge(fromId, toId) {
    const edgeKey = `${fromId}-${toId}`;
    return this.edges[edgeKey];
  }
  
  // Convert to a format suitable for rendering
  toRenderFormat() {
    if (this.isGridMode) {
      return {
        grid: this.grid,
        gridSize: this.gridSize,
        cellSize: this.cellSize
      };
    }
    
    return {
      nodes: Object.values(this.nodes),
      edges: Object.values(this.edges)
    };
  }
}

export default Graph;
