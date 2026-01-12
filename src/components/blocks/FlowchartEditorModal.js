import React, { useCallback, useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import ReactFlow, {
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
} from 'reactflow';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Mark, mergeAttributes } from '@tiptap/core';
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
  ArrowsIn,
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
import InlineTextToolbar from '../InlineTextToolbar';

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
        style={{ ...style, strokeWidth: 1 }}
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
// CUSTOM DOT BACKGROUND - Moves with viewport like tldraw/Miro
// ============================================

const CustomDotBackground = ({ gap = 14, dotSize = 1, color = 'rgba(0, 0, 0, 0.1)' }) => {
  const { x, y, zoom } = useViewport();
  
  // Der Gap im Screen-Koordinatensystem skaliert mit dem Zoom
  const scaledGap = gap * zoom;
  
  // Das Pattern muss bei Screen-Position (x, y) beginnen
  // Modulo sorgt dafür, dass es sich korrekt wiederholt
  // Positive Modulo für negative Werte (wichtig für korrektes Verhalten)
  const patternX = ((x % scaledGap) + scaledGap) % scaledGap;
  const patternY = ((y % scaledGap) + scaledGap) % scaledGap;
  
  // Dot-Größe skaliert ebenfalls mit Zoom, aber mit Minimum für Sichtbarkeit
  const scaledDotSize = Math.max(0.5, dotSize * zoom);
  
  return (
    <svg
      className="react-flow__background custom-dot-background"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <pattern
          id="dot-pattern"
          x={patternX}
          y={patternY}
          width={scaledGap}
          height={scaledGap}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={scaledGap / 2}
            cy={scaledGap / 2}
            r={scaledDotSize}
            fill={color}
          />
        </pattern>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#dot-pattern)"
      />
    </svg>
  );
};

// ============================================
// TIPTAP EXTENSIONS FOR FLOWCHART NODES
// ============================================

// Custom extension for smaller font size (9px)
const SmallFont = Mark.create({
  name: 'smallFont',
  
  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: node => (node.style.fontSize === '9px' || node.style.fontSize === '8px' || node.style.fontSize === '7px' || node.style.fontSize === '10px') && null,
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { style: 'font-size: 9px' }), 0];
  },
  
  addCommands() {
    return {
      toggleSmallFont: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },
});

// Custom extension for heading font size (11px)
const HeadingFont = Mark.create({
  name: 'headingFont',
  
  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: node => (node.style.fontSize === '11px' || node.style.fontSize === '12px' || node.style.fontSize === '13px') && null,
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'tiptap-heading', style: 'font-size: 11px' }), 0];
  },
  
  addCommands() {
    return {
      toggleHeadingFont: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },
});

// ============================================
// FLOWCHART NODE EDITOR COMPONENT (TipTap)
// ============================================

const FlowchartNodeEditor = ({ 
  content, 
  onChange, 
  placeholder,
  onToolbarUpdate,
  onFocusChange,
  editable = false, // Default to false - require double-click to edit
}) => {
  const editorRef = useRef(null);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Minimal configuration for flowchart nodes
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
        strike: false,
        hardBreak: true,
        // Disable underline from StarterKit - we use explicit import
        underline: false,
        paragraph: {
          HTMLAttributes: {
            class: 'flowchart-tiptap-paragraph',
          },
        },
      }),
      Underline,
      Subscript,
      Superscript,
      SmallFont,
      HeadingFont,
    ],
    content: content || '',
    editable: editable, // Control editability based on double-click state
    editorProps: {
      attributes: {
        class: 'flowchart-node-tiptap-editor',
        spellcheck: 'false',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Convert empty paragraph to empty string
      const cleanHtml = html === '<p></p>' || html === '<p class="flowchart-tiptap-paragraph"></p>' ? '' : html;
      onChange(cleanHtml);
    },
    onFocus: () => {
      // Notify parent that editor is focused - disable node dragging
      if (onFocusChange) {
        onFocusChange(true);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (onToolbarUpdate) {
        const { state } = editor;
        const { from, to } = state.selection;
        
        if (from !== to) {
          // There's a text selection - show toolbar
          const { view } = editor;
          const start = view.coordsAtPos(from);
          const end = view.coordsAtPos(to);
          
          const left = (start.left + end.right) / 2;
          const top = start.top - 10;
          
          onToolbarUpdate({
            visible: true,
            position: { top, left },
            editor,
          });
        } else {
          onToolbarUpdate({ visible: false, editor });
        }
      }
    },
    onBlur: ({ editor }) => {
      // Clear selection when editor loses focus to prevent text from staying selected
      // when user drags selection box in canvas
      if (editor && !editor.isDestroyed) {
        const { from } = editor.state.selection;
        editor.commands.setTextSelection(from);
      }
      // Notify parent that editor is blurred - re-enable node dragging
      if (onFocusChange) {
        onFocusChange(false);
      }
      // Hide toolbar with delay to allow button clicks
      if (onToolbarUpdate) {
        setTimeout(() => {
          onToolbarUpdate({ visible: false, editor: null });
        }, 200);
      }
    },
  });

  // Focus editor when entering edit mode (editable becomes true)
  useEffect(() => {
    if (editable && editor && !editor.isDestroyed) {
      // Update editable state
      editor.setEditable(true);
      // Focus at the end of content
      editor.commands.focus('end');
    } else if (!editable && editor && !editor.isDestroyed) {
      // Disable editing
      editor.setEditable(false);
    }
  }, [editable, editor]);

  // Sync content from parent
  useEffect(() => {
    if (editor) {
      const currentContent = editor.getHTML();
      const newContent = content || '';
      
      // Normalize for comparison
      const normalizedCurrent = currentContent === '<p></p>' || currentContent === '<p class="flowchart-tiptap-paragraph"></p>' ? '' : currentContent;
      const normalizedNew = newContent === '<p></p>' || newContent === '<p class="flowchart-tiptap-paragraph"></p>' ? '' : newContent;
      
      // Only update if content actually changed and editor is not focused
      if (normalizedCurrent !== normalizedNew && !editor.isFocused) {
        editor.commands.setContent(newContent, false);
      }
    }
  }, [content, editor]);

  // Store editor ref
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flowchart-node-editor-wrapper nodrag" data-placeholder={placeholder}>
      <EditorContent editor={editor} />
    </div>
  );
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
  return (
    <div className={`flowchart-node flowchart-node-start ${selected ? 'selected' : ''} ${data.isEditing ? 'editing' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <FlowchartNodeEditor
          content={data.label}
          onChange={data.onChange}
          placeholder="Start"
          onToolbarUpdate={data.onToolbarUpdate}
          editable={data.isEditing}
          onFocusChange={data.onFocusChange}
        />
      </div>
    </div>
  );
};

const PhaseNode = ({ data, selected }) => {
  return (
    <div className={`flowchart-node flowchart-node-phase ${selected ? 'selected' : ''} ${data.isEditing ? 'editing' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <FlowchartNodeEditor
          content={data.label}
          onChange={data.onChange}
          placeholder="Phase"
          onToolbarUpdate={data.onToolbarUpdate}
          editable={data.isEditing}
          onFocusChange={data.onFocusChange}
        />
      </div>
    </div>
  );
};

const AktionNode = ({ data, selected }) => {
  return (
    <div className={`flowchart-node flowchart-node-aktion ${selected ? 'selected' : ''} ${data.isEditing ? 'editing' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <FlowchartNodeEditor
          content={data.label}
          onChange={data.onChange}
          placeholder="Aktion"
          onToolbarUpdate={data.onToolbarUpdate}
          editable={data.isEditing}
          onFocusChange={data.onFocusChange}
        />
      </div>
    </div>
  );
};

const LabelNode = ({ data, selected }) => {
  return (
    <div className={`flowchart-node flowchart-node-label ${selected ? 'selected' : ''} ${data.isEditing ? 'editing' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <FlowchartNodeEditor
          content={data.label}
          onChange={data.onChange}
          placeholder="Beschriftung"
          onToolbarUpdate={data.onToolbarUpdate}
          editable={data.isEditing}
          onFocusChange={data.onFocusChange}
        />
      </div>
    </div>
  );
};

const CommentNode = ({ data, selected }) => {
  return (
    <div className={`flowchart-node flowchart-node-comment ${selected ? 'selected' : ''} ${data.isEditing ? 'editing' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <FlowchartNodeEditor
          content={data.label}
          onChange={data.onChange}
          placeholder="Kommentar"
          onToolbarUpdate={data.onToolbarUpdate}
          editable={data.isEditing}
          onFocusChange={data.onFocusChange}
        />
      </div>
    </div>
  );
};

const PositiveNode = ({ data, selected }) => {
  return (
    <div className={`flowchart-node flowchart-node-positive ${selected ? 'selected' : ''} ${data.isEditing ? 'editing' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <FlowchartNodeEditor
          content={data.label}
          onChange={data.onChange}
          placeholder="Positiv"
          onToolbarUpdate={data.onToolbarUpdate}
          editable={data.isEditing}
          onFocusChange={data.onFocusChange}
        />
      </div>
    </div>
  );
};

const NegativeNode = ({ data, selected }) => {
  return (
    <div className={`flowchart-node flowchart-node-negative ${selected ? 'selected' : ''} ${data.isEditing ? 'editing' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <FlowchartNodeEditor
          content={data.label}
          onChange={data.onChange}
          placeholder="Negativ"
          onToolbarUpdate={data.onToolbarUpdate}
          editable={data.isEditing}
          onFocusChange={data.onFocusChange}
        />
      </div>
    </div>
  );
};

const NeutralNode = ({ data, selected }) => {
  return (
    <div className={`flowchart-node flowchart-node-neutral ${selected ? 'selected' : ''} ${data.isEditing ? 'editing' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content">
        <FlowchartNodeEditor
          content={data.label}
          onChange={data.onChange}
          placeholder="Neutral"
          onToolbarUpdate={data.onToolbarUpdate}
          editable={data.isEditing}
          onFocusChange={data.onFocusChange}
        />
      </div>
    </div>
  );
};

const HighNode = ({ data, selected }) => {
  return (
    <div className={`flowchart-node flowchart-node-high ${selected ? 'selected' : ''} ${data.isEditing ? 'editing' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content flowchart-node-with-icon">
        <FlowchartNodeEditor
          content={data.label}
          onChange={data.onChange}
          placeholder="Hoch"
          onToolbarUpdate={data.onToolbarUpdate}
          editable={data.isEditing}
          onFocusChange={data.onFocusChange}
        />
        <div className="flowchart-node-icon flowchart-node-icon-high">
          <ArrowCircleUp size={18} weight="fill" />
        </div>
      </div>
    </div>
  );
};

const LowNode = ({ data, selected }) => {
  return (
    <div className={`flowchart-node flowchart-node-low ${selected ? 'selected' : ''} ${data.isEditing ? 'editing' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content flowchart-node-with-icon">
        <FlowchartNodeEditor
          content={data.label}
          onChange={data.onChange}
          placeholder="Runter"
          onToolbarUpdate={data.onToolbarUpdate}
          editable={data.isEditing}
          onFocusChange={data.onFocusChange}
        />
        <div className="flowchart-node-icon flowchart-node-icon-low">
          <ArrowCircleDown size={18} weight="fill" />
        </div>
      </div>
    </div>
  );
};

const EqualNode = ({ data, selected }) => {
  return (
    <div className={`flowchart-node flowchart-node-equal ${selected ? 'selected' : ''} ${data.isEditing ? 'editing' : ''}`}>
      <NodeHandles selected={selected} />
      <div className="flowchart-node-content flowchart-node-with-icon">
        <FlowchartNodeEditor
          content={data.label}
          onChange={data.onChange}
          placeholder="Gleich"
          onToolbarUpdate={data.onToolbarUpdate}
          editable={data.isEditing}
          onFocusChange={data.onFocusChange}
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
  aktion: AktionNode,
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
      { type: 'aktion', label: 'Aktion', icon: Square, color: '#003366', bgColor: '#FFFFFF' },
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
  
  // Inline Text Toolbar state
  const [toolbarState, setToolbarState] = useState({
    visible: false,
    position: { top: 0, left: 0 },
    editor: null,
  });
  
  // Handle toolbar updates from nodes
  const handleToolbarUpdate = useCallback((update) => {
    setToolbarState(prev => ({
      ...prev,
      ...update,
    }));
  }, []);
  
  // Get active formatting states for toolbar
  const getActiveFormats = useCallback(() => {
    const { editor } = toolbarState;
    if (!editor) return {};
    return {
      heading: editor.isActive('headingFont'),
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      fontSize: editor.isActive('smallFont'),
      superscript: editor.isActive('superscript'),
      subscript: editor.isActive('subscript'),
      bulletList: false, // Not supported in flowchart nodes
    };
  }, [toolbarState.editor]);
  
  // Handle toolbar commands
  const handleFormatCommand = useCallback((command) => {
    const { editor } = toolbarState;
    if (!editor) return;
    
    switch (command) {
      case 'heading':
        editor.chain().focus().toggleHeadingFont().run();
        break;
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'fontSize':
        editor.chain().focus().toggleSmallFont().run();
        break;
      case 'superscript':
        editor.chain().focus().toggleSuperscript().run();
        break;
      case 'subscript':
        editor.chain().focus().toggleSubscript().run();
        break;
      case 'bulletList':
        // Not supported in flowchart nodes
        break;
      case 'removeFormat':
        editor.chain().focus().clearNodes().unsetAllMarks().run();
        break;
      default:
        break;
    }
  }, [toolbarState.editor]);
  
  // Initialize nodes with onChange handlers
  const initializeNodes = useCallback((nodes) => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onChange: () => {}, // Will be set properly after setNodes is available
        onToolbarUpdate: () => {}, // Will be set properly after setNodes is available
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
  const [editingNodeId, setEditingNodeId] = useState(null); // Track which node is in edit mode

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

  // Handle double-click on node to enter edit mode
  const handleNodeDoubleClick = useCallback((event, node) => {
    setEditingNodeId(node.id);
  }, []);

  // Exit edit mode when clicking on the canvas (pane)
  const handlePaneClick = useCallback(() => {
    if (editingNodeId) {
      setEditingNodeId(null);
    }
  }, [editingNodeId]);

  // Sync nodes with onChange, onToolbarUpdate, isEditing, and onFocusChange handlers
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onChange: (newLabel) => handleNodeLabelChange(node.id, newLabel),
          onToolbarUpdate: handleToolbarUpdate,
          isEditing: node.id === editingNodeId,
          onFocusChange: (focused) => {
            // When editor loses focus, exit edit mode
            if (!focused) {
              setEditingNodeId(null);
            }
          },
        },
      }))
    );
  }, [handleNodeLabelChange, handleToolbarUpdate, setNodes, editingNodeId]);

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
          onToolbarUpdate: handleToolbarUpdate,
        },
      }));
      setNodes(restoredNodes);
      setEdges(previousState.edges);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex, setNodes, setEdges, handleNodeLabelChange, handleToolbarUpdate]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      const restoredNodes = nextState.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: (newLabel) => handleNodeLabelChange(node.id, newLabel),
          onToolbarUpdate: handleToolbarUpdate,
        },
      }));
      setNodes(restoredNodes);
      setEdges(nextState.edges);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex, setNodes, setEdges, handleNodeLabelChange, handleToolbarUpdate]);

  // Reset Zoom function
  const handleResetZoom = useCallback(() => {
    fitView({ 
      padding: 0.2, 
      duration: 400,
      minZoom: 0.857,
      maxZoom: 0.857,
    });
  }, [fitView]);

  // Reset Flowchart to initial state (only Start node)
  const handleResetFlowchart = useCallback(() => {
    const initialNode = {
      id: '1',
      type: 'start',
      position: { x: 250, y: 50 },
      data: {
        label: 'Start',
        onChange: (newLabel) => handleNodeLabelChange('1', newLabel),
        onToolbarUpdate: handleToolbarUpdate,
      },
    };
    setNodes([initialNode]);
    setEdges([]);
    setNodeIdCounter(2);
    setTimeout(() => saveToHistory(), 100);
  }, [setNodes, setEdges, handleNodeLabelChange, handleToolbarUpdate, saveToHistory]);

  // Check if flowchart has been modified (more than just a Start node or has edges)
  const hasFlowchartChanges = nodes.length > 1 || edges.length > 0 || 
    (nodes.length === 1 && nodes[0].type !== 'start');

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
          strokeWidth: 1,
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
            strokeWidth: 1,
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
                strokeWidth: 1,
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
    aktion: 'Aktion',
    label: 'Beschriftung',
    comment: 'Kommentar',
    positive: 'Positiv',
    negative: 'Negativ',
    neutral: 'Neutral',
    high: 'Hoch',
    low: 'Runter',
    equal: 'Gleich',
  };

  // Helper function to check if a position collides with existing nodes
  const checkCollision = useCallback((x, y, nodeWidth, nodeHeight, existingNodes) => {
    const padding = 30; // Increased padding around nodes to avoid overlap
    for (const node of existingNodes) {
      const existingWidth = node.width ?? node.measured?.width ?? 150;
      const existingHeight = node.height ?? node.measured?.height ?? 40;
      
      // Check if rectangles overlap with padding
      if (
        x < node.position.x + existingWidth + padding &&
        x + nodeWidth + padding > node.position.x &&
        y < node.position.y + existingHeight + padding &&
        y + nodeHeight + padding > node.position.y
      ) {
        return true;
      }
    }
    return false;
  }, []);

  // Find free position using spiral search from center
  const findFreePosition = useCallback((centerX, centerY, nodeWidth, nodeHeight, existingNodes) => {
    const step = 80; // Step size for spiral search
    const maxRadius = 1000; // Maximum search radius
    let radius = 0;
    let angle = 0;
    
    // Start at center
    let x = centerX - nodeWidth / 2;
    let y = centerY - nodeHeight / 2;
    
    // Check center first
    if (!checkCollision(x, y, nodeWidth, nodeHeight, existingNodes)) {
      return { x, y };
    }
    
    // Spiral search outward
    while (radius < maxRadius) {
      radius += step;
      const positionsPerCircle = Math.max(8, Math.floor(radius / 20)); // More positions as radius increases
      
      for (let i = 0; i < positionsPerCircle; i++) {
        angle = (i * Math.PI * 2) / positionsPerCircle;
        x = centerX - nodeWidth / 2 + Math.cos(angle) * radius;
        y = centerY - nodeHeight / 2 + Math.sin(angle) * radius;
        
        if (!checkCollision(x, y, nodeWidth, nodeHeight, existingNodes)) {
          return { x, y };
        }
      }
    }
    
    // Fallback: return center position (will overlap but better than random)
    return { x: centerX - nodeWidth / 2, y: centerY - nodeHeight / 2 };
  }, [checkCollision]);

  // Add node function
  const addNode = useCallback((type, position = null) => {
    let finalPosition;
    
    if (position) {
      // Use provided position (e.g., from drag & drop)
      finalPosition = position;
    } else {
      // Calculate center of viewport
      if (!reactFlowInstance || !reactFlowWrapper.current) {
        // Fallback if reactFlowInstance not ready
        finalPosition = {
          x: Math.random() * 300 + 100,
          y: Math.random() * 300 + 100,
        };
      } else {
        const viewport = reactFlowWrapper.current.getBoundingClientRect();
        const centerX = viewport.width / 2;
        const centerY = viewport.height / 2;
        
        // Convert screen coordinates to flow coordinates
        const flowPosition = reactFlowInstance.screenToFlowPosition({
          x: centerX,
          y: centerY,
        });
        
        // Default node dimensions
        const nodeWidth = 150;
        const nodeHeight = 40;
        
        // Use current nodes state to check collisions and find free position
        setNodes((currentNodes) => {
          const freePosition = findFreePosition(
            flowPosition.x,
            flowPosition.y,
            nodeWidth,
            nodeHeight,
            currentNodes
          );
          
          const newNode = {
            id: `${nodeIdCounter}`,
            type,
            position: freePosition,
            data: {
              label: nodeTypeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1),
              onChange: (newLabel) => handleNodeLabelChange(`${nodeIdCounter}`, newLabel),
              onToolbarUpdate: handleToolbarUpdate,
            },
          };
          
          // Update nodeIdCounter after adding node
          setTimeout(() => {
            setNodeIdCounter((prev) => prev + 1);
            saveToHistory();
          }, 100);
          
          return [...currentNodes, newNode];
        });
        
        // Return early since setNodes handles the update
        return;
      }
    }

    // For drag & drop or fallback position
    const newNode = {
      id: `${nodeIdCounter}`,
      type,
      position: finalPosition,
      data: {
        label: nodeTypeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1),
        onChange: (newLabel) => handleNodeLabelChange(`${nodeIdCounter}`, newLabel),
        onToolbarUpdate: handleToolbarUpdate,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((prev) => prev + 1);
    setTimeout(() => saveToHistory(), 100);
  }, [nodeIdCounter, setNodes, handleNodeLabelChange, handleToolbarUpdate, saveToHistory, reactFlowInstance, findFreePosition]);

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

  // Generate static SVG from current nodes and edges for print export
  // Matches the exact styles from FlowchartBlock.css
  const generateStaticSvg = useCallback(() => {
    if (nodes.length === 0) return null;
    
    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      const width = node.width || node.measured?.width || 150;
      const height = node.height || node.measured?.height || 40;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    });
    
    const padding = 20;
    const viewBox = `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
    
    // Node type styles - matching FlowchartBlock.css exactly
    // Text color = border color (as per the CSS)
    const nodeStyles = {
      start: { fill: '#E8FAF9', stroke: '#47D1C6', textColor: '#47D1C6', strokeStyle: 'solid' },
      phase: { fill: '#E5F2FF', stroke: '#003366', textColor: '#003366', strokeStyle: 'solid' },
      aktion: { fill: '#FFFFFF', stroke: '#003366', textColor: '#003366', strokeStyle: 'solid' },
      positive: { fill: '#ECF9EB', stroke: '#52C41A', textColor: '#52C41A', strokeStyle: 'solid' },
      negative: { fill: '#FCEAE8', stroke: '#EB5547', textColor: '#EB5547', strokeStyle: 'solid' },
      neutral: { fill: '#FFF7E6', stroke: '#FAAD14', textColor: '#B27700', strokeStyle: 'solid' },
      high: { fill: 'white', stroke: '#003366', textColor: '#003366', strokeStyle: 'solid' },
      low: { fill: 'white', stroke: '#003366', textColor: '#003366', strokeStyle: 'solid' },
      equal: { fill: 'white', stroke: '#003366', textColor: '#003366', strokeStyle: 'solid' },
      label: { fill: 'transparent', stroke: 'none', textColor: '#6b7280', strokeStyle: 'none' },
      comment: { fill: 'white', stroke: '#3399FF', textColor: '#3399FF', strokeStyle: 'dashed' },
    };
    
    // Strip HTML tags for SVG text
    const stripHtml = (html) => {
      if (!html) return '';
      return html.replace(/<[^>]*>/g, '').trim();
    };
    
    // SVG path data for Phosphor icons (filled, 256x256 viewBox scaled to 18x18)
    const iconPaths = {
      // ArrowCircleUp - filled
      high: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,101.66a8,8,0,0,1-11.32,0L136,107.31V168a8,8,0,0,1-16,0V107.31l-18.34,18.35a8,8,0,0,1-11.32-11.32l32-32a8,8,0,0,1,11.32,0l32,32A8,8,0,0,1,165.66,125.66Z',
      // ArrowCircleDown - filled
      low: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,109.66-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L120,140.69V88a8,8,0,0,1,16,0v52.69l18.34-18.35a8,8,0,0,1,11.32,11.32Z',
      // ArrowCircleRight - filled  
      equal: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,109.66-32,32a8,8,0,0,1-11.32-11.32L148.69,136H88a8,8,0,0,1,0-16h60.69l-18.35-18.34a8,8,0,0,1,11.32-11.32l32,32A8,8,0,0,1,173.66,133.66Z',
    };
    
    const iconColors = {
      high: '#EB5547',
      low: '#3399FF', 
      equal: '#FAAD14',
    };

    // Generate node elements
    const nodeElements = nodes.map(node => {
      const width = node.width || node.measured?.width || 150;
      const height = node.height || node.measured?.height || 40;
      const style = nodeStyles[node.type] || nodeStyles.phase;
      const label = stripHtml(node.data?.label || '');
      const x = node.position.x;
      const y = node.position.y;
      // All nodes have rx=4 except label which has no border
      const rx = 4;
      
      // For label node - no rect, just text
      if (node.type === 'label') {
        return `
          <g transform="translate(${x}, ${y})">
            <text 
              x="${width / 2}" 
              y="${height / 2}" 
              text-anchor="middle" 
              dominant-baseline="middle" 
              fill="${style.textColor}"
              font-family="Roboto, sans-serif"
              font-size="12"
              font-weight="400"
            >${label}</text>
          </g>
        `;
      }
      
      // Stroke dasharray for comment node
      const strokeDasharray = style.strokeStyle === 'dashed' ? 'stroke-dasharray="4,2"' : '';
      
      // Check if node has icon (high, low, equal)
      const hasIcon = ['high', 'low', 'equal'].includes(node.type);
      const iconPath = iconPaths[node.type];
      const iconColor = iconColors[node.type];
      
      // Calculate text and icon positions for nodes with icons
      // Match CSS: gap: 2px, icon at end, text fills remaining space
      const iconSize = 18;
      const gap = 1; // Minimal gap between text and icon
      const padding = 6; // Inner padding from node edges
      
      // For nodes with icons: text is centered in left area, icon is at right with small padding
      const iconX = hasIcon ? width - iconSize - padding : 0;
      // Text center: account for icon and gap if present
      const textX = hasIcon ? (width - iconSize - gap - padding) / 2 + padding : width / 2;
      
      return `
        <g transform="translate(${x}, ${y})">
          <rect 
            width="${width}" 
            height="${height}" 
            rx="${rx}" 
            fill="${style.fill}" 
            stroke="${style.stroke}" 
            stroke-width="1"
            ${strokeDasharray}
          />
          <text 
            x="${textX}" 
            y="${height / 2}" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            fill="${style.textColor}"
            font-family="Roboto, sans-serif"
            font-size="12"
            font-weight="400"
          >${label}</text>
          ${hasIcon ? `
            <g transform="translate(${iconX}, ${(height - iconSize) / 2})">
              <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 256 256">
                <path d="${iconPath}" fill="${iconColor}"/>
              </svg>
            </g>
          ` : ''}
        </g>
      `;
    }).join('');
    
    // Generate edge elements with arrows
    const edgeElements = edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return '';
      
      const sourceWidth = sourceNode.width || sourceNode.measured?.width || 150;
      const sourceHeight = sourceNode.height || sourceNode.measured?.height || 40;
      const targetWidth = targetNode.width || targetNode.measured?.width || 150;
      const targetHeight = targetNode.height || targetNode.measured?.height || 40;
      
      const sourceCenter = {
        x: sourceNode.position.x + sourceWidth / 2,
        y: sourceNode.position.y + sourceHeight / 2,
      };
      const targetCenter = {
        x: targetNode.position.x + targetWidth / 2,
        y: targetNode.position.y + targetHeight / 2,
      };
      
      // Calculate start/end points on node edges
      const dx = targetCenter.x - sourceCenter.x;
      const dy = targetCenter.y - sourceCenter.y;
      
      let startX, startY, endX, endY;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal connection
        if (dx > 0) {
          startX = sourceNode.position.x + sourceWidth;
          startY = sourceCenter.y;
          endX = targetNode.position.x;
          endY = targetCenter.y;
        } else {
          startX = sourceNode.position.x;
          startY = sourceCenter.y;
          endX = targetNode.position.x + targetWidth;
          endY = targetCenter.y;
        }
      } else {
        // Vertical connection
        if (dy > 0) {
          startX = sourceCenter.x;
          startY = sourceNode.position.y + sourceHeight;
          endX = targetCenter.x;
          endY = targetNode.position.y;
        } else {
          startX = sourceCenter.x;
          startY = sourceNode.position.y;
          endX = targetCenter.x;
          endY = targetNode.position.y + targetHeight;
        }
      }
      
      // Create smooth step path
      const midY = (startY + endY) / 2;
      const path = Math.abs(dx) > Math.abs(dy) 
        ? `M ${startX} ${startY} L ${(startX + endX) / 2} ${startY} L ${(startX + endX) / 2} ${endY} L ${endX} ${endY}`
        : `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
      
      // Edge label
      const labelX = (startX + endX) / 2;
      const labelY = (startY + endY) / 2;
      const label = edge.data?.label ? stripHtml(edge.data.label) : '';
      
      return `
        <g>
          <path 
            d="${path}" 
            fill="none" 
            stroke="#003366" 
            stroke-width="1"
            marker-end="url(#arrowhead)"
          />
          ${label ? `
            <rect x="${labelX - 20}" y="${labelY - 8}" width="40" height="16" fill="white" stroke="#e5e7eb" rx="3"/>
            <text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" fill="#374151" font-size="11" font-family="Quicksand, sans-serif" font-weight="500">${label}</text>
          ` : ''}
        </g>
      `;
    }).join('');
    
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" style="width: 100%; height: 100%;">
        <defs>
          <!-- Arrow marker matching ReactFlow style - open arrowhead -->
          <marker 
            id="arrowhead" 
            markerWidth="15" 
            markerHeight="15" 
            viewBox="-10 -10 20 20"
            refX="0" 
            refY="0" 
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <polyline 
              stroke="#003366" 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="1" 
              fill="none" 
              points="-5,-4 0,0 -5,4"
            />
          </marker>
        </defs>
        ${edgeElements}
        ${nodeElements}
      </svg>
    `;
  }, [nodes, edges]);

  // Handle save - also generate static SVG for print
  const handleSave = useCallback(async () => {
    const nodesToSave = nodes.map(({ data, ...node }) => ({
      ...node,
      data: {
        label: data.label,
      },
    }));
    
    // Generate static SVG for print export using manual rendering
    const staticSvg = generateStaticSvg();
    
    onSave({
      nodes: nodesToSave,
      edges,
      nodeIdCounter,
      staticSvg, // Include the static SVG for print
    });
  }, [nodes, edges, nodeIdCounter, onSave, generateStaticSvg]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        // If editing a node, exit edit mode first
        if (editingNodeId) {
          setEditingNodeId(null);
        } else {
          onCancel();
        }
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
  }, [handleSave, onCancel, handleUndo, handleRedo, editingNodeId]);

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
            <FloppyDisk size={16} weight="regular" />
            <span>Speichern</span>
          </button>
          <Dialog.Close asChild>
            <button className="flowchart-editor-close-btn">
              <X size={16} weight="regular" />
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
          onNodeDoubleClick={handleNodeDoubleClick}
          onPaneClick={handlePaneClick}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: 'floating',
            animated: false,
            style: { 
              strokeWidth: 1,
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
          snapGrid={[14, 14]}
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
          {/* Custom Background that moves with viewport - like tldraw/Miro */}
          <CustomDotBackground gap={14} dotSize={1} color="rgba(0, 0, 0, 0.1)" />
          
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
                  case 'aktion': return '#003366';
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
              const gridUnits = Math.round(indicator.distance / 14);
              
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
            {/* Undo/Redo */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Rückgängig (Cmd+Z)"
              className="flowchart-toolbar-btn"
            >
              <ArrowCounterClockwise size={16} weight="regular" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Wiederherstellen (Cmd+Shift+Z)"
              className="flowchart-toolbar-btn"
            >
              <ArrowClockwise size={16} weight="regular" />
            </button>
            <div className="flowchart-toolbar-separator" />
            {/* Interaction Mode Tools */}
            <button
              onClick={() => setInteractionMode('select')}
              title="Auswahl (V)"
              className={`flowchart-toolbar-btn ${interactionMode === 'select' ? 'active' : ''}`}
            >
              <Cursor size={16} weight="regular" />
            </button>
            <button
              onClick={() => setInteractionMode('pan')}
              title="Verschieben (H)"
              className={`flowchart-toolbar-btn ${interactionMode === 'pan' ? 'active' : ''}`}
            >
              <Hand size={16} weight="regular" />
            </button>
            <button
              onClick={() => setInteractionMode('eraser')}
              title="Radierer (E)"
              className={`flowchart-toolbar-btn ${interactionMode === 'eraser' ? 'active' : ''}`}
            >
              <EraserIcon size={16} weight="regular" />
            </button>
            <div className="flowchart-toolbar-separator" />
            {/* Reset Flowchart */}
            <button
              onClick={handleResetFlowchart}
              disabled={!hasFlowchartChanges}
              title="Flowchart zurücksetzen"
              className="flowchart-toolbar-btn"
            >
              <Trash size={16} weight="regular" />
            </button>
            <div className="flowchart-toolbar-separator" />
            {/* Zoom Reset */}
            <button 
              onClick={handleResetZoom} 
              title="Zoom zurücksetzen"
              className="flowchart-toolbar-btn"
            >
              <ArrowsIn size={16} weight="regular" />
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
                    // Custom icons with letters for Phase and Aktion
                    const renderIcon = () => {
                      if (config.type === 'phase' || config.type === 'aktion') {
                        const letter = config.type === 'phase' ? 'P' : 'A';
                        return (
                          <div className="flowchart-toolbar-letter-icon" style={{ 
                            color: config.color,
                            borderColor: config.color,
                            background: config.bgColor,
                          }}>
                            {letter}
                          </div>
                        );
                      }
                      return <Icon size={20} weight="regular" style={{ color: config.color }} />;
                    };
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
                        {renderIcon()}
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
    
    {/* Inline Text Toolbar for Flowchart Nodes */}
    <InlineTextToolbar
      visible={toolbarState.visible}
      position={toolbarState.position}
      activeStates={getActiveFormats()}
      onCommand={handleFormatCommand}
      usePortal={true}
    />
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

