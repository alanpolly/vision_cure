import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";

const HeroSection = () => {
    const { t } = useLanguage();
    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <section id="hero" className="relative h-screen w-full flex flex-col items-center justify-center bg-transparent z-10 overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] dark:bg-white/[0.03] bg-black/[0.04] blur-[140px] rounded-full pointer-events-none" />

            {/* Main content */}
            <div className="text-center px-6">
                <h1 className="text-[clamp(4rem,14vw,12rem)] font-bold tracking-[-0.04em] leading-none uppercase mb-4 outfit">
                    <motion.span
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="block dark:text-white/90 text-black/90"
                    >
                        Vision
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className="block dark:text-white/15 text-black/15"
                    >
                        Cure
                    </motion.span>
                </h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.85 }}
                    className="dark:text-white/60 text-black/60 text-lg md:text-xl font-light tracking-wide max-w-sm mx-auto inter mb-3"
                >
                    {t('hero_sub')}
                </motion.p>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1.0 }}
                    className="dark:text-white/30 text-black/35 text-sm font-light max-w-xs mx-auto inter leading-relaxed"
                >
                    {t('hero_tag')}
                </motion.p>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.2 }}
                    className="flex items-center justify-center gap-4 mt-10"
                >
                    <button
                        onClick={() => scrollTo("contact")}
                        className="inline-flex items-center justify-center whitespace-nowrap px-7 py-3 rounded-full text-sm font-bold uppercase tracking-wider outfit transition-all duration-300 hover:scale-105 active:scale-95
                            dark:bg-white dark:text-black bg-black text-white
                            dark:shadow-[0_0_24px_rgba(255,255,255,0.12)] shadow-[0_0_24px_rgba(0,0,0,0.12)]
                            dark:hover:shadow-[0_0_36px_rgba(255,255,255,0.22)] hover:shadow-[0_0_36px_rgba(0,0,0,0.22)]"
                    >
                        {t('nav_get_started')}
                    </button>
                    <button
                        onClick={() => scrollTo("features")}
                        className="inline-flex items-center justify-center whitespace-nowrap px-7 py-3 rounded-full text-sm font-medium uppercase tracking-wider inter transition-all duration-300 hover:scale-105 active:scale-95
                            border dark:border-white/15 border-black/15
                            dark:text-white/60 text-black/55
                            dark:hover:border-white/30 hover:border-black/28
                            dark:hover:text-white/90 hover:text-black/85
                            dark:bg-white/[0.04] bg-black/[0.03]
                            backdrop-blur-md"
                    >
                        {t('btn_features')}
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
