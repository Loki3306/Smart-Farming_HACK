import React, { useRef, useState, useEffect } from "react";

interface Props {
  onFileSelected: (file: File | null) => void;
  file: File | null;
  disabled?: boolean;
}

export default function ImageUploader({ onFileSelected, file, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return onFileSelected(null);
    const f = files[0];
    if (!f.type.startsWith("image/")) return onFileSelected(null);
    onFileSelected(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-shadow ${disabled ? 'opacity-60' : 'hover:shadow-lg'}`}
        aria-disabled={disabled}
      >
        {!preview ? (
          <div>
            <p className="text-sm text-muted-foreground">Drag & drop a clear leaf photo here, or</p>
            <div className="mt-3">
              <button
                type="button"
                className="inline-flex items-center rounded bg-emerald-600 px-4 py-2 text-white shadow-sm hover:bg-emerald-700 transition"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
              >
                Choose image
              </button>
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onSelect} />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-full sm:w-64">
              <div className="relative rounded-lg overflow-hidden shadow-sm">
                <img src={preview} alt="Uploaded leaf preview" className="h-48 w-full rounded object-cover" />
                <div className="absolute left-3 top-3 rounded bg-white/80 px-2 py-1 text-xs font-medium">Leaf image detected</div>
              </div>
              <div className="mt-3 flex gap-2 justify-start sm:justify-center">
                <button
                  type="button"
                  className="inline-flex items-center rounded bg-orange-500 px-3 py-1 text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  onClick={() => onFileSelected(null)}
                  aria-label="Remove image"
                >
                  Remove
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled}
                  aria-label="Replace image"
                >
                  Replace
                </button>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onSelect} />
              </div>
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium">Preview</p>
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">File: <span className="font-medium">{file?.name ?? ''}</span></p>
                <p className="text-xs text-muted-foreground mt-1">Tip: Try to include a single leaf with even lighting.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        <p>Tips: Use a clear leaf image. Avoid background clutter. Good light improves results.</p>
      </div>
    </div>
  );
}
