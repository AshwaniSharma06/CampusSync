import React from 'react';

export default function CtaSection({ onOpenPortal }) {
  return (
    <section className="relative py-section-gap flex items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          alt="Campus CTA background"
          className="w-full h-full object-cover opacity-30"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpW_vuozuh-4UQjcpX3vryO1hhyu6hSvNkk0PX1MBm0OTZDi8uyP2P-TDbYTVMfI9DCixi1cnwHz1z2EKBWjmKcDDRZh-hKNIS7gYsL84vBUVBgNipZl6gd7BDdakiGNJ33foUCw6HalVnSGYLnYS6KyO1VZv_kJre0ViqR4mtZyvBvgHTG1nEIrGx8lXb-3IFF6IPsA-lqzkDL92HJQEmMVC2d763GEGHaTjpLseN--6wUaysUGNR0UEbkIozmbuD0gY"
        />
        <div className="absolute inset-0 bg-background/80"></div>
      </div>
      <div className="relative z-10 max-w-3xl px-margin-mobile md:px-margin-desktop">
        <h2 className="font-display-md text-3xl md:text-5xl text-white mb-6">
          Campus life moves quickly. Stay connected to all of it.
        </h2>
        <button
          onClick={onOpenPortal}
          className="bg-primary text-on-primary px-8 py-4 rounded-xl font-label-sm uppercase tracking-wider hover:bg-primary-fixed transition-colors glow-hover shadow-[0_0_20px_rgba(113,216,200,0.2)]"
        >
          Open Student Portal
        </button>
      </div>
    </section>
  );
}
