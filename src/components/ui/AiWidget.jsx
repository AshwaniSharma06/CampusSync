import React, { useState } from 'react';

const SAMPLE_PROMPTS = [
  'Where is my next class?',
  'When is the main library open today?',
  'What mid-terms do I have in Fall 2026?',
  'How do I register for Technotsav 2026?',
];

export default function AiWidget({ isOpenExternal, setIsOpenExternal }) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = isOpenExternal !== undefined ? isOpenExternal : isOpenInternal;
  const setIsOpen = setIsOpenExternal || setIsOpenInternal;

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi Alex! 👋 I am your Campus AI Agent. I can help with your schedule, BTU exam dates, library books, and ECA campus navigation. Ask me anything!',
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
      let botResponse = `Campus AI Agent: I've checked Engineering College Ajmer's 2026 calendar and profile. `;

      const lower = query.toLowerCase();
      if (lower.includes('next class') || lower.includes('where')) {
        botResponse =
          "Your next class is Advanced AI & ML Lab in Barliya Block, Room 402 at 10:00 AM. It's about a 5-minute walk from Central Computer Center.";
      } else if (lower.includes('library') || lower.includes('open')) {
        botResponse =
          'The Central Library is open today until 11:00 PM. Study Pod B is reserved for your Calculus study session at 2:00 PM.';
      } else if (lower.includes('exam') || lower.includes('mid-term') || lower.includes('midterm')) {
        botResponse =
          'Your BTU mid-term exam schedule for Fall 2026 includes Database Systems on Oct 18 and Machine Learning on Oct 22.';
      } else if (lower.includes('technotsav') || lower.includes('register') || lower.includes('fest')) {
        botResponse =
          'Technotsav 2026 is scheduled for Oct 15–17 at ECA Campus. Registration is currently open for Robowar and Hackathon!';
      } else {
        botResponse = `Campus AI Agent: "${query}" has been logged into your student dashboard. I've updated your schedule preferences.`;
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: botResponse }]);
      setIsThinking(false);
    }, 700);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Widget */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-surface-container-high/95 backdrop-blur-2xl border border-primary/30 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-surface-container/90 px-5 py-4 border-b border-outline/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(113,216,200,0.3)]">
                  <span className="material-symbols-outlined text-xl">smart_toy</span>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-surface shadow-[0_0_6px_#71d8c8]"></span>
              </div>
              <div>
                <h4 className="font-sans font-bold text-white text-sm flex items-center gap-1.5">
                  Campus AI Agent
                </h4>
                <span className="text-[11px] text-primary font-medium flex items-center gap-1">
                  Online • ECA Knowledge Base 2026
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-surface-bright/50 hover:bg-surface-bright text-on-surface-variant hover:text-white flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Quick Prompt Pills */}
          <div className="p-3 bg-surface/50 border-b border-outline/10 flex gap-2 overflow-x-auto hide-scrollbar">
            {SAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap text-xs bg-surface-bright/60 hover:bg-primary/20 hover:text-primary text-on-surface-variant px-3 py-1.5 rounded-full border border-outline/10 transition-colors font-sans font-medium shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 font-sans hide-scrollbar">
            {messages.map((m, idx) =>
              m.role === 'user' ? (
                <div
                  key={idx}
                  className="bg-primary/20 text-white rounded-2xl rounded-tr-xs p-3.5 max-w-[85%] self-end border border-primary/30 text-sm leading-relaxed"
                >
                  {m.text}
                </div>
              ) : (
                <div
                  key={idx}
                  className="bg-surface-bright/60 text-on-surface rounded-2xl rounded-tl-xs p-3.5 max-w-[85%] self-start border border-outline/10 text-sm leading-relaxed"
                >
                  {m.text}
                </div>
              )
            )}
            {isThinking && (
              <div className="bg-surface-bright/40 text-primary rounded-2xl rounded-tl-xs p-3 max-w-[50%] self-start border border-outline/10 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span>Campus AI Agent is thinking...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-surface-container/90 border-t border-outline/10 relative flex items-center"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask Campus AI Agent..."
              className="w-full bg-surface-container-low rounded-full py-2.5 px-4 pr-11 text-xs text-white placeholder:text-on-surface-variant/70 border border-outline/20 focus:outline-none focus:border-primary/50 transition-colors font-sans"
            />
            <button
              type="submit"
              className="absolute right-4 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-on-primary hover:bg-primary-fixed transition-colors shadow-md"
            >
              <span className="material-symbols-outlined text-[15px]">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_0_25px_rgba(113,216,200,0.5)] hover:bg-primary-fixed hover:scale-105 active:scale-95 transition-all duration-300 z-50"
        title="Open Campus AI Agent"
      >
        <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">
          {isOpen ? 'close' : 'smart_toy'}
        </span>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-tertiary rounded-full border-2 border-surface animate-bounce"></span>
        )}
      </button>
    </div>
  );
}
