import React, { useRef, useState, useEffect } from 'react';
import { IdPhotoSize } from '../types';

interface WorkspaceProps {
  image: string | null;
  selectedSize: IdPhotoSize;
  scale: number;
  position: { x: number, y: number };
  onUpdate: (scale: number, position: { x: number, y: number }) => void;
  displayDimensions: { width: number, height: number };
}

export const Workspace: React.FC<WorkspaceProps> = ({ 
  image, 
  selectedSize, 
  scale,
  position,
  onUpdate,
  displayDimensions
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    onUpdate(scale, {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
       e.preventDefault();
       // Zoom sensitivity
       const delta = e.deltaY * -0.001;
       const newScale = Math.max(0.05, scale + delta); // Prevent inverting
       onUpdate(newScale, position);
    }
  };

  if (!image) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 m-4">
        <div className="text-center text-slate-400">
          <p className="mb-2">No image loaded</p>
          <p className="text-sm">Upload a photo to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-100 overflow-hidden relative select-none">
      
      {/* Frame Container */}
      <div 
        className="relative shadow-2xl bg-white overflow-hidden ring-8 ring-white"
        style={{
          width: `${displayDimensions.width}px`,
          height: `${displayDimensions.height}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img 
          ref={imgRef}
          src={image} 
          alt="Workspace" 
          className="absolute max-w-none"
          style={{
            // Apply transform logic carefully.
            // We use transform for performance, but need to match this in canvas export.
            // Using standard translate/scale from center.
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
          draggable={false}
        />

        {/* Grid overlay for alignment (Rule of thirds) */}
        <div className="absolute inset-0 z-20 pointer-events-none opacity-30 grid grid-cols-3 grid-rows-3 border border-slate-400/50">
            {[...Array(9)].map((_, i) => <div key={i} className="border border-slate-400/30"></div>)}
        </div>
      </div>

      <div className="mt-6 flex items-center space-x-4 bg-white px-6 py-3 rounded-full shadow-sm">
         <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{selectedSize.name}</span>
         <div className="h-4 w-px bg-slate-200"></div>
         <span className="text-xs text-slate-400">{selectedSize.widthMm}x{selectedSize.heightMm}mm</span>
         <div className="h-4 w-px bg-slate-200"></div>
         <span className="text-xs text-slate-400">Scale: {Math.round(scale * 100)}%</span>
      </div>
      
      <p className="mt-4 text-xs text-slate-400">Drag to adjust position • Scroll/Pinch to zoom</p>
    </div>
  );
};