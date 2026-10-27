import React, { useState } from 'react';

const SAMPLE_PROMPTS = [
  'Where is my next class?',
  'When does the Central Library close?',
  'What BTU mid-terms do I have in Oct 2026?',
  'How do I register for Technotsav 2026?',
];

export default function AiWidget({ isOpenExternal, setIsOpenExternal }) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = isOpenExternal !== undefined ? isOpenExternal : isOpenInternal;
  const setIsOpen = setIsOpenExternal || setIsOpenInternal;

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi Ashwani! 👋 I am your ECA Campus AI Copilot. Ask me about your timetable, BTU mid-terms, Central Library hours, or SAC fest passes.',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = (textOverride) => {
    const query = textOverride || inputVal;
    if (!query.trim()) return;

    const newMsg = { role: 'user', text: query };
    setMessages((prev) => [...prev, newMsg]);
    if (!textOverride) setInputVal('');
    setIsThinking(true);

    setTimeout(() => {
      let botResponse = `Campus AI Copilot: Checked ECA 2026 records. `;

      const lower = query.toLowerCase();
      if (lower.includes('next class') || lower.includes('where')) {
        botResponse =
          "Your next class is Advanced Physics Lab (PHYS 302) in Barliya Block, Room 402 at 10:00 AM. Dr. Marcus Brody is instructor.";
      } else if (lower.includes('library') || lower.includes('open') || lower.includes('close')) {
        botResponse =
          'The Central Library is open today until 10:00 PM. Study Pod B in Central Library is reserved for Calculus III peer review.';
      } else if (lower.includes('exam') || lower.includes('mid-term') || lower.includes('midterm')) {
        botResponse =
          'BTU mid-terms begin Oct 18 with Database Systems (CS 401) at 10:00 AM in Exam Hall A, and ML (CS 450) on Oct 22 at 2:00 PM in Hall C.';
      } else if (lower.includes('technotsav') || lower.includes('register') || lower.includes('fest')) {
        botResponse =
          'Technotsav 2026 runs Oct 15–17 at ECA Campus. Registrations are open for Robowar and the 24-hr Hackathon.';
      } else {
        botResponse = `Campus AI Copilot: Logged "${query}" into your student workspace and verified against the Fall 2026 academic catalog.`;
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: botResponse }]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Widget: Full-screen on mobile, compact desktop panel */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full h-full sm:w-[350px] sm:h-[480px] bg-[#0c1e36] sm:rounded-2xl border-0 sm:border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-[#09172c] px-4 py-3.5 border-b border-slate-700/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                  <span className="material-symbols-outlined text-lg">smart_toy</span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-400 rounded-full border-2 border-slate-900"></span>
              </div>
              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 leading-tight">
                  Campus AI Copilot
                </h4>
                <span className="text-[10px] text-teal-400 font-medium">
                  ECA Knowledge Base 2026
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Close Assistant"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Quick Prompts - Wrapped without truncation */}
          <div className="p-2.5 bg-[#081528] border-b border-slate-800 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto hide-scrollbar shrink-0">
            {SAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="text-[11px] bg-slate-800/80 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors text-left font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Body with High Contrast Text */}
          <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3 hide-scrollbar">
            {messages.map((m, idx) =>
              m.role === 'user' ? (
                <div
                  key={idx}
                  className="bg-slate-800 text-white rounded-2xl rounded-tr-xs p-3 max-w-[85%] self-end border border-slate-700 text-xs leading-relaxed shadow-sm"
                >
                  {m.text}
                </div>
              ) : (
                <div
                  key={idx}
                  className="bg-teal-950/80 text-teal-100 rounded-2xl rounded-tl-xs p-3 max-w-[88%] self-start border border-teal-500/40 text-xs leading-relaxed shadow-sm"
                >
                  <p className="text-slate-100 font-normal leading-relaxed">{m.text}</p>
                </div>
              )
            )}
            {isThinking && (
              <div className="bg-teal-950/60 text-teal-300 rounded-2xl rounded-tl-xs p-2.5 max-w-[65%] self-start border border-teal-500/30 text-[11px] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
                <span>Copilot is checking ECA notices...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#09172c] border-t border-slate-800 relative flex items-center shrink-0"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask Campus AI..."
              className="w-full bg-slate-900 rounded-xl py-2 px-3.5 pr-10 text-xs text-white placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:border-teal-500/60 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-4 w-6 h-6 bg-teal-600 rounded-lg flex items-center justify-center text-white hover:bg-teal-500 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[13px]">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-teal-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:bg-teal-500 hover:scale-105 active:scale-95 transition-all duration-200 z-50"
        title="Open Campus AI Copilot"
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
