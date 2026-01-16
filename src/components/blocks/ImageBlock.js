import React, { useState } from 'react';

const ImageBlock = ({ content, onChange }) => {
  const [imageUrl, setImageUrl] = useState(content || '');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setImageUrl(result);
        onChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    onChange(url);
  };

  return (
    <div className="image-block my-4">
      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt="SOP Illustration"
            className="max-w-full h-auto rounded border border-sop-border"
            style={{ aspectRatio: 'auto' }}
            loading="lazy"
          />
          <button
            onClick={() => {
              setImageUrl('');
              onChange('');
            }}
            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/90 no-print"
            aria-label="Bild entfernen"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded p-8 text-center no-print">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <div className="text-sop-text">
              <p className="mb-2 text-foreground">Bild hochladen</p>
              <p className="text-sm text-muted-foreground">
                oder URL eingeben:
              </p>
              <input
                type="text"
                value={imageUrl}
                onChange={handleUrlChange}
                placeholder="https://…"
                className="mt-2 w-full px-3 py-2 border border-input rounded outline-none focus:border-ring bg-background text-foreground"
              />
            </div>
          </label>
        </div>
      )}
    </div>
  );
};

export default ImageBlock;

