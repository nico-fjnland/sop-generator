import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import './FlowchartBlock.css';
import FlowchartPreview from './FlowchartPreview';
import FlowchartEditorModal from './FlowchartEditorModal';

// Initial node setup - empty canvas
const initialNodes = [];
const initialEdges = [];

const FlowchartBlock = ({ content, onChange }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);
  const [height, setHeight] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  // Load saved content on mount
  useEffect(() => {
    if (content && typeof content === 'object' && content.nodes) {
      setNodes(content.nodes);
      setEdges(content.edges || []);
      setNodeIdCounter(content.nodeIdCounter || 2);
      setHeight(content.height || 450);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save changes to parent
  const saveToParent = useCallback((newNodes, newEdges, newNodeIdCounter, newHeight) => {
    const flowData = {
      nodes: newNodes,
      edges: newEdges,
      nodeIdCounter: newNodeIdCounter,
      height: newHeight,
    };
    onChange(flowData);
  }, [onChange]);

  // Handle save from modal
  const handleSaveFromModal = useCallback((data) => {
    setNodes(data.nodes);
    setEdges(data.edges);
    setNodeIdCounter(data.nodeIdCounter);
    saveToParent(data.nodes, data.edges, data.nodeIdCounter, height);
  }, [height, saveToParent]);

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

  // Save height changes after resize ends
  useEffect(() => {
    if (!isResizing && height) {
      const flowData = {
        nodes,
        edges,
        nodeIdCounter,
        height,
      };
      onChange(flowData);
    }
    // Only run when isResizing changes to false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResizing]);

  return (
    <div className="flowchart-block-container" style={{ height: `${height}px` }}>
      {/* Preview with ReactFlowProvider */}
      <ReactFlowProvider>
        <FlowchartPreview
          nodes={nodes}
          edges={edges}
          height={height - 12} // Subtract resize handle height
          onEditClick={handleEditClick}
        />
      </ReactFlowProvider>
      
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
      />
    </div>
  );
};

export default FlowchartBlock;
