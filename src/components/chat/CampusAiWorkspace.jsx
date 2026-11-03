import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/apiService';

export default function CampusAiWorkspace({ studentProfile, onActionNotification }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState('New Conversation');
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load user's persistent chat sessions
  const loadSessions = async () => {
    setIsSessionsLoading(true);
    try {
      const data = await apiService.getChatSessions();
      if (Array.isArray(data)) {
        setSessions(data);
        if (data.length > 0 && !activeSessionId) {
          // Load most recent session
          loadSessionDetails(data[0].id);
        } else if (data.length === 0) {
          startNewSession();
        }
      }
    } catch (err) {
      console.warn('Unable to load persistent chat sessions:', err);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Load messages for a selected session
  const loadSessionDetails = async (sessionId) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const details = await apiService.getChatSession(sessionId);
      if (details) {
        setActiveSessionId(details.id);
        setActiveSessionTitle(details.title || 'Conversation');
        setMessages(details.messages || []);
      }
    } catch (err) {
      setErrorMsg(`Unable to load conversation #${sessionId}.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Start a fresh conversation
  const startNewSession = async () => {
    setActiveSessionId(null);
    setActiveSessionTitle('New Conversation');
    setMessages([
      {
        role: 'assistant',
        content: `Hi ${studentProfile?.name?.split(' ')[0] || 'there'}! I'm **CampusSync AI**, your intelligent academic assistant for Engineering College Ajmer.\n\nAsk me anything about your university circulars, mid-term examinations, timetable, syllabus, or engineering subjects (DBMS, OS, ML, Java, DSA).`,
        sources: [],
        created_at: new Date().toISOString()
      }
    ]);
    setErrorMsg(null);
  };

  // Create session explicitly or trigger on first query
  const handleSendMessage = async (queryText = null) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isLoading) return;

    setInputQuery('');
    setErrorMsg(null);

    // Append user message immediately
    const userMsg = {
      role: 'user',
      content: q,
      created_at: new Date().toISOString()
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Format recent history for multi-turn Gemini reasoning
    const historyPayload = updatedMessages.slice(-8).map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const res = await apiService.chatWithAI(q, historyPayload, studentProfile, activeSessionId);

      if (res && res.answer) {
        const assistantMsg = {
          role: 'assistant',
          content: res.answer,
          sources: res.sources || [],
          rewritten_query: res.rewritten_query || '',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);

        // If backend assigned a session ID, track it and refresh sessions
        if (res.session_id && res.session_id !== activeSessionId) {
          setActiveSessionId(res.session_id);
          loadSessions();
        }
      } else {
        throw new Error('Empty response from AI engine');
      }
    } catch (err) {
      console.error('Chat generation error:', err);
      let errorBubbleText = `⚠️ **Error**: ${err.message || 'Unable to complete your request.'}`;

      if (err.status === 401) {
        errorBubbleText = '🔒 **Authentication Required**: Your session has expired or is invalid. Please log in again to continue.';
      } else if (err.status === 403) {
        errorBubbleText = '⛔ **Access Restricted**: You do not have permission to access academic data outside your registered department or semester.';
      } else if (err.status === 422) {
        errorBubbleText = `⚠️ **Validation Error**: ${err.message}`;
      } else if (err.status >= 500) {
        errorBubbleText = `🔥 **Backend Server Error (${err.status})**: ${err.message}`;
      } else if (err.code === 'TIMEOUT') {
        errorBubbleText = '⏱️ **Request Timeout**: The AI generation timed out. Please retry with a concise question.';
      } else if (err.code === 'NETWORK_ERROR' || (err.message && err.message.includes('unreachable'))) {
        errorBubbleText = `🔌 **Backend Offline / Connection Refused**: Unable to connect to the backend server.\n\n*Please ensure the FastAPI backend is running:* \`uvicorn backend.main:app --reload --port 8000\``;
      }

      setErrorMsg(err.message || 'Network error communicating with CampusSync AI');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: errorBubbleText,
          sources: [],
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Rename session title
  const handleRenameSession = async (sessionId) => {
    if (!editingTitle.trim()) return;
    try {
      const updated = await apiService.renameChatSession(sessionId, editingTitle.trim());
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: updated.title } : s));
      if (activeSessionId === sessionId) {
        setActiveSessionTitle(updated.title);
      }
      setEditingSessionId(null);
      setEditingTitle('');
      onActionNotification?.('Conversation title updated');
    } catch (err) {
      alert('Failed to rename conversation.');
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Delete this conversation history?')) return;
    try {
      await apiService.deleteChatSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        startNewSession();
      }
      onActionNotification?.('Conversation deleted');
    } catch (err) {
      alert('Failed to delete conversation.');
    }
  };

  // Handle textarea enter & shift+enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col lg:flex-row h-[720px] animate-in fade-in duration-200">
      {/* 1. SESSIONS SIDEBAR (30% desktop, collapsible drawer mobile) */}
      <div className="w-full lg:w-72 bg-slate-900 text-white flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 shrink-0">
        {/* Sidebar Header & New Chat button */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-400 text-xl">smart_toy</span>
            <span className="text-[14px] font-bold text-white tracking-wide">CampusSync AI</span>
          </div>
          <button
            onClick={startNewSession}
            className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white text-[12px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
            title="Start New Chat"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 hide-scrollbar">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Your Conversations
          </div>

          {isSessionsLoading ? (
            <div className="p-4 text-center text-slate-500 text-[12px]">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-[12px]">No saved conversations yet.</div>
          ) : (
            sessions.map((sess) => {
              const isActive = activeSessionId === sess.id;
              const isEditing = editingSessionId === sess.id;

              return (
                <div
                  key={sess.id}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-600/30 text-teal-300 border border-teal-500/40'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                  onClick={() => !isEditing && loadSessionDetails(sess.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-teal-400 shrink-0">
                      chat_bubble
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSession(sess.id)}
                        className="bg-slate-800 text-white text-[12px] px-2 py-0.5 rounded border border-teal-400 w-full focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate">{sess.title || 'Conversation'}</span>
                    )}
                  </div>

                  {/* Actions: Edit / Delete */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                    {isEditing ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameSession(sess.id);
                        }}
                        className="p-1 text-teal-400 hover:text-white"
                        title="Save Title"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(sess.id);
                          setEditingTitle(sess.title);
                        }}
                        className="p-1 text-slate-400 hover:text-teal-300"
                        title="Rename"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(sess.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-400"
                      title="Delete Conversation"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{studentProfile?.department || 'CSE'} • Sem {studentProfile?.semester || 7}</span>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Gemini Online
          </span>
        </div>
      </div>

      {/* 2. MAIN CHAT AREA (70% desktop) */}
      <div className="flex-1 flex flex-col bg-slate-50/60 min-w-0 h-full">
        {/* Chat Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200/90 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">smart_toy</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] font-bold text-slate-900 truncate">
                {activeSessionTitle}
              </h3>
              <p className="text-[12px] text-slate-500 font-medium">
                Grounded in official ECA circulars &amp; BTU syllabus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={startNewSession}
              className="lg:hidden flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-xl text-[12px] font-bold"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 hide-scrollbar">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user' || msg.role === 'student';

            return (
              <div
                key={idx}
                className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm shadow-xs ${
                    isUser
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-slate-900 text-teal-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {isUser ? 'person' : 'smart_toy'}
                  </span>
                </div>

                {/* Content Bubble */}
                <div className={`space-y-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-[14px] leading-relaxed shadow-xs whitespace-pre-wrap ${
                      isUser
                        ? 'bg-teal-600 text-white font-medium rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none font-normal'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* CITATION CARDS (Phase 8: Compact, Grounded Source Display) */}
                  {!isUser && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span className="material-symbols-outlined text-xs text-teal-600">bookmark</span>
                        <span>Source Citations ({msg.sources.length})</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.url || 'https://www.ecajmer.ac.in'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all flex items-start justify-between gap-2 group shadow-2xs text-left"
                            title="Open Source Link"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 uppercase">
                                  {src.scope || 'Notice'}
                                </span>
                                {src.data_origin === 'VERIFIED_OFFICIAL' ? (
                                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[10px]">verified</span>
                                    Official
                                  </span>
                                ) : (src.data_origin === 'DEMO_SEED' || src.verification_status === 'PENDING_VERIFICATION') ? (
                                  <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                    Pending Verification
                                  </span>
                                ) : null}
                                {src.published_date && (
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(src.published_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <h5 className="text-[12px] font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                                {src.title}
                              </h5>
                            </div>
                            <span className="material-symbols-outlined text-xs text-slate-400 group-hover:text-teal-600 shrink-0 mt-1">
                              open_in_new
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General educational badge when no official citation was needed */}
                  {!isUser && (!msg.sources || msg.sources.length === 0) && (
                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 pl-1">
                      <span className="material-symbols-outlined text-xs text-slate-400">school</span>
                      <span>General Academic Guidance</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing / Thinking Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3.5 max-w-xl animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-base">smart_toy</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-none p-3.5 shadow-xs flex items-center gap-2">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-[12px] text-slate-500 font-medium ml-1.5">
                  Analyzing verified circulars with Gemini...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills (if thread is short) */}
        {messages.length <= 2 && (
          <div className="px-6 py-2 flex flex-wrap gap-2 shrink-0">
            {[
              'Explain DBMS normalization with examples',
              'What are the Central Library hours?',
              'Give me 10 Java MCQs for midterm revision',
              'When is the Semester 7 Major Project evaluation?'
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="text-[12px] bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 px-3 py-1.5 rounded-xl font-medium transition-all shadow-2xs"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Multiline Input Bar (Phase 9) */}
        <div className="p-4 bg-white border-t border-slate-200/90 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2.5 bg-slate-50 border border-slate-200 focus-within:border-teal-500 rounded-2xl p-2 transition-all shadow-2xs"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask CampusSync AI anything (Press Enter to send, Shift+Enter for new line)..."
              className="flex-1 bg-transparent px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-32 min-h-[40px] font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold p-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
              title="Send Message"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </form>
          <div className="text-[11px] text-slate-400 text-center mt-2 font-medium">
            CampusSync AI answers are grounded in official ECA &amp; BTU circulars. Verify critical deadlines with the administration.
          </div>
        </div>
      </div>
    </div>
  );
}

