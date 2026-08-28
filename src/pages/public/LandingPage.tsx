import React from 'react';
import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/ui/HeroSection';
import FeatureShowcase from '@/components/ui/FeatureShowcase';
import LabRoomSection from '@/components/ui/LabRoomSection';
import B2bSection from '@/components/ui/B2bSection';
import Footer from '@/components/ui/Footer';

export function LandingPage() {
  return (
    <div className="bg-background text-foreground font-sans min-h-screen flex flex-col selection:bg-brand-500/30 overflow-x-hidden transition-colors duration-300">
      {/* 1. Sticky Navigation Header */}
      <Navbar />
      
      {/* Main Orchestrated Sections */}
      <main className="flex-1">
        {/* 2. Hero Section (Visual Simulator Hook) */}
        <HeroSection />
        
        {/* 3. Feature Showcase Section (B2C & Quiz Banner & Bento Grid) */}
        <FeatureShowcase />

        {/* 4. Virtual Lab Room Section (Phòng Lab ảo) */}
        <LabRoomSection />

        {/* 5. B2B / Enterprise Section (Z-pattern & Social Proof) */}
        <B2bSection />
      </main>
      
      {/* 6. Minimal footer */}
      <Footer />
    </div>
  );
}

export default LandingPage;
