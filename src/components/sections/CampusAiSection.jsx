import React, { useState } from 'react';
import AiKnowledgeCanvas from '../three/AiKnowledgeCanvas';

const SAMPLE_PROMPTS = [
  {
    q: 'Where is my next class and how long will it take to walk there from the library?',
    a: "Your next class is Advanced Physics Lab in Science Bldg, Room 402 at 10:00 AM. It's approximately a 7-minute walk from the Main Library.",
  },
  {
    q: 'When is the main library open today?',
    a: 'The Main Library is open today until 11:00 PM. Study Pods can be reserved directly through your Student Portal.',
  },
  {
    q: 'What mid-term exams do I have scheduled for Fall 2026?',
    a: 'Your mid-term schedule for Fall 2026 includes Database Systems on Oct 18 and Machine Learning on Oct 22.',
  },
];

export default function CampusAiSection() {
  const [messages, setMessages] = useState([
    {
      role: 'user',
      text: 'Where is my next class and how long will it take to walk there from the library?',
    },
    {
      role: 'assistant',
      text: "Your next class is Advanced Physics Lab in Science Bldg, Room 402. It's about a 7-minute walk from your current location at the Main Library.",
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
        "CampusSync AI: I've checked your student profile, campus map, and academic catalog for 2026. Everything is set up for your schedule!";
      const matched = SAMPLE_PROMPTS.find((sp) =>
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
                CampusSync AI Assistant
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-tight">
              Ask your campus.
              <br />
              <span className="font-serif-italic text-primary">Get the right answer.</span>
            </h2>
            <p className="font-sans text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed">
              Our context-aware AI knows your schedule, the syllabus, library inventory, and campus events. Just ask naturally.
            </p>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((sp, idx) => (
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
                    <span className="text-xs text-primary font-medium">CampusSync AI thinking...</span>
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
                  placeholder="Ask anything about your campus life..."
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
