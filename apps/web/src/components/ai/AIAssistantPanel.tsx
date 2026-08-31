"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Maximize2,
  Minimize2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { AskAssistantResponse } from "@tracefuse/shared";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  citations?: string[];
  grounded?: boolean;
  model?: string;
  timestamp: string;
  fallbackUsed?: boolean;
}

interface AIAssistantPanelProps {
  investigationId: string;
  caseTitle: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const QUICK_PROMPTS = [
  "Why is this case suspicious and what patterns were detected?",
  "What is the multi-hop money trail from the origin?",
  "Are there shared hardware devices or coordinated mule accounts?",
  "Summarize key findings for SAR / STR regulatory filing.",
];

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  investigationId,
  caseTitle,
  isOpen,
  onClose,
  className = "",
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: `Hello Analyst. I am your **TraceFuse AML Assistant**, grounded directly in the evidence and transaction graph of **${caseTitle}**.\n\nAsk me anything about the detected patterns, money trail hops, shared hardware, or case genesis triggers.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      grounded: true,
      model: "TraceFuse Grounded Engine",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res: AskAssistantResponse = await api.askAssistant(investigationId, textToSend.trim());

      const assistantMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: "assistant",
        text: res.answer,
        citations: res.citations,
        grounded: res.grounded,
        model: res.model,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fallbackUsed: res.fallback_used,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: "assistant",
        text: `Error contacting investigation copilot: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        grounded: false,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 bg-[#111622] border border-[#233148] rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
        isExpanded
          ? "bottom-4 right-4 left-4 sm:left-auto sm:w-[700px] h-[85vh]"
          : "bottom-4 right-4 w-full sm:w-[460px] h-[600px] max-w-[calc(100vw-2rem)]"
      } ${className}`}
    >
      {/* Header */}
      <div className="p-4 bg-[#182030] border-b border-[#233148] rounded-t-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold text-white">Grounded AI Copilot</h3>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-medium flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Grounded
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono truncate max-w-[240px]">
              Case Scope: {investigationId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-400">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() =>
              setMessages([
                {
                  id: "welcome",
                  sender: "assistant",
                  text: `Chat cleared. Grounded in evidence for **${caseTitle}**.`,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  grounded: true,
                },
              ])
            }
            className="p-1.5 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 leading-relaxed ${
                  isUser
                    ? "bg-blue-600 text-white font-medium rounded-tr-none shadow-md shadow-blue-600/20"
                    : "bg-[#0a0d14] border border-[#1f293d] text-gray-200 rounded-tl-none shadow-md"
                }`}
              >
                {/* Message Body formatted with linebreaks / markdown elements */}
                <div className="whitespace-pre-wrap font-sans text-xs space-y-2">
                  {msg.text.split("\n\n").map((paragraph, pIdx) => {
                    if (paragraph.startsWith("### ")) {
                      return (
                        <h4 key={pIdx} className="font-mono font-bold text-blue-400 text-xs mt-2">
                          {paragraph.replace("### ", "")}
                        </h4>
                      );
                    }
                    if (paragraph.startsWith("- ")) {
                      return (
                        <ul key={pIdx} className="space-y-1 list-disc list-inside text-gray-300">
                          {paragraph.split("\n").map((line, lIdx) => (
                            <li key={lIdx}>{line.replace("- ", "")}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={pIdx}>{paragraph}</p>;
                  })}
                </div>

                {/* Citations & Model Badge */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center gap-1 font-mono text-[10px]">
                    <span className="text-gray-500">Citations:</span>
                    {msg.citations.map((c) => (
                      <span
                        key={c}
                        className="px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-[10px] text-gray-500 font-mono">
                  <span>{msg.timestamp}</span>
                  {!isUser && msg.model && (
                    <span className="text-gray-400">{msg.model}</span>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-gray-800 text-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 text-gray-400 font-mono text-xs p-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Analyzing case graph and grounding evidence...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="px-4 py-2 border-t border-[#1f293d] bg-[#0d121d] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-[#111622] hover:bg-[#182030] border border-[#1f293d] text-gray-300 hover:text-white text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-[#111622] border-t border-[#233148] rounded-b-2xl flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask about this investigation (grounded in case context)..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={loading}
          className="flex-1 px-3.5 py-2 bg-[#0a0d14] border border-[#1f293d] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-sans"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-blue-600/25 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
