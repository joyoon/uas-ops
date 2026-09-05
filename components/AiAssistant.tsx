"use client";
import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg }),
    });

    const data = await res.json();
    setMessages((m) => [...m, { role: "assistant", content: data.response }]);
    setLoading(false);
  }

  const suggestions = [
    "Which parts are low on stock?",
    "Summarize recent purchase orders",
    "Which supplier has the longest lead time?",
    "What should I reorder this week?",
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-[480px]">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        <span className="text-sm font-medium text-gray-200">Ops Assistant</span>
        <span className="text-xs text-gray-500 ml-1">powered by Claude</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-gray-500 text-xs uppercase tracking-wide">Suggested queries</p>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
                className="block w-full text-left px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-lg whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-orange-500/20 text-orange-100"
                : "bg-gray-800 text-gray-200"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 px-3 py-2 rounded-lg text-gray-400 text-xs">Thinking…</div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about inventory, orders, suppliers…"
          className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <button
          onClick={send}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
