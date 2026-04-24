import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ThemeSwitcher } from "../ui/ThemeSwitcher";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { useLanguage } from "../../context/LanguageContext";

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollTo = (id) => {
        if (id === "hero") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const navLinks = [
        { label: t('nav_home'),              id: "hero" },
        { label: t('nav_features'),          id: "features" },
        { label: t('nav_how'),               id: "how-it-works" },
        { label: t('nav_about'),             id: "about" },
        { label: t('nav_contact'),           id: "contact" },
    ];

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-0 left-0 w-full z-[100] px-6 md:px-10 py-4 flex items-center justify-between transition-all duration-500 ${
                scrolled
                    ? "dark:bg-black/60 bg-white/90 backdrop-blur-xl dark:border-b dark:border-white/[0.05] border-b border-black/[0.06]"
                    : "bg-transparent"
            }`}
        >
            {/* Left: Logo + Theme Toggle */}
            <div className="flex items-center gap-3">
                <button onClick={() => scrollTo("hero")} className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-full dark:bg-white bg-black flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                        <span className="dark:text-black text-white font-bold text-sm outfit">V</span>
                    </div>
                    <span className="dark:text-white text-black font-bold text-lg tracking-tight uppercase outfit">
                        Vision <span className="dark:text-white/25 text-black/25">Cure</span>
                    </span>
                </button>

                {/* Theme toggle — right of logo */}
                <LanguageSwitcher />
                <ThemeSwitcher />
            </div>

            {/* Center: Nav Links — absolutely centered */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 px-5 py-2.5 rounded-full dark:bg-white/[0.04] bg-black/[0.04] dark:border dark:border-white/[0.06] border border-black/[0.07] backdrop-blur-md">
                {navLinks.map((link) => (
                    <button
                        key={link.id}
                        onClick={() => scrollTo(link.id)}
                        className="relative px-4 py-1.5 dark:text-white/50 text-black/50 text-sm font-medium tracking-wide transition-colors duration-300 dark:hover:text-white/90 hover:text-black/90 group inter"
                    >
                        {link.label}
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-px dark:bg-white/40 bg-black/30 transition-all duration-300 group-hover:w-4" />
                    </button>
                ))}
            </div>

            {/* Right: Get Started + Login */}
            <div className="flex items-center gap-2">
                <motion.button
                    onClick={() => scrollTo("contact")}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center justify-center whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider outfit transition-all duration-300 hover:scale-105 active:scale-95
                        dark:bg-white dark:text-black bg-black text-white
                        dark:shadow-[0_0_20px_rgba(255,255,255,0.10)] shadow-[0_0_20px_rgba(0,0,0,0.10)]
                        dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.20)] hover:shadow-[0_0_30px_rgba(0,0,0,0.18)]"
                >
                    {t('nav_get_started')}
                </motion.button>

                <motion.button
                    onClick={() => navigate("/login")}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center justify-center whitespace-nowrap gap-1 px-5 py-2 rounded-full text-xs font-medium tracking-wide inter transition-all duration-300 hover:scale-105 active:scale-95
                        border dark:border-white/15 border-black/15
                        dark:text-white/60 text-black/55
                        dark:hover:border-white/30 hover:border-black/28
                        dark:hover:text-white/90 hover:text-black/85
                        dark:bg-white/[0.04] bg-black/[0.03]
                        backdrop-blur-md"
                >
                    {t('nav_login')} <span className="tracking-normal">→</span>
                </motion.button>
            </div>
        </motion.nav>
    );
};

export default Navbar;
