import React, { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Controls,
  ControlButton,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  useViewport,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  getSmoothStepPath,
  useStore,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './FlowchartBlock.css';
import { Square, Circle, FileText, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { ArrowCounterClockwise, ArrowClockwise, FrameCorners, ArrowsOut } from '@phosphor-icons/react';

// Helper function to get the position on the node edge for a given side
function getHandleCoordsByPosition(node, handlePosition) {
  // Get node dimensions - check multiple possible locations for width/height
  const width = node.width ?? node.measured?.width ?? 150;
  const height = node.height ?? node.measured?.height ?? 40;
  
  let x, y;
  
  switch (handlePosition) {
    case Position.Top:
      x = width / 2;
      y = 0;
      break;
    case Position.Bottom:
      x = width / 2;
      y = height;
      break;
    case Position.Left:
      x = 0;
      y = height / 2;
      break;
    case Position.Right:
      x = width;
      y = height / 2;
      break;
    default:
      x = width / 2;
      y = height;
  }
  
  return { x, y };
}

// Helper function to determine the closest sides between two nodes
function getClosestSides(sourceNode, targetNode) {
  const sourceWidth = sourceNode.width ?? sourceNode.measured?.width ?? 150;
  const sourceHeight = sourceNode.height ?? sourceNode.measured?.height ?? 40;
  const targetWidth = targetNode.width ?? targetNode.measured?.width ?? 150;
  const targetHeight = targetNode.height ?? targetNode.measured?.height ?? 40;
  
  // Get absolute position - try positionAbsolute first, then position
  const sourcePos = sourceNode.positionAbsolute ?? sourceNode.position;
  const targetPos = targetNode.positionAbsolute ?? targetNode.position;
  
  const sourceCenter = {
    x: sourcePos.x + sourceWidth / 2,
    y: sourcePos.y + sourceHeight / 2,
  };
  const targetCenter = {
    x: targetPos.x + targetWidth / 2,
    y: targetPos.y + targetHeight / 2,
  };
  
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  
  // Determine which axis has the larger difference
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal connection preferred
    return dx > 0 
      ? { sourcePos: Position.Right, targetPos: Position.Left }
      : { sourcePos: Position.Left, targetPos: Position.Right };
  } else {
    // Vertical connection preferred
    return dy > 0
      ? { sourcePos: Position.Bottom, targetPos: Position.Top }
      : { sourcePos: Position.Top, targetPos: Position.Bottom };
  }
}

// Custom Floating Edge Component
function FloatingEdge({ id, source, target, markerEnd, style }) {
  // Use useStore to get nodes from the ReactFlow store
  const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sourcePos, targetPos } = getClosestSides(sourceNode, targetNode);
  
  const sourceHandleCoords = getHandleCoordsByPosition(sourceNode, sourcePos);
  const targetHandleCoords = getHandleCoordsByPosition(targetNode, targetPos);
  
  // Get absolute position
  const sourceAbsPos = sourceNode.positionAbsolute ?? sourceNode.position;
  const targetAbsPos = targetNode.positionAbsolute ?? targetNode.position;
  
  const [edgePath] = getSmoothStepPath({
    sourceX: sourceAbsPos.x + sourceHandleCoords.x,
    sourceY: sourceAbsPos.y + sourceHandleCoords.y,
    sourcePosition: sourcePos,
    targetX: targetAbsPos.x + targetHandleCoords.x,
    targetY: targetAbsPos.y + targetHandleCoords.y,
    targetPosition: targetPos,
    borderRadius: 8,
  });

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
      style={style}
    />
  );
}

const edgeTypes = {
  floating: FloatingEdge,
};

// Reusable Handles component for all 4 sides
const NodeHandles = ({ selected }) => {
  const handleStyle = { visibility: selected ? 'visible' : 'hidden' };
  
  return (
    <>
      {/* Target handles (can receive connections) */}
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="target" position={Position.Bottom} id="bottom" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="target" position={Position.Left} id="left" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="target" position={Position.Right} id="right" style={handleStyle} className="flowchart-custom-handle" />
      {/* Source handles (can start connections) */}
      <Handle type="source" position={Position.Top} id="top-source" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="source" position={Position.Left} id="left-source" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="source" position={Position.Right} id="right-source" style={handleStyle} className="flowchart-custom-handle" />
    </>
  );
};

// Custom Node Components
const StartNode = ({ data, selected }) => {
  const text = data.label || 'Start';
  const lines = text.split('\n');
  const cols = Math.max(5, Math.max(...lines.map(line => line.length)) + 2);
  const rows = Math.max(1, lines.length);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };
  
  return (
    <div className={`flowchart-node flowchart-node-start ${selected ? 'selected' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <textarea
          value={data.label}
          onChange={(e) => data.onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start"
          className="flowchart-node-input"
          cols={cols}
          rows={rows}
        />
      </div>
    </div>
  );
};

const PhaseNode = ({ data, selected }) => {
  const text = data.label || 'Phase';
  const lines = text.split('\n');
  const cols = Math.max(5, Math.max(...lines.map(line => line.length)) + 2);
  const rows = Math.max(1, lines.length);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };
  
  return (
    <div className={`flowchart-node flowchart-node-phase ${selected ? 'selected' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <textarea
          value={data.label}
          onChange={(e) => data.onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Phase"
          className="flowchart-node-input"
          cols={cols}
          rows={rows}
        />
      </div>
    </div>
  );
};

const LabelNode = ({ data, selected }) => {
  const text = data.label || 'Beschriftung';
  const lines = text.split('\n');
  const cols = Math.max(8, Math.max(...lines.map(line => line.length)) + 2);
  const rows = Math.max(1, lines.length);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };
  
  return (
    <div className={`flowchart-node flowchart-node-label ${selected ? 'selected' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <textarea
          value={data.label}
          onChange={(e) => data.onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Beschriftung"
          className="flowchart-node-input"
          cols={cols}
          rows={rows}
        />
      </div>
    </div>
  );
};

const CommentNode = ({ data, selected }) => {
  const text = data.label || 'Kommentar';
  const lines = text.split('\n');
  const cols = Math.max(8, Math.max(...lines.map(line => line.length)) + 2);
  const rows = Math.max(1, lines.length);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };
  
  return (
    <div className={`flowchart-node flowchart-node-comment ${selected ? 'selected' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <textarea
          value={data.label}
          onChange={(e) => data.onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Kommentar"
          className="flowchart-node-input"
          cols={cols}
          rows={rows}
        />
      </div>
    </div>
  );
};

const PositiveNode = ({ data, selected }) => {
  const text = data.label || 'Positiv';
  const lines = text.split('\n');
  const cols = Math.max(6, Math.max(...lines.map(line => line.length)) + 2);
  const rows = Math.max(1, lines.length);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };
  
  return (
    <div className={`flowchart-node flowchart-node-positive ${selected ? 'selected' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <textarea
          value={data.label}
          onChange={(e) => data.onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Positiv"
          className="flowchart-node-input"
          cols={cols}
          rows={rows}
        />
      </div>
    </div>
  );
};

const NegativeNode = ({ data, selected }) => {
  const text = data.label || 'Negativ';
  const lines = text.split('\n');
  const cols = Math.max(6, Math.max(...lines.map(line => line.length)) + 2);
  const rows = Math.max(1, lines.length);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };
  
  return (
    <div className={`flowchart-node flowchart-node-negative ${selected ? 'selected' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <textarea
          value={data.label}
          onChange={(e) => data.onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Negativ"
          className="flowchart-node-input"
          cols={cols}
          rows={rows}
        />
      </div>
    </div>
  );
};

const NeutralNode = ({ data, selected }) => {
  const text = data.label || 'Neutral';
  const lines = text.split('\n');
  const cols = Math.max(6, Math.max(...lines.map(line => line.length)) + 2);
  const rows = Math.max(1, lines.length);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };
  
  return (
    <div className={`flowchart-node flowchart-node-neutral ${selected ? 'selected' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <textarea
          value={data.label}
          onChange={(e) => data.onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Neutral"
          className="flowchart-node-input"
          cols={cols}
          rows={rows}
        />
      </div>
    </div>
  );
};

const nodeTypes = {
  start: StartNode,
  phase: PhaseNode,
  label: LabelNode,
  comment: CommentNode,
  positive: PositiveNode,
  negative: NegativeNode,
  neutral: NeutralNode,
};

// Initial node setup
const initialNodes = [
  {
    id: '1',
    type: 'start',
    position: { x: 250, y: 50 },
    data: { label: 'Start', onChange: () => {} },
  },
];

const initialEdges = [];

const FlowchartBlockInner = ({ content, onChange }) => {
  const { x: viewportX, y: viewportY, zoom } = useViewport();
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showToolbar, setShowToolbar] = useState(false);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);
  const [height, setHeight] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [helperLineHorizontal, setHelperLineHorizontal] = useState(null);
  const [helperLineVertical, setHelperLineVertical] = useState(null);
  const [distanceIndicators, setDistanceIndicators] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Reset Zoom function - reset to default zoom where text appears as 12px
  const handleResetZoom = useCallback(() => {
    fitView({ 
      padding: 0.2, 
      duration: 400,
      minZoom: 0.857, // 12px / 14px = 0.857 (makes 14px text appear as 12px)
      maxZoom: 0.857,
    });
  }, [fitView]);

  // Load saved content
  useEffect(() => {
    if (content && typeof content === 'object' && content.nodes) {
      // Restore nodes with onChange handlers
      const restoredNodes = content.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: (newLabel) => handleNodeLabelChange(node.id, newLabel),
        },
      }));
      setNodes(restoredNodes);
      setEdges(content.edges || []);
      setNodeIdCounter(content.nodeIdCounter || 2);
      setHeight(content.height || 450);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update node label
  const handleNodeLabelChange = useCallback((nodeId, newLabel) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    const currentState = {
      nodes: nodes.map(({ data, ...node }) => ({
        ...node,
        data: { label: data.label },
      })),
      edges: edges,
    };

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, currentState];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [nodes, edges, historyIndex]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      const restoredNodes = previousState.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: (newLabel) => handleNodeLabelChange(node.id, newLabel),
        },
      }));
      setNodes(restoredNodes);
      setEdges(previousState.edges);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex, setNodes, setEdges, handleNodeLabelChange]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      const restoredNodes = nextState.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: (newLabel) => handleNodeLabelChange(node.id, newLabel),
        },
      }));
      setNodes(restoredNodes);
      setEdges(nextState.edges);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex, setNodes, setEdges, handleNodeLabelChange]);

  // Helper line logic
  const getHelperLines = useCallback((change, nodes) => {
    const defaultResult = {
      horizontal: null,
      vertical: null,
      snapPosition: { x: change.position.x, y: change.position.y },
      distances: [],
    };

    const nodeA = nodes.find((node) => node.id === change.id);
    if (!nodeA || !change.position) {
      return defaultResult;
    }

    const nodeABounds = {
      left: change.position.x,
      right: change.position.x + (nodeA.width || 0),
      top: change.position.y,
      bottom: change.position.y + (nodeA.height || 0),
      centerX: change.position.x + (nodeA.width || 0) / 2,
      centerY: change.position.y + (nodeA.height || 0) / 2,
      width: nodeA.width || 0,
      height: nodeA.height || 0,
    };

    let horizontalLine = null;
    let verticalLine = null;
    let snapX = change.position.x;
    let snapY = change.position.y;
    const snapDistance = 5;
    const distances = [];

    // Check alignment and distances with other nodes
    for (const nodeB of nodes) {
      if (nodeB.id === change.id) continue;

      const nodeBBounds = {
        left: nodeB.position.x,
        right: nodeB.position.x + (nodeB.width || 0),
        top: nodeB.position.y,
        bottom: nodeB.position.y + (nodeB.height || 0),
        centerX: nodeB.position.x + (nodeB.width || 0) / 2,
        centerY: nodeB.position.y + (nodeB.height || 0) / 2,
        width: nodeB.width || 0,
        height: nodeB.height || 0,
      };

      // Vertical alignment checks
      const distanceLeftLeft = Math.abs(nodeABounds.left - nodeBBounds.left);
      const distanceCenterCenter = Math.abs(nodeABounds.centerX - nodeBBounds.centerX);
      const distanceRightRight = Math.abs(nodeABounds.right - nodeBBounds.right);

      if (distanceLeftLeft < snapDistance) {
        verticalLine = nodeBBounds.left;
        snapX = nodeBBounds.left;
      } else if (distanceCenterCenter < snapDistance) {
        verticalLine = nodeBBounds.centerX;
        snapX = nodeBBounds.centerX - (nodeA.width || 0) / 2;
      } else if (distanceRightRight < snapDistance) {
        verticalLine = nodeBBounds.right;
        snapX = nodeBBounds.right - (nodeA.width || 0);
      }

      // Horizontal alignment checks
      const distanceTopTop = Math.abs(nodeABounds.top - nodeBBounds.top);
      const distanceMiddleMiddle = Math.abs(nodeABounds.centerY - nodeBBounds.centerY);
      const distanceBottomBottom = Math.abs(nodeABounds.bottom - nodeBBounds.bottom);

      if (distanceTopTop < snapDistance) {
        horizontalLine = nodeBBounds.top;
        snapY = nodeBBounds.top;
      } else if (distanceMiddleMiddle < snapDistance) {
        horizontalLine = nodeBBounds.centerY;
        snapY = nodeBBounds.centerY - (nodeA.height || 0) / 2;
      } else if (distanceBottomBottom < snapDistance) {
        horizontalLine = nodeBBounds.bottom;
        snapY = nodeBBounds.bottom - (nodeA.height || 0);
      }

      // Calculate distances between nodes
      const distanceThreshold = 100;
      
      // Horizontal distance (when nodes are side by side)
      if (Math.abs(nodeABounds.centerY - nodeBBounds.centerY) < nodeABounds.height) {
        if (nodeABounds.left > nodeBBounds.right) {
          const distance = Math.round(nodeABounds.left - nodeBBounds.right);
          if (distance < distanceThreshold) {
            distances.push({
              type: 'horizontal',
              distance,
              x1: nodeBBounds.right,
              x2: nodeABounds.left,
              y: (nodeABounds.centerY + nodeBBounds.centerY) / 2,
            });
          }
        } else if (nodeBBounds.left > nodeABounds.right) {
          const distance = Math.round(nodeBBounds.left - nodeABounds.right);
          if (distance < distanceThreshold) {
            distances.push({
              type: 'horizontal',
              distance,
              x1: nodeABounds.right,
              x2: nodeBBounds.left,
              y: (nodeABounds.centerY + nodeBBounds.centerY) / 2,
            });
          }
        }
      }

      // Vertical distance (when nodes are above/below)
      if (Math.abs(nodeABounds.centerX - nodeBBounds.centerX) < nodeABounds.width) {
        if (nodeABounds.top > nodeBBounds.bottom) {
          const distance = Math.round(nodeABounds.top - nodeBBounds.bottom);
          if (distance < distanceThreshold) {
            distances.push({
              type: 'vertical',
              distance,
              y1: nodeBBounds.bottom,
              y2: nodeABounds.top,
              x: (nodeABounds.centerX + nodeBBounds.centerX) / 2,
            });
          }
        } else if (nodeBBounds.top > nodeABounds.bottom) {
          const distance = Math.round(nodeBBounds.top - nodeABounds.bottom);
          if (distance < distanceThreshold) {
            distances.push({
              type: 'vertical',
              distance,
              y1: nodeABounds.bottom,
              y2: nodeBBounds.top,
              x: (nodeABounds.centerX + nodeBBounds.centerX) / 2,
            });
          }
        }
      }
    }

    return {
      horizontal: horizontalLine,
      vertical: verticalLine,
      snapPosition: { x: snapX, y: snapY },
      distances,
    };
  }, []);

  // Custom onNodesChange with helper lines
  const onNodesChangeWithHelperLines = useCallback((changes) => {
    const nextChanges = changes.reduce((acc, change) => {
      if (change.type === 'position' && change.dragging && change.position) {
        const helperLines = getHelperLines(change, nodes);
        
        setHelperLineHorizontal(helperLines.horizontal);
        setHelperLineVertical(helperLines.vertical);
        setDistanceIndicators(helperLines.distances);

        return [
          ...acc,
          {
            ...change,
            position: helperLines.snapPosition,
          },
        ];
      }

      return [...acc, change];
    }, []);

    onNodesChange(nextChanges);

    // Clear helper lines when not dragging
    if (!changes.some((change) => change.type === 'position' && change.dragging)) {
      setHelperLineHorizontal(null);
      setHelperLineVertical(null);
      setDistanceIndicators([]);
    }

    // Save to history on certain changes
    const shouldSave = changes.some(
      (change) => 
        (change.type === 'position' && !change.dragging) ||
        change.type === 'remove' ||
        change.type === 'add'
    );
    if (shouldSave) {
      setTimeout(() => saveToHistory(), 100);
    }
  }, [getHelperLines, nodes, onNodesChange, saveToHistory]);

  // Sync nodes with onChange handlers
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onChange: (newLabel) => handleNodeLabelChange(node.id, newLabel),
        },
      }))
    );
  }, [handleNodeLabelChange, setNodes]);

  // Save changes to parent
  useEffect(() => {
    // Strip onChange handlers before saving
    const nodesToSave = nodes.map(({ data, ...node }) => ({
      ...node,
      data: {
        label: data.label,
      },
    }));

    const flowData = {
      nodes: nodesToSave,
      edges,
      nodeIdCounter,
      height,
    };
    
    onChange(flowData);
  }, [nodes, edges, nodeIdCounter, height, onChange]);

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        type: 'floating',
        markerEnd: {
          type: MarkerType.Arrow,
          width: 20,
          height: 20,
          color: '#003366',
        },
        style: { 
          strokeWidth: 1.5,
          stroke: '#003366',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setTimeout(() => saveToHistory(), 100);
    },
    [setEdges, saveToHistory]
  );

  // Delete Middle Node: Reconnect incomers to outgoers when a node is deleted
  const onNodesDelete = useCallback(
    (deletedNodes) => {
      // Use edges from state directly (not from callback) because ReactFlow
      // may have already removed the connected edges before this callback fires
      setEdges(
        deletedNodes.reduce((acc, deletedNode) => {
          const incomers = getIncomers(deletedNode, nodes, edges);
          const outgoers = getOutgoers(deletedNode, nodes, edges);
          const connectedEdges = getConnectedEdges([deletedNode], edges);

          // Remove all edges connected to the deleted node
          const remainingEdges = acc.filter((edge) => !connectedEdges.includes(edge));

          // Create new edges from each incomer to each outgoer
          const createdEdges = incomers.flatMap(({ id: sourceId }) =>
            outgoers.map(({ id: targetId }) => ({
              id: `${sourceId}->${targetId}`,
              source: sourceId,
              target: targetId,
              type: 'floating',
              markerEnd: {
                type: MarkerType.Arrow,
                width: 20,
                height: 20,
                color: '#003366',
              },
              style: {
                strokeWidth: 1.5,
                stroke: '#003366',
              },
            }))
          );

          return [...remainingEdges, ...createdEdges];
        }, edges)
      );

      setTimeout(() => saveToHistory(), 100);
    },
    [nodes, edges, setEdges, saveToHistory]
  );

  const addNode = useCallback((type) => {
    const newNode = {
      id: `${nodeIdCounter}`,
      type,
      position: {
        x: Math.random() * 300 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        onChange: (newLabel) => handleNodeLabelChange(`${nodeIdCounter}`, newLabel),
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((prev) => prev + 1);
  }, [nodeIdCounter, setNodes, handleNodeLabelChange]);

  // Handle resize
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newHeight = Math.max(300, Math.min(1200, height + e.movementY));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, height]);

  return (
    <div className="flowchart-block-container" style={{ height: `${height}px` }}>
      <div 
        className="flowchart-wrapper"
        onMouseEnter={() => setShowToolbar(true)}
        onMouseLeave={() => setShowToolbar(false)}
      >
        {/* Node Toolbar */}
        {showToolbar && (
          <div className="flowchart-toolbar no-print">
            <button
              onClick={() => addNode('start')}
              className="flowchart-toolbar-btn"
              title="Start hinzufügen"
            >
              <Circle size={16} />
              <span>Start</span>
            </button>
            <button
              onClick={() => addNode('phase')}
              className="flowchart-toolbar-btn"
              title="Phase hinzufügen"
            >
              <Square size={16} />
              <span>Phase</span>
            </button>
            <button
              onClick={() => addNode('positive')}
              className="flowchart-toolbar-btn"
              title="Positiv hinzufügen"
            >
              <CheckCircle size={16} />
              <span>Positiv</span>
            </button>
            <button
              onClick={() => addNode('negative')}
              className="flowchart-toolbar-btn"
              title="Negativ hinzufügen"
            >
              <XCircle size={16} />
              <span>Negativ</span>
            </button>
            <button
              onClick={() => addNode('neutral')}
              className="flowchart-toolbar-btn"
              title="Neutral hinzufügen"
            >
              <MinusCircle size={16} />
              <span>Neutral</span>
            </button>
            <button
              onClick={() => addNode('comment')}
              className="flowchart-toolbar-btn"
              title="Kommentar hinzufügen"
            >
              <FileText size={16} />
              <span>Kommentar</span>
            </button>
            <button
              onClick={() => addNode('label')}
              className="flowchart-toolbar-btn"
              title="Beschriftung hinzufügen"
            >
              <FileText size={16} />
              <span>Label</span>
            </button>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWithHelperLines}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: 'floating',
            animated: false,
            style: { 
              strokeWidth: 1.5,
              stroke: '#003366',
            },
            markerEnd: {
              type: MarkerType.Arrow,
              color: '#003366',
            },
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.857 }}
          minZoom={0.3}
          maxZoom={2}
          snapToGrid={true}
          snapGrid={[4, 4]}
          fitView
          fitViewOptions={{ padding: 0.2, minZoom: 0.857, maxZoom: 0.857 }}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Controls 
            className="flowchart-controls no-print"
            showZoom={false}
            showFitView={false}
            showInteractive={false}
            position="bottom-left"
          >
            <ControlButton onClick={handleUndo} disabled={historyIndex <= 0} title="Rückgängig">
              <ArrowCounterClockwise size={18} weight="bold" />
            </ControlButton>
            <ControlButton onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Wiederherstellen">
              <ArrowClockwise size={18} weight="bold" />
            </ControlButton>
            <ControlButton onClick={() => fitView({ padding: 0.2, duration: 400 })} title="Alles anzeigen">
              <FrameCorners size={18} weight="bold" />
            </ControlButton>
            <ControlButton onClick={handleResetZoom} title="Zoom zurücksetzen">
              <ArrowsOut size={18} weight="bold" />
            </ControlButton>
          </Controls>
          <Background color="#e0e0e0" gap={4} size={1} className="no-print" />
          
          {/* Helper Lines - rendered in viewport coordinates */}
          <svg className="no-print" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1000 }}>
            {helperLineHorizontal !== null && (
              <line
                x1={0}
                y1={helperLineHorizontal * zoom + viewportY}
                x2="100%"
                y2={helperLineHorizontal * zoom + viewportY}
                stroke="#47D1C6"
                strokeWidth={1}
                strokeDasharray="5,5"
                style={{ filter: 'drop-shadow(0 0 6px rgba(71, 209, 198, 0.8))' }}
              />
            )}
            {helperLineVertical !== null && (
              <line
                x1={helperLineVertical * zoom + viewportX}
                y1={0}
                x2={helperLineVertical * zoom + viewportX}
                y2="100%"
                stroke="#47D1C6"
                strokeWidth={1}
                strokeDasharray="5,5"
                style={{ filter: 'drop-shadow(0 0 6px rgba(71, 209, 198, 0.8))' }}
              />
            )}
            
            {/* Distance Indicators */}
            {distanceIndicators.map((indicator, idx) => {
              const gridUnits = Math.round(indicator.distance / 4);
              
              if (indicator.type === 'horizontal') {
                const x1 = indicator.x1 * zoom + viewportX;
                const x2 = indicator.x2 * zoom + viewportX;
                const y = indicator.y * zoom + viewportY;
                const width = x2 - x1;
                const height = 30 * zoom;
                const midX = (x1 + x2) / 2;
                const midY = y;
                
                return (
                  <g key={`dist-${idx}`}>
                    {/* Red transparent rectangle */}
                    <rect
                      x={x1}
                      y={y - height / 2}
                      width={width}
                      height={height}
                      fill="rgba(235, 85, 71, 0.15)"
                      stroke="rgba(235, 85, 71, 0.4)"
                      strokeWidth={1}
                    />
                    {/* Grid unit text */}
                    <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#EB5547"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="Roboto, sans-serif"
                    >
                      {gridUnits}
                    </text>
                  </g>
                );
              } else {
                const y1 = indicator.y1 * zoom + viewportY;
                const y2 = indicator.y2 * zoom + viewportY;
                const x = indicator.x * zoom + viewportX;
                const height = y2 - y1;
                const width = 30 * zoom;
                const midX = x;
                const midY = (y1 + y2) / 2;
                
                return (
                  <g key={`dist-${idx}`}>
                    {/* Red transparent rectangle */}
                    <rect
                      x={x - width / 2}
                      y={y1}
                      width={width}
                      height={height}
                      fill="rgba(235, 85, 71, 0.15)"
                      stroke="rgba(235, 85, 71, 0.4)"
                      strokeWidth={1}
                    />
                    {/* Grid unit text */}
                    <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#EB5547"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="Roboto, sans-serif"
                    >
                      {gridUnits}
                    </text>
                  </g>
                );
              }
            })}
          </svg>
        </ReactFlow>
      </div>
      
      {/* Resize Handle */}
      <div 
        className="flowchart-resize-handle no-print"
        onMouseDown={handleMouseDown}
        style={{ cursor: isResizing ? 'ns-resize' : 'ns-resize' }}
      >
        <div className="flowchart-resize-line" />
      </div>
    </div>
  );
};

const FlowchartBlock = ({ content, onChange }) => {
  return (
    <ReactFlowProvider>
      <FlowchartBlockInner content={content} onChange={onChange} />
    </ReactFlowProvider>
  );
};

export default FlowchartBlock;

