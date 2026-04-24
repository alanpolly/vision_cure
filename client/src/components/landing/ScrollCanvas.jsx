import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ScrollCanvas = ({ frameCount, parentRef, onFinalFrame }) => {
    const canvasRef = useRef(null);
    const imagesRef = useRef([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [showCTA, setShowCTA] = useState(false);

    const targetFrame = useRef(0);
    const currentFrame = useRef(0);
    const renderedFrame = useRef(-1);
    const isFinalRef = useRef(false);

    const layoutRef = useRef({
        winWidth: 0, winHeight: 0, dpr: 1, top: 0, height: 0, maxScroll: 1,
    });

    const renderFrame = useCallback((index) => {
        const canvas = canvasRef.current;
        const images = imagesRef.current;
        if (!canvas || images.length === 0) return;
        const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: false });
        if (!ctx) return;
        const img = images[index];
        if (!img || !img.complete) return;
        const layout = layoutRef.current;
        if (layout.winWidth === 0) return;
        const targetW = layout.winWidth * layout.dpr;
        const targetH = layout.winHeight * layout.dpr;
        if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
            canvas.style.width = `${layout.winWidth}px`;
            canvas.style.height = `${layout.winHeight}px`;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(layout.dpr, layout.dpr);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
        }
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, layout.winWidth, layout.winHeight);
        const scale = Math.max(layout.winWidth / img.naturalWidth, layout.winHeight / img.naturalHeight);
        const drawWidth = img.naturalWidth * scale;
        const drawHeight = img.naturalHeight * scale;
        const x = (layout.winWidth - drawWidth) / 2;
        const y = (layout.winHeight - drawHeight) / 2;
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
    }, []);

    useEffect(() => {
        const container = parentRef.current;
        if (!container) return;
        const updateLayout = () => {
            layoutRef.current.winWidth = window.innerWidth;
            layoutRef.current.winHeight = window.innerHeight;
            layoutRef.current.dpr = Math.min(window.devicePixelRatio || 1, 2);
            layoutRef.current.top = container.getBoundingClientRect().top + window.scrollY;
            layoutRef.current.height = container.offsetHeight;
            layoutRef.current.maxScroll = Math.max(1, container.offsetHeight - window.innerHeight);
        };
        setTimeout(updateLayout, 150);
        window.addEventListener("resize", updateLayout, { passive: true });
        return () => window.removeEventListener("resize", updateLayout);
    }, [parentRef]);

    useEffect(() => {
        let rafId;
        const update = () => {
            if (isLoaded) {
                const layout = layoutRef.current;
                if (layout.maxScroll > 1) {
                    let rawProgress = (window.scrollY - layout.top) / layout.maxScroll;
                    rawProgress = Math.max(0, Math.min(1, rawProgress));
                    targetFrame.current = rawProgress * (frameCount - 1);
                }
                currentFrame.current += (targetFrame.current - currentFrame.current) * 0.12;
                let nextFrame = Math.round(currentFrame.current);
                nextFrame = Math.max(0, Math.min(frameCount - 1, nextFrame));
                if (nextFrame !== renderedFrame.current) {
                    renderFrame(nextFrame);
                    renderedFrame.current = nextFrame;
                    const threshold = frameCount - Math.ceil(frameCount * 0.02);
                    const nowFinal = nextFrame >= threshold;
                    if (nowFinal !== isFinalRef.current) {
                        isFinalRef.current = nowFinal;
                        setShowCTA(nowFinal);
                        onFinalFrame?.(nowFinal);
                    }
                }
            }
            rafId = requestAnimationFrame(update);
        };
        rafId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(rafId);
    }, [isLoaded, frameCount, renderFrame, onFinalFrame]);

    useEffect(() => {
        let isMounted = true;
        const totalToLoad = 120;
        const imgArray = new Array(totalToLoad);
        let loadedCount = 0;
        for (let i = 1; i <= 120; i++) {
            const img = new Image();
            const actualFrameNum = ((i - 1) * 2 + 1).toString().padStart(3, "0");
            img.src = `/hq_frames/frame-${actualFrameNum}.jpg`;
            img.decoding = "async";
            const idx = i - 1;
            img.onload = () => {
                if (!isMounted) return;
                imgArray[idx] = img;
                loadedCount++;
                setLoadProgress(Math.round((loadedCount / totalToLoad) * 100));
                if (loadedCount === totalToLoad) {
                    imagesRef.current = imgArray;
                    setIsLoaded(true);
                    setTimeout(() => renderFrame(0), 16);
                }
            };
            img.onerror = () => {
                if (!isMounted) return;
                loadedCount++;
                if (loadedCount === totalToLoad) {
                    imagesRef.current = imgArray;
                    setIsLoaded(true);
                }
            };
        }
        return () => { isMounted = false; };
    }, [renderFrame]);

    return (
        <div className="absolute inset-0 w-full h-full bg-[#050505]">
            <AnimatePresence>
                {!isLoaded && (
                    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] gap-6">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col items-center gap-6">
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-2">
                                <span className="text-white font-bold text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>V</span>
                            </div>
                            <span className="text-white/40 font-medium tracking-[0.5em] text-[10px] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                                Initializing Vision Cure
                            </span>
                            <div className="w-48 h-px bg-white/10 relative overflow-hidden">
                                <motion.div className="absolute top-0 left-0 h-full bg-white/60" style={{ width: `${loadProgress}%` }} transition={{ duration: 0.05 }} />
                            </div>
                            <span className="text-white/20 text-[10px] tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>{loadProgress}%</span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <canvas ref={canvasRef} className={`block w-full h-full pointer-events-none transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
            <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,0,0,0)_0%,rgba(5,5,5,0.65)_100%)]" />

            <AnimatePresence>
                {showCTA && isLoaded && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                        <motion.div initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 10 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} className="flex flex-col items-center gap-6 pointer-events-auto">
                            <span className="text-white/30 text-[10px] font-medium tracking-[0.5em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Delivery Complete</span>
                            <div className="relative group">
                                <div className="absolute -inset-1 rounded-full bg-white/10 blur-md group-hover:bg-white/20 transition-all duration-500" />
                                <div className="absolute -inset-3 rounded-full bg-white/5 blur-xl group-hover:bg-white/10 transition-all duration-700" />
                                <button className="relative px-10 py-4 bg-white text-black text-sm font-bold rounded-full tracking-[0.1em] uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.35)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    Get Started
                                </button>
                            </div>
                            <p className="text-white/20 text-[11px] tracking-widest text-center" style={{ fontFamily: 'Inter, sans-serif' }}>Precision medicine, perfected.</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ScrollCanvas;
