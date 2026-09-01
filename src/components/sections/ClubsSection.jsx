import React from 'react';
import clubsBg from '../../assets/clubs-bg.jpg';

const ECA_CLUBS = [
  {
    id: 'pcc-coding',
    name: 'Technotsav & PCC Club',
    icon: 'code_blocks',
    accentColor: 'text-primary',
    bgBadge: 'bg-primary/20 border-primary/30',
    bgImg: clubsBg,
    description:
      'The premier technical programming and robotics society of Engineering College Ajmer. PCC Club conducts competitive programming sessions, hackathons, and designs autonomous robots for state and national level competitions.',
    focusAreas: ['Competitive Coding', 'Autonomous Robotics', 'Hackathons', 'Web Development'],
    keyEvents: 'Technotsav, Robowar, SIH Innovation Challenge',
    location: 'Central Computer Center & Robotics Lab',
    membersCount: '240+ Active ECA Coders',
  },
  {
    id: 'creative-art',
    name: 'Creative Art Society (CAS)',
    icon: 'palette',
    accentColor: 'text-tertiary',
    bgBadge: 'bg-tertiary/20 border-tertiary/30',
    bgImg: clubsBg,
    description:
      'ECA’s apex cultural organization responsible for nurturing student talents in performing arts, music, dance, theatrical acts, photography, and literature. CAS is the lead host of ECA’s annual fest Tarangini.',
    focusAreas: ['Music & Vocal Performance', 'Folk & Contemporary Dance', 'Theater & Skits', 'Fine Arts'],
    keyEvents: 'Tarangini Cultural Fest, Open Mic Night, Art Exhibition',
    location: 'ECA Open Air Theatre (OAT)',
    membersCount: '310+ Active Artists',
    stagger: true,
  },
  {
    id: 'ai-ml-cse',
    name: 'AI & Data Science Club',
    icon: 'smart_toy',
    accentColor: 'text-secondary',
    bgBadge: 'bg-secondary/20 border-secondary/30',
    bgImg: clubsBg,
    description:
      'Specialized technical wing under the Department of Computer Science & Engineering. Focuses on Deep Learning, Machine Learning models, Computer Vision, Data Science pipelines, and AI research projects.',
    focusAreas: ['Neural Networks', 'Natural Language Processing', 'Computer Vision', 'Data Analytics'],
    keyEvents: 'AI Paper Reviews, ML Model Showcase, Kaggle Sprints',
    location: 'Barliya CSE Block • AI Lab 204',
    membersCount: '180+ ML Enthusiasts',
  },
];

export default function ClubsSection({ onActionNotification }) {
  return (
    <section className="py-section-gap bg-background relative overflow-hidden" id="clubs">
      {/* Prominent Campus Background Image Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={clubsBg}
          alt="Engineering College Ajmer Campus Backdrop"
          className="w-full h-full object-cover object-center opacity-75 scale-105 transition-transform duration-1000"
          style={{ animation: 'subtleZoom 25s infinite alternate' }}
        />
        {/* Transparent gradient vignette for high visual clarity and readable text */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-background"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/70"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none"></div>
      </div>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-xs font-bold text-primary mb-3 uppercase tracking-wider">
              ECA Student Activity Center (SAC)
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white mb-4 tracking-tight leading-tight">
              ECA Student Organizations.
              <br />
              <span className="font-serif-italic text-primary">Detailed Overview &amp; Activities.</span>
            </h2>
            <p className="font-sans text-base md:text-lg text-on-surface-variant">
              Comprehensive overview of official student societies operating under Engineering College Ajmer.
            </p>
          </div>
          <button
            onClick={() => onActionNotification('Opening ECA Student Activity Center Charter & Directory...')}
            className="hidden md:block border border-outline/40 text-on-surface px-6 py-2.5 rounded-full font-sans text-xs font-bold uppercase tracking-[0.1em] hover:bg-surface-variant transition-colors whitespace-nowrap"
          >
            View SAC Directory
          </button>
        </div>

        {/* Detailed Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ECA_CLUBS.map((club) => (
            <div
              key={club.id}
              className={`glass-card rounded-3xl overflow-hidden border border-outline/10 hover:border-primary/30 transition-all duration-300 group flex flex-col ${
                club.stagger ? 'lg:translate-y-4' : ''
              }`}
            >
              {/* Header Image banner */}
              <div
                className="h-40 bg-cover bg-center relative"
                style={{ backgroundImage: `url('${club.bgImg}')` }}
              >
                <div className="w-full h-full bg-surface/60 backdrop-blur-sm flex items-center justify-between px-6">
                  <div
                    className={`w-14 h-14 rounded-2xl ${club.bgBadge} backdrop-blur-md border flex items-center justify-center ${club.accentColor} shadow-lg`}
                  >
                    <span className="material-symbols-outlined text-3xl">{club.icon}</span>
                  </div>
                  <span className="text-xs bg-surface-bright/80 text-white font-sans font-bold px-3 py-1 rounded-full border border-outline/20">
                    {club.membersCount}
                  </span>
                </div>
              </div>

              {/* Detailed Content Body */}
              <div className="p-6 flex flex-col flex-1 font-sans">
                <h3 className="text-2xl text-white font-serif mb-2">{club.name}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  {club.description}
                </p>

                {/* Key Information Badges */}
                <div className="mt-auto space-y-3 pt-4 border-t border-outline/10 text-xs">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-primary tracking-wider block mb-1.5">
                      Focus Areas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {club.focusAreas.map((area, idx) => (
                        <span
                          key={idx}
                          className="bg-surface-bright/40 text-on-surface-variant px-2.5 py-1 rounded-md text-[11px] font-medium border border-outline/10"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-on-surface-variant text-[11px] pt-2">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-tertiary">event</span>
                      <strong className="text-white font-semibold">Flagship Events:</strong> {club.keyEvents}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-on-surface-variant text-[11px]">
                    <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                    <strong className="text-white font-semibold">Venue:</strong> {club.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onActionNotification('Opening ECA Student Activity Center Charter & Directory...')}
          className="md:hidden w-full border border-outline/40 text-on-surface px-6 py-3 mt-8 rounded-xl font-sans text-xs font-bold uppercase tracking-[0.1em] hover:bg-surface-variant transition-colors"
        >
          View SAC Directory
        </button>
      </div>
    </section>
  );
}
