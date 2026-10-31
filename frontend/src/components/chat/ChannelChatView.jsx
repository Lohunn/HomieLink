import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import ConvertToTaskModal from './ConvertToTaskModal';
import {
  Hash, Send, CheckSquare, Smile, MessageSquare, Sparkles,
  Paperclip, ExternalLink, ThumbsUp, Heart, Flame, AlertCircle,
  CornerUpLeft, X, FileText, Image, Check, Plus
} from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '🚀', '🔥', '👀', '✅', '🎉'];

export default function ChannelChatView({ onNavigateToTask }) {
  const {
    activeWorkspace, activeChannel, activeConversation, chatType,
    typingUsers, sendEvent, setActiveSection
  } = useWorkspace();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [activeConvertMessage, setActiveConvertMessage] = useState(null);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isChannel = chatType === 'channel';
  const targetId = isChannel ? activeChannel?.id : activeConversation?.id;

  // Load message history
  useEffect(() => {
    if (!targetId) return;
    setLoading(true);

    const queryParam = isChannel ? `channel_id=${activeChannel.id}` : `conversation_id=${activeConversation.id}`;
    apiRequest(`/messages/?${queryParam}`)
      .then((data) => {
        setMessages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load messages", err);
        setLoading(false);
      });
  }, [targetId, isChannel]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!inputText.trim() && !attachmentPreview) || !targetId) return;

    const content = inputText.trim() || (attachmentPreview ? `[Attachment: ${attachmentPreview.name}]` : '');
    const currentReply = replyingTo;
    const currentAttachment = attachmentPreview;

    setInputText('');
    setReplyingTo(null);
    setAttachmentPreview(null);

    try {
      if (isChannel) {
        sendEvent('typing_stop', { channel_id: activeChannel.id });
      } else {
        sendEvent('typing_stop', { conversation_id: activeConversation.id });
      }

      const payload = {
        content,
        reply_to: currentReply ? currentReply.id : null,
        attachment_name: currentAttachment ? currentAttachment.name : '',
        attachment_url: currentAttachment ? currentAttachment.url : '',
      };

      if (isChannel) {
        payload.channel = activeChannel.id;
      } else {
        payload.conversation = activeConversation.id;
      }

      const newMsg = await apiRequest('/messages/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!targetId) return;

    if (isChannel) {
      sendEvent('typing_start', { channel_id: activeChannel.id });
    } else {
      sendEvent('typing_start', { conversation_id: activeConversation.id });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isChannel) {
        sendEvent('typing_stop', { channel_id: activeChannel.id });
      } else {
        sendEvent('typing_stop', { conversation_id: activeConversation.id });
      }
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
    if (result.source_message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === result.source_message.id ? result.source_message : m))
      );
    }
  };

  const handleSimulateAttachment = () => {
    // Quick demonstration attachment helper
    setAttachmentPreview({
      name: 'mine_hazard_telemetry_schema.json',
      type: 'json',
      url: '#'
    });
    inputRef.current?.focus();
  };

  if (!targetId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted bg-bg-main">
        <Hash className="h-12 w-12 text-border-subtle mb-3" />
        <h3 className="text-base font-semibold text-text-primary">No Conversation Selected</h3>
        <p className="text-xs text-text-secondary mt-1">
          Pick a channel or start a direct message to begin talking.
        </p>
      </div>
    );
  }

  const typingUser = typingUsers[isChannel ? activeChannel?.id : activeConversation?.id];

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-main overflow-hidden relative">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-text-muted">
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-muted py-12">
            <div className="h-12 w-12 rounded-2xl bg-bg-surface flex items-center justify-center text-brand-primary mb-3 shadow-md shadow-brand-primary/10">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-text-primary">
              {isChannel ? `Welcome to #${activeChannel.name}!` : 'Start of direct conversation'}
            </h4>
            <p className="text-xs text-text-secondary max-w-sm mt-1 leading-relaxed">
              {isChannel
                ? 'This is the start of the channel. Send a message, brainstorm an idea, or plan your next move.'
                : 'Say hello and start collaborating one-on-one.'}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender.id === user?.id;

            return (
              <div
                key={msg.id}
                className="group relative flex gap-3 p-2 -mx-2 rounded-md hover:bg-bg-hover/60 transition-colors"
              >
                {/* Sender Avatar */}
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-primary to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm uppercase">
                  {msg.sender.username.substring(0, 2)}
                </div>

                {/* Message Body */}
                <div className="flex-1 min-w-0">
                  {/* Quoted Reply Context */}
                  {msg.reply_to_content && (
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-1 pl-2 border-l-2 border-brand-primary/60">
                      <CornerUpLeft className="h-3 w-3 text-brand-secondary" />
                      <span className="font-semibold text-text-secondary">@{msg.reply_to_content.sender}:</span>
                      <span className="truncate italic">"{msg.reply_to_content.content}"</span>
                    </div>
                  )}

                  {/* Header: Sender & Timestamp */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-bold text-text-primary">
                      {msg.sender.first_name ? `${msg.sender.first_name} ${msg.sender.last_name || ''}` : msg.sender.username}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Content Bubble / Text */}
                  <div className="text-[14px] text-text-primary leading-relaxed break-words whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* Attachment Preview (if any) */}
                  {msg.attachment_name && (
                    <div className="mt-2 inline-flex items-center gap-2 p-2.5 rounded-md bg-bg-surface border border-border-subtle text-xs text-brand-secondary">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium truncate max-w-xs">{msg.attachment_name}</span>
                    </div>
                  )}

                  {/* SIGNATURE FEATURE: Message Converted to Task Badge */}
                  {msg.is_converted_to_task && (
                    <div
                      onClick={() => {
                        if (onNavigateToTask) onNavigateToTask();
                        else setActiveSection('projects');
                      }}
                      className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-brand-500/10 border border-brand-primary/30 text-brand-primary text-xs cursor-pointer hover:bg-brand-500/20 transition-colors"
                      title="View on Kanban board"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-brand-secondary shrink-0" />
                      <span>Converted to Task:</span>
                      <strong className="font-semibold text-text-primary">
                        {msg.converted_task?.title || 'Active Task'}
                      </strong>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-primary/20 text-brand-secondary">
                        {msg.converted_task?.status || 'todo'}
                      </span>
                      <ExternalLink className="h-3 w-3 text-text-muted" />
                    </div>
                  )}

                  {/* Reactions Bar */}
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
                                ? 'bg-brand-primary/20 border-brand-primary/50 text-text-primary font-semibold'
                                : 'bg-bg-surface border-border-subtle text-text-secondary hover:bg-bg-hover'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px]">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Floating Modern Action Menu */}
                <div className="absolute right-3 -top-3.5 hidden group-hover:flex items-center bg-bg-surface border border-border-subtle rounded-md shadow-xl p-1 gap-1 z-10">
                  {/* Signature Feature: Convert to Task Button */}
                  <button
                    onClick={() => setActiveConvertMessage(msg)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-brand-primary hover:bg-brand-hover text-white shadow-sm transition-colors"
                    title="Convert Message into Task"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>Convert to Task</span>
                  </button>

                  {/* Reply Action */}
                  <button
                    onClick={() => {
                      setReplyingTo(msg);
                      inputRef.current?.focus();
                    }}
                    className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                    title="Reply to message"
                  >
                    <CornerUpLeft className="h-3.5 w-3.5" />
                  </button>

                  {/* Emoji Reaction Toggle */}
                  <button
                    onClick={() =>
                      setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)
                    }
                    className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                    title="Add reaction"
                  >
                    <Smile className="h-3.5 w-3.5" />
                  </button>

                  {/* Quick Emoji Dropdown */}
                  {showEmojiPickerFor === msg.id && (
                    <div className="absolute right-0 top-8 bg-bg-surface border border-border-subtle rounded-md shadow-2xl p-1.5 flex gap-1 z-20">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className="h-7 w-7 rounded hover:bg-bg-hover flex items-center justify-center text-sm transition-transform hover:scale-125"
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
        <div className="px-6 py-1 text-[11px] text-text-secondary italic bg-bg-main/80 flex items-center gap-1.5">
          <span className="flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-brand-primary animate-bounce" />
            <span className="h-1 w-1 rounded-full bg-brand-primary animate-bounce [animation-delay:0.2s]" />
            <span className="h-1 w-1 rounded-full bg-brand-primary animate-bounce [animation-delay:0.4s]" />
          </span>
          <span><strong className="text-text-primary font-semibold">{typingUser}</strong> is typing...</span>
        </div>
      )}

      {/* Modern Composer Area */}
      <div className="p-3 sm:p-4 px-4 sm:px-6 border-t border-border-subtle bg-bg-main shrink-0">
        {/* Reply Quote Banner */}
        {replyingTo && (
          <div className="mb-2 p-2 rounded-md bg-bg-surface border border-border-subtle flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <CornerUpLeft className="h-3.5 w-3.5 text-brand-secondary shrink-0" />
              <span className="text-text-muted">Replying to</span>
              <strong className="text-text-primary font-semibold">@{replyingTo.sender.username}:</strong>
              <span className="text-text-secondary truncate italic">"{replyingTo.content}"</span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 text-text-muted hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Attachment preview banner */}
        {attachmentPreview && (
          <div className="mb-2 p-2 rounded-md bg-bg-surface border border-border-subtle flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-brand-secondary">
              <FileText className="h-4 w-4" />
              <span className="font-medium">{attachmentPreview.name}</span>
            </div>
            <button
              onClick={() => setAttachmentPreview(null)}
              className="p-1 text-text-muted hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Composer Input Bar */}
        <div className="flex items-center gap-2 bg-bg-surface border border-border-subtle rounded-md px-3 py-2 focus-within:border-brand-primary transition-all shadow-inner">
          {/* Attachment button */}
          <button
            type="button"
            onClick={handleSimulateAttachment}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors shrink-0"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Text Input */}
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isChannel
                ? `Message #${activeChannel.name}...`
                : 'Send a direct message...'
            }
            className="flex-1 bg-transparent text-xs text-text-primary placeholder-text-muted focus:outline-none resize-none py-1 max-h-24"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputText.trim() && !attachmentPreview}
            className="h-8 w-8 rounded-md bg-brand-primary hover:bg-brand-hover disabled:opacity-30 disabled:hover:bg-brand-primary text-white flex items-center justify-center transition-all shadow-md shadow-brand-primary/20 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
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
