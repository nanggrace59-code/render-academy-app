'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MoveHorizontal, Columns, Layers, Maximize, 
  RotateCcw, Monitor, Rows, X, Image as ImageIcon
} from 'lucide-react';

interface ImageSliderProps {
  referenceImage: string;
  renderImage: string;
  className?: string;
  isModalView?: boolean;
}

type ViewMode = 'slide' | 'split' | 'overlay' | 'fullscreen';

export const ImageSlider: React.FC<ImageSliderProps> = ({ 
  referenceImage, 
  renderImage, 
  className = '',
  isModalView = false 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('slide');
  const [splitDirection, setSplitDirection] = useState<'horizontal'|'vertical'>('horizontal');
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Slide Logic
  const handleSlideMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingSlider) {
      e.preventDefault();
      handleSlideMove(e.clientX);
    }
  }, [isDraggingSlider, handleSlideMove]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsDraggingSlider(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [handleGlobalMouseUp, handleGlobalMouseMove]);

  // Expanded View Handling
  if (isExpanded && !isModalView) {
     return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
           <div className="p-4 bg-neutral-900 flex justify-end">
               <button onClick={() => setIsExpanded(false)} className="text-white flex items-center gap-2"><X size={16}/> Close Fullscreen</button>
           </div>
           <div className="flex-1 relative">
               <ImageSlider referenceImage={referenceImage} renderImage={renderImage} isModalView={true} className="h-full border-0 rounded-none"/>
           </div>
        </div>
     );
  }

  const renderContent = () => {
     const imgStyle = { width: '100%', height: '100%', objectFit: 'contain' as const, display: 'block', pointerEvents: 'none' as const };
     
     switch(viewMode) {
        case 'slide':
            return (
               <div className="relative w-full h-full cursor-crosshair" onMouseDown={(e) => { setIsDraggingSlider(true); handleSlideMove(e.clientX); }}>
                   <div className="absolute inset-0 bg-black flex items-center justify-center">
                       <img src={renderImage} style={imgStyle} alt="Render" />
                       <div className="absolute top-4 right-4 bg-black/80 text-white text-[10px] px-2 py-1 font-bold">RENDER</div>
                   </div>
                   <div className="absolute inset-0 bg-black flex items-center justify-center" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                       <img src={referenceImage} style={imgStyle} alt="Ref" />
                       <div className="absolute top-4 left-4 bg-black/80 text-white text-[10px] px-2 py-1 font-bold">REFERENCE</div>
                   </div>
                   <div className="absolute top-0 bottom-0 w-0.5 bg-red-600 cursor-ew-resize z-20" style={{ left: `${sliderPosition}%` }}>
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black border border-red-600 rounded-full flex items-center justify-center text-white shadow-xl">
                           <MoveHorizontal size={14} />
                       </div>
                   </div>
               </div>
            );
        case 'split':
            return (
                <div className={`w-full h-full grid ${splitDirection === 'horizontal' ? 'grid-cols-2 divide-x' : 'grid-rows-2 divide-y'} divide-neutral-800 bg-black`}>
                    <div className="relative overflow-hidden w-full h-full bg-black">
                        <img src={referenceImage} style={imgStyle} alt="Ref" />
                        <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1">REF</div>
                    </div>
                    <div className="relative overflow-hidden w-full h-full bg-black">
                        <img src={renderImage} style={imgStyle} alt="Render" />
                        <div className="absolute top-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1">RENDER</div>
                    </div>
                </div>
            );
        case 'overlay':
            return (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <img src={referenceImage} className="absolute inset-0 w-full h-full object-contain" alt="Ref" />
                    <img src={renderImage} className="absolute inset-0 w-full h-full object-contain" style={{ opacity: overlayOpacity / 100 }} alt="Render" />
                    <div className="absolute bottom-6 z-30 bg-neutral-900 border border-neutral-700 px-6 py-3 rounded-sm flex items-center gap-4">
                        <span className="text-[10px] font-bold text-neutral-400">REF</span>
                        <input type="range" min="0" max="100" value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="h-1 accent-red-600"/>
                        <span className="text-[10px] font-bold text-white">RENDER</span>
                    </div>
                </div>
            );
        default: return null;
     }
  }

  return (
    <div ref={containerRef} className={`flex flex-col bg-[#0a0a0a] border border-neutral-800 rounded-sm overflow-hidden select-none shadow-2xl ${className}`}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-[#0f0f0f] h-10 shrink-0">
             <div className="flex items-center gap-1">
                 {[{m:'slide', i:MoveHorizontal}, {m:'split', i:Columns}, {m:'overlay', i:Layers}].map(b => (
                     <button key={b.m} onClick={() => setViewMode(b.m as ViewMode)} className={`p-1.5 rounded-sm ${viewMode === b.m ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>
                         <b.i size={14}/>
                     </button>
                 ))}
             </div>
             {!isModalView && (
                 <button onClick={() => setIsExpanded(true)} className="text-neutral-400 hover:text-red-500"><Maximize size={14}/></button>
             )}
        </div>
        <div className="flex-1 overflow-hidden relative min-h-0 bg-black">
            {renderContent()}
        </div>
    </div>
  );
}