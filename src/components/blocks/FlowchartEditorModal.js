import React, { useCallback, useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import ReactFlow, {
  Background,
  MiniMap,
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
import './FlowchartEditorModal.css';
import { 
  X, 
  Square, 
  Circle, 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  ArrowCounterClockwise, 
  ArrowClockwise, 
  FrameCorners,
  ArrowsOut,
  Tag,
  ChatCircleText,
  FloppyDisk,
  Trash,
  Cursor,
  Hand,
  Eraser as EraserIcon,
} from '@phosphor-icons/react';
import Eraser from './flowchart/Eraser';

// ============================================
// EDGE HELPERS
// ============================================

function getHandleCoordsByPosition(node, handlePosition) {
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

function getClosestSides(sourceNode, targetNode) {
  const sourceWidth = sourceNode.width ?? sourceNode.measured?.width ?? 150;
  const sourceHeight = sourceNode.height ?? sourceNode.measured?.height ?? 40;
  const targetWidth = targetNode.width ?? targetNode.measured?.width ?? 150;
  const targetHeight = targetNode.height ?? targetNode.measured?.height ?? 40;
  
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
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 
      ? { sourcePos: Position.Right, targetPos: Position.Left }
      : { sourcePos: Position.Left, targetPos: Position.Right };
  } else {
    return dy > 0
      ? { sourcePos: Position.Bottom, targetPos: Position.Top }
      : { sourcePos: Position.Top, targetPos: Position.Bottom };
  }
}

function FloatingEdge({ id, source, target, markerEnd, style }) {
  const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sourcePos, targetPos } = getClosestSides(sourceNode, targetNode);
  
  const sourceHandleCoords = getHandleCoordsByPosition(sourceNode, sourcePos);
  const targetHandleCoords = getHandleCoordsByPosition(targetNode, targetPos);
  
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

// ============================================
// NODE COMPONENTS
// ============================================

const NodeHandles = ({ selected }) => {
  const handleStyle = { visibility: selected ? 'visible' : 'hidden' };
  
  return (
    <>
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="target" position={Position.Bottom} id="bottom" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="target" position={Position.Left} id="left" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="target" position={Position.Right} id="right" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="source" position={Position.Top} id="top-source" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="source" position={Position.Left} id="left-source" style={handleStyle} className="flowchart-custom-handle" />
      <Handle type="source" position={Position.Right} id="right-source" style={handleStyle} className="flowchart-custom-handle" />
    </>
  );
};

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

// ============================================
// NODE TYPE CONFIG FOR SIDEBAR
// ============================================

const NODE_TYPE_CONFIG = [
  { type: 'start', label: 'Start', icon: Circle, color: '#47D1C6', bgColor: '#E8FAF9' },
  { type: 'phase', label: 'Phase', icon: Square, color: '#003366', bgColor: '#E5F2FF' },
  { type: 'positive', label: 'Positiv', icon: CheckCircle, color: '#52C41A', bgColor: '#ECF9EB' },
  { type: 'negative', label: 'Negativ', icon: XCircle, color: '#EB5547', bgColor: '#FCEAE8' },
  { type: 'neutral', label: 'Neutral', icon: MinusCircle, color: '#FAAD14', bgColor: '#FFF7E6' },
  { type: 'comment', label: 'Kommentar', icon: ChatCircleText, color: '#3399FF', bgColor: '#FFFFFF' },
  { type: 'label', label: 'Label', icon: Tag, color: '#6b7280', bgColor: 'transparent' },
];

// ============================================
// MAIN EDITOR COMPONENT
// ============================================

const FlowchartEditorInner = ({ 
  initialNodes, 
  initialEdges, 
  initialNodeIdCounter,
  onSave, 
  onCancel 
}) => {
  const { x: viewportX, y: viewportY, zoom } = useViewport();
  const { fitView } = useReactFlow();
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // Initialize nodes with onChange handlers
  const initializeNodes = useCallback((nodes) => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onChange: () => {}, // Will be set properly after setNodes is available
      },
    }));
  }, []);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initializeNodes(initialNodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(initialNodeIdCounter);
  const [helperLineHorizontal, setHelperLineHorizontal] = useState(null);
  const [helperLineVertical, setHelperLineVertical] = useState(null);
  const [distanceIndicators, setDistanceIndicators] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [interactionMode, setInteractionMode] = useState('select'); // 'select' or 'pan'

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

  // Reset Zoom function
  const handleResetZoom = useCallback(() => {
    fitView({ 
      padding: 0.2, 
      duration: 400,
      minZoom: 0.857,
      maxZoom: 0.857,
    });
  }, [fitView]);

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

    if (!changes.some((change) => change.type === 'position' && change.dragging)) {
      setHelperLineHorizontal(null);
      setHelperLineVertical(null);
      setDistanceIndicators([]);
    }

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

  // Delete Middle Node: Reconnect incomers to outgoers
  const onNodesDelete = useCallback(
    (deletedNodes) => {
      setEdges(
        deletedNodes.reduce((acc, deletedNode) => {
          const incomers = getIncomers(deletedNode, nodes, edges);
          const outgoers = getOutgoers(deletedNode, nodes, edges);
          const connectedEdges = getConnectedEdges([deletedNode], edges);

          const remainingEdges = acc.filter((edge) => !connectedEdges.includes(edge));

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

  // Add node function
  const addNode = useCallback((type, position = null) => {
    const newNode = {
      id: `${nodeIdCounter}`,
      type,
      position: position || {
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
    setTimeout(() => saveToHistory(), 100);
  }, [nodeIdCounter, setNodes, handleNodeLabelChange, saveToHistory]);

  // Handle drop from sidebar
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [reactFlowInstance, addNode]
  );

  // Handle save
  const handleSave = useCallback(() => {
    const nodesToSave = nodes.map(({ data, ...node }) => ({
      ...node,
      data: {
        label: data.label,
      },
    }));
    
    onSave({
      nodes: nodesToSave,
      edges,
      nodeIdCounter,
    });
  }, [nodes, edges, nodeIdCounter, onSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        onCancel();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      // Tool shortcuts (only when not typing in an input)
      if (!e.metaKey && !e.ctrlKey && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        if (e.key === 'v' || e.key === 'V') {
          setInteractionMode('select');
        }
        if (e.key === 'h' || e.key === 'H') {
          setInteractionMode('pan');
        }
        if (e.key === 'e' || e.key === 'E') {
          setInteractionMode('eraser');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, onCancel, handleUndo, handleRedo]);

  // Get selected nodes for delete/duplicate actions
  const selectedNodes = nodes.filter(n => n.selected);
  const hasSelection = selectedNodes.length > 0;

  // Delete selected nodes
  const handleDeleteSelected = useCallback(() => {
    if (hasSelection) {
      setNodes(nds => nds.filter(n => !n.selected));
      setEdges(eds => {
        const selectedIds = selectedNodes.map(n => n.id);
        return eds.filter(e => !selectedIds.includes(e.source) && !selectedIds.includes(e.target));
      });
      setTimeout(() => saveToHistory(), 100);
    }
  }, [hasSelection, selectedNodes, setNodes, setEdges, saveToHistory]);

  return (
    <>
      {/* Header with Title and Action Buttons */}
      <div className="flowchart-editor-header">
        <Dialog.Title className="flowchart-editor-title">
          SOP Flowchart Editor
        </Dialog.Title>
        <div className="flowchart-editor-header-actions">
          <button 
            onClick={handleSave} 
            title="Speichern (Cmd+S)"
            className="flowchart-editor-save-btn"
          >
            <FloppyDisk size={16} weight="bold" />
            <span>Speichern</span>
          </button>
          <Dialog.Close asChild>
            <button className="flowchart-editor-close-btn">
              <X size={16} weight="bold" />
              <span>Schließen</span>
            </button>
          </Dialog.Close>
        </div>
      </div>

      {/* Content Area */}
      <div className="flowchart-editor-modal-content">
        {/* Full-width Canvas Area */}
        <div className="flowchart-editor-canvas" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWithHelperLines}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
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
          fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1 }}
          proOptions={{ hideAttribution: true }}
          panOnDrag={interactionMode === 'pan' ? true : (interactionMode === 'eraser' ? false : [1, 2])}
          panOnScroll={false}
          zoomOnScroll={interactionMode !== 'eraser'}
          selectionOnDrag={interactionMode === 'select'}
          nodesDraggable={interactionMode === 'select'}
          nodesConnectable={interactionMode === 'select'}
          elementsSelectable={interactionMode === 'select' || interactionMode === 'eraser'}
          selectNodesOnDrag={false}
          className={`${interactionMode}-mode`}
        >
          <Background color="#c0c0c0" gap={8} size={1} />
          
          {/* MiniMap */}
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'start': return '#47D1C6';
                case 'phase': return '#003366';
                case 'positive': return '#52C41A';
                case 'negative': return '#EB5547';
                case 'neutral': return '#B27700';
                case 'label': return '#6b7280';
                case 'comment': return '#3399FF';
                default: return '#9ca3af';
              }
            }}
            maskColor="rgba(71, 209, 198, 0.15)"
            nodeStrokeWidth={1}
            pannable
            zoomable
            className="minimap-inner"
          />
          
          {/* Eraser Tool */}
          {interactionMode === 'eraser' && (
            <Eraser onErase={() => saveToHistory()} />
          )}
          
          {/* Helper Lines */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1000 }}>
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
                    <rect
                      x={x1}
                      y={y - height / 2}
                      width={width}
                      height={height}
                      fill="rgba(235, 85, 71, 0.15)"
                      stroke="rgba(235, 85, 71, 0.4)"
                      strokeWidth={1}
                    />
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
                    <rect
                      x={x - width / 2}
                      y={y1}
                      width={width}
                      height={height}
                      fill="rgba(235, 85, 71, 0.15)"
                      stroke="rgba(235, 85, 71, 0.4)"
                      strokeWidth={1}
                    />
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

        {/* tldraw-style Toolbar */}
        <div className="flowchart-toolbar-container">
          {/* Top row: Tools and Actions (gray, smaller) */}
          <div className="flowchart-toolbar-actions">
            {/* Delete */}
            <button 
              onClick={handleDeleteSelected} 
              disabled={!hasSelection} 
              title="Löschen"
              className="flowchart-toolbar-btn"
            >
              <Trash size={16} weight="bold" />
            </button>
            <button 
              onClick={() => setInteractionMode('eraser')} 
              title="Radierer (E)"
              className={`flowchart-toolbar-btn ${interactionMode === 'eraser' ? 'active' : ''}`}
            >
              <EraserIcon size={16} weight="bold" />
            </button>
            <div className="flowchart-toolbar-separator" />
            {/* Undo/Redo */}
            <button 
              onClick={handleUndo} 
              disabled={historyIndex <= 0} 
              title="Rückgängig (Cmd+Z)"
              className="flowchart-toolbar-btn"
            >
              <ArrowCounterClockwise size={16} weight="bold" />
            </button>
            <button 
              onClick={handleRedo} 
              disabled={historyIndex >= history.length - 1} 
              title="Wiederherstellen (Cmd+Shift+Z)"
              className="flowchart-toolbar-btn"
            >
              <ArrowClockwise size={16} weight="bold" />
            </button>
            <div className="flowchart-toolbar-separator" />
            {/* Interaction Mode Tools */}
            <button 
              onClick={() => setInteractionMode('select')} 
              title="Auswahl (V)"
              className={`flowchart-toolbar-btn ${interactionMode === 'select' ? 'active' : ''}`}
            >
              <Cursor size={16} weight="bold" />
            </button>
            <button 
              onClick={() => setInteractionMode('pan')} 
              title="Verschieben (H)"
              className={`flowchart-toolbar-btn ${interactionMode === 'pan' ? 'active' : ''}`}
            >
              <Hand size={16} weight="bold" />
            </button>
            <div className="flowchart-toolbar-separator" />
            {/* View Controls */}
            <button 
              onClick={() => fitView({ padding: 0.2, duration: 400 })} 
              title="Alles anzeigen"
              className="flowchart-toolbar-btn"
            >
              <FrameCorners size={16} weight="bold" />
            </button>
            <button 
              onClick={handleResetZoom} 
              title="Zoom zurücksetzen"
              className="flowchart-toolbar-btn"
            >
              <ArrowsOut size={16} weight="bold" />
            </button>
          </div>

          {/* Bottom row: Node types (white, larger) */}
          <div className="flowchart-toolbar-nodes">
            {/* Node type buttons */}
            {NODE_TYPE_CONFIG.map((config) => {
              const Icon = config.icon;
              return (
                <div
                  key={config.type}
                  className="flowchart-toolbar-node-item"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/reactflow', config.type);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => addNode(config.type)}
                  title={config.label}
                  style={{ 
                    '--node-color': config.color,
                    '--node-bg': config.bgColor,
                  }}
                >
                  <Icon size={20} weight="regular" style={{ color: config.color }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

// ============================================
// MODAL WRAPPER
// ============================================

const FlowchartEditorModal = ({ 
  open, 
  onOpenChange, 
  nodes, 
  edges, 
  nodeIdCounter,
  onSave 
}) => {
  const handleSave = useCallback((data) => {
    onSave(data);
    onOpenChange(false);
  }, [onSave, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="flowchart-editor-overlay" />
        <Dialog.Content className="flowchart-editor-modal">
          <ReactFlowProvider>
            <FlowchartEditorInner
              initialNodes={nodes || []}
              initialEdges={edges || []}
              initialNodeIdCounter={nodeIdCounter || 2}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </ReactFlowProvider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FlowchartEditorModal;

