import React from "react";
import { motion, useTransform } from "framer-motion";

const TextOverlay = ({ progress }) => {
    const op1 = useTransform(progress, [0.0, 0.06, 0.15, 0.21], [0, 1, 1, 0]);
    const y1  = useTransform(progress, [0.0, 0.06, 0.15, 0.21], [30, 0, 0, -20]);

    const op2 = useTransform(progress, [0.26, 0.33, 0.43, 0.50], [0, 1, 1, 0]);
    const x2  = useTransform(progress, [0.26, 0.33, 0.43, 0.50], [-50, 0, 0, -30]);

    const op3 = useTransform(progress, [0.55, 0.62, 0.72, 0.80], [0, 1, 1, 0]);
    const x3  = useTransform(progress, [0.55, 0.62, 0.72, 0.80], [50, 0, 0, 30]);

    const op4 = useTransform(progress, [0.86, 0.92, 0.96, 0.99], [0, 1, 1, 0]);
    const y4  = useTransform(progress, [0.86, 0.92, 0.96, 0.99], [20, 0, 0, -15]);

    const glowOp = useTransform(progress, [0, 0.5, 1], [0.04, 0.14, 0.04]);

    return (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            <motion.div style={{ opacity: glowOp }} className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_70%)]" />

            <motion.div style={{ opacity: op1, y: y1 }} className="absolute bottom-[22%] left-1/2 -translate-x-1/2 text-center">
                <div className="flex flex-col items-center gap-3">
                    <span className="text-white/25 text-[9px] font-bold uppercase tracking-[0.6em] inter">01 / 04</span>
                    <h3 className="text-4xl md:text-6xl font-bold text-white/90 outfit uppercase tracking-tight leading-none">
                        Smart Healthcare<br />Starts Here
                    </h3>
                    <div className="w-8 h-px bg-white/25 mt-1" />
                </div>
            </motion.div>

            <motion.div style={{ opacity: op2, x: x2 }} className="absolute left-[8%] md:left-[12%] top-[28%] max-w-[280px]">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-px bg-white/30" />
                        <span className="text-white/25 text-[9px] font-bold uppercase tracking-[0.5em] inter">02 / 04</span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-bold text-white/90 outfit uppercase tracking-tight leading-tight">
                        Scan &amp;<br />Understand<br />Medicines
                    </h3>
                    <p className="text-white/40 text-sm font-light leading-relaxed inter">
                        Point your camera at any medicine and get instant identification and safety checks.
                    </p>
                </div>
            </motion.div>

            <motion.div style={{ opacity: op3, x: x3 }} className="absolute right-[8%] md:right-[12%] top-[32%] max-w-[280px] text-right">
                <div className="flex flex-col gap-3 items-end">
                    <div className="flex items-center gap-3">
                        <span className="text-white/25 text-[9px] font-bold uppercase tracking-[0.5em] inter">03 / 04</span>
                        <div className="w-8 h-px bg-white/30" />
                    </div>
                    <h3 className="text-3xl md:text-5xl font-bold text-white/90 outfit uppercase tracking-tight leading-tight">
                        Detect Risks<br />Instantly
                    </h3>
                    <p className="text-white/40 text-sm font-light leading-relaxed inter">
                        Real-time warnings for harmful drug combinations before they reach you.
                    </p>
                </div>
            </motion.div>

            <motion.div style={{ opacity: op4, y: y4 }} className="absolute top-[18%] left-1/2 -translate-x-1/2 text-center">
                <div className="flex flex-col items-center gap-3">
                    <span className="text-white/25 text-[9px] font-bold uppercase tracking-[0.6em] inter">04 / 04</span>
                    <h3 className="text-4xl md:text-6xl font-bold text-white/90 outfit uppercase tracking-tight leading-none">
                        Stay Safe.<br />Stay In Control.
                    </h3>
                    <div className="w-8 h-px bg-white/25 mt-1" />
                    <p className="text-white/35 text-sm font-light tracking-wide inter mt-1">
                        Your complete medicine command center.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default TextOverlay;
