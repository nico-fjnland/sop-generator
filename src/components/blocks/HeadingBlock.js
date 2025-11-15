import React, { forwardRef } from 'react';

const HeadingBlock = forwardRef(({ content, onChange, onKeyDown }, ref) => {
  return (
    <input
      ref={ref}
      type="text"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Überschrift"
      className="w-full text-2xl font-semibold text-foreground border-none outline-none bg-transparent mb-4 mt-6 print:text-black"
      aria-label="Überschrift"
    />
  );
});

HeadingBlock.displayName = 'HeadingBlock';

export default HeadingBlock;

