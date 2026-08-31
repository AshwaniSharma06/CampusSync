import React from 'react';

export default function CtaSection({ onOpenSignIn }) {
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
        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white mb-6 tracking-tight leading-tight">
          Campus life moves quickly.
          <br />
          <span className="font-serif-italic text-gradient">Stay connected to all of it.</span>
        </h2>
        <button
          onClick={onOpenSignIn}
          className="bg-primary text-on-primary px-9 py-4 rounded-xl font-sans font-bold text-xs uppercase tracking-[0.14em] hover:bg-primary-fixed transition-all glow-hover shadow-[0_0_20px_rgba(113,216,200,0.2)]"
        >
          Sign In to Student Portal
        </button>
      </div>
    </section>
  );
}
