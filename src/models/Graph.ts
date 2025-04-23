
import { generateId } from '../utils/graphUtils';

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

type Edges = {
  [key: string]: Edge;
}

type Nodes = {
  [key: string]: Node;
}

class Graph {
  nodes: Nodes;
  edges: Edges;
  nodeCounter: number;
  
  // Grid-specific properties
  grid: number[][];
  gridSize: number;
  cellSize: number;
  isGridMode: boolean;
  
  // Path highlighting properties
  finalPath: string[];
  visitedCells: string[];
  isPathHighlighted: boolean;

  constructor() {
    this.nodes = {};  // nodeId -> {id, x, y, label}
    this.edges = {};  // `${fromId}-${toId}` -> {from, to, weight}
    this.nodeCounter = 0;
    
    // Grid-specific properties - initialize with empty grid
    this.grid = [];
    this.gridSize = 15; // default grid size
    this.cellSize = 30; // default cell size
    this.isGridMode = false;
    
    // Initialize empty grid with default size
    this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
    
    // Initialize path highlighting properties
    this.finalPath = [];
    this.visitedCells = [];
    this.isPathHighlighted = false;
  }

  // Initialize grid with size and cell dimensions
  initGrid(gridSize: number, cellSize: number) {
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.isGridMode = true;
    
    // Create empty grid (0 = empty, 1 = road, -1 = obstacle, >1 = weighted road)
    this.grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
    
    // Reset existing graph
    this.nodes = {};
    this.edges = {};
    this.nodeCounter = 0;
    
    // Reset path highlighting
    this.finalPath = [];
    this.visitedCells = [];
    this.isPathHighlighted = false;
  }
  
  // Set a specific grid cell type
  setCellType(row: number, col: number, type: number): boolean {
    if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
      this.grid[row][col] = type;
      return true;
    }
    return false;
  }
  
  // Get a specific grid cell type
  getCellType(row: number, col: number): number | null {
    if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
      return this.grid[row][col];
    }
    return null;
  }
  
  // Set the final path for highlighting
  setFinalPath(path: string[]): void {
    this.finalPath = path;
    this.isPathHighlighted = true;
  }
  
  // Set the visited cells for visualization
  setVisitedCells(visited: string[]): void {
    this.visitedCells = visited;
  }
  
  // Clear path highlighting
  clearPathHighlighting(): void {
    this.finalPath = [];
    this.visitedCells = [];
    this.isPathHighlighted = false;
  }
  
  // Check if a cell is part of the final path
  isInFinalPath(row: number, col: number): boolean {
    const cellId = `${row},${col}`;
    return this.isPathHighlighted && this.finalPath.includes(cellId);
  }
  
  // Check if a cell was visited during pathfinding
  isVisitedCell(row: number, col: number): boolean {
    const cellId = `${row},${col}`;
    return this.visitedCells.includes(cellId);
  }
  
  // Convert grid position to canvas coordinates
  gridToCoord(row: number, col: number) {
    return {
      x: col * this.cellSize + this.cellSize / 2,
      y: row * this.cellSize + this.cellSize / 2
    };
  }
  
  // Convert canvas coordinates to grid position
  coordToGrid(x: number, y: number) {
    return {
      row: Math.floor(y / this.cellSize),
      col: Math.floor(x / this.cellSize)
    };
  }

  // Add a node to the graph
  addNode(x: number, y: number): string {
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
  removeNode(nodeId: string): void {
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
  addEdge(fromId: string, toId: string, weight = 1): Edge | null {
    if (!this.nodes[fromId] || !this.nodes[toId]) return null;
    
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
  updateEdgeWeight(fromId: string, toId: string, weight: number): void {
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
  removeEdge(fromId: string, toId: string): void {
    const edgeKey1 = `${fromId}-${toId}`;
    const edgeKey2 = `${toId}-${fromId}`;
    
    delete this.edges[edgeKey1];
    delete this.edges[edgeKey2];
  }
  
  // Get all neighbors of a node
  getNeighbors(nodeId: string): string[] {
    const neighbors: string[] = [];
    
    Object.values(this.edges).forEach(edge => {
      if (edge.from === nodeId) {
        neighbors.push(edge.to);
      }
    });
    
    return neighbors;
  }
  
  // Get grid neighbors for pathfinding (for grid mode)
  getGridNeighbors(row: number, col: number): {row: number, col: number, weight: number}[] {
    const neighbors: {row: number, col: number, weight: number}[] = [];
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
        // Only add if it's a road (type 1 or greater)
        if (cellType >= 1) {
          neighbors.push({row: r, col: c, weight: cellType});
        }
      }
    }
    
    return neighbors;
  }
  
  // Get an edge between two nodes
  getEdge(fromId: string, toId: string): Edge | undefined {
    const edgeKey = `${fromId}-${toId}`;
    return this.edges[edgeKey];
  }
  
  // Convert to a format suitable for rendering
  toRenderFormat() {
    if (this.isGridMode) {
      return {
        grid: this.grid,
        gridSize: this.gridSize,
        cellSize: this.cellSize,
        finalPath: this.finalPath,
        visitedCells: this.visitedCells,
        isPathHighlighted: this.isPathHighlighted
      };
    }
    
    return {
      nodes: Object.values(this.nodes),
      edges: Object.values(this.edges),
      finalPath: this.finalPath,
      visitedCells: this.visitedCells,
      isPathHighlighted: this.isPathHighlighted
    };
  }
}

export default Graph;
