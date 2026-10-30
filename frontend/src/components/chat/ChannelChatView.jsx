import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import ConvertToTaskModal from './ConvertToTaskModal';
import {
  Hash, Send, CheckSquare, Smile, MessageSquare, Sparkles,
  Paperclip, ExternalLink, ThumbsUp, Heart, Flame, AlertCircle, Info
} from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '🚀', '🔥', '👀', '✅', '🎉'];

export default function ChannelChatView({ onNavigateToTask }) {
  const { activeWorkspace, activeChannel, typingUsers, sendEvent } = useWorkspace();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [activeConvertMessage, setActiveConvertMessage] = useState(null);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load message history for active channel
  useEffect(() => {
    if (!activeChannel) return;
    setLoading(true);

    apiRequest(`/messages/?channel_id=${activeChannel.id}`)
      .then((data) => {
        setMessages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load channel messages", err);
        setLoading(false);
      });
  }, [activeChannel]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for real-time socket events
  useEffect(() => {
    // Custom event listener from WorkspaceContext can also be plugged
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChannel) return;

    const content = inputText.trim();
    setInputText('');

    try {
      sendEvent('typing_stop', { channel_id: activeChannel.id });
      const newMsg = await apiRequest('/messages/', {
        method: 'POST',
        body: JSON.stringify({
          channel: activeChannel.id,
          content
        })
      });
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!activeChannel) return;

    sendEvent('typing_start', { channel_id: activeChannel.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendEvent('typing_stop', { channel_id: activeChannel.id });
    }, 2000);
  };

  const handleToggleReaction = async (messageId, emoji) => {
    setShowEmojiPickerFor(null);
    try {
      const updatedMessage = await apiRequest(`/messages/${messageId}/react/`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updatedMessage : m))
      );
    } catch (err) {
      console.error("Failed to react", err);
    }
  };

  const handleTaskConverted = (result) => {
    // Update local message to show converted state
    if (result.source_message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === result.source_message.id ? result.source_message : m))
      );
    }
  };

  if (!activeChannel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <Hash className="h-12 w-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-white">No Channel Selected</h3>
        <p className="text-xs text-slate-400 mt-1">Select or create a channel to start communicating.</p>
      </div>
    );
  }

  const typingUser = typingUsers[activeChannel.id];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden relative">
      {/* Top Channel Header */}
      <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
            <Hash className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              #{activeChannel.name}
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                Channel
              </span>
            </h2>
            <p className="text-xs text-slate-400 truncate max-w-md">
              {activeChannel.description || 'Topic discussions for the team'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-950/60 border border-brand-500/20 text-brand-300">
            <Sparkles className="h-3 w-3 text-brand-400" />
            <span>Hover a message to convert into task</span>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500">
            Loading conversations...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-12">
            <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-white">Welcome to #{activeChannel.name}!</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              This is the start of the #{activeChannel.name} channel. Share an idea or send a message to kick off collaboration.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === user?.id;

            return (
              <div
                key={msg.id}
                className="group relative flex gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-800/40 transition-colors"
              >
                {/* Sender Avatar */}
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm uppercase">
                  {msg.sender.username.substring(0, 2)}
                </div>

                {/* Message Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-white">
                      {msg.sender.first_name ? `${msg.sender.first_name} ${msg.sender.last_name || ''}` : msg.sender.username}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed break-words whitespace-pre-wrap">
                    {msg.content}
                  </p>

                  {/* SIGNATURE FEATURE BADGE: Message Converted to Task */}
                  {msg.is_converted_to_task && (
                    <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Converted to Task:</span>
                      <strong className="font-semibold text-white">
                        {msg.converted_task?.title || 'Active Task'}
                      </strong>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {msg.converted_task?.status || 'todo'}
                      </span>
                    </div>
                  )}

                  {/* Reactions List */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(
                        msg.reactions.reduce((acc, r) => {
                          acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([emoji, count]) => {
                        const hasReacted = msg.reactions.some(
                          (r) => r.emoji === emoji && r.user.id === user?.id
                        );
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all ${
                              hasReacted
                                ? 'bg-brand-900/60 border-brand-500/40 text-brand-300'
                                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-medium">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Floating Action Menu (HomieLink Conversation-to-Action) */}
                <div className="absolute right-3 -top-3 hidden group-hover:flex items-center bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-1 gap-1 z-10">
                  {/* Signature Feature: Convert to Task Button */}
                  <button
                    onClick={() => setActiveConvertMessage(msg)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-colors"
                    title="Convert Message into Actionable Task"
                  >
                    <CheckSquare className="h-3 w-3" />
                    <span>Convert to Task</span>
                  </button>

                  {/* Quick Reaction Button */}
                  <button
                    onClick={() =>
                      setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)
                    }
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Add reaction"
                  >
                    <Smile className="h-3.5 w-3.5" />
                  </button>

                  {/* Quick Emojis Dropdown */}
                  {showEmojiPickerFor === msg.id && (
                    <div className="absolute right-0 top-8 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-1.5 flex gap-1 z-20">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className="h-7 w-7 rounded hover:bg-slate-700 flex items-center justify-center text-sm transition-transform hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUser && (
        <div className="px-6 py-1 text-[11px] text-slate-400 italic bg-slate-900/80">
          <span className="font-semibold text-slate-300">{typingUser}</span> is typing...
        </div>
      )}

      {/* Message Input Box */}
      <div className="p-4 px-6 border-t border-slate-800 bg-slate-900/80 shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message #${activeChannel.name}... (Press enter to send)`}
              className="w-full bg-transparent px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="h-10 w-10 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white flex items-center justify-center transition-all shadow-md shadow-brand-600/20"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Convert to Task Modal */}
      {activeConvertMessage && (
        <ConvertToTaskModal
          message={activeConvertMessage}
          onClose={() => setActiveConvertMessage(null)}
          onSuccess={handleTaskConverted}
        />
      )}
    </div>
  );
}

