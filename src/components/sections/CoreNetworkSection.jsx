import React from 'react';
import CoreNetworkCanvas from '../three/CoreNetworkCanvas';

export default function CoreNetworkSection() {
  return (
    <section className="py-section-gap bg-[#faf9f6] text-[#1c1b1f] relative overflow-hidden" id="features">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-4 text-[#04132a] tracking-tight leading-tight">
            Everything students need, <span className="font-serif-italic text-[#006a60]">finally connected.</span>
          </h2>
          <p className="font-sans text-base md:text-lg text-[#3d4947] max-w-2xl mx-auto">
            A unified academic ecosystem unifying courseware, live announcements, and campus community.
          </p>
        </div>
        <div className="w-full h-[400px] md:h-[500px] relative rounded-3xl overflow-hidden bg-[#04132a] border border-outline/10 shadow-2xl">
          <CoreNetworkCanvas />
        </div>
      </div>
    </section>
  );
}
