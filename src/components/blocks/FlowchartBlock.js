import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import './FlowchartBlock.css';
import FlowchartPreview from './FlowchartPreview';
import FlowchartEditorModal from './FlowchartEditorModal';

// Initial node setup - empty canvas
const initialNodes = [];
const initialEdges = [];

// Default algorithmus color
const DEFAULT_COLOR = '#47D1C6';

const FlowchartBlock = ({ content, onChange, boxLabel = 'Diag. Algorithmus' }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);
  const [height, setHeight] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [accentColor, setAccentColor] = useState(DEFAULT_COLOR);
  const containerRef = useRef(null);
  
  // Get accent color from CSS variable
  useEffect(() => {
    if (containerRef.current) {
      const computedColor = getComputedStyle(containerRef.current).getPropertyValue('--content-box-color').trim();
      if (computedColor) {
        setAccentColor(computedColor);
      }
    }
  });

  // State for static SVG (used for print)
  const [staticSvg, setStaticSvg] = useState(null);

  // Load saved content on mount
  useEffect(() => {
    if (content && typeof content === 'object' && content.nodes) {
      setNodes(content.nodes);
      setEdges(content.edges || []);
      setNodeIdCounter(content.nodeIdCounter || 2);
      setHeight(content.height || 450);
      if (content.staticSvg) {
        setStaticSvg(content.staticSvg);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save changes to parent
  const saveToParent = useCallback((newNodes, newEdges, newNodeIdCounter, newHeight, newStaticSvg = null) => {
    const flowData = {
      nodes: newNodes,
      edges: newEdges,
      nodeIdCounter: newNodeIdCounter,
      height: newHeight,
      staticSvg: newStaticSvg,
    };
    onChange(flowData);
  }, [onChange]);

  // Handle save from modal
  const handleSaveFromModal = useCallback((data) => {
    setNodes(data.nodes);
    setEdges(data.edges);
    setNodeIdCounter(data.nodeIdCounter);
    if (data.staticSvg) {
      setStaticSvg(data.staticSvg);
    }
    saveToParent(data.nodes, data.edges, data.nodeIdCounter, height, data.staticSvg);
  }, [height, saveToParent]);

  // NOTE: Auto SVG generation removed - SVG is now generated manually in FlowchartEditorModal when user saves

  // Handle edit click
  const handleEditClick = useCallback(() => {
    setIsEditorOpen(true);
  }, []);

  // Handle resize
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      setHeight((prevHeight) => {
        const newHeight = Math.max(200, Math.min(1200, prevHeight + e.movementY));
        return newHeight;
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Save the new height
      saveToParent(nodes, edges, nodeIdCounter, height);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, nodes, edges, nodeIdCounter, height, saveToParent]);

  return (
    <div ref={containerRef} className="flowchart-block-container" style={{ height: `${height}px` }}>
      {/* Preview with ReactFlowProvider - hidden in print */}
      <div className="no-print">
        <ReactFlowProvider>
          <FlowchartPreview
            nodes={nodes}
            edges={edges}
            height={height - 12} // Subtract resize handle height
            onEditClick={handleEditClick}
            accentColor={accentColor}
          />
        </ReactFlowProvider>
      </div>
      
      {/* Static SVG for print - only visible in print */}
      {staticSvg && (
        <div 
          className="flowchart-static-print hidden print:block"
          style={{ 
            width: '100%', 
            height: `${height - 12}px`,
            overflow: 'hidden',
          }}
          dangerouslySetInnerHTML={{ __html: staticSvg }}
        />
      )}
      
      {/* Fallback message if no static SVG - only visible in print */}
      {!staticSvg && (
        <div 
          className="flowchart-no-svg hidden print:flex"
          style={{ 
            width: '100%', 
            height: `${height - 12}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            border: '1px dashed #ccc',
            borderRadius: '6px',
            color: '#999',
            fontSize: '12px',
          }}
        >
          Flowchart: Bitte im Editor speichern, um es im Export anzuzeigen
        </div>
      )}
      
      {/* Resize Handle */}
      <div 
        className="flowchart-resize-handle no-print"
        onMouseDown={handleMouseDown}
        style={{ cursor: isResizing ? 'ns-resize' : 'ns-resize' }}
      >
        <div className="flowchart-resize-line" />
      </div>

      {/* Editor Modal */}
      <FlowchartEditorModal
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        nodes={nodes}
        edges={edges}
        nodeIdCounter={nodeIdCounter}
        onSave={handleSaveFromModal}
        accentColor={accentColor}
        boxLabel={boxLabel}
      />
    </div>
  );
};

export default FlowchartBlock;
