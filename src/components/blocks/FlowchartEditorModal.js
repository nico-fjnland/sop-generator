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
  EdgeLabelRenderer,
  getBezierPath,
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
  ArrowCircleUp,
  ArrowCircleDown,
  ArrowCircleRight,
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

function FloatingEdge({ id, source, target, markerEnd, style, data, selected }) {
  const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));
  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(data?.label || '');
  const inputRef = useRef(null);

  // Update local state when data changes
  useEffect(() => {
    setLabelText(data?.label || '');
  }, [data?.label]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sourcePos, targetPos } = getClosestSides(sourceNode, targetNode);
  
  const sourceHandleCoords = getHandleCoordsByPosition(sourceNode, sourcePos);
  const targetHandleCoords = getHandleCoordsByPosition(targetNode, targetPos);
  
  const sourceAbsPos = sourceNode.positionAbsolute ?? sourceNode.position;
  const targetAbsPos = targetNode.positionAbsolute ?? targetNode.position;
  
  const sourceX = sourceAbsPos.x + sourceHandleCoords.x;
  const sourceY = sourceAbsPos.y + sourceHandleCoords.y;
  const targetX = targetAbsPos.x + targetHandleCoords.x;
  const targetY = targetAbsPos.y + targetHandleCoords.y;
  
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePos,
    targetX,
    targetY,
    targetPosition: targetPos,
    borderRadius: 8,
  });

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (data?.onLabelChange) {
      data.onLabelChange(labelText);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLabelText(data?.label || '');
      setIsEditing(false);
    }
  };

  const hasLabel = labelText && labelText.trim() !== '';

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      {/* Invisible wider path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className="react-flow__edge-interaction"
        onDoubleClick={handleDoubleClick}
      />
      <EdgeLabelRenderer>
        <div
          className={`edge-label-container ${selected ? 'selected' : ''} ${hasLabel || isEditing ? 'has-label' : ''}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="edge-label-input"
              placeholder="Label..."
            />
          ) : (
            <div className="edge-label-text" title="Doppelklick zum Bearbeiten">
              {hasLabel ? labelText : (selected ? '+' : '')}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
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

const HighNode = ({ data, selected }) => {
  const text = data.label || 'Hoch';
  const lines = text.split('\n');
  const cols = Math.max(6, Math.max(...lines.map(line => line.length)) + 2);
  const rows = Math.max(1, lines.length);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };
  
  return (
    <div className={`flowchart-node flowchart-node-high ${selected ? 'selected' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content flowchart-node-with-icon">
        <textarea
          value={data.label}
          onChange={(e) => data.onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hoch"
          className="flowchart-node-input"
          cols={cols}
          rows={rows}
        />
        <div className="flowchart-node-icon flowchart-node-icon-high">
          <ArrowCircleUp size={18} weight="fill" />
        </div>
      </div>
    </div>
  );
};

const LowNode = ({ data, selected }) => {
  const text = data.label || 'Runter';
  const lines = text.split('\n');
  const cols = Math.max(6, Math.max(...lines.map(line => line.length)) + 2);
  const rows = Math.max(1, lines.length);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };
  
  return (
    <div className={`flowchart-node flowchart-node-low ${selected ? 'selected' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content flowchart-node-with-icon">
        <textarea
          value={data.label}
          onChange={(e) => data.onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Runter"
          className="flowchart-node-input"
          cols={cols}
          rows={rows}
        />
        <div className="flowchart-node-icon flowchart-node-icon-low">
          <ArrowCircleDown size={18} weight="fill" />
        </div>
      </div>
    </div>
  );
};

const EqualNode = ({ data, selected }) => {
  const text = data.label || 'Gleich';
  const lines = text.split('\n');
  const cols = Math.max(6, Math.max(...lines.map(line => line.length)) + 2);
  const rows = Math.max(1, lines.length);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };
  
  return (
    <div className={`flowchart-node flowchart-node-equal ${selected ? 'selected' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content flowchart-node-with-icon">
        <textarea
          value={data.label}
          onChange={(e) => data.onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Gleich"
          className="flowchart-node-input"
          cols={cols}
          rows={rows}
        />
        <div className="flowchart-node-icon flowchart-node-icon-equal">
          <ArrowCircleRight size={18} weight="fill" />
        </div>
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
  high: HighNode,
  low: LowNode,
  equal: EqualNode,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Convert hex color to a light, opaque background color (mix with white)
const hexToLightBg = (hex, lightness = 0.88) => {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Mix with white (255, 255, 255) based on lightness factor
  const lightR = Math.round(r + (255 - r) * lightness);
  const lightG = Math.round(g + (255 - g) * lightness);
  const lightB = Math.round(b + (255 - b) * lightness);
  return `rgb(${lightR}, ${lightG}, ${lightB})`;
};

// ============================================
// NODE TYPE CONFIG FOR SIDEBAR
// ============================================

// Node types grouped for toolbar display
const NODE_TYPE_GROUPS = [
  {
    id: 'basic',
    items: [
      { type: 'start', label: 'Start', icon: Circle, color: '#47D1C6', bgColor: '#E8FAF9' },
      { type: 'phase', label: 'Phase', icon: Square, color: '#003366', bgColor: '#E5F2FF' },
    ]
  },
  {
    id: 'status',
    items: [
      { type: 'positive', label: 'Positiv', icon: CheckCircle, color: '#52C41A', bgColor: '#ECF9EB' },
      { type: 'negative', label: 'Negativ', icon: XCircle, color: '#EB5547', bgColor: '#FCEAE8' },
      { type: 'neutral', label: 'Neutral', icon: MinusCircle, color: '#FAAD14', bgColor: '#FFF7E6' },
    ]
  },
  {
    id: 'indicators',
    items: [
      { type: 'high', label: 'Hoch', icon: ArrowCircleUp, color: '#EB5547', bgColor: '#FCEAE8' },
      { type: 'low', label: 'Runter', icon: ArrowCircleDown, color: '#3399FF', bgColor: '#E5F2FF' },
      { type: 'equal', label: 'Gleich', icon: ArrowCircleRight, color: '#FAAD14', bgColor: '#FFF7E6' },
    ]
  },
  {
    id: 'annotations',
    items: [
      { type: 'comment', label: 'Kommentar', icon: ChatCircleText, color: '#3399FF', bgColor: '#FFFFFF' },
      { type: 'label', label: 'Label', icon: Tag, color: '#6b7280', bgColor: 'transparent' },
    ]
  }
];

// Flat list for backwards compatibility
const NODE_TYPE_CONFIG = NODE_TYPE_GROUPS.flatMap(group => group.items);

// ============================================
// MAIN EDITOR COMPONENT
// ============================================

const FlowchartEditorInner = ({ 
  initialNodes, 
  initialEdges, 
  initialNodeIdCounter,
  onSave, 
  onCancel,
  accentColor = '#47D1C6',
  boxLabel = 'Diag. Algorithmus'
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

  // Update edge label (saveToHistory is called via ref to avoid circular dependency)
  const saveToHistoryRef = useRef(null);
  
  const handleEdgeLabelChange = useCallback((edgeId, newLabel) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            data: {
              ...edge.data,
              label: newLabel,
            },
          };
        }
        return edge;
      })
    );
    // Use ref to call saveToHistory after it's defined
    setTimeout(() => {
      if (saveToHistoryRef.current) {
        saveToHistoryRef.current();
      }
    }, 100);
  }, [setEdges]);

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

  // Sync edges with onLabelChange handlers
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          onLabelChange: (newLabel) => handleEdgeLabelChange(edge.id, newLabel),
        },
      }))
    );
  }, [handleEdgeLabelChange, setEdges]);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    const currentState = {
      nodes: nodes.map(({ data, ...node }) => ({
        ...node,
        data: { label: data.label },
      })),
      edges: edges.map(({ data, ...edge }) => ({
        ...edge,
        data: { label: data?.label },
      })),
    };

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, currentState];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [nodes, edges, historyIndex]);
  
  // Update ref after saveToHistory is defined
  useEffect(() => {
    saveToHistoryRef.current = saveToHistory;
  }, [saveToHistory]);

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

  // Multi-connection support: connect from all selected nodes to target
  // Based on https://reactflow.dev/examples/edges/multi-connection-line
  const onConnect = useCallback(
    (params) => {
      const { source, target } = params;
      
      // Get all selected nodes that should also be connected
      const selectedSourceNodes = nodes.filter(
        (node) => (node.id === source || node.selected) && node.id !== target
      );
      
      // Create edges from all selected source nodes to the target
      const newEdges = selectedSourceNodes.map((node) => ({
        id: `edge-${node.id}-${target}-${Date.now()}-${Math.random()}`,
        source: node.id,
        target: target,
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
      }));
      
      // If no selected nodes, just use the original params
      if (newEdges.length === 0) {
        const newEdge = {
          ...params,
          id: `edge-${source}-${target}-${Date.now()}`,
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
        saveToHistory();
        return;
      }
      
      // Add all new edges from selected nodes
      setEdges((eds) => {
        // Filter out any duplicate edges (same source-target combination)
        const existingConnections = new Set(eds.map(e => `${e.source}-${e.target}`));
        const uniqueNewEdges = newEdges.filter(
          (e) => !existingConnections.has(`${e.source}-${e.target}`)
        );
        return [...eds, ...uniqueNewEdges];
      });
      setTimeout(() => saveToHistory(), 100);
    },
    [nodes, setEdges, saveToHistory]
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

  // German labels for node types
  const nodeTypeLabels = {
    start: 'Start',
    phase: 'Phase',
    label: 'Beschriftung',
    comment: 'Kommentar',
    positive: 'Positiv',
    negative: 'Negativ',
    neutral: 'Neutral',
    high: 'Hoch',
    low: 'Runter',
    equal: 'Gleich',
  };

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
        label: nodeTypeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1),
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
          <Background />
          
          {/* MiniMap with Custom Wrapper for Dynamic Icon Color */}
          <div className="minimap-wrapper" style={{ '--minimap-accent': accentColor, '--minimap-accent-light': hexToLightBg(accentColor, 0.95) }}>
            {/* Dynamic Icon */}
            <svg className="minimap-icon" width="18" height="26" viewBox="0 0 30 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.625 0.625C18.338 0.625 21.899 2.1 24.5245 4.72551C27.15 7.35102 28.625 10.912 28.625 14.625V28.625C28.625 32.338 27.15 35.899 24.5245 38.5245C21.899 41.15 18.338 42.625 14.625 42.625C10.912 42.625 7.35099 41.15 4.72548 38.5245C2.09998 35.899 0.625005 32.338 0.625005 28.625V14.625C0.625005 10.912 2.09998 7.35102 4.72548 4.72551C7.35099 2.1 10.912 0.625 14.625 0.625Z" fill={hexToLightBg(accentColor, 0.95)} stroke={hexToLightBg(accentColor, 0.95)} strokeWidth="0.5"/>
              <path d="M10.4623 1.25966C11.8099 0.839454 13.2134 0.625485 14.625 0.625C18.338 0.625 21.899 2.1 24.5245 4.72551C27.15 7.35102 28.625 10.912 28.625 14.625V28.625C28.625 32.338 27.15 35.899 24.5245 38.5245C21.899 41.15 18.338 42.625 14.625 42.625C10.912 42.625 7.35099 41.15 4.72548 38.5245C2.09998 35.899 0.625005 32.338 0.625005 28.625V14.625C0.623464 12.8005 0.978562 10.9933 1.67033 9.30499" stroke={accentColor} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.61865 2.11832V6.69165" stroke={accentColor} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.33154 4.40498H7.90488" stroke={accentColor} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.2655 12.133H11.0695C10.3788 12.133 9.81885 12.6929 9.81885 13.3837V15.8197C9.81885 16.5104 10.3788 17.0703 11.0695 17.0703H18.2655C18.9562 17.0703 19.5162 16.5104 19.5162 15.8197V13.3837C19.5162 12.6929 18.9562 12.133 18.2655 12.133Z" fill={hexToLightBg(accentColor, 0.95)} stroke={accentColor} strokeWidth="1.25"/>
              <path d="M14.6626 17.2943V28.1583" stroke={accentColor} strokeWidth="1.25"/>
              <path d="M21.7367 27.4676V24.5183H7.5874V27.5236" stroke={accentColor} strokeWidth="1.25"/>
              <path d="M14.6626 31.1263C15.6111 31.1263 16.38 30.3574 16.38 29.4089C16.38 28.4605 15.6111 27.6916 14.6626 27.6916C13.7142 27.6916 12.9453 28.4605 12.9453 29.4089C12.9453 30.3574 13.7142 31.1263 14.6626 31.1263Z" fill={hexToLightBg(accentColor, 0.95)} stroke={accentColor} strokeWidth="1.25"/>
              <path d="M7.58793 31.1263C8.53639 31.1263 9.30526 30.3574 9.30526 29.4089C9.30526 28.4605 8.53639 27.6916 7.58793 27.6916C6.63948 27.6916 5.87061 28.4605 5.87061 29.4089C5.87061 30.3574 6.63948 31.1263 7.58793 31.1263Z" fill={hexToLightBg(accentColor, 0.95)} stroke={accentColor} strokeWidth="1.25"/>
              <path d="M21.7373 31.1263C22.6858 31.1263 23.4547 30.3574 23.4547 29.4089C23.4547 28.4605 22.6858 27.6916 21.7373 27.6916C20.7889 27.6916 20.02 28.4605 20.02 29.4089C20.02 30.3574 20.7889 31.1263 21.7373 31.1263Z" fill={hexToLightBg(accentColor, 0.95)} stroke={accentColor} strokeWidth="1.25"/>
              <path d="M12.3662 14.597H16.9676" stroke={accentColor} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {/* Dynamic Caption */}
            <span className="minimap-caption" style={{ background: accentColor }}>{boxLabel}</span>
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'start': return accentColor;
                  case 'phase': return '#003366';
                  case 'positive': return '#52C41A';
                  case 'negative': return '#EB5547';
                  case 'neutral': return '#B27700';
                  case 'high': return '#003366';
                  case 'low': return '#003366';
                  case 'equal': return '#003366';
                  case 'label': return '#6b7280';
                  case 'comment': return '#3399FF';
                  default: return '#9ca3af';
                }
              }}
              maskColor={`${accentColor}26`}
              nodeStrokeWidth={1}
              pannable
              zoomable
              className="minimap-inner"
            />
          </div>
          
          {/* Viewport Logger - bottom left */}
          <div className="viewport-logger">
            <span>x: {viewportX.toFixed(0)}</span>
            <span>y: {viewportY.toFixed(0)}</span>
            <span>zoom: {(zoom * 100).toFixed(0)}%</span>
          </div>
          
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
                stroke={accentColor}
                strokeWidth={1}
                strokeDasharray="5,5"
                style={{ filter: `drop-shadow(0 0 6px ${accentColor}80)` }}
              />
            )}
            {helperLineVertical !== null && (
              <line
                x1={helperLineVertical * zoom + viewportX}
                y1={0}
                x2={helperLineVertical * zoom + viewportX}
                y2="100%"
                stroke={accentColor}
                strokeWidth={1}
                strokeDasharray="5,5"
                style={{ filter: `drop-shadow(0 0 6px ${accentColor}80)` }}
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

          {/* Bottom row: Node types (white, larger) - grouped */}
          <div className="flowchart-toolbar-nodes">
            {NODE_TYPE_GROUPS.map((group, groupIndex) => (
              <React.Fragment key={group.id}>
                {groupIndex > 0 && <div className="flowchart-toolbar-separator" />}
                <div className="flowchart-toolbar-group">
                  {group.items.map((config) => {
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
              </React.Fragment>
            ))}
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

// Default algorithmus color
const DEFAULT_ACCENT_COLOR = '#47D1C6';

const FlowchartEditorModal = ({ 
  open, 
  onOpenChange, 
  nodes, 
  edges, 
  nodeIdCounter,
  onSave,
  accentColor = DEFAULT_ACCENT_COLOR,
  boxLabel = 'Diag. Algorithmus'
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
        <Dialog.Content 
          className="flowchart-editor-modal"
          style={{ 
            '--accent-color': accentColor,
            '--accent-color-light': hexToLightBg(accentColor, 0.90),
            '--accent-color-lighter': hexToLightBg(accentColor, 0.95),
          }}
        >
          <ReactFlowProvider>
            <FlowchartEditorInner
              initialNodes={nodes || []}
              initialEdges={edges || []}
              initialNodeIdCounter={nodeIdCounter || 2}
              onSave={handleSave}
              onCancel={handleCancel}
              accentColor={accentColor}
              boxLabel={boxLabel}
            />
          </ReactFlowProvider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FlowchartEditorModal;

