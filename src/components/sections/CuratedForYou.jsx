import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

export default function CuratedForYou({ onActionNotification }) {
  const [recommendations, setRecommendations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchPersonalized() {
      try {
        const data = await apiService.getRecommendations();
        if (isMounted && data) {
          if (data.recommendations && data.recommendations.length > 0) {
            setRecommendations(data.recommendations);
          }
          if (data.alerts && data.alerts.length > 0) {
            setAlerts(data.alerts);
          }
        }
      } catch (err) {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPersonalized();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = (id, e) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
    if (onActionNotification) {
      onActionNotification('Recommendation dismissed.');
    }
  };

  const handleSave = async (item, e) => {
    e.stopPropagation();
    const isSaved = savedIds.includes(item.id);
    if (isSaved) {
      setSavedIds((prev) => prev.filter((id) => id !== item.id));
      if (onActionNotification) onActionNotification(`Removed "${item.title}" from saved items.`);
    } else {
      setSavedIds((prev) => [...prev, item.id]);
      try {
        await apiService.toggleSaveItem({
          item_type: item.type || 'notice',
          item_id: parseInt(String(item.id).replace(/\D/g, '')) || 1,
        });
      } catch (_) {}
      if (onActionNotification) onActionNotification(`Saved "${item.title}" for later.`);
    }
  };

  const visibleRecommendations = recommendations.filter((r) => !dismissedIds.includes(r.id));

  return (
    <section className="py-16 md:py-24 bg-surface-container-lowest relative overflow-hidden" id="curated">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Compact, clean sans-serif section header */}
        <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              Personalized Feed
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              For you
            </h2>
            <p className="text-sm md:text-base text-on-surface-variant mt-1.5 max-w-2xl">
              Curated BTU examination updates, department notices, and hackathon recommendations.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Semester VII • Computer Science &amp; Eng.
          </span>
        </div>

        {/* Lighter card surface with crisp borders & readable sans-serif titles */}
        <div className="bg-[#0d213b]/90 rounded-2xl border border-slate-700/70 p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-indigo-500 to-amber-400"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Column 1: Deadlines & Alerts (Red/Amber Urgency) */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">schedule</span> Approaching Deadlines
              </h3>

              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => onActionNotification?.(`Opening ${alert.title}`)}
                    className="bg-slate-900/80 rounded-xl p-4 border border-red-500/30 border-l-4 border-l-red-500 cursor-pointer hover:bg-slate-800/80 transition-all font-sans group shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-white font-bold text-sm group-hover:text-red-300 transition-colors leading-snug">
                        {alert.title}
                      </h4>
                      <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full shrink-0 border border-red-500/30">
                        {alert.days_left === 0 ? 'Due Today' : `${alert.days_left}d left`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Course: {alert.course}</p>
                  </div>
                ))
              ) : (
                <>
                  <div
                    onClick={() => onActionNotification?.('Opening B.Tech VII Sem Project submission portal...')}
                    className="bg-slate-900/80 rounded-xl p-4 border border-red-500/30 border-l-4 border-l-red-500 cursor-pointer hover:bg-slate-800/80 transition-all group shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-white font-bold text-sm group-hover:text-red-300 transition-colors leading-snug">
                        B.Tech Project-1 Submission
                      </h4>
                      <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full shrink-0 border border-red-500/30">
                        2d left
                      </span>
                    </div>
                    <p className="text-xs text-red-400 mt-2 font-semibold">Due Friday, 11:59 PM • VII Sem CSE/IT</p>
                  </div>
                  <div
                    onClick={() => onActionNotification?.('Opening BTU Exam Registration schedule...')}
                    className="bg-slate-900/80 rounded-xl p-4 border border-amber-500/30 border-l-4 border-l-amber-500 cursor-pointer hover:bg-slate-800/80 transition-all group shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-white font-bold text-sm group-hover:text-amber-300 transition-colors leading-snug">
                        BTU B.Tech Semester Exam Registration
                      </h4>
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full shrink-0 border border-amber-500/30">
                        5d left
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Main & Back Paper Exam Forms Live</p>
                  </div>
                </>
              )}
            </div>

            {/* Column 2: Department Announcements */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">domain</span> Dept of CSE &amp; IT
              </h3>

              <div
                onClick={() => onActionNotification?.('Opening ECA LEEP 2026-27 Direct Admission Portal...')}
                className="bg-slate-900/80 rounded-xl p-4 border border-slate-700 hover:border-teal-400/50 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] bg-teal-500/15 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded font-bold">
                    Official Notice
                  </span>
                  <span className="text-[11px] text-slate-400">Fall 2026</span>
                </div>
                <h4 className="text-white font-bold text-sm group-hover:text-teal-300 transition-colors leading-snug">
                  LEEP 2026-27 &amp; B.Tech 1st Year Sliding
                </h4>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  Direct admission links for lateral entry diploma holders and branch sliding schedule are active.
                </p>
              </div>

              <div
                onClick={() => onActionNotification?.('Opening BTU Academic Calendar...')}
                className="bg-slate-900/80 rounded-xl p-4 border border-slate-700 hover:border-teal-400/50 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-bold">
                    Curriculum Update
                  </span>
                  <span className="text-[11px] text-slate-400">BTU Schedule</span>
                </div>
                <h4 className="text-white font-bold text-sm group-hover:text-indigo-300 transition-colors leading-snug">
                  BTU Semester 7 Mid-Term Exam Time Table
                </h4>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  Theoretical and practical assessment schedule released for CS, IT, and AI branches.
                </p>
              </div>
            </div>

            {/* Column 3: Recommendations with Save & Dismiss */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">auto_awesome</span> Recommended for you
              </h3>

              {visibleRecommendations.length > 0 ? (
                visibleRecommendations.slice(0, 2).map((item) => {
                  const isSaved = savedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => onActionNotification?.(`Viewing ${item.title}`)}
                      className="bg-slate-900/80 rounded-xl p-4 border border-slate-700 hover:border-amber-400/50 transition-all cursor-pointer relative group shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {item.category || 'Curated'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleSave(item, e)}
                            className="p-1 rounded text-slate-400 hover:text-amber-400 transition-colors"
                            title={isSaved ? 'Remove from saved' : 'Save recommendation'}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isSaved ? 'bookmark_added' : 'bookmark'}
                            </span>
                          </button>
                          <button
                            onClick={(e) => handleDismiss(item.id, e)}
                            className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors"
                            title="Dismiss recommendation"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      </div>
                      <h4 className="text-white font-bold text-sm mt-2 group-hover:text-amber-300 transition-colors leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{item.reason}</p>
                    </div>
                  );
                })
              ) : (
                <div
                  onClick={() => onActionNotification?.('Viewing Smart India Hackathon SIH-2026 details...')}
                  className="bg-slate-900/80 rounded-xl p-4 border border-slate-700 hover:border-amber-400/50 transition-all cursor-pointer flex gap-3.5 items-start group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <span className="material-symbols-outlined text-lg">school</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm group-hover:text-amber-300 transition-colors leading-snug">
                      Smart India Hackathon (SIH) 2026
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      ECA Innovation Cell internal screening round for 2026 problem statements.
                    </p>
                    <span className="mt-2 text-xs text-teal-400 uppercase font-bold tracking-wider hover:underline inline-flex items-center gap-1">
                      View Details <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
