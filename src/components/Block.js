import React, { useState, useRef, useEffect, memo } from 'react';
import { IconButton } from './ui/icon-button';
import TitleBlock from './blocks/TitleBlock';
import HeadingBlock from './blocks/HeadingBlock';
import TextBlock from './blocks/TextBlock';
import TableBlock from './blocks/TableBlock';
import TipTapTableBlock from './blocks/TipTapTableBlock';
import ListBlock from './blocks/ListBlock';
import ImageBlock from './blocks/ImageBlock';
import DividerBlock from './blocks/DividerBlock';
import ContentBoxBlock from './blocks/ContentBoxBlock';
import FlowchartBlock from './blocks/FlowchartBlock';
import SourceBlock from './blocks/SourceBlock';
import { X } from 'lucide-react';

const Block = memo(({ block, onUpdate, onDelete, onAddAfter, isLast, isInsideContentBox = false, isDragging, usedCategories = [], isRightColumn = false, iconOnRight = false, dragHandleProps = {}, onSortBlocks }) => {
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const blockRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (block.type === 'title' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [block.type]);

  const handleKeyDown = (e) => {
    // Don't handle special keys for contentbox blocks (they have their own inner blocks)
    if (block.type === 'contentbox') {
      return;
    }
    
    // Inside content boxes, just allow normal text editing
    if (isInsideContentBox) {
      return;
    }
    
    // Handle Enter key for text blocks (outside content boxes)
    if (e.key === 'Enter' && !e.shiftKey && block.type === 'text') {
      e.preventDefault();
      onAddAfter('text', block.id);
    } else if (e.key === 'Backspace' && e.target.value === '' && block.type !== 'title') {
      e.preventDefault();
      onDelete(block.id);
    }
  };

  const renderBlock = () => {
    switch (block.type) {
      case 'title':
        return (
          <TitleBlock
            ref={inputRef}
            content={block.content}
            onChange={(content) => onUpdate(block.id, content)}
            onKeyDown={handleKeyDown}
          />
        );
      case 'heading':
        return (
          <HeadingBlock
            ref={inputRef}
            content={block.content}
            onChange={(content) => onUpdate(block.id, content)}
            onKeyDown={handleKeyDown}
          />
        );
      case 'text':
        return (
          <TextBlock
            ref={inputRef}
            content={block.content}
            onChange={(content) => onUpdate(block.id, content)}
            onKeyDown={handleKeyDown}
            isInsideContentBox={isInsideContentBox}
            onAddAfter={isInsideContentBox ? onAddAfter : undefined}
            blockId={block.id}
          />
        );
      case 'table':
        return (
          <TableBlock
            content={block.content}
            onChange={(content) => onUpdate(block.id, content)}
          />
        );
      case 'tiptaptable':
        return (
          <TipTapTableBlock
            content={block.content}
            onChange={(content) => onUpdate(block.id, content)}
            onDelete={onDelete}
            isDragging={isDragging}
            blockId={block.id}
            usedCategories={isInsideContentBox ? [] : usedCategories}
            isRightColumn={isRightColumn}
            dragHandleProps={dragHandleProps}
            onSortBlocks={!isInsideContentBox ? onSortBlocks : undefined}
            onAddBoxAfter={
              !isInsideContentBox && onAddAfter
                ? (categoryId) => onAddAfter('contentbox', block.id, categoryId)
                : undefined
            }
            onAddBlockAfter={
              !isInsideContentBox && onAddAfter
                ? (blockType) => onAddAfter(blockType, block.id)
                : undefined
            }
          />
        );
      case 'list':
        return (
          <ListBlock
            content={block.content}
            onChange={(content) => onUpdate(block.id, content)}
          />
        );
      case 'image':
        return (
          <ImageBlock
            content={block.content}
            onChange={(content) => onUpdate(block.id, content)}
          />
        );
      case 'divider':
        return <DividerBlock />;
      case 'flowchart':
        return (
          <FlowchartBlock
            content={block.content}
            onChange={(content) => onUpdate(block.id, content)}
          />
        );
      case 'contentbox':
        return (
          <ContentBoxBlock
            content={block.content || { category: 'definition', blocks: [{ id: '1', type: 'text', content: '' }] }}
            onChange={(content) => onUpdate(block.id, content)}
            onDelete={onDelete}
            isDragging={isDragging}
            blockId={block.id}
            usedCategories={isInsideContentBox ? [] : usedCategories}
            isRightColumn={isRightColumn}
            iconOnRight={iconOnRight}
            dragHandleProps={dragHandleProps}
            onSortBlocks={!isInsideContentBox ? onSortBlocks : undefined}
            onAddBoxAfter={
              !isInsideContentBox && onAddAfter
                ? (categoryId) => onAddAfter('contentbox', block.id, categoryId)
                : undefined
            }
            onAddBlockAfter={
              !isInsideContentBox && onAddAfter
                ? (blockType) => onAddAfter(blockType, block.id)
                : undefined
            }
          />
        );
      case 'source':
        return (
          <SourceBlock
            content={block.content || { blocks: [{ id: '1', type: 'text', content: '' }] }}
            onChange={(content) => onUpdate(block.id, content)}
            onDelete={onDelete}
            isDragging={isDragging}
            blockId={block.id}
            usedCategories={isInsideContentBox ? [] : usedCategories}
            isRightColumn={isRightColumn}
            dragHandleProps={dragHandleProps}
            onSortBlocks={!isInsideContentBox ? onSortBlocks : undefined}
            onAddBoxAfter={
              !isInsideContentBox && onAddAfter
                ? (categoryId) => onAddAfter('contentbox', block.id, categoryId)
                : undefined
            }
            onAddBlockAfter={
              !isInsideContentBox && onAddAfter
                ? (blockType) => onAddAfter(blockType, block.id)
                : undefined
            }
          />
        );
      default:
        return null;
    }
  };

  const handleDelete = () => {
    // Prevent deleting the last title block
    if (block.type === 'title') {
      const shouldDelete = window.confirm('Möchten Sie wirklich den Titel löschen? Es wird automatisch ein neuer leerer Titel erstellt.');
      if (!shouldDelete) return;
    }
    onDelete(block.id);
  };

  return (
    <div 
      ref={blockRef} 
      className="block-wrapper mb-1 relative group"
      data-block-id={block.id}
      onMouseEnter={() => setShowDeleteButton(true)}
      onMouseLeave={() => setShowDeleteButton(false)}
    >
      {renderBlock()}
      
      {/* Delete Button - appears on hover, but not inside content boxes */}
      {showDeleteButton && !isInsideContentBox && block.type !== 'title' && block.type !== 'contentbox' && block.type !== 'tiptaptable' && block.type !== 'source' && (
        <IconButton
          variant="destructive"
          size="icon"
          className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity no-print z-10 shadow-md"
          onClick={handleDelete}
          aria-label="Block löschen"
        >
          <X className="h-3 w-3" />
        </IconButton>
      )}
      
      {/* Delete Button for title - appears on hover but with different styling, not inside content boxes */}
      {showDeleteButton && !isInsideContentBox && block.type === 'title' && block.content && (
        <IconButton
          variant="outline"
          size="icon"
          className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity no-print z-10 shadow-md bg-background"
          onClick={handleDelete}
          aria-label="Titel löschen"
        >
          <X className="h-3 w-3" />
        </IconButton>
      )}
      
    </div>
  );
});

export default Block;

