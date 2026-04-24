import React from "react";
import { motion } from "framer-motion";

const features = [
    { icon: "◉", label: "Voice AI", title: "Conversational AI Voice Assistant", desc: "Speak naturally and get spoken answers. Ties the entire platform together with robust hands-free guidance." },
    { icon: "⬡", label: "Smart Scanner", title: "Smart Scanner with Real-Time Validation", desc: "Real-time validation powered by your timeline. Scan any medicine to instantly verify its safety against your schedule." },
    { icon: "▦", label: "Prescription OCR", title: "Prescription Upload with AI OCR", desc: "Upload physical prescriptions and our AI instantly extracts the data to feed your dynamic medication timeline." },
    { icon: "⚠", label: "Safety", title: "Drug Interaction Checker", desc: "Protects you at every step. Automatically cross-checks new prescriptions and scanned medicines against your profile." },
    { icon: "◈", label: "Timeline", title: "Dynamic Real-Time Timeline", desc: "Powered by your uploads. Tracks your schedule perfectly and updates dynamically based on your daily adherence." },
    { icon: "⊞", label: "Compliance", title: "Telegram Reminders with Escalation", desc: "Closes the compliance loop. Sends beautiful, timely notifications to your phone with escalation protocols for missed doses." },
];

const CoreFeatures = () => {
    return (
        <section id="features" className="relative py-40 px-6 dark:bg-[#0A0A0A] bg-[#F9FAFB]">
            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="mb-24 max-w-3xl">
                    <span className="dark:text-white/25 text-black/35 text-[10px] font-bold uppercase tracking-[0.6em] inter block mb-5">Platform Workflow</span>
                    <h2 className="text-5xl md:text-7xl font-bold dark:text-white/90 text-black/90 outfit uppercase tracking-tight leading-none mb-6">
                        An Intelligent<br /><span className="dark:text-white/20 text-black/20">Ecosystem</span>
                    </h2>
                    <p className="dark:text-white/50 text-black/60 text-lg font-medium inter leading-relaxed bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-black/10 dark:border-white/10 backdrop-blur-md inline-block">
                        Prescription upload → feeds the Timeline → powers the Scanner validation → triggers SOS if wrong → Telegram bot closes the compliance loop → Voice assistant ties it all together → Drug checker protects at every step
                    </p>
                </motion.div>

                {/* Grid for top 6 features */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {features.map((f, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }}
                            className="group relative p-8 rounded-2xl border dark:border-white/10 border-black/5 
                                       dark:bg-white/[0.03] bg-white/40 backdrop-blur-xl saturate-150
                                       shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)]
                                       hover:dark:border-white/20 hover:border-black/15 hover:dark:bg-white/[0.06] hover:bg-white/60 
                                       transition-all duration-500 cursor-default">
                            <div className="absolute top-0 left-0 w-8 h-px dark:bg-white/30 bg-black/20 transition-all duration-500 group-hover:w-16" />
                            <div className="absolute top-0 left-0 h-8 w-px dark:bg-white/30 bg-black/20 transition-all duration-500 group-hover:h-16" />
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center gap-3">
                                    <span className="dark:text-blue-400 text-blue-600 text-xl">{f.icon}</span>
                                    <span className="dark:text-white/30 text-black/40 text-[10px] font-bold uppercase tracking-[0.4em] inter">{f.label}</span>
                                </div>
                                <h3 className="text-xl font-bold dark:text-white/90 text-black/90 outfit tracking-tight leading-snug">{f.title}</h3>
                                <p className="dark:text-white/50 text-black/60 text-sm leading-relaxed inter font-light">{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 7th Feature: Full Width Emergency SOS */}
                <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }}
                    className="group relative p-8 md:p-10 rounded-2xl border dark:border-red-500/20 border-red-500/10 
                               dark:bg-red-500/[0.03] bg-red-500/5 backdrop-blur-2xl saturate-150
                               shadow-[0_8px_32px_-12px_rgba(239,68,68,0.15)] dark:shadow-[0_8px_32px_-12px_rgba(239,68,68,0.15)]
                               hover:dark:bg-red-500/[0.06] hover:bg-red-500/10 
                               transition-all duration-500 cursor-default flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="absolute top-0 left-0 w-8 h-px dark:bg-red-500/40 bg-red-500/30 transition-all duration-500 group-hover:w-24" />
                    <div className="absolute top-0 left-0 h-8 w-px dark:bg-red-500/40 bg-red-500/30 transition-all duration-500 group-hover:h-24" />
                    
                    <div className="flex flex-col gap-5 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="dark:text-red-400 text-red-500 text-xl flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10">🚨</span>
                            <span className="dark:text-red-400 text-red-500 text-[10px] font-bold uppercase tracking-[0.4em] inter">Critical Loop</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold dark:text-white/90 text-black/90 outfit tracking-tight leading-snug">Emergency SOS System</h3>
                        <p className="dark:text-white/50 text-black/60 text-base leading-relaxed inter font-light">
                            Triggered automatically if highly critical drug interactions are detected by the drug checker, or if missed doses escalate past the safe threshold. It immediately hooks into the Telegram API to alert your designated caregivers and emergency contacts.
                        </p>
                    </div>
                    
                    <div className="flex-shrink-0">
                        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border border-red-500/30 flex items-center justify-center bg-red-500/5">
                            <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping opacity-50 duration-1000"></div>
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                <span className="text-red-500 text-2xl md:text-3xl">⚕</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Glowing background meshes for glassy texture */}
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
        </section>
    );
};

export default CoreFeatures;
