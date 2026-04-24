import React from "react";
import { motion } from "framer-motion";

const pillars = [
    { title: "Safety First", desc: "Vision Cure automatically detects harmful drug interactions before they happen. Every scan, every combination, every time — your safety is checked." },
    { title: "Simple to Use", desc: "No medical knowledge needed. Scan a medicine, get a plain-language answer. Manage your health without confusion or guesswork." },
    { title: "Intelligent by Design", desc: "Built on AI that understands medicine. From identifying unknown tablets to answering complex drug questions — Vision Cure thinks ahead so you don't have to." },
];

const EngineeredPrecision = () => {
    return (
        <section id="about" className="relative py-48 px-6 dark:bg-[#050505] bg-[#fafafa] overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] dark:bg-white/[0.025] bg-black/[0.03] blur-[130px] rounded-full pointer-events-none" />
            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="max-w-3xl mb-24">
                    <span className="dark:text-white/25 text-black/35 text-[10px] font-bold uppercase tracking-[0.6em] inter block mb-5">About Vision Cure</span>
                    <h2 className="text-5xl md:text-7xl font-bold dark:text-white/90 text-black/90 outfit uppercase tracking-tight leading-none mb-6">
                        Why<br /><span className="dark:text-white/20 text-black/20">Vision Cure?</span>
                    </h2>
                    <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }} className="w-16 h-px dark:bg-white/30 bg-black/25 mb-8 origin-left" />
                    <p className="dark:text-white/60 text-black/65 text-xl font-light leading-relaxed inter">
                        Vision Cure is a smart healthcare platform that puts medicine management in your hands. Whether you&apos;re managing a single prescription or multiple medicines across your family — Vision Cure keeps everything organised, safe, and understood.
                    </p>
                    <p className="dark:text-white/40 text-black/45 text-lg font-light leading-relaxed inter mt-5">
                        We built Vision Cure because too many people take the wrong medicine, miss doses, or suffer from preventable drug interactions. Our platform solves this with AI, real-time scanning, and a simple experience anyone can use.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pillars.map((p, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }}
                            className="relative p-8 rounded-2xl border dark:border-white/[0.07] border-black/[0.08] dark:bg-white/[0.02] bg-white dark:hover:border-white/[0.14] hover:border-black/[0.15] dark:hover:bg-white/[0.04] hover:bg-black/[0.02] transition-all duration-500 group cursor-default">
                            <div className="absolute top-0 left-0 w-8 h-px dark:bg-white/25 bg-black/20 transition-all duration-500 group-hover:w-14" />
                            <div className="absolute top-0 left-0 h-8 w-px dark:bg-white/25 bg-black/20 transition-all duration-500 group-hover:h-14" />
                            <h3 className="text-lg font-bold dark:text-white/90 text-black/90 outfit uppercase tracking-wide mb-4">{p.title}</h3>
                            <p className="dark:text-white/45 text-black/55 text-sm leading-relaxed inter font-light">{p.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default EngineeredPrecision;
