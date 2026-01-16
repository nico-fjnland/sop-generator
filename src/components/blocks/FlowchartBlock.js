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

// Minimum height for the flowchart container
const MIN_HEIGHT = 200;

const FlowchartBlock = ({ content, onChange, boxLabel = 'Diag. Algorithmus' }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);
  const [dynamicHeight, setDynamicHeight] = useState(MIN_HEIGHT);
  const [containerWidth, setContainerWidth] = useState(500);
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
  }, []);

  // Track last width to only react to actual width changes
  const lastWidthRef = useRef(0);

  // Measure container width using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const measureWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width > 0 && width !== lastWidthRef.current) {
          lastWidthRef.current = width;
          setContainerWidth(width);
        }
      }
    };

    // Initial measurement
    measureWidth();

    // Set up ResizeObserver for dynamic updates
    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to avoid "ResizeObserver loop" warning
      // Only check width - ignore height changes to prevent loops
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          if (width > 0 && width !== lastWidthRef.current) {
            lastWidthRef.current = width;
            setContainerWidth(width);
          }
        }
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // State for static SVG (used for print)
  const [staticSvg, setStaticSvg] = useState(null);

  // Load saved content on mount AND when content changes (JSON upload, Supabase load)
  useEffect(() => {
    if (content && typeof content === 'object' && content.nodes) {
      setNodes(content.nodes);
      setEdges(content.edges || []);
      setNodeIdCounter(content.nodeIdCounter || 2);
      if (content.staticSvg) {
        setStaticSvg(content.staticSvg);
      }
    }
  }, [content]);

  // Save changes to parent
  const saveToParent = useCallback((newNodes, newEdges, newNodeIdCounter, newStaticSvg = null) => {
    const flowData = {
      nodes: newNodes,
      edges: newEdges,
      nodeIdCounter: newNodeIdCounter,
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
    saveToParent(data.nodes, data.edges, data.nodeIdCounter, data.staticSvg);
  }, [saveToParent]);

  // Handle edit click
  const handleEditClick = useCallback(() => {
    setIsEditorOpen(true);
  }, []);

  // Handle height change from FlowchartPreview
  const handleHeightChange = useCallback((newHeight) => {
    setDynamicHeight(newHeight);
  }, []);

  return (
    <div ref={containerRef} className="flowchart-block-container" style={{ height: `${dynamicHeight}px` }}>
      {/* Preview with ReactFlowProvider - hidden in print */}
      <div className="no-print" style={{ height: '100%' }}>
        <ReactFlowProvider>
          <FlowchartPreview
            nodes={nodes}
            edges={edges}
            containerWidth={containerWidth}
            onHeightChange={handleHeightChange}
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
            height: `${dynamicHeight}px`,
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
            height: `${dynamicHeight}px`,
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
