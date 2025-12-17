import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Position,
  Handle,
  getSmoothStepPath,
  useStore,
  Background,
  EdgeLabelRenderer,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PencilSimple, ArrowCircleUp, ArrowCircleDown, ArrowCircleRight } from '@phosphor-icons/react';

// Default color for Algorithmus category
const ALGORITHMUS_COLOR = '#47D1C6';

// Helper function to get the position on the node edge for a given side
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

// Helper function to determine the closest sides between two nodes
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

// Custom Floating Edge Component for Preview
function FloatingEdgePreview({ id, source, target, markerEnd, style, data }) {
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

  const hasLabel = data?.label && data.label.trim() !== '';

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      {hasLabel && (
        <EdgeLabelRenderer>
          <div
            className="edge-label-preview"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '11px',
              fontFamily: "'Quicksand', sans-serif",
              fontWeight: 500,
              color: '#374151',
              whiteSpace: 'nowrap',
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = {
  floating: FloatingEdgePreview,
};

// Static Node Components (no editing, no handles visible)
const StaticNodeHandles = () => (
  <>
    <Handle type="target" position={Position.Top} id="top" style={{ visibility: 'hidden' }} />
    <Handle type="target" position={Position.Bottom} id="bottom" style={{ visibility: 'hidden' }} />
    <Handle type="target" position={Position.Left} id="left" style={{ visibility: 'hidden' }} />
    <Handle type="target" position={Position.Right} id="right" style={{ visibility: 'hidden' }} />
    <Handle type="source" position={Position.Top} id="top-source" style={{ visibility: 'hidden' }} />
    <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ visibility: 'hidden' }} />
    <Handle type="source" position={Position.Left} id="left-source" style={{ visibility: 'hidden' }} />
    <Handle type="source" position={Position.Right} id="right-source" style={{ visibility: 'hidden' }} />
  </>
);

const StaticStartNode = ({ data }) => {
  const text = data.label || 'Start';
  const lines = text.split('\n');
  
  return (
    <div className="flowchart-node flowchart-node-start">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <div className="flowchart-node-static-text">
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const StaticPhaseNode = ({ data }) => {
  const text = data.label || 'Phase';
  const lines = text.split('\n');
  
  return (
    <div className="flowchart-node flowchart-node-phase">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <div className="flowchart-node-static-text">
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const StaticLabelNode = ({ data }) => {
  const text = data.label || 'Beschriftung';
  const lines = text.split('\n');
  
  return (
    <div className="flowchart-node flowchart-node-label">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <div className="flowchart-node-static-text">
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const StaticCommentNode = ({ data }) => {
  const text = data.label || 'Kommentar';
  const lines = text.split('\n');
  
  return (
    <div className="flowchart-node flowchart-node-comment">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <div className="flowchart-node-static-text">
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const StaticPositiveNode = ({ data }) => {
  const text = data.label || 'Positiv';
  const lines = text.split('\n');
  
  return (
    <div className="flowchart-node flowchart-node-positive">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <div className="flowchart-node-static-text">
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const StaticNegativeNode = ({ data }) => {
  const text = data.label || 'Negativ';
  const lines = text.split('\n');
  
  return (
    <div className="flowchart-node flowchart-node-negative">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <div className="flowchart-node-static-text">
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const StaticNeutralNode = ({ data }) => {
  const text = data.label || 'Neutral';
  const lines = text.split('\n');
  
  return (
    <div className="flowchart-node flowchart-node-neutral">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <div className="flowchart-node-static-text">
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const StaticHighNode = ({ data }) => {
  const text = data.label || 'Hoch';
  const lines = text.split('\n');
  
  return (
    <div className="flowchart-node flowchart-node-high">
      <StaticNodeHandles />
      <div className="flowchart-node-content flowchart-node-with-icon">
        <div className="flowchart-node-static-text">
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </div>
        <div className="flowchart-node-icon flowchart-node-icon-high">
          <ArrowCircleUp size={18} weight="fill" />
        </div>
      </div>
    </div>
  );
};

const StaticLowNode = ({ data }) => {
  const text = data.label || 'Runter';
  const lines = text.split('\n');
  
  return (
    <div className="flowchart-node flowchart-node-low">
      <StaticNodeHandles />
      <div className="flowchart-node-content flowchart-node-with-icon">
        <div className="flowchart-node-static-text">
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </div>
        <div className="flowchart-node-icon flowchart-node-icon-low">
          <ArrowCircleDown size={18} weight="fill" />
        </div>
      </div>
    </div>
  );
};

const StaticEqualNode = ({ data }) => {
  const text = data.label || 'Gleich';
  const lines = text.split('\n');
  
  return (
    <div className="flowchart-node flowchart-node-equal">
      <StaticNodeHandles />
      <div className="flowchart-node-content flowchart-node-with-icon">
        <div className="flowchart-node-static-text">
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </div>
        <div className="flowchart-node-icon flowchart-node-icon-equal">
          <ArrowCircleRight size={18} weight="fill" />
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  start: StaticStartNode,
  phase: StaticPhaseNode,
  label: StaticLabelNode,
  comment: StaticCommentNode,
  positive: StaticPositiveNode,
  negative: StaticNegativeNode,
  neutral: StaticNeutralNode,
  high: StaticHighNode,
  low: StaticLowNode,
  equal: StaticEqualNode,
};

const FlowchartPreview = ({ nodes, edges, height, onEditClick, accentColor }) => {
  // Memoize nodes and edges to prevent unnecessary re-renders
  const displayNodes = useMemo(() => {
    return (nodes || []).map(node => ({
      ...node,
      data: { label: node.data?.label || '' },
    }));
  }, [nodes]);

  const displayEdges = useMemo(() => {
    return edges || [];
  }, [edges]);

  const buttonColor = accentColor || ALGORITHMUS_COLOR;

  // Fit view on init to ensure centering
  const onInit = useCallback((reactFlowInstance) => {
    if (displayNodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({ 
          padding: 0.1, 
          minZoom: 0.1, 
          maxZoom: 1 
        });
      }, 50);
    }
  }, [displayNodes.length]);

  return (
    <div 
      className="flowchart-preview-container" 
      style={{ height: `${height}px` }}
    >
      <div className="flowchart-preview-wrapper">
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          fitView
          fitViewOptions={{ 
            padding: 0.1, 
            minZoom: 0.1, 
            maxZoom: 1,
            includeHiddenNodes: false,
          }}
          onInit={onInit}
          proOptions={{ hideAttribution: true }}
          className="flowchart-preview-canvas"
        >
          <Background />
        </ReactFlow>
        
        {/* Edit Overlay */}
        <div className="flowchart-preview-overlay no-print" onClick={onEditClick}>
          <button 
            className="flowchart-preview-edit-button"
            style={{ backgroundColor: buttonColor }}
            aria-label="Flowchart bearbeiten"
          >
            <PencilSimple size={18} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlowchartPreview;

