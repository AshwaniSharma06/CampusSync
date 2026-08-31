import React, { useState } from 'react';

const EVENTS = [
  {
    id: 'tech-symposium',
    title: 'Tech Symposium 2026',
    category: 'Technical',
    categoryBg: 'bg-primary text-on-primary',
    dateBadgeDay: '15',
    dateBadgeMonth: 'Oct',
    dateText: 'Oct 15 - 17, 2026 • Main Auditorium',
    description:
      'Annual technical festival featuring hackathons, guest lectures from industry leaders, and project showcases.',
    status: 'Registration Open',
    actionText: 'Register Now',
    imgUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAmUkjAYcJOEjVGc8sovruZ1wYMmQAmPckWJV9H84SLiyOrEJCqOWPIcTJbHw36Opb_aUtPC7e9J3thDiwSbcpfKTlG9b5jWlkaDyul4rV1Hmsfa_QPWrVMueEHAC1XjsO29TWGgfQ4UOu96Wy-onvdm2VSvaT9S8BOXsdmGm_Tx9pV1eU5wVzzm9JzPB-TF9m0_UYyD5-WIyjnmP8NAknLVtmxNOqDYkUlWX5LJYxi_uP-zG4IhzOt_g',
  },
  {
    id: 'rhythm-arts',
    title: 'Rhythm & Arts Fest 2026',
    category: 'Cultural',
    categoryBg: 'bg-tertiary text-on-tertiary',
    dateBadgeDay: '05',
    dateBadgeMonth: 'Nov',
    dateText: 'Nov 05, 2026 • Open Air Theatre',
    description:
      'A celebration of diversity and talent. Join us for an evening of music, dance, and theatrical performances.',
    status: 'Opening soon',
    actionText: 'Notify Me',
    imgUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDHKED6PnSYAHlQGCcEaRp8oha7KM-G1fRp5Oe9gRyJqbqs34lFp-UEoIgiAiHr4Z8vFTJ85qnjmcXMmPeoEgSLC7FTymKJX8BbVJ71MRSB-nwu-w-WOp8KvcTJpQtK0OO4p9mNuGIL-sanVQ34WcRRFNDo_0uJ17tIJmtICzSZuP5ZEjN4_qz0k4z3lRtMBlt7Mwu438gO7m3gEvX_pw274fv3dI6YhxTZTebx2rxUHq5fG8UFbFa36w',
  },
];

export default function EventsSection({ onActionNotification }) {
  const [registered, setRegistered] = useState({});
  const [notified, setNotified] = useState({});

  const handleAction = (event) => {
    if (event.id === 'tech-symposium') {
      const isReg = registered[event.id];
      setRegistered({ ...registered, [event.id]: !isReg });
      if (!isReg) {
        onActionNotification(`Registered for Tech Symposium 2026! Check student email for pass.`);
      } else {
        onActionNotification(`Registration cancelled for Tech Symposium 2026.`);
      }
    } else {
      const isNot = notified[event.id];
      setNotified({ ...notified, [event.id]: !isNot });
      if (!isNot) {
        onActionNotification(`Reminder set for Rhythm & Arts Fest 2026 (Nov 05, 2026).`);
      } else {
        onActionNotification(`Reminder turned off for Rhythm & Arts Fest 2026.`);
      }
    }
  };

  return (
    <section className="py-section-gap bg-surface relative overflow-hidden" id="events">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white mb-8 md:mb-12 text-center tracking-tight">
          Featured <span className="font-serif-italic text-gradient">Events</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {EVENTS.map((event) => {
            const isRegistered = registered[event.id];
            const isNotified = notified[event.id];

            return (
              <div key={event.id} className="glass-card rounded-3xl overflow-hidden border border-outline/10 group">
                <div
                  className="h-48 md:h-64 bg-surface-container relative overflow-hidden bg-cover bg-center"
                  style={{ backgroundImage: `url('${event.imgUrl}')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent/30 z-10"></div>
                  <div className="absolute bottom-4 left-6 z-20">
                    <span
                      className={`${event.categoryBg} text-xs font-sans font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-lg`}
                    >
                      {event.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl md:text-3xl text-white font-serif mb-2">{event.title}</h3>
                      <p className="font-sans text-sm md:text-base text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">calendar_month</span> {event.dateText}
                      </p>
                    </div>
                    <div className="text-center bg-surface-bright rounded-xl p-3 border border-outline/10 shrink-0 font-sans">
                      <span
                        className={`block text-lg md:text-xl font-bold ${
                          event.category === 'Technical' ? 'text-primary' : 'text-tertiary'
                        }`}
                      >
                        {event.dateBadgeDay}
                      </span>
                      <span className="block text-xs text-on-surface-variant uppercase font-semibold">
                        {event.dateBadgeMonth}
                      </span>
                    </div>
                  </div>
                  <p className="font-sans text-sm md:text-base text-on-surface-variant mb-6 leading-relaxed">
                    {event.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-outline/10 font-sans">
                    <span
                      className={`text-sm ${
                        isRegistered ? 'text-primary font-bold' : 'text-on-surface-variant'
                      }`}
                    >
                      {isRegistered ? 'Confirmed ✓' : event.status}
                    </span>
                    <button
                      onClick={() => handleAction(event)}
                      className={`px-5 md:px-7 py-2 rounded-full text-xs font-sans font-bold uppercase tracking-[0.1em] transition-colors border ${
                        event.id === 'tech-symposium'
                          ? isRegistered
                            ? 'bg-primary/20 text-primary border-primary/40'
                            : 'bg-surface-bright hover:bg-surface-variant text-white border-outline/20'
                          : isNotified
                          ? 'bg-tertiary/20 text-tertiary border-tertiary/40'
                          : 'bg-surface-bright/50 text-on-surface-variant border-outline/10 hover:text-white'
                      }`}
                    >
                      {event.id === 'tech-symposium'
                        ? isRegistered
                          ? 'Registered ✓'
                          : event.actionText
                        : isNotified
                        ? 'Notified ✓'
                        : event.actionText}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
