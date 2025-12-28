'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MoveHorizontal, Columns, Layers, Maximize, Minimize,
  RotateCcw, Move, Box, GripVertical, Image as ImageIcon
} from 'lucide-react';

interface ImageSliderProps {
  referenceImage: string;
  renderImage: string;
  className?: string;
  isModalView?: boolean;
}

type ViewMode = 'slide' | 'split' | 'overlay' | 'full';

interface ToolOption {
    id: ViewMode;
    label: string;
    icon: React.ElementType;
}

const DEFAULT_TOOLS: ToolOption[] = [
    { id: 'slide', label: 'Slide', icon: MoveHorizontal },
    { id: 'split', label: 'Split', icon: Columns },
    { id: 'overlay', label: 'Blend', icon: Layers },
    { id: 'full', label: 'Full View', icon: Maximize },
];

export const ImageSlider: React.FC<ImageSliderProps> = ({ 
  referenceImage, 
  renderImage, 
  className = '',
  isModalView = false 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('slide');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  
  // Full View Toggle State
  const [fullViewSource, setFullViewSource] = useState<'ref' | 'render'>('render');

  // Toolbar Order State
  const [tools, setTools] = useState<ToolOption[]>(DEFAULT_TOOLS);
  const [draggedToolIndex, setDraggedToolIndex] = useState<number | null>(null);

  // Transform State (Zoom/Pan)
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fullscreen State
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // --- 1. ROBUST ZOOM & SCROLL PREVENTION ---
  // Moving zoom logic to the native listener ensures preventDefault works and logic fires consistently
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const handleNativeWheel = (e: WheelEvent) => {
        e.preventDefault();
        
        // Simple Zoom Logic
        const zoomIntensity = 0.1;
        const direction = e.deltaY > 0 ? -1 : 1;
        
        setScale(prevScale => {
            const newScale = Math.min(Math.max(1, prevScale + direction * zoomIntensity), 8); // 1x to 8x
            if (newScale === 1) {
                // We need to reset position in a way that doesn't conflict with state updates
                // Using a timeout or separate state set in the component body is better, 
                // but setting state here works because React batches.
                setPosition({ x: 0, y: 0 });
            }
            return newScale;
        });
    };

    node.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => node.removeEventListener('wheel', handleNativeWheel);
  }, []);

  // --- PAN LOGIC (Mouse Events) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow panning if zoomed in OR if simply wanting to move around (though at 1x it does nothing visible if fits)
    if (scale > 1) {
       setIsDragging(true);
       setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
        e.preventDefault();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetTransform = () => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
  };

  // --- SLIDER DRAG LOGIC ---
  const handleSliderMove = useCallback((clientX: number) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
        if (isResizing) {
            e.preventDefault(); 
            handleSliderMove(e.clientX);
        }
    };
    const handleGlobalUp = () => setIsResizing(false);

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => {
        window.removeEventListener('mousemove', handleGlobalMove);
        window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [isResizing, handleSliderMove]);


  // --- DRAG & DROP TOOLBAR LOGIC ---
  const handleDragStart = (index: number) => {
      setDraggedToolIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedToolIndex === null || draggedToolIndex === index) return;
      
      const newTools = [...tools];
      const draggedItem = newTools[draggedToolIndex];
      newTools.splice(draggedToolIndex, 1);
      newTools.splice(index, 0, draggedItem);
      
      setDraggedToolIndex(index);
      setTools(newTools);
  };

  const handleDrop = () => {
      setDraggedToolIndex(null);
  };

  // --- RENDER HELPERS ---
  const transformStyle: React.CSSProperties = {
      transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
      transition: isDragging ? 'none' : 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)',
      cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
      transformOrigin: 'center center',
      willChange: 'transform'
  };

  const imageCommonClass = "absolute inset-0 w-full h-full object-contain pointer-events-none select-none";

  // Common Event Handlers for the Viewport
  // Note: onWheel is handled via ref + useEffect to ensure non-passive listener
  const mouseHandlers = {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp
  };

  const renderViewer = () => {
      switch(viewMode) {
          case 'slide':
              return (
                <div className="relative w-full h-full overflow-hidden bg-[#050505]" {...mouseHandlers}>
                     {/* Layer 1: Render (Bottom) */}
                     <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                         <div style={transformStyle} className="w-full h-full relative flex items-center justify-center">
                             <img src={renderImage} className={imageCommonClass} alt="Render" />
                         </div>
                         <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-[10px] px-3 py-1 font-bold rounded-full pointer-events-none z-10 shadow-lg">RENDER</div>
                     </div>

                     {/* Layer 2: Reference (Top, Clipped) */}
                     <div 
                        className="absolute inset-0 flex items-center justify-center overflow-hidden border-r-2 border-primary shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                     >
                         <div style={transformStyle} className="w-full h-full relative flex items-center justify-center">
                             <img src={referenceImage} className={imageCommonClass} alt="Reference" />
                         </div>
                         <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm text-white text-[10px] px-3 py-1 font-bold rounded-full pointer-events-none z-10 shadow-lg">REFERENCE</div>
                     </div>

                     {/* Handle */}
                     <div 
                        className="absolute inset-y-0 w-10 -ml-5 z-30 cursor-ew-resize flex items-center justify-center group outline-none"
                        style={{ left: `${sliderPosition}%` }}
                        onMouseDown={() => setIsResizing(true)}
                     >
                         <div className="w-0.5 h-full bg-primary shadow-[0_0_15px_rgba(222,4,67,1)] transition-all group-hover:w-1 group-hover:bg-white" />
                         <div className="absolute w-8 h-8 bg-black border-2 border-primary rounded-full flex items-center justify-center text-white shadow-xl scale-75 group-hover:scale-110 transition-transform">
                             <MoveHorizontal size={14} />
                         </div>
                     </div>
                </div>
              );
          case 'split':
              return (
                  // Grid itself receives mouse events for panning.
                  // Since transformStyle is applied to inner DIVs, they move together.
                  <div className="w-full h-full grid grid-cols-2 divide-x divide-white/10 bg-[#050505]" {...mouseHandlers}>
                      {/* Left: Reference */}
                      <div className="relative overflow-hidden w-full h-full bg-black/20 group/split">
                          <div style={transformStyle} className="w-full h-full flex items-center justify-center">
                              <img src={referenceImage} className={imageCommonClass} alt="Reference" />
                          </div>
                          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-[10px] px-3 py-1 font-bold rounded-full pointer-events-none">REF</div>
                      </div>
                      
                      {/* Right: Render */}
                      <div className="relative overflow-hidden w-full h-full bg-black/20 group/split">
                          <div style={transformStyle} className="w-full h-full flex items-center justify-center">
                              <img src={renderImage} className={imageCommonClass} alt="Render" />
                          </div>
                          <div className="absolute top-4 right-4 bg-primary/80 backdrop-blur-sm text-white text-[10px] px-3 py-1 font-bold rounded-full pointer-events-none">RENDER</div>
                      </div>
                  </div>
              );
          case 'overlay':
              return (
                <div className="relative w-full h-full overflow-hidden bg-[#050505]" {...mouseHandlers}>
                     <div style={transformStyle} className="w-full h-full relative flex items-center justify-center">
                        <img src={referenceImage} className={imageCommonClass} alt="Reference" />
                        <img src={renderImage} className={imageCommonClass} style={{ opacity: overlayOpacity / 100 }} alt="Render" />
                     </div>
                     
                     <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-black/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl">
                        <span className="text-[10px] font-bold text-neutral-400">REF</span>
                        <input 
                            type="range" min="0" max="100" 
                            value={overlayOpacity} 
                            onChange={(e) => setOverlayOpacity(Number(e.target.value))} 
                            className="w-32 h-1 accent-primary bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-primary">RENDER</span>
                     </div>
                </div>
              );
           case 'full':
               return (
                   <div className="relative w-full h-full overflow-hidden bg-[#050505]" {...mouseHandlers}>
                       <div style={transformStyle} className="w-full h-full flex items-center justify-center">
                           <img 
                                src={fullViewSource === 'ref' ? referenceImage : renderImage} 
                                className={imageCommonClass} 
                                alt="Full View" 
                           />
                       </div>
                       
                       {/* Floating Source Switcher */}
                       <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center bg-black/80 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-2xl">
                           <button 
                                onClick={(e) => { e.stopPropagation(); setFullViewSource('ref'); }}
                                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all ${fullViewSource === 'ref' ? 'bg-white text-black shadow-glow' : 'text-neutral-500 hover:text-white'}`}
                           >
                               Reference
                           </button>
                           <button 
                                onClick={(e) => { e.stopPropagation(); setFullViewSource('render'); }}
                                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all ${fullViewSource === 'render' ? 'bg-primary text-white shadow-glow' : 'text-neutral-500 hover:text-white'}`}
                           >
                               Render
                           </button>
                       </div>

                       <div className={`absolute top-4 right-4 text-white text-[10px] px-3 py-1 font-bold rounded-full pointer-events-none backdrop-blur-sm shadow-lg ${fullViewSource === 'ref' ? 'bg-neutral-800/80 border border-white/10' : 'bg-primary/80'}`}>
                           {fullViewSource === 'ref' ? 'FULL REFERENCE' : 'FULL RENDER'}
                       </div>
                   </div>
               );
      }
  };

  // --- FULL SCREEN WRAPPER ---
  if (isExpanded && !isModalView) {
      return (
          <div className="fixed inset-0 z-[200] bg-[#050505] animate-in fade-in duration-200 flex flex-col">
              <div className="h-14 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0">
                  <div className="flex items-center gap-2">
                       <Box className="text-primary" size={18}/>
                       <span className="text-white font-bold tracking-wider text-sm">FULLSCREEN MODE</span>
                  </div>
                  <button 
                    onClick={() => setIsExpanded(false)} 
                    className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-sm text-xs font-bold border border-white/5 transition-colors shadow-lg"
                  >
                      <Minimize size={14} /> EXIT
                  </button>
              </div>
              <div className="flex-1 relative">
                  <ImageSlider referenceImage={referenceImage} renderImage={renderImage} isModalView={true} className="h-full border-0 rounded-none w-full"/>
              </div>
          </div>
      );
  }

  return (
    <div ref={containerRef} className={`flex flex-col bg-[#0a0a0a] border border-dark-border rounded-lg overflow-hidden select-none shadow-2xl ${className} group`}>
        
        {/* Professional Reorderable Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0f0f0f] min-h-12 shrink-0 backdrop-blur-xl gap-2">
             
             {/* Left: Draggable View Modes */}
             <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                 <span className="text-[10px] text-neutral-600 mr-2 uppercase tracking-widest hidden sm:block">View:</span>
                 {tools.map((mode, index) => (
                     <div
                        key={mode.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={handleDrop}
                        className={`transition-transform duration-200 ${draggedToolIndex === index ? 'opacity-50 scale-95' : ''}`}
                     >
                         <button 
                            onClick={() => { setViewMode(mode.id); resetTransform(); }} 
                            className={`group relative p-1.5 px-3 rounded-sm flex items-center gap-2 text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                                viewMode === mode.id 
                                ? 'bg-primary text-white shadow-glow' 
                                : 'text-neutral-500 hover:text-white hover:bg-white/5'
                            }`}
                         >  
                             <GripVertical size={8} className="text-neutral-700 group-hover:text-neutral-500 cursor-grab" />
                             <mode.icon size={14}/>
                             <span className="hidden sm:inline">{mode.label}</span>
                         </button>
                     </div>
                 ))}
             </div>

             {/* Right: Tools */}
             <div className="flex items-center gap-3 ml-auto">
                 {/* Zoom Indicator */}
                 <div className="hidden sm:flex items-center gap-2 text-neutral-500 text-[10px] font-mono border-r border-white/10 pr-3 mr-1">
                     <Move size={12} />
                     <span>{Math.round(scale * 100)}%</span>
                 </div>

                 <button onClick={resetTransform} className="text-neutral-500 hover:text-white p-1.5 hover:bg-white/5 rounded transition-colors" title="Reset View">
                     <RotateCcw size={14}/>
                 </button>
                 
                 {!isModalView && (
                     <button 
                        onClick={() => setIsExpanded(true)} 
                        className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-primary transition-colors ml-2"
                        title="Fullscreen"
                     >
                        <Maximize size={14}/> 
                     </button>
                 )}
             </div>
        </div>

        {/* Viewport */}
        <div 
            ref={viewportRef}
            className="flex-1 overflow-hidden relative min-h-0 bg-[#020202] cursor-crosshair touch-none"
            style={{ overscrollBehavior: 'none' }}
        >
            {renderViewer()}
        </div>
    </div>
  );
}
