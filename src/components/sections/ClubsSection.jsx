import React from 'react';

const ECA_CLUBS = [
  {
    id: 'pcc-coding',
    name: 'Technotsav & PCC Club',
    icon: 'code_blocks',
    accentColor: 'text-primary',
    bgBadge: 'bg-primary/20 border-primary/30',
    bgImg:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBBAMxWMbzO72c92JTA0Z4EQGYTOrcjdibq1M3z2kkSO98DeUoyQBFompqvo4_V-vWjBk6f09Hlo9g1bWYJAHWQXh8bZScqS6YnF8wtfBqufAu7Wp8voitWpgrjRxklE_ZWxWRuPuWdCLwA9q5B2LjRRCYT-p6jjLsbjFi2Z7NgEAq9-zUhVT4qp_uUlMnmAwa4K00I-6ptkLwmMJVxwR2AYgG3a_KEkHypRymHjOzjjPVUbbuxf4B0bA',
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
    bgImg:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAY9KRjPh_ddODP3b0LQhe1eNqTfZX0VedMpYIlW_nIkaB1jzD57004QgZrPPpZHlaLB7f_4IThSKJR0volI3DvXB69pj0snzinEFkIdfCv3nk412f__XrF7kYcjMecNqGkP5wy6gOapOBVUiZpv4-8OzfQJ3AMSTrIPM6oZZryntPOZ2uYhxsg5S1b9kRiAdNP_6_-SKzbZAJ_2jMTBrtTE5XVsxdk7hlS04aLdE2_CdKGS9KF7_3vVA',
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
    bgImg:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBciqEZTmtAHmcSWfaL3iLbtMGxlj9jwezOOkBI5eJIF4t0Pn4Xfey2dfa7ylYbWDsnRSSsiB2kPGp860jDq5NKB3Xfwvr9a5HYY-nRawWkc-nYomwJTfI543vgMm-fomnhO_died5buq13Pxs42fNt1AbEsXXw81z7Jsml87eZTXxR6KQ67mUGsqgbHq4wJvdvUdobcNJJjBF2V2nZ9r8k_FcAC1bJVfyUXtj-38POiUHbo72rNGuklw',
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
    <section className="py-section-gap bg-surface-container-lowest relative overflow-hidden" id="clubs">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
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
