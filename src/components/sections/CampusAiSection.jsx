import React, { useState } from 'react';
import AiKnowledgeCanvas from '../three/AiKnowledgeCanvas';

const ECA_PROMPTS = [
  {
    q: 'Where is Engineering College Ajmer located and how do I reach the campus?',
    a: "ECA is located at Badliya Chouraha, National Highway 8 (N.H.8), Ajmer, Rajasthan 305025. It's approximately 12 km from Ajmer Junction railway station, accessible by auto or city bus.",
  },
  {
    q: 'Which university is ECA Ajmer affiliated with and what are the accreditation details?',
    a: 'Engineering College Ajmer is affiliated with Bikaner Technical University (BTU), approved by AICTE, and accredited by NBA for major engineering disciplines.',
  },
  {
    q: 'When are Technotsav and Tarangini festivals scheduled for this session?',
    a: 'Technotsav (Annual Tech & Robotics Fest) is scheduled for October 15–17, 2026, and Tarangini (Annual Cultural Fest by CAS) is hosted in November 2026 at the Open Air Theatre.',
  },
];

export default function CampusAiSection() {
  const [messages, setMessages] = useState([
    {
      role: 'user',
      text: 'Where is Engineering College Ajmer located and how do I reach the campus?',
    },
    {
      role: 'assistant',
      text: "ECA is located at Badliya Chouraha, National Highway 8 (N.H.8), Ajmer, Rajasthan 305025. It's approximately 12 km from Ajmer Junction railway station, accessible by auto or city bus.",
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = (userText) => {
    const textToSend = userText || inputVal;
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!userText) setInputVal('');
    setIsThinking(true);

    setTimeout(() => {
      let botAnswer =
        "ECA CampusSync AI: I've cross-referenced Engineering College Ajmer's academic catalog, BTU examination notices, and campus directory for 2026.";
      const matched = ECA_PROMPTS.find((sp) =>
        sp.q.toLowerCase().includes(textToSend.toLowerCase().slice(0, 15)) ||
        textToSend.toLowerCase().includes(sp.q.toLowerCase().slice(0, 15))
      );
      if (matched) {
        botAnswer = matched.a;
      } else if (textToSend.toLowerCase().includes('library') || textToSend.toLowerCase().includes('book')) {
        botAnswer = "The Central Library at ECA is open 8:00 AM to 10:00 PM on weekdays. Digital BTU question papers can be accessed via the student portal.";
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: botAnswer }]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <section className="py-16 md:py-24 bg-surface relative overflow-hidden" id="ai-assistant">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Content Column */}
          <div className="flex flex-col gap-5 relative z-10 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-3.5 py-1.5 rounded-full w-fit">
              <span className="material-symbols-outlined text-teal-400 text-sm">smart_toy</span>
              <span className="font-bold text-teal-400 uppercase tracking-wider text-xs">
                ECA CampusSync AI Copilot
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Ask ECA Campus AI
              </h2>
              <p className="text-sm md:text-base text-on-surface-variant mt-2 max-w-xl leading-relaxed">
                Context-aware AI with full knowledge of Engineering College Ajmer’s BTU syllabus, Barliya block room navigation, LEEP admissions, and SAC events.
              </p>
            </div>

            {/* Quick Prompts - Wrapped without truncation */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Suggested Questions
              </span>
              <div className="flex flex-wrap gap-2">
                {ECA_PROMPTS.map((sp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(sp.q)}
                    className="text-xs bg-[#0d213b] hover:bg-teal-500/15 text-slate-200 hover:text-teal-300 px-3.5 py-2 rounded-xl border border-slate-700/80 hover:border-teal-400/50 transition-all text-left font-medium max-w-full shadow-sm"
                  >
                    "{sp.q}"
                  </button>
                ))}
              </div>
            </div>

            {/* AI Interactive Chat Card with High Contrast */}
            <div className="bg-[#0d213b]/95 rounded-2xl p-5 md:p-6 border border-slate-700/80 shadow-2xl mt-1">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    ECA Knowledge Base • Fall 2026
                  </span>
                </div>
                <span className="text-[11px] text-teal-400 font-semibold bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-full">
                  AI Active
                </span>
              </div>

              {/* Chat messages with high-contrast text */}
              <div className="flex flex-col gap-3.5 max-h-[280px] overflow-y-auto pr-1 hide-scrollbar">
                {messages.map((m, index) =>
                  m.role === 'user' ? (
                    <div
                      key={index}
                      className="bg-slate-800/90 text-white rounded-2xl rounded-tr-xs p-3.5 max-w-[88%] self-end border border-slate-700 text-xs sm:text-sm leading-relaxed shadow-sm"
                    >
                      {m.text}
                    </div>
                  ) : (
                    <div
                      key={index}
                      className="bg-teal-950/80 text-teal-100 rounded-2xl rounded-tl-xs p-3.5 max-w-[88%] self-start border border-teal-500/40 text-xs sm:text-sm leading-relaxed shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 text-teal-400 font-bold text-[11px] mb-1">
                        <span className="material-symbols-outlined text-xs">smart_toy</span>
                        <span>Campus AI Copilot</span>
                      </div>
                      <p className="text-slate-100 font-normal">{m.text}</p>
                    </div>
                  )
                )}

                {isThinking && (
                  <div className="bg-teal-950/60 text-teal-300 rounded-2xl rounded-tl-xs p-3 max-w-[60%] self-start border border-teal-500/30 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                    <span>Checking ECA academic notices...</span>
                  </div>
                )}
              </div>

              {/* Form Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="mt-4 relative flex items-center"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full bg-slate-900/90 rounded-xl py-3 px-4 pr-12 text-xs sm:text-sm text-white placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:border-teal-400/60 transition-colors"
                  placeholder="Ask anything about ECA Ajmer, BTU syllabus, midterms..."
                />
                <button
                  type="submit"
                  className="absolute right-2.5 w-8 h-8 bg-teal-600 hover:bg-teal-500 rounded-lg flex items-center justify-center text-white transition-colors shadow-sm"
                  title="Send Question"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </form>
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
