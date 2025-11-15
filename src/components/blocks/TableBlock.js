import React, { useState, useEffect } from 'react';

const TableBlock = ({ content, onChange }) => {
  const [rows, setRows] = useState(
    content && content.rows ? content.rows : [['', ''], ['', '']]
  );
  const [cols, setCols] = useState(content && content.cols ? content.cols : 2);

  // Sync state when content prop changes
  useEffect(() => {
    if (content && content.rows && content.cols) {
      setRows(content.rows);
      setCols(content.cols);
    }
  }, [content]);

  const updateCell = (rowIndex, colIndex, value) => {
    const newRows = rows.map((row, rIdx) =>
      rIdx === rowIndex
        ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell))
        : row
    );
    setRows(newRows);
    onChange({ rows: newRows, cols });
  };

  const addRow = () => {
    const newRow = new Array(cols).fill('');
    setRows([...rows, newRow]);
    onChange({ rows: [...rows, newRow], cols });
  };

  const addColumn = () => {
    const newRows = rows.map((row) => [...row, '']);
    setRows(newRows);
    setCols(cols + 1);
    onChange({ rows: newRows, cols: cols + 1 });
  };

  return (
    <div className="table-block my-4">
      <table className="w-full border-collapse border border-border print:border-black">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <th
                key={colIndex}
                className="border border-border p-2 bg-muted font-semibold text-left print:border-black print:bg-transparent"
              >
                <input
                  type="text"
                  value={rows[0]?.[colIndex] || ''}
                  onChange={(e) => updateCell(0, colIndex, e.target.value)}
                  className="w-full border-none outline-none bg-transparent"
                  placeholder="Spaltenüberschrift"
                  aria-label={`Spaltenüberschrift ${colIndex + 1}`}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td
                  key={colIndex}
                  className="border border-border p-2 print:border-black"
                >
                  <input
                    type="text"
                    value={row[colIndex] || ''}
                    onChange={(e) => updateCell(rowIndex + 1, colIndex, e.target.value)}
                    className="w-full border-none outline-none bg-transparent"
                    placeholder="Zelle"
                    aria-label={`Zelle Zeile ${rowIndex + 2}, Spalte ${colIndex + 1}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex gap-2">
        <button
          onClick={addRow}
          className="text-sm text-primary hover:underline no-print"
          aria-label="Zeile hinzufügen"
        >
          + Zeile hinzufügen
        </button>
        <button
          onClick={addColumn}
          className="text-sm text-primary hover:underline no-print"
          aria-label="Spalte hinzufügen"
        >
          + Spalte hinzufügen
        </button>
      </div>
    </div>
  );
};

export default TableBlock;

