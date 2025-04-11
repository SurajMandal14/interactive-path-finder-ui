
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import {
  ArrowRightCircle,
  Plus,
  Link,
  MapPin,
  MousePointer,
  Play,
  RotateCcw,
  Settings,
  Grid,
  Square,
  Ban,
  Weight,
  Trash2
} from 'lucide-react';

const ControlPanel = ({
  mode,
  setMode,
  runPathfinding,
  selectedNodes,
  setSelectedNodes,
  resetGraph,
  algorithm,
  setAlgorithm,
  animationSpeed,
  setAnimationSpeed,
  isGridMode,
  setIsGridMode,
  gridSize,
  setGridSize
}) => {
  const [activeTab, setActiveTab] = useState('tools');
  
  const handleStartPathfinding = () => {
    if (selectedNodes.length !== 2) {
      toast.error("Please select a start and end node first.");
      return;
    }
    
    runPathfinding();
  };
  
  const handleToolSelect = (newMode) => {
    setMode(newMode);
    
    // Show helpful toast message
    const tooltips = {
      'add-node': 'Click anywhere on the canvas to add a node',
      'add-edge': 'Click on two nodes to connect them with an edge',
      'select': 'Click on nodes to select them as start/end points',
      'add-road': 'Click on cells to mark them as roads',
      'add-obstacle': 'Click on cells to mark them as obstacles',
      'add-weight': 'Click on cells to add traffic weight',
      'clear': 'Click on cells to clear them'
    };
    
    toast.info(tooltips[newMode] || '');
  };
  
  const handleResetSelection = () => {
    setSelectedNodes([]);
    toast.info('Node selection cleared');
  };
  
  const handleResetGraph = () => {
    resetGraph();
    toast.success('Graph has been reset');
  };
  
  const handleModeToggle = (newGridMode) => {
    if (newGridMode !== isGridMode) {
      setIsGridMode(newGridMode);
      setSelectedNodes([]);
      resetGraph();
      
      if (newGridMode) {
        setMode('add-road');
        toast.info('Switched to grid mode. Click to create roads.');
      } else {
        setMode('add-node');
        toast.info('Switched to graph mode. Click to add nodes.');
      }
    }
  };
  
  const handleGridSizeChange = (size) => {
    setGridSize(size);
    resetGraph();
    toast.info(`Grid size set to ${size}x${size}`);
  };

  return (
    <Card className="w-full h-full overflow-auto">
      <CardHeader className="pb-3">
        <CardTitle>Route Planning Control Panel</CardTitle>
        <CardDescription>
          Build your graph and find the optimal route
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Graph Mode</span>
            <div className="flex items-center gap-2">
              <span className={!isGridMode ? "font-medium text-primary" : "text-gray-400"}>Graph</span>
              <Switch 
                checked={isGridMode}
                onCheckedChange={handleModeToggle}
              />
              <span className={isGridMode ? "font-medium text-primary" : "text-gray-400"}>Grid</span>
            </div>
          </div>
        </div>
        
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          defaultValue="tools"
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="algorithm">Algorithm</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="pt-4">
            <div className="flex flex-col gap-3">
              {isGridMode ? (
                // Grid mode tools
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={mode === 'add-road' ? 'default' : 'outline'} 
                    onClick={() => handleToolSelect('add-road')}
                    className="flex-col py-6 h-auto"
                  >
                    <Square className="h-6 w-6 mb-1" />
                    <div className="text-xs">Add Road</div>
                  </Button>
                  <Button 
                    variant={mode === 'add-obstacle' ? 'default' : 'outline'} 
                    onClick={() => handleToolSelect('add-obstacle')}
                    className="flex-col py-6 h-auto"
                  >
                    <Ban className="h-6 w-6 mb-1" />
                    <div className="text-xs">Add Obstacle</div>
                  </Button>
                  <Button 
                    variant={mode === 'add-weight' ? 'default' : 'outline'} 
                    onClick={() => handleToolSelect('add-weight')}
                    className="flex-col py-6 h-auto"
                  >
                    <Weight className="h-6 w-6 mb-1" />
                    <div className="text-xs">Add Weight</div>
                  </Button>
                  <Button 
                    variant={mode === 'select' ? 'default' : 'outline'} 
                    onClick={() => handleToolSelect('select')}
                    className="flex-col py-6 h-auto"
                  >
                    <MousePointer className="h-6 w-6 mb-1" />
                    <div className="text-xs">Select Start/End</div>
                  </Button>
                  <Button 
                    variant={mode === 'clear' ? 'default' : 'outline'} 
                    onClick={() => handleToolSelect('clear')}
                    className="flex-col py-6 h-auto"
                  >
                    <Trash2 className="h-6 w-6 mb-1" />
                    <div className="text-xs">Clear Cell</div>
                  </Button>
                </div>
              ) : (
                // Graph mode tools
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={mode === 'add-node' ? 'default' : 'outline'} 
                    onClick={() => handleToolSelect('add-node')}
                    className="flex-col py-6 h-auto"
                  >
                    <Plus className="h-6 w-6 mb-1" />
                    <div className="text-xs">Add Node</div>
                  </Button>
                  <Button 
                    variant={mode === 'add-edge' ? 'default' : 'outline'} 
                    onClick={() => handleToolSelect('add-edge')}
                    className="flex-col py-6 h-auto"
                  >
                    <Link className="h-6 w-6 mb-1" />
                    <div className="text-xs">Add Edge</div>
                  </Button>
                  <Button 
                    variant={mode === 'select' ? 'default' : 'outline'} 
                    onClick={() => handleToolSelect('select')}
                    className="flex-col py-6 h-auto"
                  >
                    <MousePointer className="h-6 w-6 mb-1" />
                    <div className="text-xs">Select</div>
                  </Button>
                </div>
              )}
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Selected {isGridMode ? 'Cells' : 'Nodes'}</h3>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 px-3 py-2 bg-gray-100 rounded-md min-h-10 flex items-center">
                    {selectedNodes.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <MapPin size={16} className="text-green-600" />
                          <span>Start: {selectedNodes[0] ? 
                            (isGridMode ? selectedNodes[0] : selectedNodes[0]?.split('-')[1]) : 'None'}</span>
                        </div>
                        {selectedNodes.length > 1 && (
                          <>
                            <ArrowRightCircle size={16} />
                            <div className="flex items-center gap-1">
                              <MapPin size={16} className="text-red-600" />
                              <span>End: {isGridMode ? selectedNodes[1] : selectedNodes[1]?.split('-')[1]}</span>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">No {isGridMode ? 'cells' : 'nodes'} selected</span>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleResetSelection}
                  >
                    <RotateCcw size={16} />
                  </Button>
                </div>
              </div>
              
              <Button 
                className="mt-4"
                onClick={handleStartPathfinding}
                disabled={selectedNodes.length !== 2}
              >
                <Play className="mr-2 h-4 w-4" />
                Find Route
              </Button>
              
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={handleResetGraph}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset {isGridMode ? 'Grid' : 'Graph'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="algorithm" className="pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Pathfinding Algorithm</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={algorithm === 'dijkstra' ? 'default' : 'outline'}
                    onClick={() => setAlgorithm('dijkstra')}
                    className="justify-start"
                  >
                    Dijkstra's Algorithm
                  </Button>
                  <Button 
                    variant={algorithm === 'astar' ? 'default' : 'outline'}
                    onClick={() => setAlgorithm('astar')}
                    className="justify-start"
                  >
                    A* Algorithm
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Algorithm Description</h3>
                <div className="bg-gray-100 p-3 rounded-md text-sm">
                  {algorithm === 'dijkstra' ? (
                    <p>
                      Dijkstra's algorithm finds the shortest path between nodes by considering all possible paths.
                      It guarantees the optimal solution but may explore more nodes than necessary.
                    </p>
                  ) : (
                    <p>
                      A* (A-Star) is an informed search algorithm that uses a heuristic to estimate distances.
                      It's generally faster than Dijkstra's as it prioritizes paths that seem most promising.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="pt-4">
            <div className="space-y-4">
              {isGridMode && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Grid Size</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 15, 20].map(size => (
                      <Button
                        key={size}
                        variant={gridSize === size ? 'default' : 'outline'}
                        onClick={() => handleGridSizeChange(size)}
                      >
                        {size} x {size}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium mb-2">Animation Speed</h3>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm">{animationSpeed}x</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Instructions</h3>
                <div className="bg-gray-100 p-3 rounded-md text-sm space-y-2">
                  {isGridMode ? (
                    <>
                      <p><strong>1.</strong> Add roads by clicking on the grid cells</p>
                      <p><strong>2.</strong> Add obstacles or traffic weights for certain cells</p>
                      <p><strong>3.</strong> Select a start and end cell</p>
                      <p><strong>4.</strong> Choose an algorithm and find the optimal route</p>
                    </>
                  ) : (
                    <>
                      <p><strong>1.</strong> Add nodes by clicking on the canvas</p>
                      <p><strong>2.</strong> Connect nodes with edges and assign weights</p>
                      <p><strong>3.</strong> Select a start and end node</p>
                      <p><strong>4.</strong> Choose an algorithm and find the optimal route</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
