'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Columns, GalleryVerticalEnd, Layers, Eye, 
  Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw,
  MoveHorizontal
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

    // Helper for Mode Buttons
    const ModeBtn = ({ icon: Icon, active, onClick, title }: any) => (
        <button 
            onClick={() => {
                onClick();
                transformRef.current?.resetTransform(); // Reset zoom when changing modes
            }} 
            title={title} 
            className={`p-2 rounded-lg transition-all flex items-center justify-center ${active ? 'bg-[#d90238] text-white shadow-lg' : 'bg-black/60 text-neutral-400 hover:text-white hover:bg-black/80 backdrop-blur-sm border border-white/10'}`}
        >
            <Icon size={16} />
        </button>
    );

    return (
        <div ref={wrapperRef} className={`relative bg-[#020202] overflow-hidden group ${className} ${isFullscreen ? 'fixed inset-0 z-[100] w-screen h-screen' : 'w-full h-full'}`}>
            
            {/* --- TOP CONTROLS --- */}
            <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
                <div className="flex bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10 gap-1">
                    <ModeBtn icon={Columns} active={mode === 'slider'} onClick={() => setMode('slider')} title="Slider" />
                    <ModeBtn icon={GalleryVerticalEnd} active={mode === 'split'} onClick={() => setMode('split')} title="Split" />
                    <ModeBtn icon={Layers} active={mode === 'overlay'} onClick={() => setMode('overlay')} title="Overlay" />
                    <ModeBtn icon={Eye} active={mode === 'full'} onClick={() => setMode('full')} title="Full View" />
                </div>
            </div>

            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                <div className="flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                    <button onClick={() => transformRef.current?.zoomIn()} className="p-1.5 text-neutral-400 hover:text-white"><ZoomIn size={16}/></button>
                    <button onClick={() => transformRef.current?.zoomOut()} className="p-1.5 text-neutral-400 hover:text-white"><ZoomOut size={16}/></button>
                    <button onClick={() => transformRef.current?.resetTransform()} className="p-1.5 text-neutral-400 hover:text-white"><RotateCcw size={16}/></button>
                </div>
                <button onClick={toggleFullscreen} className="p-2.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-neutral-400 hover:text-white hover:bg-[#d90238]">
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* --- MAIN VISUAL AREA --- */}
            <TransformWrapper 
                ref={transformRef} 
                centerOnInit={true} 
                minScale={0.5} 
                maxScale={8} 
                wheel={{ step: 0.1 }}
            >
                <TransformComponent 
                    wrapperStyle={{ width: "100%", height: "100%" }} 
                    contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                    
                    {/* 1. SLIDER MODE */}
                    {mode === 'slider' && (
                        <div className="relative w-full h-full flex items-center justify-center select-none">
                            {/* Base Image (Render) */}
                            <img src={renderImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                            
                            {/* Top Image (Reference) - Clipped */}
                            <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                                <img src={referenceImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                            </div>

                            {/* Floating Labels for Slide Mode */}
                            <div className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/50 backdrop-blur px-2 py-1 rounded border border-white/10 text-[10px] font-bold text-white pointer-events-none" style={{ opacity: sliderPosition > 10 ? 1 : 0, transition: 'opacity 0.2s' }}>REF</div>
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 bg-[#d90238]/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white pointer-events-none" style={{ opacity: sliderPosition < 90 ? 1 : 0, transition: 'opacity 0.2s' }}>RENDER</div>

                            {/* Slider Handle (Interactive) */}
                            <div className="absolute inset-0 w-full h-full pointer-events-auto">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={sliderPosition} 
                                    // STOP PROPAGATION is key here to prevent Zoom/Pan hijacking
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onChange={(e) => setSliderPosition(Number(e.target.value))} 
                                    className="absolute top-0 bottom-0 z-20 w-full h-full opacity-0 cursor-ew-resize m-0 p-0 appearance-none bg-transparent" 
                                />
                                {/* Visual Line */}
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_15px_rgba(0,0,0,0.8)] pointer-events-none transition-none" style={{ left: `${sliderPosition}%` }}>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#d90238] shadow-xl border-2 border-neutral-200">
                                        <MoveHorizontal size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. SPLIT MODE (Synchronized Zoom) */}
                    {mode === 'split' && (
                        <div className="flex w-full h-full items-center justify-center gap-1">
                            <div className="flex-1 h-full relative border-r border-white/20">
                                <img src={referenceImage} className="w-full h-full object-contain pointer-events-none" />
                                <span className="absolute bottom-4 left-4 bg-black/60 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">Reference</span>
                            </div>
                            <div className="flex-1 h-full relative">
                                <img src={renderImage} className="w-full h-full object-contain pointer-events-none" />
                                <span className="absolute bottom-4 right-4 bg-[#d90238] text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">Render</span>
                            </div>
                        </div>
                    )}

                    {/* 3. OVERLAY/BLEND MODE */}
                    {mode === 'overlay' && (
                        <div className="relative w-full h-full flex items-center justify-center select-none">
                            <img src={referenceImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                            <img src={renderImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-75" style={{ opacity: overlayOpacity / 100 }} />
                        </div>
                    )}

                    {/* 4. FULL VIEW MODE */}
                    {mode === 'full' && (
                        <div className="relative w-full h-full flex items-center justify-center select-none">
                            <img src={fullViewTarget === 'render' ? renderImage : referenceImage} className="w-full h-full object-contain pointer-events-none" />
                        </div>
                    )}

                </TransformComponent>
            </TransformWrapper>

            {/* --- BOTTOM FLOATING CONTROLS --- */}
            
            {/* Blend Controls */}
            {mode === 'overlay' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-72 bg-black/80 backdrop-blur-md p-4 rounded-full border border-white/10 flex flex-col gap-2 pointer-events-auto">
                    <div className="flex justify-between w-full text-[10px] text-neutral-400 font-bold uppercase tracking-widest px-2">
                        <span>Reference</span>
                        <span className="text-white">{overlayOpacity}%</span>
                        <span>Render</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" 
                        value={overlayOpacity} 
                        onPointerDown={(e) => e.stopPropagation()} // Important for interaction
                        onChange={(e) => setOverlayOpacity(Number(e.target.value))} 
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#d90238] [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all" 
                    />
                </div>
            )}

            {/* Full View Toggle */}
            {mode === 'full' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-md p-2 rounded-full border border-white/10 flex items-center gap-2 pointer-events-auto">
                    <button onClick={() => setFullViewTarget('reference')} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${fullViewTarget === 'reference' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}>Reference</button>
                    <button onClick={() => setFullViewTarget('render')} className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${fullViewTarget === 'render' ? 'bg-[#d90238] text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}>Render</button>
                </div>
            )}
        </div>
    );
}
