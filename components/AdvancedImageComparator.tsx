'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Columns, GalleryVerticalEnd, Layers, Eye, 
  Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw,
  MoveHorizontal, GripVertical, GripHorizontal,
  LayoutTemplate
} from 'lucide-react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

interface AdvancedComparatorProps {
  referenceImage: string;
  renderImage: string;
  className?: string;
}

type ComparisonMode = 'slider' | 'split' | 'overlay' | 'full';
type SplitDirection = 'horizontal' | 'vertical';

export function AdvancedImageComparator({ referenceImage, renderImage, className = '' }: AdvancedComparatorProps) {
    const [mode, setMode] = useState<ComparisonMode>('slider');
    const [sliderPosition, setSliderPosition] = useState(50);
    const [overlayOpacity, setOverlayOpacity] = useState(50);
    const [fullViewTarget, setFullViewTarget] = useState<'reference' | 'render'>('render');
    const [splitDirection, setSplitDirection] = useState<SplitDirection>('horizontal'); // New Split Options
    
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
            onClick={() => { onClick(); transformRef.current?.resetTransform(); }} 
            title={title} 
            className={`p-2 rounded-lg transition-all flex items-center justify-center ${active ? 'bg-[#d90238] text-white shadow-lg scale-105' : 'bg-black/60 text-neutral-400 hover:text-white hover:bg-black/80 backdrop-blur-sm border border-white/10'}`}
        >
            <Icon size={16} />
        </button>
    );

    return (
        <div ref={wrapperRef} className={`relative bg-[#050505] overflow-hidden group ${className} ${isFullscreen ? 'fixed inset-0 z-[100] w-screen h-screen' : 'w-full h-full'}`}>
            
            {/* --- 1. TOP CONTROL BAR --- */}
            <div className="absolute top-4 left-4 z-50 flex items-center gap-4 pointer-events-none">
                {/* Main Modes */}
                <div className="flex bg-black/80 backdrop-blur-md rounded-xl p-1.5 border border-white/10 gap-1 pointer-events-auto shadow-2xl">
                    <ModeBtn icon={Columns} active={mode === 'slider'} onClick={() => setMode('slider')} title="Slide Comparison" />
                    <ModeBtn icon={GalleryVerticalEnd} active={mode === 'split'} onClick={() => setMode('split')} title="Side-by-Side" />
                    <ModeBtn icon={Layers} active={mode === 'overlay'} onClick={() => setMode('overlay')} title="Overlay Blend" />
                    <ModeBtn icon={Eye} active={mode === 'full'} onClick={() => setMode('full')} title="Full View" />
                </div>

                {/* Split Context Controls (Only show in Split Mode) */}
                {mode === 'split' && (
                    <div className="flex bg-black/80 backdrop-blur-md rounded-xl p-1.5 border border-white/10 gap-1 pointer-events-auto animate-in slide-in-from-left-4 fade-in">
                        <button onClick={() => setSplitDirection('horizontal')} className={`p-2 rounded-lg ${splitDirection === 'horizontal' ? 'bg-white/20 text-white' : 'text-neutral-500 hover:text-white'}`} title="Left / Right"><Columns size={14}/></button>
                        <button onClick={() => setSplitDirection('vertical')} className={`p-2 rounded-lg ${splitDirection === 'vertical' ? 'bg-white/20 text-white' : 'text-neutral-500 hover:text-white'}`} title="Top / Bottom"><LayoutTemplate size={14} className="rotate-90"/></button>
                    </div>
                )}
            </div>

            <div className="absolute top-4 right-4 z-50 flex items-center gap-2 pointer-events-auto">
                <div className="flex items-center gap-1 p-1.5 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
                    <button onClick={() => transformRef.current?.zoomIn()} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><ZoomIn size={16}/></button>
                    <button onClick={() => transformRef.current?.zoomOut()} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><ZoomOut size={16}/></button>
                    <button onClick={() => transformRef.current?.resetTransform()} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><RotateCcw size={16}/></button>
                </div>
                <button onClick={toggleFullscreen} className="p-3 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-[#d90238] transition-colors shadow-2xl">
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
            </div>

            {/* --- 2. MAIN VISUAL AREA --- */}
            <TransformWrapper 
                ref={transformRef} 
                centerOnInit={true} 
                minScale={0.5} 
                maxScale={8} 
                wheel={{ step: 0.1 }}
                alignmentAnimation={{ sizeX: 0, sizeY: 0 }}
            >
                <TransformComponent 
                    wrapperStyle={{ width: "100%", height: "100%" }} 
                    contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                    
                    {/* A. SLIDER MODE (Fixed Dragging) */}
                    {mode === 'slider' && (
                        <div className="relative w-full h-full flex items-center justify-center select-none">
                            <img src={renderImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                            <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                                <img src={referenceImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                            </div>
                            
                            {/* Comparison Labels */}
                            <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-opacity duration-300" style={{ opacity: sliderPosition > 15 ? 1 : 0 }}>
                                <span className="bg-black/50 backdrop-blur border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded">REFERENCE</span>
                            </div>
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-opacity duration-300" style={{ opacity: sliderPosition < 85 ? 1 : 0 }}>
                                <span className="bg-[#d90238]/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded">RENDER</span>
                            </div>

                            {/* INTERACTIVE SLIDER HANDLE */}
                            <div className="absolute inset-0 w-full h-full pointer-events-auto">
                                <input 
                                    type="range" min="0" max="100" value={sliderPosition} 
                                    /* THIS FIXES THE SLIDE ISSUE: Stops Zoom from stealing the event */
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onChange={(e) => setSliderPosition(Number(e.target.value))} 
                                    className="absolute top-0 bottom-0 z-20 w-full h-full opacity-0 cursor-ew-resize m-0 p-0 appearance-none bg-transparent hover:cursor-grab active:cursor-grabbing" 
                                />
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-none" style={{ left: `${sliderPosition}%` }}>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#d90238] shadow-2xl border-2 border-black/10">
                                        <MoveHorizontal size={16} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* B. SPLIT MODE (Horizontal & Vertical Support) */}
                    {mode === 'split' && (
                        <div className={`flex w-full h-full items-center justify-center gap-1 ${splitDirection === 'vertical' ? 'flex-col' : 'flex-row'}`}>
                            <div className={`relative border-white/20 flex-1 w-full h-full ${splitDirection === 'vertical' ? 'border-b' : 'border-r'}`}>
                                <img src={referenceImage} className="w-full h-full object-contain pointer-events-none" />
                                <span className="absolute top-4 left-4 bg-black/60 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">Reference</span>
                            </div>
                            <div className="relative flex-1 w-full h-full">
                                <img src={renderImage} className="w-full h-full object-contain pointer-events-none" />
                                <span className="absolute top-4 left-4 bg-[#d90238] text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">Student Render</span>
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

            {/* --- 3. BOTTOM FLOATING CONTROLS --- */}
            {mode === 'overlay' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-80 bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-3 pointer-events-auto animate-in slide-in-from-bottom-4 fade-in">
                    <div className="flex justify-between w-full text-[10px] text-neutral-400 font-bold uppercase tracking-widest px-1">
                        <span>Reference</span>
                        <span className="text-white">{overlayOpacity}% Mix</span>
                        <span>Render</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" value={overlayOpacity} 
                        onPointerDown={(e) => e.stopPropagation()} 
                        onChange={(e) => setOverlayOpacity(Number(e.target.value))} 
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#d90238] [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all" 
                    />
                </div>
            )}

            {mode === 'full' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-2 pointer-events-auto animate-in slide-in-from-bottom-4 fade-in">
                    <button onClick={() => setFullViewTarget('reference')} className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${fullViewTarget === 'reference' ? 'bg-white text-black shadow-lg scale-105' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}>Reference</button>
                    <button onClick={() => setFullViewTarget('render')} className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${fullViewTarget === 'render' ? 'bg-[#d90238] text-white shadow-lg scale-105' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}>Student Render</button>
                </div>
            )}
        </div>
    );
}
