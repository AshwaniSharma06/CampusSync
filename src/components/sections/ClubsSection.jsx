import React from 'react';

const ECA_CLUBS = [
  {
    id: 'pcc-coding',
    name: 'Technotsav & PCC Club',
    tag: 'Technical Chapter',
    tagBg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    icon: 'terminal',
    accentColor: 'text-teal-300',
    iconBg: 'bg-teal-500/20 border-teal-500/40 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.3)]',
    cardBorder: 'hover:border-teal-500/50',
    headerGradient: 'from-teal-950/80 via-slate-900 to-slate-900',
    patternIcon: 'code',
    description:
      'The premier coding and robotics society of ECA. Organizes competitive programming bootcamps, hackathons, and autonomous robotics challenges.',
    focusAreas: ['Competitive Coding', 'Autonomous Robotics', 'Hackathons', 'Full-Stack Dev'],
    keyEvents: 'Technotsav, Robowar, SIH Innovation Challenge',
    location: 'Central Computer Center & Robotics Lab',
    membersCount: '240+ Active Coders',
  },
  {
    id: 'creative-art',
    name: 'Creative Art Society (CAS)',
    tag: 'Cultural Apex',
    tagBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: 'palette',
    accentColor: 'text-amber-300',
    iconBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    cardBorder: 'hover:border-amber-500/50',
    headerGradient: 'from-amber-950/80 via-slate-900 to-slate-900',
    patternIcon: 'theater_comedy',
    description:
      'Apex cultural organization nurturing student talents in music, performing arts, theatrical skits, photography, and literature. Hosts ECA’s annual fest Tarangini.',
    focusAreas: ['Vocal & Instrumental', 'Choreography', 'Theatrics & Skits', 'Fine Arts'],
    keyEvents: 'Tarangini Cultural Fest, Open Mic Night, Art Exhibition',
    location: 'ECA Open Air Theatre (OAT)',
    membersCount: '310+ Active Artists',
  },
  {
    id: 'ai-ml-cse',
    name: 'AI & Data Science Club',
    tag: 'AI Research Wing',
    tagBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    icon: 'psychology',
    accentColor: 'text-indigo-300',
    iconBg: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]',
    cardBorder: 'hover:border-indigo-500/50',
    headerGradient: 'from-indigo-950/80 via-slate-900 to-slate-900',
    patternIcon: 'memory',
    description:
      'Specialized research wing under Dept. of CSE focusing on Deep Learning, Machine Learning models, Computer Vision, and student AI open-source projects.',
    focusAreas: ['Neural Networks', 'Natural Language Processing', 'Computer Vision', 'Data Science'],
    keyEvents: 'AI Paper Reviews, ML Model Showcase, Kaggle Sprints',
    location: 'Barliya CSE Block • AI Lab 204',
    membersCount: '180+ ML Enthusiasts',
  },
];

export default function ClubsSection({ onActionNotification }) {
  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden" id="clubs">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
        {/* Compact, clean sans-serif section header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full text-xs font-bold text-teal-400 mb-2 uppercase tracking-wider">
              Student Activity Center (SAC)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Campus clubs
            </h2>
            <p className="text-sm md:text-base text-on-surface-variant mt-1.5 max-w-2xl">
              Official student organizations, robotics chapters, and creative arts societies at Engineering College Ajmer.
            </p>
          </div>
          <button
            onClick={() => onActionNotification?.('Opening ECA Student Activity Center Charter & Directory...')}
            className="border border-slate-700/80 text-on-surface hover:text-white hover:border-teal-400/50 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-surface-container/60 hover:bg-surface-bright transition-all whitespace-nowrap shadow-sm"
          >
            SAC Directory
          </button>
        </div>

        {/* Lighter card surfaces with distinct club logos & clear borders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ECA_CLUBS.map((club) => (
            <div
              key={club.id}
              className={`bg-[#0d213b]/90 rounded-2xl overflow-hidden border border-slate-700/70 ${club.cardBorder} transition-all duration-300 flex flex-col shadow-lg hover:shadow-2xl hover:-translate-y-1 group`}
            >
              {/* Meaningful Club Header Banner with Distinct Club Logo & Theme */}
              <div className={`p-6 bg-gradient-to-br ${club.headerGradient} border-b border-slate-700/50 relative overflow-hidden`}>
                {/* Decorative background watermark icon */}
                <span className="material-symbols-outlined text-8xl text-white/5 absolute -right-3 -bottom-4 select-none pointer-events-none group-hover:scale-110 transition-transform duration-500">
                  {club.patternIcon}
                </span>

                <div className="flex items-start justify-between relative z-10">
                  {/* Meaningful Club Logo Badge */}
                  <div className={`w-14 h-14 rounded-2xl ${club.iconBg} border flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <span className="material-symbols-outlined text-3xl">{club.icon}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${club.tagBg}`}>
                    {club.tag}
                  </span>
                </div>

                <div className="mt-4 relative z-10">
                  <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-teal-300 transition-colors">
                    {club.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                    <span>{club.membersCount}</span>
                  </div>
                </div>
              </div>

              {/* Card Body with legible typography */}
              <div className="p-6 flex flex-col flex-1">
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {club.description}
                </p>

                {/* Focus areas */}
                <div className="mb-4">
                  <span className="text-[11px] uppercase font-bold text-teal-400 tracking-wider block mb-2">
                    Focus Areas
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {club.focusAreas.map((area, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-700/60"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key metadata */}
                <div className="mt-auto space-y-2.5 pt-4 border-t border-slate-700/60 text-xs text-slate-400">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-amber-400 shrink-0 mt-0.5">event</span>
                    <span>
                      <strong className="text-slate-200 font-semibold">Flagship:</strong> {club.keyEvents}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-teal-400 shrink-0 mt-0.5">location_on</span>
                    <span>
                      <strong className="text-slate-200 font-semibold">Venue:</strong> {club.location}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => onActionNotification?.(`Opening ${club.name} registration portal...`)}
                  className="mt-5 w-full bg-teal-500/10 hover:bg-teal-500 text-teal-300 hover:text-slate-950 border border-teal-500/30 hover:border-teal-400 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Explore Chapter</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
