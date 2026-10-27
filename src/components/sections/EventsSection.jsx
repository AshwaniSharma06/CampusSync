import React, { useState } from 'react';

const ECA_EVENTS = [
  {
    id: 'technotsav',
    title: 'Technotsav 2026 (ECA Tech Fest)',
    category: 'Technical',
    categoryBg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    dateBadgeDay: '15',
    dateBadgeMonth: 'Oct',
    dateBadgeYear: '2026',
    dateText: 'Oct 15 - 17, 2026',
    venue: 'ECA Central Labs & Campus Grounds',
    description:
      'Flagship technical fest featuring autonomous Robowar, 24-hr Hackathon, coding sprint, and Smart India Hackathon showcase.',
    status: 'Registration Open',
    actionText: 'Register Now',
    icon: 'precision_manufacturing',
    posterThumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAmUkjAYcJOEjVGc8sovruZ1wYMmQAmPckWJV9H84SLiyOrEJCqOWPIcTJbHw36Opb_aUtPC7e9J3thDiwSbcpfKTlG9b5jWlkaDyul4rV1Hmsfa_QPWrVMueEHAC1XjsO29TWGgfQ4UOu96Wy-onvdm2VSvaT9S8BOXsdmGm_Tx9pV1eU5wVzzm9JzPB-TF9m0_UYyD5-WIyjnmP8NAknLVtmxNOqDYkUlWX5LJYxi_uP-zG4IhzOt_g',
  },
  {
    id: 'tarangini',
    title: 'Tarangini 2026 (ECA Cultural Fest)',
    category: 'Cultural',
    categoryBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dateBadgeDay: '05',
    dateBadgeMonth: 'Nov',
    dateBadgeYear: '2026',
    dateText: 'Nov 05, 2026',
    venue: 'ECA Open Air Theatre (OAT)',
    description:
      'Annual cultural extravaganza by Creative Art Society. Battle of Bands, folk & modern dance, stage drama, and live evening concerts.',
    status: 'Opening Soon',
    actionText: 'Notify Me',
    icon: 'celebration',
    posterThumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDHKED6PnSYAHlQGCcEaRp8oha7KM-G1fRp5Oe9gRyJqbqs34lFp-UEoIgiAiHr4Z8vFTJ85qnjmcXMmPeoEgSLC7FTymKJX8BbVJ71MRSB-nwu-w-WOp8KvcTJpQtK0OO4p9mNuGIL-sanVQ34WcRRFNDo_0uJ17tIJmtICzSZuP5ZEjN4_qz0k4z3lRtMBlt7Mwu438gO7m3gEvX_pw274fv3dI6YhxTZTebx2rxUHq5fG8UFbFa36w',
  },
];

export default function EventsSection({ onActionNotification }) {
  const [registered, setRegistered] = useState({});
  const [notified, setNotified] = useState({});

  const handleAction = (event) => {
    if (event.id === 'technotsav') {
      const isReg = registered[event.id];
      setRegistered({ ...registered, [event.id]: !isReg });
      if (!isReg) {
        onActionNotification?.(`Registered for Technotsav 2026! Digital event pass sent to student email.`);
      } else {
        onActionNotification?.(`Registration cancelled for Technotsav 2026.`);
      }
    } else {
      const isNot = notified[event.id];
      setNotified({ ...notified, [event.id]: !isNot });
      if (!isNot) {
        onActionNotification?.(`Reminder set for Tarangini 2026 (Nov 05, 2026 at ECA OAT).`);
      } else {
        onActionNotification?.(`Reminder turned off for Tarangini 2026.`);
      }
    }
  };

  return (
    <section className="py-16 md:py-24 bg-surface relative overflow-hidden" id="events">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Compact, clean sans-serif section header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">
              Campus Calendar
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Upcoming events
            </h2>
            <p className="text-sm md:text-base text-on-surface-variant mt-1.5 max-w-2xl">
              Flagship technical symposiums, hackathons, and cultural festivals hosted at Engineering College Ajmer.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Fall 2026 Academic Session
          </span>
        </div>

        {/* Compact cards with date, title, venue, registration status, and action visible together */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ECA_EVENTS.map((event) => {
            const isRegistered = registered[event.id];
            const isNotified = notified[event.id];

            return (
              <div
                key={event.id}
                className="bg-[#0d213b]/90 rounded-2xl border border-slate-700/70 hover:border-teal-400/50 transition-all duration-300 p-5 md:p-6 shadow-lg flex flex-col justify-between group"
              >
                {/* Top Section: Date badge + Title & Category + Compact Poster Thumbnail */}
                <div className="flex items-start gap-4">
                  {/* High-visibility Date Badge */}
                  <div className="w-16 h-20 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col items-center justify-center shrink-0 shadow-md">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {event.dateBadgeMonth}
                    </span>
                    <span className="text-2xl font-extrabold text-white leading-none my-0.5">
                      {event.dateBadgeDay}
                    </span>
                    <span className="text-[10px] text-teal-400 font-semibold">
                      {event.dateBadgeYear}
                    </span>
                  </div>

                  {/* Main Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${event.categoryBg}`}>
                        {event.category}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-xs text-teal-400">schedule</span>
                        {event.dateText}
                      </span>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-white tracking-tight group-hover:text-teal-300 transition-colors">
                      {event.title}
                    </h3>

                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium truncate">
                      <span className="material-symbols-outlined text-xs text-amber-400 shrink-0">location_on</span>
                      {event.venue}
                    </p>
                  </div>

                  {/* Compact Poster Thumbnail */}
                  <div className="hidden sm:block w-20 h-20 rounded-xl overflow-hidden border border-slate-700/60 shrink-0 relative">
                    <img
                      src={event.posterThumbnail}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  </div>
                </div>

                {/* Event Summary */}
                <p className="text-sm text-slate-300 mt-4 mb-4 leading-relaxed line-clamp-2">
                  {event.description}
                </p>

                {/* Bottom Bar: Status + Action Button visible together */}
                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isRegistered ? 'bg-teal-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    ></span>
                    <span
                      className={`text-xs font-semibold ${
                        isRegistered ? 'text-teal-400' : 'text-slate-300'
                      }`}
                    >
                      {isRegistered ? 'Pass Confirmed ✓' : isNotified ? 'Reminder Set ✓' : event.status}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAction(event)}
                    className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${
                      event.id === 'technotsav'
                        ? isRegistered
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30'
                          : 'bg-teal-600 hover:bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.25)]'
                        : isNotified
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 hover:text-white'
                    }`}
                  >
                    <span>
                      {event.id === 'technotsav'
                        ? isRegistered
                          ? 'Pass Ready'
                          : event.actionText
                        : isNotified
                        ? 'Notified'
                        : event.actionText}
                    </span>
                    <span className="material-symbols-outlined text-sm">
                      {event.id === 'technotsav'
                        ? isRegistered
                          ? 'confirmation_number'
                          : 'arrow_forward'
                        : isNotified
                        ? 'check'
                        : 'notifications'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
