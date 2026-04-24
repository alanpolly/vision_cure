import React from "react";
import { motion } from "framer-motion";

const steps = [
    { num: "01", title: "Scan", desc: "Open Vision Cure and point your camera at any medicine. The scanner reads the label, identifies the medicine, and pulls up everything you need to know." },
    { num: "02", title: "Verify", desc: "Vision Cure cross-checks the scanned medicine against your stored prescriptions and checks for any harmful combinations with medicines you already take." },
    { num: "03", title: "Track", desc: "Every medicine is added to your personal dashboard. Set reminders, log doses, and keep a clear record of what you're taking and when." },
    { num: "04", title: "Stay Safe", desc: "Get real-time alerts if something doesn't add up. Ask our AI assistant anything. Vision Cure keeps you informed, protected, and in control at all times." },
];

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="relative py-40 px-6 dark:bg-[#050505] bg-white">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="mb-28">
                    <span className="dark:text-white/25 text-black/35 text-[10px] font-bold uppercase tracking-[0.6em] inter block mb-5">The Process</span>
                    <h2 className="text-5xl md:text-7xl font-bold dark:text-white/90 text-black/90 outfit uppercase tracking-tight leading-none">How It Works</h2>
                    <div className="w-16 h-px dark:bg-white/20 bg-black/20 mt-6" />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:divide-x dark:divide-white/[0.06] divide-black/[0.07]">
                    {steps.map((step, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }}
                            className="flex flex-col gap-5 px-0 md:px-10 first:pl-0 last:pr-0 py-8 md:py-0 border-b dark:border-white/[0.06] border-black/[0.07] md:border-b-0 last:border-b-0">
                            <span className="dark:text-white/10 text-black/10 text-5xl font-bold outfit tabular-nums">{step.num}</span>
                            <div className="w-8 h-px dark:bg-white/20 bg-black/20" />
                            <h3 className="text-2xl font-bold dark:text-white/90 text-black/90 outfit uppercase tracking-wide">{step.title}</h3>
                            <p className="dark:text-white/50 text-black/55 text-sm leading-relaxed inter font-light">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
