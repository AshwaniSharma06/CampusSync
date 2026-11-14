import React, { useState, useEffect, useRef } from 'react';
import AiKnowledgeCanvas from '../three/AiKnowledgeCanvas';
import { apiService } from '../../services/apiService';

const SUGGESTED_ACADEMIC_QUESTIONS = [
  {
    icon: '📝',
    category: 'Examination Rules',
    query: 'What are the BTU examination rules, passing marks, and back-paper regulations?',
  },
  {
    icon: '📚',
    category: 'Syllabus & Scheme',
    query: 'Where can I find the 7th semester B.Tech syllabus and course structure?',
  },
  {
    icon: '🏛️',
    category: 'Campus Facilities',
    query: 'What are the Central Library hours, book issue limits, and digital portal access?',
  },
  {
    icon: '🎉',
    category: 'Event Schedules',
    query: 'What is the schedule for Technotsav, Tarangini, and upcoming college events?',
  },
  {
    icon: '📍',
    category: 'Campus Directory',
    query: 'Where is Engineering College Ajmer located and how do I reach the campus?',
  },
];

export default function CampusAiSection({ currentUser }) {
  // Session persistence: restore history from sessionStorage if available
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('campussync_ai_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      return sessionStorage.getItem('campussync_ai_session_id') || null;
    } catch {
      return null;
    }
  });

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync messages with sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('campussync_ai_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Unable to persist AI messages to sessionStorage:', e);
    }
  }, [messages]);

  // Sync activeSessionId with sessionStorage
  useEffect(() => {
    try {
      if (activeSessionId) {
        sessionStorage.setItem('campussync_ai_session_id', activeSessionId);
      } else {
        sessionStorage.removeItem('campussync_ai_session_id');
      }
    } catch (e) {
      console.warn('Unable to persist AI session_id to sessionStorage:', e);
    }
  }, [activeSessionId]);

  // Auto-scroll chat area when new messages appear or loading starts
  useEffect(() => {
    if (messages.length > 0 || isThinking) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  const handleResetChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    try {
      sessionStorage.removeItem('campussync_ai_messages');
      sessionStorage.removeItem('campussync_ai_session_id');
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSend = async (textOverride) => {
    const query = (textOverride || inputVal).trim();
    if (!query || isThinking) return;

    const userMsg = {
      role: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    if (!textOverride) {
      setInputVal('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    setIsThinking(true);

    // Context history payload: send last 8 messages for contextual awareness
    const historyPayload = updatedMessages.slice(-8).map((m) => ({
      role: m.role,
      content: m.text,
    }));

    const studentProfile = currentUser
      ? {
          name: currentUser.name || currentUser.displayName,
          department: currentUser.department || 'CSE',
          semester: currentUser.semester || 7,
          degree: currentUser.degree || 'B.Tech',
          college: 'Govt. Engineering College Ajmer (ECA)',
        }
      : null;

    try {
      const response = await apiService.chatWithAI(query, historyPayload, studentProfile, activeSessionId);

      if (response && response.answer) {
        if (response.session_id) {
          setActiveSessionId(response.session_id);
        }

        // Check if information was not found in verified college data
        const isInfoUnavailable =
          response.answer.toLowerCase().includes('not available in the college data') ||
          response.answer.toLowerCase().includes('no official record') ||
          response.answer.toLowerCase().includes('not found in verified');

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: response.answer,
            sources: response.sources || [],
            isInfoUnavailable,
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }
      throw new Error('No answer returned from CampusSync AI service');
    } catch (err) {
      console.error('Campus AI API communication error:', err);
      let errorText = `Unable to connect to CampusSync AI (${err.message || 'Network failure'}).`;

      if (err.status === 401) {
        errorText = '🔒 Authentication Required: Please sign in to access personalized student academic records.';
      } else if (err.status === 403) {
        errorText = '⛔ Access Restricted: Access to academic records outside your cohort is restricted.';
      } else if (err.status === 422) {
        errorText = `⚠️ Query Validation Error: ${err.message || 'Please rephrase your query.'}`;
      } else if (err.status >= 500) {
        errorText = '🔥 CampusSync Backend Error: The AI service encountered an issue. Please try again shortly.';
      } else if (err.code === 'TIMEOUT') {
        errorText = '⏱️ Request Timeout: The query took too long to complete. Please try a more specific question.';
      } else if (err.code === 'NETWORK_ERROR' || (err.message && err.message.includes('unreachable'))) {
        errorText = '🔌 CampusSync AI service is currently unreachable. Please check your network connection or verify that the backend server is running.';
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: errorText,
          isError: true,
          failedQuery: query,
          sources: [],
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    // Shift + Enter for newline; Enter alone to send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInputVal(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <section
      className="py-16 md:py-24 bg-surface relative overflow-hidden scroll-mt-20 md:scroll-mt-24"
      id="ai-assistant"
    >
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Content & Interactive Chat Column */}
          <div className="flex flex-col gap-5 relative z-10 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-3.5 py-1.5 rounded-full w-fit">
              <span className="material-symbols-outlined text-teal-400 text-sm">smart_toy</span>
              <span className="font-bold text-teal-400 uppercase tracking-wider text-xs">
                ECA CampusSync AI
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Ask ECA Campus AI
              </h2>
              <p className="text-sm md:text-base text-on-surface-variant mt-2 max-w-xl leading-relaxed">
                Context-aware AI powered by verified Engineering College Ajmer records, BTU examination notices, academic syllabi, and campus facility guides.
              </p>
            </div>

            {/* Quick Prompts Bar (Always accessible) */}
            {messages.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Questions
                </span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_ACADEMIC_QUESTIONS.slice(0, 3).map((sp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sp.query)}
                      disabled={isThinking}
                      className="text-xs bg-[#0d213b] hover:bg-teal-500/15 text-slate-200 hover:text-teal-300 px-3 py-1.5 rounded-xl border border-slate-700/80 hover:border-teal-400/50 transition-all text-left font-medium max-w-full shadow-sm disabled:opacity-50"
                    >
                      <span className="mr-1.5">{sp.icon}</span>
                      <span>"{sp.query.slice(0, 42)}..."</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Interactive Chat Card */}
            <div className="bg-[#0d213b]/95 rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-700/80 shadow-2xl flex flex-col min-h-[380px] max-h-[560px]">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/60 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    ECA Knowledge Base • Fall 2026
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <button
                      onClick={handleResetChat}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Clear chat and start a new session"
                    >
                      <span className="material-symbols-outlined text-xs">restart_alt</span>
                      <span>New Session</span>
                    </button>
                  )}
                  <span className="text-[11px] text-teal-400 font-semibold bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-full">
                    AI Active
                  </span>
                </div>
              </div>

              {/* Chat Body: Empty State or Messages */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 hide-scrollbar">
                {messages.length === 0 ? (
                  /* Empty State with Suggested Academic Questions */
                  <div className="flex flex-col items-center justify-center text-center py-4 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-3 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
                      <span className="material-symbols-outlined text-2xl">smart_toy</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                      How can Campus AI assist your academics today?
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                      Ask about BTU regulations, semester syllabus, Central Library hours, or college announcements.
                    </p>

                    <div className="w-full space-y-2 text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Suggested Academic Questions
                      </span>
                      {SUGGESTED_ACADEMIC_QUESTIONS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(item.query)}
                          disabled={isThinking}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/60 hover:border-teal-500/50 transition-all flex items-center justify-between group disabled:opacity-50"
                        >
                          <div className="flex items-center gap-2.5 pr-2">
                            <span className="text-base shrink-0">{item.icon}</span>
                            <div>
                              <span className="text-xs text-slate-200 group-hover:text-teal-300 font-medium block leading-snug">
                                {item.query}
                              </span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                {item.category}
                              </span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-500 group-hover:text-teal-400 text-sm transition-transform group-hover:translate-x-0.5 shrink-0">
                            arrow_forward
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Message History */
                  messages.map((m, index) =>
                    m.role === 'user' ? (
                      <div
                        key={index}
                        className="bg-slate-800/95 text-white rounded-2xl rounded-tr-xs p-3.5 max-w-[88%] self-end ml-auto border border-slate-700 text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-wrap"
                      >
                        {m.text}
                      </div>
                    ) : (
                      <div
                        key={index}
                        className={`rounded-2xl rounded-tl-xs p-3.5 max-w-[92%] self-start mr-auto border text-xs sm:text-sm leading-relaxed shadow-sm ${
                          m.isError
                            ? 'bg-rose-950/40 text-rose-200 border-rose-500/40'
                            : 'bg-teal-950/80 text-teal-100 border-teal-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 font-bold text-[11px] mb-1.5 pb-1 border-b border-white/10">
                          <div className="flex items-center gap-1.5 text-teal-300">
                            <span className="material-symbols-outlined text-sm">smart_toy</span>
                            <span>CampusSync AI</span>
                          </div>
                          {m.isError ? (
                            <span className="text-rose-400 font-semibold text-[10px]">Error</span>
                          ) : (
                            <span className="text-teal-400 font-medium text-[10px]">Verified Response</span>
                          )}
                        </div>

                        {/* Text Content */}
                        <div className="text-slate-100 font-normal leading-relaxed whitespace-pre-wrap">
                          {m.text}
                        </div>

                        {/* Notice for information not in college records */}
                        {m.isInfoUnavailable && (
                          <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-1.5">
                            <span className="material-symbols-outlined text-amber-400 text-xs mt-0.5">info</span>
                            <span>
                              This specific detail was not located in verified college circulars. Check the official ECA administration at{' '}
                              <a
                                href="https://www.ecajmer.ac.in"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-white"
                              >
                                ecajmer.ac.in
                              </a>
                              .
                            </span>
                          </div>
                        )}

                        {/* Verified Source Citations */}
                        {Array.isArray(m.sources) && m.sources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-teal-500/20 space-y-1.5">
                            <div className="flex items-center gap-1 text-[10px] text-teal-300 font-bold uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[13px]">verified</span>
                              <span>Source References &amp; Citations ({m.sources.length}):</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {m.sources.map((src, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={src.url || 'https://www.ecajmer.ac.in'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-teal-400/70 hover:bg-slate-800 transition-all text-left flex flex-col gap-0.5 group"
                                >
                                  <span className="text-xs font-semibold text-teal-300 group-hover:text-teal-200 line-clamp-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">description</span>
                                    {src.title || 'Official College Notice'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {src.scope || 'Notice'} • {src.data_origin === 'VERIFIED_OFFICIAL' ? 'Verified Official' : 'Academic Notice'}{' '}
                                    {src.published_date ? `• ${new Date(src.published_date).toLocaleDateString()}` : ''}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Retry action for failed queries */}
                        {m.isError && m.failedQuery && (
                          <div className="mt-2.5 pt-2 border-t border-rose-500/20 flex justify-end">
                            <button
                              onClick={() => handleSend(m.failedQuery)}
                              disabled={isThinking}
                              className="text-xs text-rose-300 hover:text-white bg-rose-900/40 hover:bg-rose-900/80 border border-rose-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <span className="material-symbols-outlined text-xs">refresh</span>
                              <span>Retry Question</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )
                )}

                {/* Loading Indicator */}
                {isThinking && (
                  <div className="bg-teal-950/60 text-teal-300 rounded-2xl rounded-tl-xs p-3.5 max-w-[80%] self-start mr-auto border border-teal-500/30 text-xs flex items-center gap-2.5 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.15s]"></span>
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.3s]"></span>
                    </div>
                    <span className="font-medium text-slate-200">
                      CampusSync AI is verifying ECA notices &amp; BTU syllabus...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Form Input Area */}
              <div className="mt-3 shrink-0">
                <div className="relative flex items-end">
                  <textarea
                    id="campus-ai-input"
                    ref={textareaRef}
                    rows={1}
                    value={inputVal}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about ECA Ajmer, BTU syllabus, midterms..."
                    className="w-full bg-slate-900/90 rounded-xl py-3 pl-4 pr-12 text-xs sm:text-sm text-white placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:border-teal-400/80 transition-colors resize-none min-h-[46px] max-h-28 hide-scrollbar"
                  />
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={isThinking || !inputVal.trim()}
                    className="absolute right-2 bottom-2 w-8 h-8 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 rounded-lg flex items-center justify-center text-white transition-all shadow-sm"
                    title="Send Question"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Canvas Column */}
          <div className="h-[320px] lg:h-[480px] relative order-1 lg:order-2 flex items-center justify-center">
            <AiKnowledgeCanvas />
          </div>
        </div>
      </div>
    </section>
  );
}
