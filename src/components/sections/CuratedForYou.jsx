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
        // Fallback gracefully to default curated items
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
    <section className="py-section-gap bg-surface-container-lowest relative overflow-hidden" id="curated">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Rule-Based Student Personalization
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
              Curated <span className="font-serif-italic text-tertiary">for ECA Students</span>
            </h2>
            <p className="font-sans text-base md:text-lg text-on-surface-variant mt-2">
              Personalized BTU examination updates, department notices, and hackathon recommendations.
            </p>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">
            Semester VII • Computer Science & Eng.
          </span>
        </div>

        <div className="glass-card rounded-3xl border border-outline/10 p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Column 1: Deadlines & Alerts */}
            <div className="col-span-1 flex flex-col gap-4">
              <h3 className="font-sans text-xs font-bold text-error uppercase tracking-[0.12em] mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">schedule</span> Approaching Deadlines
              </h3>

              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => onActionNotification?.(`Opening ${alert.title}`)}
                    className="bg-surface/50 rounded-xl p-4 border border-error/20 border-l-4 border-l-error cursor-pointer hover:bg-surface/70 transition-all font-sans relative group"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-white font-semibold text-sm">{alert.title}</h4>
                      <span className="text-[10px] bg-error/20 text-error font-bold px-2 py-0.5 rounded-full shrink-0">
                        {alert.days_left === 0 ? 'Due Today' : `${alert.days_left}d left`}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1.5 font-medium">Course: {alert.course}</p>
                  </div>
                ))
              ) : (
                <>
                  <div
                    onClick={() => onActionNotification?.('Opening B.Tech VII Sem Project submission portal...')}
                    className="bg-surface/50 rounded-xl p-4 border border-error/20 border-l-4 border-l-error cursor-pointer hover:bg-surface/70 transition-colors font-sans"
                  >
                    <h4 className="text-white font-semibold text-sm">B.Tech Project-1 Submission (VII Sem CSE/IT/Cyber)</h4>
                    <p className="text-sm text-error mt-1 font-bold">Due in 2 days (Friday, 11:59 PM)</p>
                  </div>
                  <div
                    onClick={() => onActionNotification?.('Opening BTU Exam Registration schedule...')}
                    className="bg-surface/50 rounded-xl p-4 border border-outline/10 cursor-pointer hover:bg-surface/70 transition-colors font-sans"
                  >
                    <h4 className="text-white font-semibold text-sm">BTU B.Tech III, V, VII Sem Registration</h4>
                    <p className="text-sm text-on-surface-variant mt-1">Due in 5 days</p>
                  </div>
                </>
              )}
            </div>

            {/* Column 2: Department Announcements */}
            <div className="col-span-1 flex flex-col gap-4">
              <h3 className="font-sans text-xs font-bold text-secondary uppercase tracking-[0.12em] mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">domain</span> Dept of CSE & IT (ECA)
              </h3>
              <div
                onClick={() => onActionNotification?.('Opening ECA LEEP 2026-27 Direct Admission Portal...')}
                className="bg-surface/50 rounded-xl p-4 border border-outline/10 hover:border-secondary/30 transition-colors cursor-pointer font-sans"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs bg-secondary/10 text-secondary px-2.5 py-0.5 rounded font-bold">
                    Official Notice
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Fall 2026</span>
                </div>
                <h4 className="text-white font-semibold text-sm">LEEP 2026-27 & B.Tech 1st Year Internal Sliding</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
                  Online form links for Diploma Lateral Entry (LEEP 2nd Year) and 1st Year direct admissions session 2026-27 are live.
                </p>
              </div>

              <div
                onClick={() => onActionNotification?.('Opening BTU Academic Calendar...')}
                className="bg-surface/50 rounded-xl p-4 border border-outline/10 hover:border-secondary/30 transition-colors cursor-pointer font-sans"
              >
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded mb-2 inline-block font-bold">
                  Curriculum Update
                </span>
                <h4 className="text-white font-semibold text-sm">BTU Semester 7 Mid-Term Exam Time Table</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
                  Theoretical and practical assessment schedule released for CS, IT, and AI branches.
                </p>
              </div>
            </div>

            {/* Column 3: Recommendations with Save & Dismiss */}
            <div className="col-span-1 flex flex-col gap-4">
              <h3 className="font-sans text-xs font-bold text-tertiary uppercase tracking-[0.12em] mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">auto_awesome</span> Recommended for you
              </h3>

              {visibleRecommendations.length > 0 ? (
                visibleRecommendations.slice(0, 2).map((item) => {
                  const isSaved = savedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => onActionNotification?.(`Viewing ${item.title}`)}
                      className="bg-surface/50 rounded-xl p-4 border border-outline/10 hover:border-tertiary/30 transition-all cursor-pointer font-sans relative group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-tertiary/10 text-tertiary">
                          {item.category || 'Curated'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleSave(item, e)}
                            className="p-1 rounded text-on-surface-variant hover:text-tertiary transition-colors"
                            title={isSaved ? 'Remove from saved' : 'Save recommendation'}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isSaved ? 'bookmark_added' : 'bookmark'}
                            </span>
                          </button>
                          <button
                            onClick={(e) => handleDismiss(item.id, e)}
                            className="p-1 rounded text-on-surface-variant hover:text-error transition-colors"
                            title="Dismiss recommendation"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      </div>
                      <h4 className="text-white text-sm font-semibold mt-2">{item.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-1">{item.reason}</p>
                    </div>
                  );
                })
              ) : (
                <div
                  onClick={() => onActionNotification?.('Viewing Smart India Hackathon SIH-2026 details...')}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
