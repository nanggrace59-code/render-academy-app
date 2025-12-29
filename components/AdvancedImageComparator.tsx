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

    // Helper for Small Floating Buttons
    const ModeBtn = ({ icon: Icon, active, onClick, title }: any) => (
        <button 
            onClick={onClick} 
            title={title} 
            className={`p-1.5 rounded-md transition-all flex items-center justify-center ${active ? 'bg-[#d90238] text-white shadow-md' : 'bg-black/60 text-neutral-400 hover:text-white hover:bg-black/80 backdrop-blur-sm border border-white/10'}`}
        >
            <Icon size={14} />
        </button>
    );

    return (
        <div ref={wrapperRef} className={`relative bg-[#020202] overflow-hidden rounded-xl border border-white/10 group ${className} ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none border-none w-screen h-screen' : 'w-full h-full'}`}>
            
            {/* --- TOP FLOATING CONTROLS (Google Style) --- */}
            <div className="absolute top-3 left-3 z-30 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ModeBtn icon={Columns} active={mode === 'slider'} onClick={() => setMode('slider')} title="Slider" />
                <ModeBtn icon={GalleryVerticalEnd} active={mode === 'split'} onClick={() => setMode('split')} title="Split" />
                <ModeBtn icon={Layers} active={mode === 'overlay'} onClick={() => setMode('overlay')} title="Overlay" />
                <ModeBtn icon={Eye} active={mode === 'full'} onClick={() => setMode('full')} title="Full View" />
            </div>

            <div className="absolute top-3 right-3 z-30 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10">
                    <button onClick={() => transformRef.current?.zoomIn()} className="p-1 text-neutral-400 hover:text-white"><ZoomIn size={14}/></button>
                    <button onClick={() => transformRef.current?.zoomOut()} className="p-1 text-neutral-400 hover:text-white"><ZoomOut size={14}/></button>
                    <button onClick={() => transformRef.current?.resetTransform()} className="p-1 text-neutral-400 hover:text-white"><RotateCcw size={14}/></button>
                </div>
                <button onClick={toggleFullscreen} className="p-1.5 bg-black/60 backdrop-blur-md rounded-md border border-white/10 text-neutral-400 hover:text-white hover:bg-[#d90238]">
                    {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
            </div>

            {/* --- MAIN VISUAL AREA --- */}
            <TransformWrapper ref={transformRef} centerOnInit={true} minScale={0.5} wheel={{ step: 0.1 }}>
                <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
                    
                    {mode === 'slider' && (
                        <div className="relative w-full h-full flex items-center justify-center select-none">
                            <img src={referenceImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                            <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                                <img src={renderImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                            </div>
                            <div className="absolute inset-0 w-full h-full pointer-events-auto" style={{ cursor: 'ew-resize' }}>
                                <input type="range" min="0" max="100" value={sliderPosition} onChange={(e) => setSliderPosition(Number(e.target.value))} className="absolute top-0 bottom-0 z-20 w-full h-full opacity-0 cursor-ew-resize" />
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none" style={{ left: `${sliderPosition}%` }}>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#d90238] shadow-lg">
                                        <Columns size={12} className="rotate-90" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'split' && (
                        <div className="flex w-full h-full gap-1 p-2">
                            <div className="flex-1 relative border border-white/10 rounded overflow-hidden flex items-center justify-center">
                                <img src={referenceImage} className="w-full h-full object-contain" />
                                <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded border border-white/10">Reference</span>
                            </div>
                            <div className="flex-1 relative border border-white/10 rounded overflow-hidden flex items-center justify-center">
                                <img src={renderImage} className="w-full h-full object-contain" />
                                <span className="absolute top-2 left-2 bg-[#d90238] text-white text-[9px] px-2 py-0.5 rounded">Student</span>
                            </div>
                        </div>
                    )}

                    {mode === 'overlay' && (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img src={referenceImage} className="absolute inset-0 w-full h-full object-contain" />
                            <img src={renderImage} className="absolute inset-0 w-full h-full object-contain transition-opacity duration-100" style={{ opacity: overlayOpacity / 100 }} />
                        </div>
                    )}

                    {mode === 'full' && (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img src={fullViewTarget === 'render' ? renderImage : referenceImage} className="w-full h-full object-contain" />
                        </div>
                    )}

                </TransformComponent>
            </TransformWrapper>

            {/* --- BOTTOM FLOATING CONTROLS --- */}
            {mode === 'overlay' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-48 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 flex flex-col gap-1 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                    <div className="flex justify-between text-[8px] text-neutral-400 font-bold uppercase px-2"><span>Ref</span><span>Assignment</span></div>
                    <input type="range" min="0" max="100" value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#d90238] [&::-webkit-slider-thumb]:rounded-full" />
                </div>
            )}

            {mode === 'full' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 flex items-center gap-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                    <button onClick={() => setFullViewTarget('reference')} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${fullViewTarget === 'reference' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>Reference</button>
                    <button onClick={() => setFullViewTarget('render')} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${fullViewTarget === 'render' ? 'bg-[#d90238] text-white' : 'text-neutral-400 hover:text-white'}`}>Student</button>
                </div>
            )}
        </div>
    );
}
