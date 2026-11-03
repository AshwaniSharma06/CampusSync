import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../../services/apiService';

const SAMPLE_PROMPTS = [
  'Explain DBMS normalization',
  'Give me 10 Java MCQs',
  'What are the Central Library hours?',
  'Explain polymorphism with examples',
  'When is the Semester 7 Major Project evaluation?'
];

export default function AiWidget({ isOpenExternal, setIsOpenExternal, userProfile }) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = isOpenExternal !== undefined ? isOpenExternal : isOpenInternal;
  const setIsOpen = setIsOpenExternal || setIsOpenInternal;

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm CampusSync AI, your intelligent academic assistant for Engineering College Ajmer. How can I help you today?",
      sources: []
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleResetChat = () => {
    setActiveSessionId(null);
    setMessages([
      {
        role: 'assistant',
        text: "Hi! I'm CampusSync AI, your intelligent academic assistant for Engineering College Ajmer. How can I help you today?",
        sources: []
      }
    ]);
  };

  const handleSend = async (textOverride) => {
    const query = (textOverride || inputVal).trim();
    if (!query || isThinking) return;

    const newMsg = { role: 'user', text: query };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    if (!textOverride) setInputVal('');
    setIsThinking(true);

    const historyPayload = updatedMessages.slice(-6).map((m) => ({
      role: m.role,
      content: m.text,
    }));

    try {
      const response = await apiService.chatWithAI(query, historyPayload, userProfile, activeSessionId);
      if (response && response.answer) {
        if (response.session_id) {
          setActiveSessionId(response.session_id);
        }
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: response.answer,
            sources: response.sources || []
          }
        ]);
        return;
      }
      throw new Error('No answer received from CampusSync AI service');
    } catch (err) {
      console.error('CampusSync AI communication error:', err);
      let errorText = `⚠️ **Connection Error**: Unable to reach CampusSync AI (${err.message || 'Network failure'}).`;

      if (err.status === 401) {
        errorText = '🔒 **Authentication Required**: Please log in to continue chatting with CampusSync AI.';
      } else if (err.status === 403) {
        errorText = '⛔ **Access Restricted**: Access to academic records outside your cohort is restricted.';
      } else if (err.status === 422) {
        errorText = `⚠️ **Validation Error**: ${err.message}`;
      } else if (err.status >= 500) {
        errorText = `🔥 **Server Error (${err.status})**: ${err.message}`;
      } else if (err.code === 'TIMEOUT') {
        errorText = '⏱️ **Timeout**: Request timed out. Please try again.';
      } else if (err.code === 'NETWORK_ERROR' || (err.message && err.message.includes('unreachable'))) {
        errorText = '🔌 **Backend Offline**: Unable to connect to the API on port 8000. Please ensure the backend server is running: `uvicorn backend.main:app --port 8000`';
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: errorText,
          sources: []
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Widget: Full-screen on mobile, compact desktop panel */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full h-full sm:w-[380px] sm:h-[540px] bg-[#0c1e36] sm:rounded-2xl border-0 sm:border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-[#09172c] px-4 py-3 border-b border-slate-700/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                  <span className="material-symbols-outlined text-base">smart_toy</span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-teal-400 rounded-full border border-slate-900"></span>
              </div>
              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 leading-tight">
                  CampusSync AI
                </h4>
                <span className="text-[10px] text-teal-400 font-medium">
                  Verified ECA &amp; BTU Assistant
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="New Chat Session"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                title="Close Assistant"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-[#081528] border-b border-slate-800 flex flex-wrap gap-1 max-h-20 overflow-y-auto hide-scrollbar shrink-0">
            {SAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="text-[10px] bg-slate-800/80 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 px-2 py-0.5 rounded-lg border border-slate-700 transition-colors text-left font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3 hide-scrollbar">
            {messages.map((m, idx) =>
              m.role === 'user' ? (
                <div
                  key={idx}
                  className="bg-teal-600 text-white rounded-2xl rounded-tr-xs p-3 max-w-[85%] self-end text-xs leading-relaxed shadow-sm font-medium whitespace-pre-wrap"
                >
                  {m.text}
                </div>
              ) : (
                <div
                  key={idx}
                  className="bg-slate-800/95 text-slate-100 rounded-2xl rounded-tl-xs p-3 max-w-[90%] self-start border border-slate-700 text-xs leading-relaxed shadow-sm space-y-2"
                >
                  <p className="text-slate-100 font-normal leading-relaxed whitespace-pre-wrap">{m.text}</p>

                  {/* Citation Cards (Phase 8) */}
                  {Array.isArray(m.sources) && m.sources.length > 0 && (
                    <div className="pt-1 border-t border-slate-700/80 space-y-1">
                      <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">
                        Source Citations ({m.sources.length}):
                      </span>
                      <div className="space-y-1">
                        {m.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.url || 'https://www.ecajmer.ac.in'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-teal-400 text-left transition-colors"
                          >
                            <span className="text-[11px] font-bold text-teal-300 line-clamp-1">
                              {src.title}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {src.scope || 'Notice'} • {src.data_origin === 'VERIFIED_OFFICIAL' ? 'Official' : 'Pending Verification'} • {src.published_date ? new Date(src.published_date).toLocaleDateString() : 'Recent'}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            {isThinking && (
              <div className="bg-slate-800/90 text-teal-300 rounded-2xl rounded-tl-xs p-2.5 max-w-[70%] self-start border border-teal-500/30 text-[11px] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
                <span>CampusSync AI is reasoning with Gemini...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Multiline Input Bar (Phase 9) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-[#09172c] border-t border-slate-800 flex items-end gap-2 shrink-0"
          >
            <textarea
              rows={1}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask CampusSync AI (Enter to send)..."
              className="flex-1 bg-slate-900 rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:border-teal-500 transition-colors resize-none max-h-24 min-h-[36px]"
            />
            <button
              type="submit"
              disabled={isThinking || !inputVal.trim()}
              className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center text-white hover:bg-teal-500 disabled:opacity-50 transition-colors shrink-0 shadow-sm"
              title="Send Message"
            >
              <span className="material-symbols-outlined text-[15px]">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-teal-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:bg-teal-500 hover:scale-105 active:scale-95 transition-all duration-200 z-50"
        title="Open CampusSync AI"
      >
        <span className="material-symbols-outlined text-2xl">
          {isOpen ? 'close' : 'smart_toy'}
        </span>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-slate-900 animate-bounce"></span>
        )}
      </button>
    </div>
  );
}
