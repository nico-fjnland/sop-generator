import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Position,
  Handle,
  getSmoothStepPath,
  useStore,
  Background,
  EdgeLabelRenderer,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TreeStructure, ArrowCircleUp, ArrowCircleDown, ArrowCircleRight } from '@phosphor-icons/react';

// Default color for Algorithmus category
const ALGORITHMUS_COLOR = '#47D1C6';

// Constants for height calculation
const MIN_HEIGHT = 200; // Minimum height for empty/small flowcharts
const PADDING = 40; // Padding around the flowchart content

// Calculate the bounding box of all nodes
const calculateFlowchartBounds = (nodes) => {
  if (!nodes || nodes.length === 0) {
    return { width: 0, height: 0, minX: 0, minY: 0 };
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    const width = node.width || node.measured?.width || 150;
    const height = node.height || node.measured?.height || 40;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  });
  
  const contentPadding = 20;
  return {
    width: maxX - minX + contentPadding * 2,
    height: maxY - minY + contentPadding * 2,
    minX: minX - contentPadding,
    minY: minY - contentPadding,
  };
};

// Calculate zoom level and required height
// Default zoom is 1.0 (no scaling), only scale down if flowchart is wider than container
const calculateZoomAndHeight = (nodes, containerWidth) => {
  const bounds = calculateFlowchartBounds(nodes);
  
  if (bounds.width === 0) {
    return { zoom: 1, height: MIN_HEIGHT, bounds };
  }
  
  // Standard: Zoom 1.0 (no scaling)
  // Only scale down if flowchart is wider than container
  const zoom = bounds.width > containerWidth 
    ? containerWidth / bounds.width  // Scale down to fit width
    : 1.0;                           // Keep natural size
  
  // Calculate height based on zoom
  const scaledHeight = bounds.height * zoom;
  const requiredHeight = Math.max(MIN_HEIGHT, scaledHeight + PADDING);
  
  return { zoom, height: requiredHeight, bounds };
};

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
        style={{ ...style, strokeWidth: 1 }}
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

// Helper to check if content contains HTML
const isHtmlContent = (content) => {
  return content && (content.includes('<') || content.includes('&'));
};

// Static text display component that handles both plain text and HTML
const StaticNodeText = ({ content, fallback }) => {
  const text = content || fallback;
  
  // Check if content is HTML (from TipTap editor)
  if (isHtmlContent(text)) {
    return (
      <div 
        className="flowchart-node-static-text flowchart-node-html-content"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }
  
  // Plain text - render with line breaks
  const lines = text.split('\n');
  return (
    <div className="flowchart-node-static-text">
      {lines.map((line, i) => (
        <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
      ))}
    </div>
  );
};

const StaticStartNode = ({ data }) => {
  return (
    <div className="flowchart-node flowchart-node-start">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <StaticNodeText content={data.label} fallback="Start" />
      </div>
    </div>
  );
};

const StaticPhaseNode = ({ data }) => {
  return (
    <div className="flowchart-node flowchart-node-phase">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <StaticNodeText content={data.label} fallback="Phase" />
      </div>
    </div>
  );
};

const StaticLabelNode = ({ data }) => {
  return (
    <div className="flowchart-node flowchart-node-label">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <StaticNodeText content={data.label} fallback="Beschriftung" />
      </div>
    </div>
  );
};

const StaticCommentNode = ({ data }) => {
  return (
    <div className="flowchart-node flowchart-node-comment">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <StaticNodeText content={data.label} fallback="Kommentar" />
      </div>
    </div>
  );
};

const StaticPositiveNode = ({ data }) => {
  return (
    <div className="flowchart-node flowchart-node-positive">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <StaticNodeText content={data.label} fallback="Positiv" />
      </div>
    </div>
  );
};

const StaticNegativeNode = ({ data }) => {
  return (
    <div className="flowchart-node flowchart-node-negative">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <StaticNodeText content={data.label} fallback="Negativ" />
      </div>
    </div>
  );
};

const StaticNeutralNode = ({ data }) => {
  return (
    <div className="flowchart-node flowchart-node-neutral">
      <StaticNodeHandles />
      <div className="flowchart-node-content">
        <StaticNodeText content={data.label} fallback="Neutral" />
      </div>
    </div>
  );
};

const StaticHighNode = ({ data }) => {
  return (
    <div className="flowchart-node flowchart-node-high">
      <StaticNodeHandles />
      <div className="flowchart-node-content flowchart-node-with-icon">
        <StaticNodeText content={data.label} fallback="Hoch" />
        <div className="flowchart-node-icon flowchart-node-icon-high">
          <ArrowCircleUp size={18} weight="fill" />
        </div>
      </div>
    </div>
  );
};

const StaticLowNode = ({ data }) => {
  return (
    <div className="flowchart-node flowchart-node-low">
      <StaticNodeHandles />
      <div className="flowchart-node-content flowchart-node-with-icon">
        <StaticNodeText content={data.label} fallback="Runter" />
        <div className="flowchart-node-icon flowchart-node-icon-low">
          <ArrowCircleDown size={18} weight="fill" />
        </div>
      </div>
    </div>
  );
};

const StaticEqualNode = ({ data }) => {
  return (
    <div className="flowchart-node flowchart-node-equal">
      <StaticNodeHandles />
      <div className="flowchart-node-content flowchart-node-with-icon">
        <StaticNodeText content={data.label} fallback="Gleich" />
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

const FlowchartPreviewInner = ({ nodes, edges, containerWidth, onHeightChange, onEditClick, accentColor }) => {
  const reactFlowInstance = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastHeightRef = useRef(MIN_HEIGHT);
  const lastViewportRef = useRef(null);
  
  // Get measured nodes from ReactFlow's internal store
  // This updates when nodes are measured after rendering
  const measuredNodes = useStore(useCallback((state) => {
    const nodeInternals = state.nodeInternals;
    if (!nodeInternals || nodeInternals.size === 0) return [];
    return Array.from(nodeInternals.values());
  }, []));
  
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

  // Calculate zoom and height based on MEASURED flowchart bounds and container width
  // Uses measured nodes from ReactFlow store for accurate dimensions
  const { zoom: calculatedZoom, height: calculatedHeight, bounds } = useMemo(() => {
    // Use measured nodes if available, otherwise fall back to display nodes
    const nodesForCalculation = measuredNodes.length > 0 ? measuredNodes : displayNodes;
    return calculateZoomAndHeight(nodesForCalculation, containerWidth || 500);
  }, [measuredNodes, displayNodes, containerWidth]);

  // Notify parent about required height (only when it actually changes)
  useEffect(() => {
    if (onHeightChange && calculatedHeight > 0 && calculatedHeight !== lastHeightRef.current) {
      lastHeightRef.current = calculatedHeight;
      onHeightChange(calculatedHeight);
    }
  }, [calculatedHeight, onHeightChange]);

  // Store updateViewport in a ref to avoid dependency issues
  const updateViewportRef = useRef(null);
  
  // Set viewport manually instead of using fitView
  // This ensures zoom 1.0 by default, only scaling down when needed
  // Always centers the flowchart horizontally in the container
  const updateViewport = useCallback((instance, currentBounds, currentZoom) => {
    if (!instance || displayNodes.length === 0) return;
    
    const effectiveWidth = containerWidth || 500;
    
    // Calculate offset to center the flowchart horizontally
    // At zoom 1.0, we want the flowchart centered in the container
    // At lower zoom, we want the scaled flowchart centered
    const scaledContentWidth = currentBounds.width * currentZoom;
    const offsetX = (effectiveWidth - scaledContentWidth) / 2 - currentBounds.minX * currentZoom;
    
    // Offset Y: Start from top with some padding
    const offsetY = PADDING / 2 - currentBounds.minY * currentZoom;
    
    const viewport = {
      x: offsetX,
      y: offsetY,
      zoom: currentZoom,
    };
    
    // Only update viewport if it actually changed (prevent infinite loop)
    const lastViewport = lastViewportRef.current;
    if (lastViewport && 
        Math.abs(lastViewport.x - viewport.x) < 0.1 &&
        Math.abs(lastViewport.y - viewport.y) < 0.1 &&
        Math.abs(lastViewport.zoom - viewport.zoom) < 0.001) {
      return;
    }
    
    lastViewportRef.current = viewport;
    instance.setViewport(viewport);
  }, [displayNodes.length, containerWidth]);
  
  // Keep ref updated with latest function
  updateViewportRef.current = updateViewport;

  // Always center the flowchart when:
  // - ReactFlow is initialized
  // - Measured nodes are available
  // - Container width changes (browser zoom, resize)
  // The loop-prevention in updateViewport ensures we don't cause infinite re-renders
  useEffect(() => {
    if (reactFlowInstance.current && isInitialized && measuredNodes.length > 0) {
      const { zoom, bounds: newBounds } = calculateZoomAndHeight(measuredNodes, containerWidth || 500);
      if (updateViewportRef.current) {
        updateViewportRef.current(reactFlowInstance.current, newBounds, zoom);
      }
    }
  }, [isInitialized, measuredNodes, containerWidth]);

  // Initialize ReactFlow instance
  // The useEffect will handle centering when measured nodes become available
  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
    setIsInitialized(true);
  }, []);

  return (
    <div 
      className="flowchart-preview-container" 
      style={{ height: `${calculatedHeight}px` }}
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
          // Don't use fitView - we control viewport manually
          fitView={false}
          onInit={onInit}
          proOptions={{ hideAttribution: true }}
          className="flowchart-preview-canvas"
        >
          <Background 
            variant="dots"
            gap={14}
            size={1}
            color="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
        
        {/* Edit Overlay */}
        <div className="flowchart-preview-overlay no-print" onClick={onEditClick}>
          <button 
            className="flowchart-preview-edit-button"
            style={{ backgroundColor: buttonColor }}
            aria-label="Flowchart bearbeiten"
          >
            <TreeStructure size={18} weight="regular" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Wrapper component that uses the inner component
// The FlowchartBlock already provides ReactFlowProvider, so we can use useReactFlow
const FlowchartPreview = (props) => {
  return <FlowchartPreviewInner {...props} />;
};

export default FlowchartPreview;

