import React, { forwardRef } from 'react';

const TitleBlock = forwardRef(({ content, onChange, onKeyDown }, ref) => {
  return (
    <input
      ref={ref}
      type="text"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Titel der SOP"
      className="w-full text-3xl font-bold text-foreground border-none outline-none bg-transparent mb-6 print:text-black"
      aria-label="SOP Titel"
    />
  );
});

TitleBlock.displayName = 'TitleBlock';

export default TitleBlock;

