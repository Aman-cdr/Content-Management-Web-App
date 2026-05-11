"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Copy, 
  CheckCircle2, 
  Smartphone, 
  Camera, 
  Video, 
  StopCircle
} from "lucide-react";

const SUGGESTIONS = [
  {
    icon: Smartphone,
    title: "Viral Shorts Ideas",
    prompt: "Generate 5 high-retention YouTube Shorts ideas for a tech channel, including hook and visual suggestions.",
    color: "text-red-500",
    bg: "bg-red-50"
  },
  {
    icon: Video,
    title: "TikTok Script",
    prompt: "Write a 30-second TikTok script about productivity hacks. Use the PAS (Problem, Agitation, Solution) framework.",
    color: "text-cyan-500",
    bg: "bg-cyan-50"
  },
  {
    icon: Camera,
    title: "IG Carousel Text",
    prompt: "Create a 5-slide Instagram carousel text about 'Designing better UIs'. Keep it punchy and engaging.",
    color: "text-pink-500",
    bg: "bg-pink-50"
  },
  {
    icon: Sparkles,
    title: "Catchy Titles",
    prompt: "Give me 10 click-worthy, non-clickbait titles for a video about building a SaaS product in a weekend.",
    color: "text-indigo-500",
    bg: "bg-indigo-50"
  }
];

export default function AIAgentPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Mock AI delay and response logic
    setTimeout(() => {
      let aiContent = "";
      const lowerText = text.toLowerCase();

      if (lowerText.includes("youtube") || lowerText.includes("shorts")) {
        aiContent = `Here are 5 high-retention YouTube Shorts ideas for your tech channel:

**1. The "Secret" Mac Feature**
*Hook:* "I guarantee you didn't know your Mac could do this."
*Visual:* Fast zoom-in on the screen recording.
*Concept:* Show the built-in screen sharing or OCR text selection in Preview.

**2. 3 VS Code Extensions You Need**
*Hook:* "Stop coding without these 3 extensions."
*Visual:* Quick montage of typing fast with cool themes.
*Concept:* Highlight Prettier, GitHub Copilot, and Live Server.

**3. Setup Tour (Under $500)**
*Hook:* "How to build a pro dev setup for under $500."
*Visual:* Cinematic pan of a clean desk setup.
*Concept:* Focus on budget-friendly monitor, mechanical keyboard, and lighting.

**4. The 5-Minute Portfolio**
*Hook:* "Get your dev portfolio done in 5 minutes."
*Visual:* Screen recording of deploying a Vercel template.
*Concept:* Show how to clone a Next.js template and deploy it instantly.

**5. AI Tools for Developers**
*Hook:* "AI is taking our jobs, so use it to your advantage."
*Visual:* Split screen of slow manual coding vs fast AI coding.
*Concept:* Showcase Cursor or GitHub Copilot X.`;
      } else if (lowerText.includes("tiktok") || lowerText.includes("script")) {
        aiContent = `Here is a 30-second TikTok script using the PAS (Problem, Agitation, Solution) framework:

**[0:00-0:05] PROBLEM (The Hook)**
*(Visual: You looking stressed at a messy desk, holding a coffee)*
"Are you working 12 hours a day but still feel like you got nothing done?"

**[0:05-0:15] AGITATION**
*(Visual: Quick cuts of a messy calendar, overflowing inbox, clock ticking)*
"Your to-do list is endless, your inbox is a nightmare, and the burnout is real. You're confusing being busy with being productive."

**[0:15-0:25] SOLUTION**
*(Visual: You smiling, showing a clean notion dashboard or kanban board)*
"Stop doing everything. Start using the 2-Minute Rule and Time Blocking. If a task takes less than 2 minutes, do it immediately. Everything else? Block it on your calendar."

**[0:25-0:30] CALL TO ACTION**
*(Visual: Pointing to the camera/screen text)*
"Work smarter, not harder. Drop a 🚀 in the comments if you're trying this today and follow for more hacks!"`;
      } else {
        aiContent = `I can certainly help with that! However, as a demo AI Agent for the CreatorCMS, my primary expertise is generating video ideas, scripts, and social media content. 

Try asking me to:
- Generate YouTube Shorts concepts
- Write a TikTok script
- Create Instagram Carousel ideas
- Brainstorm catchy titles

How else can I help your content workflow today?`;
      }

      setMessages((prev) => [...prev, { id: Date.now(), role: "ai", content: aiContent }]);
      setIsTyping(false);
    }, 2000);
  };

  const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <button 
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:text-[#0F0F0F] bg-white border border-[#E2E4E9] rounded-lg transition-colors shadow-sm"
      >
        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied!" : "Copy Text"}
      </button>
    );
  };

  // Helper to render simple markdown-like text (bold)
  const renderFormattedText = (text) => {
    return text.split('\\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={i} className="block mb-3 last:mb-0 leading-relaxed">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="font-bold text-[#0F0F0F]">{part.slice(2, -2)}</strong>;
            }
            // Add italics support for *text*
            const italicParts = part.split(/(\*.*?\*)/g);
            return italicParts.map((ip, k) => {
               if (ip.startsWith('*') && ip.endsWith('*')) {
                  return <em key={k} className="italic text-neutral-600">{ip.slice(1, -1)}</em>;
               }
               return ip;
            });
          })}
        </span>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col pt-2 pb-6">
      
      {/* Header Info */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[32px] font-bold tracking-tight mb-2 text-[#0A0A0F] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            AI Content Agent
          </h2>
          <p className="text-[#8A91A8] font-medium text-sm">Your personal creative assistant for generating ideas, scripts, and content strategies.</p>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 bg-white border border-[#E2E4E9] rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center mt-10">
               <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6">
                 <Bot className="w-8 h-8 text-indigo-600" />
               </div>
               <h3 className="text-xl font-bold text-[#0F0F0F] mb-3">How can I help you create today?</h3>
               <p className="text-neutral-500 text-sm mb-10 leading-relaxed">
                 I'm an AI trained to help content creators brainstorm viral ideas, write engaging scripts, and optimize titles for maximum reach.
               </p>
               
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                   {/* Greyed out example exchanges */}
                   <div className="col-span-1 sm:col-span-2 mb-4 space-y-4 opacity-50 pointer-events-none select-none">
                     <div className="flex gap-4 flex-row-reverse">
                       <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                         <User className="w-3.5 h-3.5 text-neutral-400" />
                       </div>
                       <div className="px-4 py-2.5 rounded-2xl text-[13px] bg-neutral-100 text-neutral-400 rounded-tr-sm">
                         Can you give me a hook for my next video?
                       </div>
                     </div>
                     <div className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                         <Bot className="w-3.5 h-3.5 text-neutral-400" />
                       </div>
                       <div className="px-4 py-2.5 rounded-2xl text-[13px] bg-neutral-50 text-neutral-400 rounded-tl-sm border border-neutral-100">
                         "Stop doing X until you try this one simple hack..."
                       </div>
                     </div>
                   </div>

                   {SUGGESTIONS.map((suggestion, idx) => (
                     <motion.button
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.1 }}
                       key={idx}
                       onClick={() => setInput(suggestion.prompt)}
                     className="text-left p-4 rounded-xl border border-[#E2E4E9] hover:border-[#6366F1] hover:shadow-[0_4px_20px_rgba(99,102,241,0.1)] transition-all group bg-white"
                   >
                     <div className="flex items-center gap-3 mb-2">
                       <div className={`w-8 h-8 rounded-lg ${suggestion.bg} flex items-center justify-center`}>
                         <suggestion.icon className={`w-4 h-4 ${suggestion.color}`} />
                       </div>
                       <span className="font-bold text-[#0F0F0F] text-sm">{suggestion.title}</span>
                     </div>
                     <p className="text-xs text-neutral-500 font-medium line-clamp-2 leading-relaxed">
                       {suggestion.prompt}
                     </p>
                   </motion.button>
                 ))}
               </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${msg.role === "user" ? "bg-[#0F0F0F]" : "bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]"}`}>
                    {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`px-5 py-3.5 rounded-2xl text-[15px] ${msg.role === "user" ? "bg-[#0F0F0F] text-white rounded-tr-sm" : "bg-[#F4F5F8] text-[#111318] rounded-tl-sm border border-[#E2E4E9]"}`}>
                      {msg.role === "ai" ? renderFormattedText(msg.content) : msg.content}
                    </div>
                    {msg.role === "ai" && (
                      <div className="flex mt-1">
                         <CopyButton text={msg.content} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 flex-row"
                >
                   <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-[#F4F5F8] border border-[#E2E4E9] rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5 h-[50px]">
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-[#6366F1]" />
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-[#A78BFA]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-[#E2E4E9]">
          <div className="max-w-4xl mx-auto relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isTyping && handleSend()}
              placeholder="Ask the AI to brainstorm, write scripts, or generate titles..."
              disabled={isTyping}
              className="w-full bg-[#F4F5F8] border border-[#E2E4E9] rounded-2xl pl-5 pr-24 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 transition-all text-[#0A0A0F] placeholder:text-[#8A91A8] disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <div className="absolute right-14 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400 pointer-events-none">
              {input.length}/500
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-[#6366F1] text-white hover:bg-[#4F46E5] disabled:opacity-50 disabled:hover:bg-[#6366F1] transition-all"
            >
              {isTyping ? <StopCircle className="w-5 h-5" /> : <Send className="w-5 h-5 ml-0.5" />}
            </button>
          </div>
          <div className="text-center mt-3">
             <span className="text-[11px] font-medium text-neutral-400">AI-generated content may be inaccurate. Please review before publishing.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
