import React from "react";
import { motion } from "framer-motion";

const aiFeatures = [
    { value: "Chat", label: "AI Chat Support", desc: "Type any question about a medicine — dosage, side effects, interactions, alternatives. Get a clear, plain-language answer instantly." },
    { value: "Voice", label: "AI Voice Assistant", desc: "Speak to Vision Cure like you would a pharmacist. Ask about your medicines, get spoken explanations, and manage your health hands-free." },
    { value: "24/7", label: "Always Available", desc: "Whether it's 2am or a weekend, Vision Cure's AI is always on — ready to help you make safe, informed decisions about your medicines." },
];

const MolecularAccuracy = () => {
    return (
        <section className="relative py-40 px-6 overflow-hidden dark:bg-gradient-to-b dark:from-[#050505] dark:via-[#06060e] dark:to-[#050505] bg-gradient-to-b from-[#fafafa] via-[#f0f0f8] to-[#fafafa]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] dark:bg-white/[0.02] bg-black/[0.03] blur-[120px] rounded-full pointer-events-none" />
            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="mb-24 text-center">
                    <span className="dark:text-white/25 text-black/35 text-[10px] font-bold uppercase tracking-[0.6em] inter block mb-5">Powered by AI</span>
                    <h2 className="text-5xl md:text-7xl font-bold dark:text-white/90 text-black/90 outfit uppercase tracking-tight leading-none">AI-Powered Care</h2>
                    <div className="w-16 h-px dark:bg-white/20 bg-black/20 mt-6 mx-auto" />
                    <p className="dark:text-white/40 text-black/50 text-lg font-light inter mt-8 max-w-xl mx-auto leading-relaxed">
                        Vision Cure&apos;s AI understands medicine. It doesn&apos;t just answer questions — it guides you, warns you, and supports you every step of the way.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {aiFeatures.map((f, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.12, duration: 1, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }}
                            className="group relative p-8 rounded-2xl border dark:border-white/[0.06] border-black/[0.08] dark:bg-white/[0.02] bg-white dark:hover:border-white/[0.12] hover:border-black/[0.14] dark:hover:bg-white/[0.04] hover:bg-black/[0.02] transition-all duration-500 cursor-default">
                            <div className="absolute top-0 left-0 w-8 h-px dark:bg-white/20 bg-black/15 transition-all duration-500 group-hover:w-14" />
                            <div className="absolute top-0 left-0 h-8 w-px dark:bg-white/20 bg-black/15 transition-all duration-500 group-hover:h-14" />
                            <div className="flex flex-col gap-4">
                                <span className="text-6xl md:text-7xl font-bold dark:text-white/90 text-black/90 outfit tracking-tight leading-none">{f.value}</span>
                                <div className="w-6 h-px dark:bg-white/20 bg-black/20" />
                                <h3 className="text-sm font-bold dark:text-white/60 text-black/55 outfit uppercase tracking-[0.2em]">{f.label}</h3>
                                <p className="dark:text-white/40 text-black/50 text-sm leading-relaxed inter font-light">{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MolecularAccuracy;
