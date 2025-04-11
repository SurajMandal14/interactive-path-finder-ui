
import { generateId } from '../utils/graphUtils';

class Graph {
  constructor() {
    this.nodes = {};  // nodeId -> {id, x, y, label}
    this.edges = {};  // `${fromId}-${toId}` -> {from, to, weight}
    this.nodeCounter = 0;
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
  
  // Get an edge between two nodes
  getEdge(fromId, toId) {
    const edgeKey = `${fromId}-${toId}`;
    return this.edges[edgeKey];
  }
  
  // Convert to a format suitable for rendering
  toRenderFormat() {
    return {
      nodes: Object.values(this.nodes),
      edges: Object.values(this.edges)
    };
  }
}

export default Graph;
