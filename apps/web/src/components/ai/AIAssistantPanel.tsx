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
        model: res.model || "TraceFuse Grounded Engine",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fallbackUsed: res.fallback_used,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: "assistant",
        text: "I encountered an issue querying the grounded case intelligence. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 bg-white border border-border-warm rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
        isExpanded
          ? "bottom-4 right-4 left-4 sm:left-auto sm:w-[700px] h-[85vh]"
          : "bottom-4 right-4 w-full sm:w-[460px] h-[600px] max-w-[calc(100vw-2rem)]"
      } ${className}`}
    >
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-border-warm rounded-t-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-navy-subtle text-navy border border-navy/20">
            <Sparkles className="w-4 h-4 text-navy" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-sm font-bold text-ink-primary">Grounded AI Copilot</h3>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-sans font-medium flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                Grounded
              </span>
            </div>
            <p className="text-[10px] text-ink-secondary font-mono truncate max-w-[240px]">
              Case Scope: {investigationId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-ink-secondary">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:text-ink-primary hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
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
            className="p-1.5 hover:text-ink-primary hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:text-ink-primary hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs bg-white">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-navy-subtle border border-navy/20 text-navy flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 leading-relaxed ${
                  isUser
                    ? "bg-navy text-white font-medium rounded-tr-none shadow-md shadow-navy/20"
                    : "bg-slate-50 border border-border-warm text-ink-primary rounded-tl-none shadow-sm"
                }`}
              >
                {/* Message Body formatted with linebreaks / markdown elements */}
                <div className="whitespace-pre-wrap font-sans text-xs space-y-2">
                  {msg.text.split("\n\n").map((paragraph, pIdx) => {
                    if (paragraph.startsWith("### ")) {
                      return (
                        <h4 key={pIdx} className="font-serif font-bold text-navy text-xs mt-2">
                          {paragraph.replace("### ", "")}
                        </h4>
                      );
                    }
                    if (paragraph.startsWith("- ")) {
                      return (
                        <ul key={pIdx} className="space-y-1 list-disc list-inside text-ink-primary">
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
                  <div className="pt-2 border-t border-border-warm flex flex-wrap items-center gap-1 text-[10px]">
                    <span className="text-ink-secondary">Citations:</span>
                    {msg.citations.map((c) => (
                      <span
                        key={c}
                        className="px-1.5 py-0.2 rounded bg-navy-subtle border border-navy/20 text-navy font-mono"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-[10px] text-ink-secondary">
                  <span className="font-mono">{msg.timestamp}</span>
                  {!isUser && msg.model && (
                    <span className="text-ink-secondary">{msg.model}</span>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 text-ink-secondary text-xs p-2">
            <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            <span>Analyzing case graph and grounding evidence...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="px-4 py-2 border-t border-border-warm bg-slate-50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-border-warm text-ink-primary text-[11px] whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shadow-sm"
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
        className="p-3 bg-slate-50 border-t border-border-warm rounded-b-2xl flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask about this investigation (grounded in case context)..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={loading}
          className="flex-1 px-3.5 py-2 bg-white border border-border-warm rounded-xl text-xs text-ink-primary placeholder-slate-400 focus:outline-none focus:border-navy font-sans shadow-sm"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="p-2 bg-navy hover:bg-navy-hover disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-navy/20 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
