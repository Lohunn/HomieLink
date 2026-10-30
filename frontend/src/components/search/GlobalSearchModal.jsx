import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { apiRequest } from '../../api/client';
import {
  Search, X, Hash, MessageSquare, CheckSquare, Lightbulb, ArrowRight
} from 'lucide-react';

export default function GlobalSearchModal({ onClose, onSelectChannel, onSelectTask }) {
  const { activeWorkspace } = useWorkspace();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ channels: [], messages: [], tasks: [], ideas: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || !activeWorkspace) {
      setResults({ channels: [], messages: [], tasks: [], ideas: [] });
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      apiRequest(`/search/?workspace_id=${activeWorkspace.id}&q=${encodeURIComponent(query.trim())}`)
        .then((data) => {
          setResults(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Search failed", err);
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, activeWorkspace]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-800/40">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search channels, messages, tasks, and ideas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] bg-slate-800 border border-slate-700 text-slate-400 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-500">Searching workspace...</div>
          ) : query && !results.channels.length && !results.messages.length && !results.tasks.length && !results.ideas.length ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No results found for "{query}"
            </div>
          ) : (
            <>
              {/* Channels */}
              {results.channels?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Channels
                  </h4>
                  <div className="space-y-1">
                    {results.channels.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectChannel(c);
                          onClose();
                        }}
                        className="p-2 rounded-xl hover:bg-slate-800 flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-white">
                          <Hash className="h-4 w-4 text-slate-400" />
                          #{c.name}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {results.tasks?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Tasks
                  </h4>
                  <div className="space-y-1">
                    {results.tasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onSelectTask(t);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-800 flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-emerald-400" />
                          <div>
                            <div className="text-xs font-semibold text-white">{t.title}</div>
                            <div className="text-[10px] text-slate-400">
                              {t.project_name} • Status: {t.status}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {results.messages?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Messages
                  </h4>
                  <div className="space-y-1">
                    {results.messages.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-xl hover:bg-slate-800 flex items-start gap-2.5 cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[11px] font-semibold text-white">
                            @{m.sender.username} in #{m.channel ? 'channel' : 'chat'}
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-1">{m.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ideas */}
              {results.ideas?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Ideas
                  </h4>
                  <div className="space-y-1">
                    {results.ideas.map((i) => (
                      <div
                        key={i.id}
                        className="p-2.5 rounded-xl hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <Lightbulb className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-medium text-white">{i.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
