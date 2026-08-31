import React from 'react';

export default function CuratedForYou({ onActionNotification }) {
  return (
    <section className="py-section-gap bg-surface-container-lowest relative overflow-hidden" id="curated">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="mb-8 md:mb-12">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white mb-4 tracking-tight">
            Curated <span className="font-serif-italic text-tertiary">for ECA Students</span>
          </h2>
          <p className="font-sans text-base md:text-lg text-on-surface-variant">
            Personalized BTU examination updates, department notices, and hackathon recommendations.
          </p>
        </div>

        <div className="glass-card rounded-3xl border border-outline/10 p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Column 1: Deadlines */}
            <div className="col-span-1 flex flex-col gap-4">
              <h3 className="font-sans text-xs font-bold text-error uppercase tracking-[0.12em] mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">schedule</span> Approaching Deadlines
              </h3>
              <div
                onClick={() => onActionNotification('Opening B.Tech VII Sem Project submission portal...')}
                className="bg-surface/50 rounded-xl p-4 border border-error/20 border-l-4 border-l-error cursor-pointer hover:bg-surface/70 transition-colors font-sans"
              >
                <h4 className="text-white font-semibold">B.Tech Project-1 Submission (VII Sem CSE/IT/Cyber)</h4>
                <p className="text-sm text-error mt-1 font-bold">Due in 2 days (Friday, 11:59 PM)</p>
              </div>
              <div
                onClick={() => onActionNotification('Opening BTU Exam Registration schedule...')}
                className="bg-surface/50 rounded-xl p-4 border border-outline/10 cursor-pointer hover:bg-surface/70 transition-colors font-sans"
              >
                <h4 className="text-white font-semibold">BTU B.Tech III, V, VII Sem Registration</h4>
                <p className="text-sm text-on-surface-variant mt-1">Due in 5 days</p>
              </div>
            </div>

            {/* Column 2: Department Announcements */}
            <div className="col-span-1 flex flex-col gap-4">
              <h3 className="font-sans text-xs font-bold text-secondary uppercase tracking-[0.12em] mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">domain</span> Dept of CSE & IT (ECA)
              </h3>
              <div
                onClick={() => onActionNotification('Opening ECA LEEP 2026-27 Direct Admission Portal...')}
                className="bg-surface/50 rounded-xl p-4 border border-outline/10 hover:border-secondary/30 transition-colors cursor-pointer font-sans"
              >
                <span className="text-xs bg-secondary/10 text-secondary px-2.5 py-0.5 rounded mb-2 inline-block font-bold">
                  Official Notice
                </span>
                <h4 className="text-white font-semibold">LEEP 2026-27 & B.Tech 1st Year Internal Sliding</h4>
                <p className="text-sm text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                  Online form links for Diploma Lateral Entry (LEEP 2nd Year) and 1st Year direct admissions session 2026-27 are live.
                </p>
              </div>
            </div>

            {/* Column 3: Recommendations */}
            <div className="col-span-1 flex flex-col gap-4">
              <h3 className="font-sans text-xs font-bold text-tertiary uppercase tracking-[0.12em] mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">auto_awesome</span> Recommended for you
              </h3>
              <div
                onClick={() => onActionNotification('Viewing Smart India Hackathon SIH-2026 details...')}
                className="bg-surface/50 rounded-xl p-4 border border-outline/10 hover:border-tertiary/30 transition-colors cursor-pointer flex gap-4 items-start font-sans"
              >
                <div className="w-10 h-10 rounded-lg bg-tertiary/20 flex items-center justify-center text-tertiary shrink-0">
                  <span className="material-symbols-outlined text-sm">school</span>
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold">Smart India Hackathon (SIH) 2026</h4>
                  <p className="text-xs text-on-surface-variant mt-1">ECA Innovation Cell selection round</p>
                  <button className="mt-2 text-xs text-tertiary uppercase font-bold tracking-wider hover:underline">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
