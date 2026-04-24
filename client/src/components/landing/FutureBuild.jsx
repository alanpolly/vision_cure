import React from "react";
import { motion } from "framer-motion";

const FutureBuild = () => {
    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <section className="relative py-48 px-6 dark:bg-gradient-to-b dark:from-[#050505] dark:to-[#08080f] bg-gradient-to-b from-[#fafafa] to-white overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-24">
                <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }} className="flex-1">
                    <span className="dark:text-white/25 text-black/35 text-[10px] font-bold uppercase tracking-[0.6em] inter block mb-6">Your Command Center</span>
                    <h2 className="text-5xl md:text-7xl font-bold dark:text-white/90 text-black/90 mb-8 outfit uppercase tracking-tight leading-tight">
                        Everything in<br /><span className="dark:text-white/15 text-black/15">One Place.</span>
                    </h2>
                    <p className="dark:text-white/50 text-black/55 text-lg leading-relaxed inter font-light max-w-lg">
                        The Vision Cure dashboard gives you a complete, real-time view of your health. See your active medicines, upcoming doses, recent scans, and safety alerts — all at a glance, without switching between apps.
                    </p>
                    <button onClick={() => scrollTo("contact")} className="btn-glass-primary mt-12">
                        Start Managing Your Medicines
                    </button>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }} className="flex-1 w-full max-w-md">
                    <div className="relative aspect-square rounded-3xl overflow-hidden border dark:border-white/[0.07] border-black/[0.09] dark:bg-white/[0.02] bg-white">
                        <div className="absolute -inset-px rounded-3xl dark:bg-gradient-to-br dark:from-white/10 dark:via-white/[0.03] dark:to-white/10 bg-gradient-to-br from-black/[0.04] via-black/[0.01] to-black/[0.04] pointer-events-none" />
                        <div className="relative h-full w-full rounded-3xl dark:bg-[#050505]/80 bg-white/90 flex flex-col p-10 gap-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="dark:text-white/90 text-black/90 text-sm font-bold outfit uppercase tracking-wide">Dashboard</div>
                                    <div className="dark:text-white/30 text-black/35 text-[10px] inter mt-0.5">Today, 24 April 2026</div>
                                </div>
                                <div className="w-8 h-8 rounded-full dark:bg-white/10 bg-black/10 flex items-center justify-center">
                                    <span className="dark:text-white text-black text-sm font-bold outfit">V</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[{ val: "3", lbl: "Medicines" }, { val: "1", lbl: "Due Today" }, { val: "0", lbl: "Alerts" }].map((s, i) => (
                                    <div key={i} className="rounded-xl dark:bg-white/[0.04] bg-black/[0.04] border dark:border-white/[0.06] border-black/[0.07] p-4 text-center">
                                        <div className="dark:text-white/90 text-black/90 text-2xl font-bold outfit">{s.val}</div>
                                        <div className="dark:text-white/30 text-black/35 text-[10px] inter mt-1 uppercase tracking-wider">{s.lbl}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 flex-1">
                                {[{ name: "Metformin 500mg", time: "8:00 AM", done: true }, { name: "Lisinopril 10mg", time: "1:00 PM", done: false }, { name: "Atorvastatin 20mg", time: "9:00 PM", done: false }].map((m, i) => (
                                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/[0.05] border-black/[0.06]">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${m.done ? "dark:bg-white/60 bg-black/40" : "dark:bg-white/20 bg-black/20"}`} />
                                            <span className={`text-sm inter ${m.done ? "dark:text-white/40 text-black/35 line-through" : "dark:text-white/70 text-black/70"}`}>{m.name}</span>
                                        </div>
                                        <span className="dark:text-white/25 text-black/30 text-[10px] inter">{m.time}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-center py-3 rounded-xl border dark:border-white/[0.08] border-black/[0.08] dark:bg-white/[0.04] bg-black/[0.03]">
                                <span className="dark:text-white/50 text-black/50 text-sm inter font-light">Tap to scan a medicine →</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default FutureBuild;
