'use client';

import { useState, useRef, useCallback } from 'react';

export interface UploadedResource {
  file: File;
  preview: string;
  type: ResourceTypeOption;
  name: string;
}

type ResourceTypeOption = 'image' | 'audio' | 'video' | 'model_3d' | 'ue5_asset' | 'animation' | 'document' | 'custom';

const RESOURCE_TYPE_OPTIONS: { value: ResourceTypeOption; label: string; icon: string; accept: string }[] = [
  { value: 'image', label: 'Image', icon: '🖼️', accept: 'image/*' },
  { value: 'audio', label: 'Audio', icon: '🎵', accept: 'audio/*' },
  { value: 'video', label: 'Video', icon: '🎬', accept: 'video/*' },
  { value: 'model_3d', label: '3D Model', icon: '🧊', accept: '.glb,.gltf,.obj,.fbx' },
  { value: 'ue5_asset', label: 'UE5 Asset', icon: '🎮', accept: '.uasset,.umap' },
  { value: 'animation', label: 'Animation', icon: '✨', accept: '.json,.lottie,.gif' },
  { value: 'document', label: 'Document', icon: '📄', accept: '.pdf,.txt,.md' },
  { value: 'custom', label: 'Other', icon: '📦', accept: '*' },
];

function detectResourceType(file: File): ResourceTypeOption {
  const mime = file.type.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (['glb', 'gltf', 'obj', 'fbx'].includes(ext)) return 'model_3d';
  if (['uasset', 'umap'].includes(ext)) return 'ue5_asset';
  if (['json', 'lottie', 'gif'].includes(ext)) return 'animation';
  if (['pdf', 'txt', 'md'].includes(ext)) return 'document';
  return 'custom';
}

interface ResourceUploaderProps {
  resources: UploadedResource[];
  onChange: (resources: UploadedResource[]) => void;
  maxResources?: number;
}

export function ResourceUploader({ resources, onChange, maxResources = 10 }: ResourceUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newResources: UploadedResource[] = [];

    Array.from(files).forEach((file) => {
      if (resources.length + newResources.length >= maxResources) return;

      const type = detectResourceType(file);
      let preview = '';

      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      newResources.push({
        file,
        preview,
        type,
        name: file.name,
      });
    });

    onChange([...resources, ...newResources]);
  }, [resources, onChange, maxResources]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeResource = (index: number) => {
    const updated = [...resources];
    if (updated[index].preview) {
      URL.revokeObjectURL(updated[index].preview);
    }
    updated.splice(index, 1);
    onChange(updated);
  };

  const updateResourceType = (index: number, type: ResourceTypeOption) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], type };
    onChange(updated);
  };

  const typeIcons: Record<string, string> = Object.fromEntries(
    RESOURCE_TYPE_OPTIONS.map(o => [o.value, o.icon])
  );

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-cyber bg-cyber/5'
            : 'border-ink-dim/30 hover:border-cyber/40 hover:bg-cyber/5'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="space-y-2">
          <span className="text-3xl block">
            {isDragging ? '⬇️' : '📁'}
          </span>
          <p className="text-sm text-ink-body font-body">
            {isDragging ? 'Drop files here' : 'Drag and drop files or click to browse'}
          </p>
          <p className="text-[10px] text-ink-dim font-mono">
            Images, Audio, Video, 3D Models, UE5 Assets · Max {maxResources} resources
          </p>
        </div>
      </div>

      {/* Uploaded Resources List */}
      {resources.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-display text-ink-muted tracking-wider">
            RESOURCES ({resources.length}/{maxResources})
          </p>
          {resources.map((resource, index) => (
            <div key={index} className="flex items-center gap-3 glass-panel p-3">
              {/* Preview */}
              <div className="w-12 h-12 bg-architect-surface border border-ink-dim/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {resource.preview ? (
                  <img src={resource.preview} alt={resource.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">{typeIcons[resource.type] || '📦'}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate font-mono">{resource.name}</p>
                <p className="text-[10px] text-ink-dim">
                  {(resource.file.size / 1024).toFixed(1)} KB
                </p>
              </div>

              {/* Type Selector */}
              <select
                value={resource.type}
                onChange={(e) => updateResourceType(index, e.target.value as ResourceTypeOption)}
                className="bg-architect-input border border-ink-dim/20 text-xs text-ink-body px-2 py-1 font-mono"
              >
                {RESOURCE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>

              {/* Remove */}
              <button
                onClick={() => removeResource(index)}
                className="text-signal-error hover:text-signal-error/80 text-sm px-2 py-1 border border-transparent hover:border-signal-error/30 transition-colors"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
