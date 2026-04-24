import React, { useState } from "react";
import { motion } from "framer-motion";

const FooterCTA = () => {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <footer id="contact" className="relative py-48 px-6 dark:bg-[#050505] bg-[#fafafa] overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] dark:bg-white/[0.025] bg-black/[0.03] blur-[150px] rounded-full pointer-events-none" />

            <div className="relative max-w-5xl mx-auto flex flex-col items-center text-center">
                <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}
                    className="dark:text-white/25 text-black/35 text-[10px] font-bold uppercase tracking-[0.6em] inter mb-6 block">
                    Get Started Today
                </motion.span>

                <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }}
                    className="text-5xl md:text-8xl font-bold dark:text-white/90 text-black/90 mb-6 outfit uppercase tracking-tight leading-[0.9]">
                    Start Managing<br />Your Medicines.
                </motion.h2>

                <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }} viewport={{ once: true }}
                    className="dark:text-white/35 text-black/45 text-lg font-light inter max-w-md mb-16 leading-relaxed">
                    Join Vision Cure and take control of your medicines. Scan, track, and stay safe — for free.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }} viewport={{ once: true }} className="w-full max-w-lg">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <input type="text" placeholder="Your name" required
                                className="w-full px-6 py-4 dark:bg-white/[0.04] bg-white border dark:border-white/[0.08] border-black/[0.10] rounded-xl dark:text-white/80 text-black/80 text-sm inter placeholder:dark:text-white/25 placeholder:text-black/30 focus:outline-none dark:focus:border-white/20 focus:border-black/25 transition-colors duration-300" />
                            <input type="email" placeholder="Your email address" required
                                className="w-full px-6 py-4 dark:bg-white/[0.04] bg-white border dark:border-white/[0.08] border-black/[0.10] rounded-xl dark:text-white/80 text-black/80 text-sm inter placeholder:dark:text-white/25 placeholder:text-black/30 focus:outline-none dark:focus:border-white/20 focus:border-black/25 transition-colors duration-300" />
                            <textarea placeholder="Tell us how you want to use Vision Cure (optional)" rows={3}
                                className="w-full px-6 py-4 dark:bg-white/[0.04] bg-white border dark:border-white/[0.08] border-black/[0.10] rounded-xl dark:text-white/80 text-black/80 text-sm inter placeholder:dark:text-white/25 placeholder:text-black/30 focus:outline-none dark:focus:border-white/20 focus:border-black/25 transition-colors duration-300 resize-none" />
                            <button type="submit" className="btn-glass-primary w-full rounded-xl">
                                Get Started — It&apos;s Free
                            </button>
                        </form>
                    ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="py-12 px-8 rounded-2xl border dark:border-white/[0.08] border-black/[0.08] dark:bg-white/[0.03] bg-white flex flex-col items-center gap-4">
                            <div className="w-10 h-10 rounded-full border dark:border-white/20 border-black/20 flex items-center justify-center">
                                <span className="dark:text-white text-black text-lg">✓</span>
                            </div>
                            <p className="dark:text-white/70 text-black/70 text-base inter font-light">
                                You&apos;re on the list. We&apos;ll be in touch shortly.
                            </p>
                        </motion.div>
                    )}
                </motion.div>

                <div className="mt-48 pt-10 border-t dark:border-white/[0.05] border-black/[0.07] w-full flex flex-col md:flex-row justify-between items-center gap-8 dark:text-white/25 text-black/35 text-[10px] font-medium uppercase tracking-[0.35em] inter">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full dark:bg-white/10 bg-black/10 flex items-center justify-center">
                            <span className="dark:text-white text-black text-[8px] font-bold outfit">V</span>
                        </div>
                        <span>© 2026 Vision Cure</span>
                    </div>
                    <div className="flex gap-10">
                        <a href="#" className="dark:hover:text-white/60 hover:text-black/60 transition-colors duration-300">Privacy Policy</a>
                        <a href="#" className="dark:hover:text-white/60 hover:text-black/60 transition-colors duration-300">Features</a>
                        <a href="#" className="dark:hover:text-white/60 hover:text-black/60 transition-colors duration-300">Contact</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default FooterCTA;
