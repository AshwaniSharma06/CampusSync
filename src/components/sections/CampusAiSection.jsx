import React, { useState } from 'react';
import AiKnowledgeCanvas from '../three/AiKnowledgeCanvas';

const ECA_PROMPTS = [
  {
    q: 'Where is Engineering College Ajmer located and how do I get there?',
    a: "ECA is located at Badliya Chouraha, National Highway 8 (N.H.8), Ajmer, Rajasthan 305025. It's easily accessible via auto or bus from Ajmer Junction railway station.",
  },
  {
    q: 'Which university is ECA Ajmer affiliated with?',
    a: 'Engineering College Ajmer is affiliated with Bikaner Technical University (BTU), approved by AICTE.',
  },
  {
    q: 'When are Technotsav and Tarangini hosted at ECA?',
    a: 'Technotsav (Annual Tech Fest) is held in October 2026, and Tarangini (Annual Cultural Fest hosted by Creative Art Society) is in November 2026 at the Open Air Theatre.',
  },
];

export default function CampusAiSection() {
  const [messages, setMessages] = useState([
    {
      role: 'user',
      text: 'Where is Engineering College Ajmer located and how do I get there?',
    },
    {
      role: 'assistant',
      text: "ECA is located at Badliya Chouraha, National Highway 8 (N.H.8), Ajmer, Rajasthan 305025. It's about 12 km from Ajmer Railway Station.",
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
        "ECA CampusSync AI: I've checked Engineering College Ajmer's academic catalog, BTU examination notices, and campus directory for 2026.";
      const matched = ECA_PROMPTS.find((sp) =>
        sp.q.toLowerCase().includes(textToSend.toLowerCase().slice(0, 15))
      );
      if (matched) {
        botAnswer = matched.a;
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: botAnswer }]);
      setIsThinking(false);
    }, 800);
  };

  return (
    <section className="py-section-gap bg-surface relative overflow-hidden" id="ai-assistant">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content Column */}
          <div className="flex flex-col gap-6 relative z-10 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full w-fit">
              <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
              <span className="font-sans font-bold text-primary uppercase tracking-[0.15em] text-[10px] md:text-xs">
                ECA CampusSync AI Agent
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-tight">
              Ask ECA Campus.
              <br />
              <span className="font-serif-italic text-primary">Get exact answers.</span>
            </h2>
            <p className="font-sans text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed">
              Our context-aware AI knows Engineering College Ajmer's syllabus, BTU exam dates, Barliya block map, LEEP admissions, and Technotsav events.
            </p>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2">
              {ECA_PROMPTS.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sp.q)}
                  className="font-sans text-xs bg-surface-bright/40 hover:bg-surface-bright/80 text-on-surface-variant hover:text-white px-3.5 py-1.5 rounded-full border border-outline/10 transition-colors text-left font-medium"
                >
                  "{sp.q.length > 40 ? sp.q.slice(0, 40) + '...' : sp.q}"
                </button>
              ))}
            </div>

            {/* AI Interactive Chat Card */}
            <div className="glass-card rounded-2xl p-6 border border-outline/10 shadow-xl mt-2 font-sans">
              <div className="flex flex-col gap-4 max-h-[260px] overflow-y-auto pr-2 hide-scrollbar">
                {messages.map((m, index) =>
                  m.role === 'user' ? (
                    <div
                      key={index}
                      className="bg-surface-bright/50 rounded-xl p-4 rounded-tr-sm self-start max-w-[85%] border border-outline/10"
                    >
                      <p className="text-sm text-white">{m.text}</p>
                    </div>
                  ) : (
                    <div
                      key={index}
                      className="bg-primary/10 rounded-xl p-4 rounded-tl-sm self-end max-w-[85%] border border-primary/20"
                    >
                      <p className="text-sm text-on-primary-container">{m.text}</p>
                    </div>
                  )
                )}
                {isThinking && (
                  <div className="bg-primary/10 rounded-xl p-3 rounded-tl-sm self-end max-w-[50%] border border-primary/20 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    <span className="text-xs text-primary font-medium">ECA AI checking notices...</span>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="mt-6 relative"
              >
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full bg-surface-container rounded-full py-3 px-6 pr-12 text-sm text-white placeholder:text-on-surface-variant border border-outline/20 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                  placeholder="Ask anything about ECA Ajmer campus life..."
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary hover:bg-primary-fixed transition-colors"
                  title="Send Question"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </form>
            </div>
          </div>

          {/* 3D Canvas Column */}
          <div className="h-[350px] lg:h-[550px] relative order-1 lg:order-2 flex items-center justify-center">
            <AiKnowledgeCanvas />
          </div>
        </div>
      </div>
    </section>
  );
}
