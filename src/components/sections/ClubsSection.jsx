import React, { useState } from 'react';

const CLUBS = [
  {
    id: 'coding',
    name: 'Coding Club',
    icon: 'code_blocks',
    accentColor: 'text-primary',
    bgBadge: 'bg-primary/20 border-primary/30',
    btnColor: 'text-primary hover:text-primary-fixed',
    bgImg:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBBAMxWMbzO72c92JTA0Z4EQGYTOrcjdibq1M3z2kkSO98DeUoyQBFompqvo4_V-vWjBk6f09Hlo9g1bWYJAHWQXh8bZScqS6YnF8wtfBqufAu7Wp8voitWpgrjRxklE_ZWxWRuPuWdCLwA9q5B2LjRRCYT-p6jjLsbjFi2Z7NgEAq9-zUhVT4qp_uUlMnmAwa4K00I-6ptkLwmMJVxwR2AYgG3a_KEkHypRymHjOzjjPVUbbuxf4B0bA',
    description:
      'Building the future, one line of code at a time. Join us for hackathons and workshops.',
    membersCount: '+120',
  },
  {
    id: 'robotics',
    name: 'Robotics Society',
    icon: 'precision_manufacturing',
    accentColor: 'text-tertiary',
    bgBadge: 'bg-tertiary/20 border-tertiary/30',
    btnColor: 'text-tertiary hover:text-tertiary-fixed',
    bgImg:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBciqEZTmtAHmcSWfaL3iLbtMGxlj9jwezOOkBI5eJIF4t0Pn4Xfey2dfa7ylYbWDsnRSSsiB2kPGp860jDq5NKB3Xfwvr9a5HYY-nRawWkc-nYomwJTfI543vgMm-fomnhO_died5buq13Pxs42fNt1AbEsXXw81z7Jsml87eZTXxR6KQ67mUGsqgbHq4wJvdvUdobcNJJjBF2V2nZ9r8k_FcAC1bJVfyUXtj-38POiUHbo72rNGuklw',
    description:
      'Designing autonomous systems and participating in national robotics competitions.',
    membersCount: '+85',
    stagger: true,
  },
  {
    id: 'arts',
    name: 'Arts & Cultural',
    icon: 'palette',
    accentColor: 'text-secondary',
    bgBadge: 'bg-secondary/20 border-secondary/30',
    btnColor: 'text-secondary hover:text-secondary-fixed',
    bgImg:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAY9KRjPh_ddODP3b0LQhe1eNqTfZX0VedMpYIlW_nIkaB1jzD57004QgZrPPpZHlaLB7f_4IThSKJR0volI3DvXB69pj0snzinEFkIdfCv3nk412f__XrF7kYcjMecNqGkP5wy6gOapOBVUiZpv4-8OzfQJ3AMSTrIPM6oZZryntPOZ2uYhxsg5S1b9kRiAdNP_6_-SKzbZAJ_2jMTBrtTE5XVsxdk7hlS04aLdE2_CdKGS9KF7_3vVA',
    description:
      'Celebrating creativity through music, dance, theatre, and visual arts.',
    membersCount: '+150',
  },
];

export default function ClubsSection({ onActionNotification }) {
  const [joinedClubs, setJoinedClubs] = useState({});

  const toggleJoin = (club) => {
    const isJoined = joinedClubs[club.id];
    setJoinedClubs((prev) => ({ ...prev, [club.id]: !isJoined }));
    if (!isJoined) {
      onActionNotification(`Successfully joined ${club.name}! Welcome aboard.`);
    } else {
      onActionNotification(`Left ${club.name}.`);
    }
  };

  return (
    <section className="py-section-gap bg-surface-container-lowest relative overflow-hidden" id="clubs">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white mb-4 tracking-tight leading-tight">
              Find your people.
              <br />
              <span className="font-serif-italic text-primary">Build something together.</span>
            </h2>
            <p className="font-sans text-base md:text-lg text-on-surface-variant">
              Discover over 50+ student-led organizations covering arts, technology, sports, and entrepreneurship.
            </p>
          </div>
          <button
            onClick={() => onActionNotification('Opening full Campus Clubs Directory...')}
            className="hidden md:block border border-outline/40 text-on-surface px-6 py-2.5 rounded-full font-sans text-xs font-bold uppercase tracking-[0.1em] hover:bg-surface-variant transition-colors whitespace-nowrap"
          >
            View All Clubs
          </button>
        </div>

        {/* Clubs Grid / Carousel */}
        <div className="flex overflow-x-auto hide-scrollbar gap-6 pb-8 -mx-margin-mobile px-margin-mobile snap-x snap-mandatory md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3">
          {CLUBS.map((club) => {
            const isJoined = joinedClubs[club.id];
            return (
              <div
                key={club.id}
                className={`glass-card rounded-3xl overflow-hidden border border-outline/10 hover:-translate-y-2 transition-transform duration-300 group min-w-[280px] snap-center flex-shrink-0 md:min-w-0 ${
                  club.stagger ? 'lg:translate-y-8' : ''
                }`}
              >
                <div
                  className="h-32 bg-cover bg-center relative"
                  style={{ backgroundImage: `url('${club.bgImg}')` }}
                >
                  <div className="w-full h-full bg-surface/50 backdrop-blur-sm flex items-center justify-center">
                    <div
                      className={`w-16 h-16 rounded-2xl ${club.bgBadge} backdrop-blur-md border flex items-center justify-center ${club.accentColor} group-hover:scale-110 transition-transform shadow-lg`}
                    >
                      <span className="material-symbols-outlined text-3xl">{club.icon}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex flex-col h-[calc(100%-8rem)]">
                  <h3 className="text-2xl text-white font-serif mb-2">{club.name}</h3>
                  <p className="font-sans text-sm text-on-surface-variant mb-6 line-clamp-2 leading-relaxed">
                    {club.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-surface-bright border-2 border-surface-container-lowest z-30"></div>
                      <div className="w-8 h-8 rounded-full bg-surface-variant border-2 border-surface-container-lowest z-20"></div>
                      <div className="w-8 h-8 rounded-full bg-surface border-2 border-surface-container-lowest z-10 flex items-center justify-center text-xs text-white font-sans font-bold">
                        {club.membersCount}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleJoin(club)}
                      className={`font-sans text-xs font-bold uppercase tracking-[0.1em] transition-colors px-4 py-1.5 rounded-full border ${
                        isJoined
                          ? 'bg-primary/20 text-primary border-primary/40'
                          : `${club.btnColor} border-transparent hover:bg-surface-bright/50`
                      }`}
                    >
                      {isJoined ? 'Joined ✓' : 'Join Club'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => onActionNotification('Opening full Campus Clubs Directory...')}
          className="md:hidden w-full border border-outline/40 text-on-surface px-6 py-3 mt-4 rounded-xl font-sans text-xs font-bold uppercase tracking-[0.1em] hover:bg-surface-variant transition-colors"
        >
          View All Clubs
        </button>
      </div>
    </section>
  );
}
