import React, { useRef } from 'react';
import { useScroll } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import ScrollCanvas from '../components/landing/ScrollCanvas';
import TextOverlay from '../components/landing/TextOverlay';
import CoreFeatures from '../components/landing/CoreFeatures';
import HowItWorks from '../components/landing/HowItWorks';
import EngineeredPrecision from '../components/landing/EngineeredPrecision';
import MolecularAccuracy from '../components/landing/MolecularAccuracy';
import FutureBuild from '../components/landing/FutureBuild';
import FooterCTA from '../components/landing/FooterCTA';

function LandingPage() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <main className="relative dark:bg-[#050505] bg-[#fafafa] selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <Navbar />

      {/* Hero */}
      <HeroSection />

      {/* Scroll Animation — always dark, canvas frames have baked-in dark bg */}
      <div ref={containerRef} className="relative h-[500vh] w-full z-10 bg-[#050505]">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505]">
          <ScrollCanvas frameCount={120} parentRef={containerRef} />
          <TextOverlay progress={scrollYProgress} />
        </div>
      </div>

      {/* Platform Sections */}
      <div className="relative z-30 dark:bg-[#050505] bg-[#fafafa]">
        <CoreFeatures />
        <HowItWorks />
        <EngineeredPrecision />
        <MolecularAccuracy />
        <FutureBuild />
        <FooterCTA />
      </div>

      {/* Global ambient — dark mode only */}
      <div className="fixed inset-0 pointer-events-none z-[5] dark:block hidden">
        <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.85)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.015)_0%,transparent_60%)]" />
      </div>
    </main>
  );
}

export default LandingPage;
