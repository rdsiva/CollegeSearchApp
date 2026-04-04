import { useState, useRef, useEffect } from 'react';
import { X, Send, User, Loader2 } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { sendChat } from '../api/client';

// College Buddy mascot avatar
function BuddyAvatar({ size = 'md', className = '' }) {
  const dim = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const emoji = size === 'sm' ? 'text-base' : 'text-lg';
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}>
      <span className={`${emoji} leading-none`}>🎓</span>
    </div>
  );
}

// Render inline text: **bold**, *italic*
function InlineText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*'))
          return <em key={i}>{part.slice(1, -1)}</em>;
        return part;
      })}
    </>
  );
}

// Render markdown: headers, bullets, numbered lists, bold, newlines
function MsgText({ text }) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={i} className="h-1" />);
      i++;
      continue;
    }

    // H1 heading
    if (trimmed.startsWith('# ')) {
      elements.push(
        <p key={i} className="font-bold text-sm mt-1"><InlineText text={trimmed.slice(2)} /></p>
      );
      i++;
      continue;
    }

    // H2/H3 heading
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      const htext = trimmed.replace(/^#{2,3}\s+/, '');
      elements.push(
        <p key={i} className="font-semibold mt-1"><InlineText text={htext} /></p>
      );
      i++;
      continue;
    }

    // Bullet list item: -, *, •, ✅, ❌, 📌
    if (/^[-*•]|^[✅❌📌🎓💰🏢📊]/.test(trimmed)) {
      const content = trimmed.replace(/^[-*•]\s*/, '').replace(/^[✅❌📌🎓💰🏢📊]\s*/, (m) => m);
      elements.push(
        <div key={i} className="flex gap-1.5 leading-relaxed">
          <span className="flex-shrink-0 text-gray-400 mt-0.5">•</span>
          <span><InlineText text={/^[✅❌📌🎓💰🏢📊]/.test(trimmed) ? trimmed : content} /></span>
        </div>
      );
      i++;
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\./)[1];
      const content = trimmed.replace(/^\d+\.\s*/, '');
      elements.push(
        <div key={i} className="flex gap-1.5 leading-relaxed">
          <span className="flex-shrink-0 text-gray-500 font-medium">{num}.</span>
          <span><InlineText text={content} /></span>
        </div>
      );
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="leading-relaxed"><InlineText text={trimmed} /></p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

const GENERAL_SUGGESTIONS = [
  'What is the TNEA counselling process?',
  'How are cutoff marks calculated?',
  'Which Chennai colleges are good for CSE?',
  'What is the difference between OC and BC cutoffs?',
];

export default function ChatWidget() {
  const { isOpen, activeCollege, messages, openGeneral, close, addMessage } = useChat();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Show suggestions when chat opens or college changes
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setSuggestions(activeCollege ? [] : GENERAL_SUGGESTIONS);
    }
  }, [isOpen, activeCollege]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function handleSend(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setSuggestions([]);
    addMessage('user', msg);
    setLoading(true);

    try {
      const res = await sendChat({
        message: msg,
        collegeCode: activeCollege?.code,
        history: messages,
      });
      addMessage('assistant', res.reply);
      if (res.suggestions?.length) setSuggestions(res.suggestions);
    } catch {
      addMessage('assistant', 'Sorry, something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={openGeneral}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 pl-2 pr-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all hover:scale-105 no-print"
          title="Ask College Buddy"
        >
          <BuddyAvatar size="sm" className="bg-white/20" />
          <span className="text-sm font-semibold">Ask College Buddy</span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-96 h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden no-print">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <BuddyAvatar size="md" />
              <div>
                <p className="font-semibold text-sm leading-tight">College Buddy</p>
                {activeCollege ? (
                  <p className="text-xs text-blue-100 truncate max-w-52">{activeCollege.name}</p>
                ) : (
                  <p className="text-xs text-blue-100">General TNEA Help</p>
                )}
              </div>
            </div>
            <button onClick={close} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Welcome / context banner */}
          {messages.length === 0 && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex-shrink-0">
              {activeCollege ? (
                <p className="text-xs text-blue-700">
                  Ask me anything about <strong>{activeCollege.name}</strong> — cutoffs, fees, placements, or courses.
                </p>
              ) : (
                <p className="text-xs text-blue-700">
                  Ask me anything about Tamil Nadu engineering colleges, TNEA cutoffs, or admissions.
                </p>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {m.role === 'user' ? (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                    <User size={13} />
                  </div>
                ) : (
                  <BuddyAvatar size="sm" />
                )}
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed
                  ${m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                  <MsgText text={m.content} />
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <BuddyAvatar size="sm" />
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="px-4 pb-2 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-1.5">Suggested questions</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    disabled={loading}
                    className="flex-shrink-0 text-xs px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type your question…"
                disabled={loading}
                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <p className="text-center text-xs text-gray-300 mt-1.5">College Buddy · Powered by Claude AI</p>
          </div>
        </div>
      )}
    </>
  );
}
