"use client"
import { useCallback, useState, useRef, useEffect } from "react"
import { NodeViewWrapper } from "@tiptap/react"
import { 
  ArrowsOutLineHorizontal,
  ArrowsInLineHorizontal,
  DownloadSimple, 
  Trash,
  PencilSimple 
} from "@phosphor-icons/react"
import { Toggle } from "../../ui/toggle"
import "./image-node-pro.scss"

/**
 * ImageNodePro component - Enhanced image with display mode, caption, and controls
 */
export const ImageNodePro = ({ node, updateAttributes, deleteNode, selected, editor }) => {
  const { src, alt, title, caption, displayMode } = node.attrs
  const [isEditing, setIsEditing] = useState(false)
  const [localCaption, setLocalCaption] = useState(caption || "")
  const [editorFocused, setEditorFocused] = useState(false)
  const captionInputRef = useRef(null)

  // Track editor focus state with polling for reliability
  useEffect(() => {
    if (!editor) return

    const checkFocus = () => {
      setEditorFocused(editor.isFocused)
    }

    // Check initial state
    checkFocus()

    // Listen to focus/blur events
    editor.on('focus', checkFocus)
    editor.on('blur', checkFocus)
    
    // Also listen to selection changes as a backup
    editor.on('selectionUpdate', checkFocus)

    return () => {
      editor.off('focus', checkFocus)
      editor.off('blur', checkFocus)
      editor.off('selectionUpdate', checkFocus)
    }
  }, [editor])

  // Update local caption when node attrs change
  useEffect(() => {
    setLocalCaption(caption || "")
  }, [caption])

  const handleDisplayModeChange = useCallback(
    (newMode) => {
      updateAttributes({ displayMode: newMode })
    },
    [updateAttributes]
  )

  const handleCaptionChange = useCallback(
    (e) => {
      setLocalCaption(e.target.value)
    },
    []
  )

  const handleCaptionBlur = useCallback(() => {
    updateAttributes({ caption: localCaption })
    setIsEditing(false)
  }, [localCaption, updateAttributes])

  const handleCaptionKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleCaptionBlur()
      }
      if (e.key === "Escape") {
        setLocalCaption(caption || "")
        setIsEditing(false)
      }
    },
    [caption, handleCaptionBlur]
  )

  const handleDownload = useCallback(() => {
    if (!src) return

    const link = document.createElement("a")
    link.href = src
    link.download = title || alt || "image"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [src, title, alt])

  const handleDelete = useCallback(() => {
    deleteNode()
  }, [deleteNode])

  const startEditing = useCallback(() => {
    setIsEditing(true)
    setTimeout(() => {
      captionInputRef.current?.focus()
      captionInputRef.current?.select()
    }, 0)
  }, [])

  if (!src) {
    return null
  }

  const isInline = displayMode === "inline"
  const isFull = displayMode === "full"
  
  // Only show toolbar when both selected AND editor is focused
  const showToolbar = selected && editorFocused

  return (
    <NodeViewWrapper
      className={`image-node-pro ${showToolbar ? "is-selected" : ""}`}
      data-display-mode={displayMode}
    >
      <figure className="image-node-pro-figure" data-display-mode={displayMode}>
        {/* Toolbar - only visible when selected AND editor focused */}
        {showToolbar && (
          <div className="image-node-pro-toolbar" contentEditable={false}>
            <Toggle
              size="sm"
              pressed={isInline}
              aria-label="Inline-Breite"
              onMouseDown={(e) => {
                e.preventDefault()
                handleDisplayModeChange("inline")
              }}
              className="h-8 w-8 p-1"
              title="Inline (Textbreite)"
            >
              <ArrowsInLineHorizontal 
                size={16} 
                weight="bold" 
                style={{ width: '16px', height: '16px', flexShrink: 0 }} 
              />
            </Toggle>
            <Toggle
              size="sm"
              pressed={isFull}
              aria-label="Volle Breite"
              onMouseDown={(e) => {
                e.preventDefault()
                handleDisplayModeChange("full")
              }}
              className="h-8 w-8 p-1"
              title="Volle Breite"
            >
              <ArrowsOutLineHorizontal 
                size={16} 
                weight="bold" 
                style={{ width: '16px', height: '16px', flexShrink: 0 }} 
              />
            </Toggle>

            <div className="image-node-pro-toolbar-divider" />

            <Toggle
              size="sm"
              pressed={false}
              aria-label="Bildunterschrift bearbeiten"
              onMouseDown={(e) => {
                e.preventDefault()
                startEditing()
              }}
              className="h-8 w-8 p-1"
              title="Bildunterschrift bearbeiten"
            >
              <PencilSimple 
                size={16} 
                weight="bold" 
                style={{ width: '16px', height: '16px', flexShrink: 0 }} 
              />
            </Toggle>
            <Toggle
              size="sm"
              pressed={false}
              aria-label="Bild herunterladen"
              onMouseDown={(e) => {
                e.preventDefault()
                handleDownload()
              }}
              className="h-8 w-8 p-1"
              title="Bild herunterladen"
            >
              <DownloadSimple 
                size={16} 
                weight="bold" 
                style={{ width: '16px', height: '16px', flexShrink: 0 }} 
              />
            </Toggle>
            <Toggle
              size="sm"
              pressed={false}
              aria-label="Bild löschen"
              onMouseDown={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="h-8 w-8 p-1 hover:bg-red-50 [&_svg]:text-red-500 hover:[&_svg]:!text-red-600"
              title="Bild löschen"
            >
              <Trash 
                size={16} 
                weight="bold" 
                style={{ width: '16px', height: '16px', flexShrink: 0 }} 
              />
            </Toggle>
          </div>
        )}

        {/* Image */}
        <div className="image-node-pro-image-wrapper">
          <img
            src={src}
            alt={alt || ""}
            title={title || ""}
            className="image-node-pro-image"
            draggable={false}
          />
        </div>

        {/* Caption */}
        {(isEditing || caption) && (
          <figcaption className="image-node-pro-caption" contentEditable={false}>
            {isEditing ? (
              <input
                ref={captionInputRef}
                type="text"
                value={localCaption}
                onChange={handleCaptionChange}
                onBlur={handleCaptionBlur}
                onKeyDown={handleCaptionKeyDown}
                placeholder="Bildunterschrift eingeben..."
                className="image-node-pro-caption-input"
              />
            ) : (
              <span
                className="image-node-pro-caption-text"
                onClick={startEditing}
              >
                {caption}
              </span>
            )}
          </figcaption>
        )}
      </figure>
    </NodeViewWrapper>
  )
}

export default ImageNodePro
