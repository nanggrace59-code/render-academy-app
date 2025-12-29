'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Columns, GalleryVerticalEnd, Layers, Eye, 
  Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw 
} from 'lucide-react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

interface AdvancedComparatorProps {
  referenceImage: string;
  renderImage: string;
  className?: string;
}

type ComparisonMode = 'slider' | 'split' | 'overlay' | 'full';

export function AdvancedImageComparator({ referenceImage, renderImage, className = '' }: AdvancedComparatorProps) {
    const [mode, setMode] = useState<ComparisonMode>('slider');
    const [sliderPosition, setSliderPosition] = useState(50);
    const [overlayOpacity, setOverlayOpacity] = useState(50);
    const [fullViewTarget, setFullViewTarget] = useState<'reference' | 'render'>('render');
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const transformRef = useRef<ReactZoomPanPinchRef>(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            wrapperRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const ModeBtn = ({ icon: Icon, active, onClick, title }: any) => (
        <button 
            onClick={onClick} 
            title={title} 
            className={`p-2 rounded-lg transition-all flex items-center justify-center ${active ? 'bg-[#d90238] text-white shadow-[0_0_10px_rgba(217,2,56,0.5)]' : 'bg-black/60 text-neutral-400 hover:text-white hover:bg-black/80 backdrop-blur-sm border border-white/10'}`}
        >
            <Icon size={16} />
        </button>
    );

    return (
        <div ref={wrapperRef} className={`relative bg-[#020202] overflow-hidden group ${className} ${isFullscreen ? 'fixed inset-0 z-[100] w-screen h-screen' : 'w-full h-full'}`}>
            
            {/* --- TOP CONTROLS --- */}
            <div className="absolute top-4 left-4 z-40 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ModeBtn icon={Columns} active={mode === 'slider'} onClick={() => setMode('slider')} title="Slider" />
                <ModeBtn icon={GalleryVerticalEnd} active={mode === 'split'} onClick={() => setMode('split')} title="Split" />
                <ModeBtn icon={Layers} active={mode === 'overlay'} onClick={() => setMode('overlay')} title="Overlay" />
                <ModeBtn icon={Eye} active={mode === 'full'} onClick={() => setMode('full')} title="Full View" />
            </div>

            <div className="absolute top-4 right-4 z-40 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                    <button onClick={() => transformRef.current?.zoomIn()} className="p-1.5 text-neutral-400 hover:text-white"><ZoomIn size={16}/></button>
                    <button onClick={() => transformRef.current?.zoomOut()} className="p-1.5 text-neutral-400 hover:text-white"><ZoomOut size={16}/></button>
                    <button onClick={() => transformRef.current?.resetTransform()} className="p-1.5 text-neutral-400 hover:text-white"><RotateCcw size={16}/></button>
                </div>
                <button onClick={toggleFullscreen} className="p-2.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-neutral-400 hover:text-white hover:bg-[#d90238]">
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* --- MAIN VISUAL AREA (FIXED HEIGHT) --- */}
            <TransformWrapper 
                ref={transformRef} 
                centerOnInit={true} 
                minScale={0.5} 
                maxScale={8} 
                wheel={{ step: 0.1 }}
                alignmentAnimation={{ sizeX: 0, sizeY: 0 }}
            >
                {/* FIX: wrapperStyle ensures the zoom component takes full space */}
                <TransformComponent 
                    wrapperStyle={{ width: "100%", height: "100%" }} 
                    contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                    
                    {/* A. SLIDER MODE */}
                    {mode === 'slider' && (
                        <div className="relative w-full h-full flex items-center justify-center select-none">
                            <img src={referenceImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                            <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                                <img src={renderImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                            </div>
                            <div className="absolute inset-0 w-full h-full pointer-events-auto" style={{ cursor: 'ew-resize' }}>
                                <input type="range" min="0" max="100" value={sliderPosition} onChange={(e) => setSliderPosition(Number(e.target.value))} 
                                    className="absolute top-0 bottom-0 z-20 w-full h-full opacity-0 cursor-ew-resize m-0 p-0 appearance-none bg-transparent" 
                                />
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_15px_rgba(0,0,0,0.8)] pointer-events-none" style={{ left: `${sliderPosition}%` }}>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#d90238] shadow-xl border-2 border-black/10">
                                        <Columns size={14} className="rotate-90" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* B. SPLIT MODE (REMOVED PADDING FOR LARGER IMAGES) */}
                    {mode === 'split' && (
                        <div className="flex w-full h-full items-center justify-center bg-black/50">
                            <div className="w-1/2 h-full relative border-r border-white/20">
                                <img src={referenceImage} className="w-full h-full object-contain pointer-events-none" />
                                <span className="absolute top-4 left-4 bg-black/60 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">Reference</span>
                            </div>
                            <div className="w-1/2 h-full relative">
                                <img src={renderImage} className="w-full h-full object-contain pointer-events-none" />
                                <span className="absolute top-4 left-4 bg-[#d90238] text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">Student</span>
                            </div>
                        </div>
                    )}

                    {/* C. OVERLAY MODE */}
                    {mode === 'overlay' && (
                        <div className="relative w-full h-full flex items-center justify-center select-none">
                            <img src={referenceImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                            <img src={renderImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-75" style={{ opacity: overlayOpacity / 100 }} />
                        </div>
                    )}

                    {/* D. FULL VIEW MODE */}
                    {mode === 'full' && (
                        <div className="relative w-full h-full flex items-center justify-center select-none">
                            <img src={fullViewTarget === 'render' ? renderImage : referenceImage} className="w-full h-full object-contain pointer-events-none" />
                        </div>
                    )}

                </TransformComponent>
            </TransformWrapper>

            {/* --- BOTTOM CONTROLS --- */}
            {mode === 'overlay' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-72 bg-black/80 backdrop-blur-md p-4 rounded-full border border-white/10 flex flex-col gap-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-auto">
                    <div className="flex justify-between w-full text-[10px] text-neutral-400 font-bold uppercase tracking-widest px-2">
                        <span>Ref</span>
                        <span className="text-white">{overlayOpacity}%</span>
                        <span>Student</span>
                    </div>
                    <input type="range" min="0" max="100" value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#d90238] [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all" />
                </div>
            )}

            {mode === 'full' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-md p-2 rounded-full border border-white/10 flex items-center gap-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-auto">
                    <button onClick={() => setFullViewTarget('reference')} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${fullViewTarget === 'reference' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}>Reference</button>
                    <button onClick={() => setFullViewTarget('render')} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${fullViewTarget === 'render' ? 'bg-[#d90238] text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}>Student</button>
                </div>
            )}
        </div>
    );
}
