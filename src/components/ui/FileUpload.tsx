import { useRef } from 'react';
import { Upload, X, Film, Image as ImageIcon, Star } from 'lucide-react';

interface FileUploadProps {
  type: 'image' | 'video' | 'media';
  label: string;
  multiple?: boolean;
  maxFiles?: number;
  files: File[];
  onFilesChange: (files: File[]) => void;
  existing?: string[];
  onRemoveExisting?: (url: string) => void;

  // NEW
  thumbnail?: string;
  onSetThumbnail?: (url: string) => void;
}

export function FileUpload({
  type,
  label,
  multiple = false,
  maxFiles = 10,
  files,
  onFilesChange,
  existing = [],
  onRemoveExisting,

  thumbnail,
  onSetThumbnail,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);

    if (multiple) {
      onFilesChange([...files, ...picked].slice(0, maxFiles));
    } else {
      onFilesChange(picked.slice(0, 1));
    }

    e.target.value = '';
  };

  const removeNewFile = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  const canAdd = multiple
    ? existing.length + files.length < maxFiles
    : files.length === 0;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {canAdd && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-56 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-all flex flex-col items-center justify-center"
        >
          {type === 'image' ? (
  <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
) : type === 'video' ? (
  <Upload className="h-12 w-12 text-gray-400 mb-3" />
) : (
  <Film className="h-12 w-12 text-gray-400 mb-3" />
)}

<p className="text-sm font-medium text-gray-700 dark:text-gray-200">
  Klik untuk memilih {
    type === 'image' ? 'gambar' :
    type === 'video' ? 'video' :
    'gambar atau video'
  }
</p>

          <p className="text-xs text-gray-500 mt-1">
            {multiple ? `Maksimal ${maxFiles} file` : 'Upload 1 file'}
          </p>
        </button>
      )}

      {(existing.length > 0 || files.length > 0) && (
        <div className="flex flex-wrap gap-3 mt-4">
          {existing.map((url) => {
            const isThumbnail = thumbnail === url;

            return (
              <div
                key={url}
                className={`relative h-24 w-24 rounded-xl overflow-hidden group ${
                  isThumbnail
                    ? 'border-2 border-yellow-400'
                    : 'border border-gray-200 dark:border-gray-700'
                }`}
              >
                {type === 'image' ? (
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video
                    src={url}
                    className="h-full w-full object-cover"
                  />
                )}

                {/* Thumbnail */}
                {type === 'image' && onSetThumbnail && (
                  <button
                    type="button"
                    onClick={() => onSetThumbnail(url)}
                    className={`absolute top-1 left-1 h-6 w-6 rounded-full flex items-center justify-center transition ${
                      isThumbnail
                        ? 'bg-yellow-400 text-white'
                        : 'bg-black/70 text-white opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Star className="h-3 w-3 fill-current" />
                  </button>
                )}

                {/* Remove */}
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(url)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}

          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="relative h-24 w-24 rounded-xl overflow-hidden border-2 border-brand-500 group"
            >
              {type === 'image' ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <Film className="h-8 w-8 text-gray-400" />
                </div>
              )}

              <button
                type="button"
                onClick={() => removeNewFile(idx)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
  ref={inputRef}
  type="file"
  accept={
    type === 'image' ? 'image/*' :
    type === 'video' ? 'video/*' :
    'image/*,video/*'
  }
  multiple={multiple}
  onChange={handlePick}
  className="hidden"
/>
    </div>
  );
}
