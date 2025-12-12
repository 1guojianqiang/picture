import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, 
  Palette, 
  Sparkles, 
  Shirt, 
  Maximize, 
  Download, 
  Undo,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { ID_SIZES, BG_COLORS, OUTFIT_OPTIONS, BEAUTY_LEVELS } from './constants';
import { IdPhotoSize, ProcessingState, ProcessingStatus, ToolType } from './types';
import { removeBackground, changeOutfit, applyBeauty } from './services/geminiService';
import { Button } from './components/ui/Button';
import { Workspace } from './components/Workspace';
import { Spinner } from './components/ui/Spinner';

// Constants for display layout
const WORKSPACE_BASE_HEIGHT = 500;

const App = () => {
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<IdPhotoSize>(ID_SIZES[0]);
  const [processing, setProcessing] = useState<ProcessingState>({ status: ProcessingStatus.IDLE });
  
  // Lifted state for exact synchronization between Preview and Download
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate display dimensions based on selected size aspect ratio
  const displayDimensions = useMemo(() => {
    const ratio = selectedSize.widthPx / selectedSize.heightPx;
    return {
      width: WORKSPACE_BASE_HEIGHT * ratio,
      height: WORKSPACE_BASE_HEIGHT
    };
  }, [selectedSize]);

  // Auto-fit Logic: When image or size changes, calculate "Cover" scale
  useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.src = image;
    img.onload = () => {
       const imgAspect = img.naturalWidth / img.naturalHeight;
       const frameAspect = selectedSize.widthPx / selectedSize.heightPx;
       
       let newScale = 1;
       
       // Cover logic: ensure the image completely covers the frame
       if (imgAspect > frameAspect) {
          // Image is wider than frame (relative to aspect), fit by height
          // Workspace height is fixed at WORKSPACE_BASE_HEIGHT
          // We need (img.naturalHeight * scale) >= WORKSPACE_BASE_HEIGHT
          // Actually, let's calculate based on pixels directly for accuracy
          newScale = WORKSPACE_BASE_HEIGHT / img.naturalHeight;
       } else {
          // Image is taller, fit by width
          newScale = displayDimensions.width / img.naturalWidth;
       }
       
       // Add a tiny buffer (1.05x) to ensure no white edges appear due to rounding
       setScale(newScale * 1.05);
       setPosition({ x: 0, y: 0 }); // Center it
    };
  }, [image, selectedSize, displayDimensions]);

  const addToHistory = (newImage: string) => {
    setHistory(prev => [...prev.slice(-4), image || newImage]);
    setImage(newImage);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setImage(prev);
      setHistory(prevHist => prevHist.slice(0, -1));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setImage(result);
        setOriginalImage(result);
        setHistory([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const processWithAI = async (action: () => Promise<string>, loadingMsg: string) => {
    if (!image) return;
    setProcessing({ status: ProcessingStatus.PROCESSING, message: loadingMsg });
    
    try {
      const result = await action();
      addToHistory(result);
      setProcessing({ status: ProcessingStatus.SUCCESS, message: 'Done!' });
      setTimeout(() => setProcessing({ status: ProcessingStatus.IDLE }), 2000);
    } catch (error: any) {
      console.error(error);
      const isKeyError = error.message?.includes("API Key");
      setProcessing({ 
        status: ProcessingStatus.ERROR, 
        message: isKeyError ? 'API Key Missing (Offline Mode)' : (error.message || 'Processing failed') 
      });
    }
  };

  const handleRemoveBg = (color: string) => {
    processWithAI(
      () => removeBackground(image!, color),
      `Removing background...`
    );
  };

  const handleOutfitChange = (outfit: any) => {
    processWithAI(
      () => changeOutfit(image!, outfit.prompt),
      `Changing outfit...`
    );
  };

  const handleBeauty = (level: any) => {
    if (level.id === 'none') {
       if (originalImage) setImage(originalImage);
       return;
    }
    processWithAI(
      () => applyBeauty(image!, level.prompt),
      `Retouching...`
    );
  };

  const handleDownload = () => {
    if (!image) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Set canvas to target high-res print size
    canvas.width = selectedSize.widthPx;
    canvas.height = selectedSize.heightPx;

    // 2. Fill background (white default)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.src = image;
    img.onload = () => {
      // 3. Coordinate Mapping
      // The ratio between the "Screen Preview Pixels" and "Actual Output Pixels"
      const ratio = selectedSize.heightPx / displayDimensions.height;

      // Center of the output canvas
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Calculate drawn size of the image on the canvas
      // In Workspace, display size = naturalSize * scale
      // In Canvas, drawn size = naturalSize * scale * ratio
      const drawWidth = img.naturalWidth * scale * ratio;
      const drawHeight = img.naturalHeight * scale * ratio;

      // Calculate position offset
      // position.x/y are in "Screen Preview Pixels" (from center)
      // We need to convert them to "Output Pixels"
      const offsetX = position.x * ratio;
      const offsetY = position.y * ratio;

      // Draw coordinates (top-left of image)
      const drawX = cx + offsetX - (drawWidth / 2);
      const drawY = cy + offsetY - (drawHeight / 2);
      
      // Use high quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      const link = document.createElement('a');
      link.download = `fresh-id-${selectedSize.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    };
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans">
      
      {/* --- LEFT SIDEBAR (TOOLS) --- */}
      <div className="w-80 bg-white border-r border-slate-100 flex flex-col shadow-lg z-10 shrink-0">
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center gap-2 text-brand-600 mb-1">
             <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
               <ImageIcon size={20} />
             </div>
             <h1 className="text-xl font-bold tracking-tight text-slate-800">FreshID</h1>
          </div>
          <p className="text-xs text-slate-400 pl-10">Local & Smart Editor</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          
          {/* UPLOAD */}
          {!image && (
             <div className="border-2 border-dashed border-brand-200 rounded-2xl p-8 text-center bg-brand-50 hover:bg-brand-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mx-auto text-brand-400 mb-3" />
                <p className="text-sm font-medium text-brand-700">Upload Portrait</p>
                <p className="text-xs text-brand-400 mt-1">Supports JPG, PNG</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
             </div>
          )}

          {image && (
            <>
               {/* 1. SIZE SELECTOR */}
               <section>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                   <Maximize size={14} className="mr-2" /> Size
                 </h3>
                 <div className="grid grid-cols-2 gap-2">
                   {ID_SIZES.map(size => (
                     <button
                       key={size.id}
                       onClick={() => setSelectedSize(size)}
                       className={`p-3 rounded-xl border text-left transition-all ${
                         selectedSize.id === size.id 
                           ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' 
                           : 'border-slate-100 hover:border-slate-300 bg-white'
                       }`}
                     >
                       <div className="font-medium text-sm text-slate-700">{size.name}</div>
                       <div className="text-[10px] text-slate-400 mt-1">{size.widthMm}x{size.heightMm}mm</div>
                     </button>
                   ))}
                 </div>
               </section>

               {/* 2. BACKGROUND (AI) */}
               <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                    <Palette size={14} className="mr-2" /> Background <span className="ml-auto text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded">AI</span>
                  </h3>
                  <div className="flex gap-3 flex-wrap">
                    {BG_COLORS.map((bg, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRemoveBg(bg.value === 'gradient' ? 'gradient' : bg.name.toLowerCase())}
                        className={`w-10 h-10 rounded-full shadow-sm ring-offset-2 transition-transform hover:scale-110 focus:ring-2 focus:ring-brand-400 ${bg.class}`}
                        title={bg.name}
                      />
                    ))}
                  </div>
               </section>

               {/* 3. BEAUTY (AI) */}
               <section>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                   <Sparkles size={14} className="mr-2" /> Beauty <span className="ml-auto text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded">AI</span>
                 </h3>
                 <div className="space-y-2">
                   {BEAUTY_LEVELS.map(level => (
                     <button
                       key={level.id}
                       onClick={() => handleBeauty(level)}
                       className="w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-600 transition-colors flex items-center justify-between group"
                     >
                       <span>{level.label}</span>
                       <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-brand-400 transition-colors"></div>
                     </button>
                   ))}
                 </div>
               </section>

               {/* 4. OUTFIT (AI) */}
               <section>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                   <Shirt size={14} className="mr-2" /> Outfit <span className="ml-auto text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded">AI</span>
                 </h3>
                 <div className="grid grid-cols-2 gap-2">
                   {OUTFIT_OPTIONS.map(outfit => (
                     <button
                       key={outfit.id}
                       onClick={() => handleOutfitChange(outfit)}
                       className="p-2 text-xs border border-slate-200 rounded-lg hover:border-brand-300 hover:text-brand-600 transition-colors text-center"
                     >
                       {outfit.label}
                     </button>
                   ))}
                 </div>
               </section>
            </>
          )}
        </div>

        {/* BOTTOM ACTION */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
           {image ? (
             <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setImage(null); fileInputRef.current!.value = ''; }} className="flex-1">New</Button>
                <Button variant="secondary" onClick={handleUndo} disabled={history.length === 0} title="Undo">
                  <Undo size={18} />
                </Button>
             </div>
           ) : (
             <p className="text-xs text-center text-slate-400">Ready to create</p>
           )}
        </div>
      </div>

      {/* --- CENTER WORKSPACE --- */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center space-x-2">
             <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
                processing.status === ProcessingStatus.PROCESSING ? 'bg-amber-100 text-amber-700' :
                processing.status === ProcessingStatus.SUCCESS ? 'bg-green-100 text-green-700' :
                processing.status === ProcessingStatus.ERROR ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-500'
             }`}>
                {processing.status === ProcessingStatus.PROCESSING && <Spinner size="sm" color="text-amber-700" />}
                {processing.status === ProcessingStatus.SUCCESS && <CheckCircle2 size={14} />}
                {processing.status === ProcessingStatus.ERROR && <AlertCircle size={14} />}
                <span>{processing.message || 'Ready'}</span>
             </div>
          </div>
          
          <div className="flex items-center space-x-3">
             <Button variant="primary" onClick={handleDownload} disabled={!image} className="shadow-brand-300/50">
               <Download size={18} className="mr-2" /> Download HD
             </Button>
          </div>
        </header>

        {/* MAIN CANVAS */}
        <Workspace 
          image={image} 
          selectedSize={selectedSize}
          displayDimensions={displayDimensions}
          scale={scale}
          position={position}
          onUpdate={(s, p) => { setScale(s); setPosition(p); }}
        />
        
        {/* Helper overlay for processing block */}
        {processing.status === ProcessingStatus.PROCESSING && (
           <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
                 <Spinner size="lg" color="text-brand-500" />
                 <p className="mt-4 text-slate-600 font-medium">{processing.message}</p>
                 <p className="text-xs text-slate-400 mt-2">Powered by Gemini AI</p>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default App;