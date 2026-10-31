import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import {
  Lightbulb, CheckCircle2, ThumbsUp, Plus, Vote, Sparkles, X, MessageSquare
} from 'lucide-react';

export default function IdeasAndPollsView() {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();

  const [ideas, setIdeas] = useState([]);
  const [polls, setPolls] = useState([]);
  const [activeTab, setActiveTab] = useState('ideas'); // 'ideas' | 'polls'
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaDesc, setNewIdeaDesc] = useState('');
  const [newIdeaCategory, setNewIdeaCategory] = useState('General');

  const [showPollModal, setShowPollModal] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const loadData = () => {
    if (!activeWorkspace) return;
    setLoading(true);

    Promise.all([
      apiRequest(`/ideas/?workspace_id=${activeWorkspace.id}`),
      apiRequest(`/polls/?workspace_id=${activeWorkspace.id}`)
    ])
      .then(([ideasData, pollsData]) => {
        setIdeas(ideasData);
        setPolls(pollsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load ideas and polls", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [activeWorkspace]);

  const handleUpvoteIdea = async (ideaId) => {
    try {
      const updated = await apiRequest(`/ideas/${ideaId}/upvote/`, {
        method: 'POST'
      });
      setIdeas((prev) => prev.map((i) => (i.id === ideaId ? updated : i)));
    } catch (err) {
      console.error("Failed to upvote", err);
    }
  };

  const handleCreateIdea = async (e) => {
    e.preventDefault();
    if (!newIdeaTitle.trim()) return;

    try {
      const created = await apiRequest('/ideas/', {
        method: 'POST',
        body: JSON.stringify({
          workspace: activeWorkspace.id,
          title: newIdeaTitle.trim(),
          description: newIdeaDesc.trim(),
          category: newIdeaCategory
        })
      });
      setIdeas((prev) => [created, ...prev]);
      setNewIdeaTitle('');
      setNewIdeaDesc('');
      setShowIdeaModal(false);
    } catch (err) {
      console.error("Failed to create idea", err);
    }
  };

  const handleVotePoll = async (pollId, optionId) => {
    try {
      const updated = await apiRequest(`/polls/${pollId}/vote/`, {
        method: 'POST',
        body: JSON.stringify({ option_id: optionId })
      });
      setPolls((prev) => prev.map((p) => (p.id === pollId ? updated : p)));
    } catch (err) {
      console.error("Failed to vote", err);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    const validOptions = pollOptions.filter((opt) => opt.trim());
    if (!newPollQuestion.trim() || validOptions.length < 2) return;

    try {
      const created = await apiRequest('/polls/', {
        method: 'POST',
        body: JSON.stringify({
          workspace: activeWorkspace.id,
          question: newPollQuestion.trim(),
          options: validOptions
        })
      });
      setPolls((prev) => [created, ...prev]);
      setNewPollQuestion('');
      setPollOptions(['', '']);
      setShowPollModal(false);
    } catch (err) {
      console.error("Failed to create poll", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-main overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 px-6 border-b border-border-subtle flex items-center justify-between bg-bg-main shrink-0">
        <div className="flex items-center gap-1.5 p-1 bg-bg-surface rounded-md border border-border-subtle">
          <button
            onClick={() => setActiveTab('ideas')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'ideas'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Idea Board ({ideas.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('polls')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'polls'
                ? 'bg-brand-secondary text-slate-950 shadow-sm font-bold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Vote className="h-3.5 w-3.5" />
            <span>Team Polls ({polls.length})</span>
          </button>
        </div>

        <button
          onClick={() => (activeTab === 'ideas' ? setShowIdeaModal(true) : setShowPollModal(true))}
          className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-hover text-white rounded-md text-xs font-semibold shadow-md shadow-brand-primary/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{activeTab === 'ideas' ? 'Share Idea' : 'Create Poll'}</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'ideas' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="bg-bg-sidebar border border-border-subtle rounded-lg p-5 flex flex-col justify-between hover:border-brand-primary/40 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                      {idea.category || 'General'}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      by @{idea.created_by?.username}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-text-primary mb-2">{idea.title}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    {idea.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                  <button
                    onClick={() => handleUpvoteIdea(idea.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      idea.has_upvoted
                        ? 'bg-brand-primary text-white border-brand-primary font-bold shadow-md shadow-brand-primary/20'
                        : 'bg-bg-surface text-text-secondary border-border-subtle hover:bg-bg-hover hover:text-text-primary'
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{idea.upvotes_count || 0} Upvotes</span>
                  </button>
                  <span className="text-[10px] text-text-muted">
                    {new Date(idea.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}

            {ideas.length === 0 && (
              <div className="col-span-full py-16 text-center text-text-muted">
                <Lightbulb className="h-10 w-10 mx-auto text-border-subtle mb-2" />
                <p className="text-sm font-medium">No brainstorm ideas yet.</p>
                <p className="text-xs text-text-muted mt-1">Be the first to share a thought with the team!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {polls.map((poll) => {
              const totalVotes = poll.total_votes || 1;

              return (
                <div
                  key={poll.id}
                  className="bg-bg-sidebar border border-border-subtle rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-brand-secondary">Team Poll</span>
                    <span className="text-[10px] text-text-muted">
                      Created by @{poll.created_by?.username}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text-primary mb-4">{poll.question}</h3>

                  <div className="space-y-2.5">
                    {poll.options?.map((opt) => {
                      const votePct = Math.round((opt.votes_count / (poll.total_votes || 1)) * 100);

                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleVotePoll(poll.id, opt.id)}
                          className={`relative overflow-hidden rounded-md border p-3 cursor-pointer transition-all ${
                            opt.has_voted
                              ? 'border-brand-primary bg-brand-primary/10 text-text-primary'
                              : 'border-border-subtle bg-bg-surface hover:bg-bg-hover text-text-secondary'
                          }`}
                        >
                          {/* Percentage Fill Bar */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 opacity-20 pointer-events-none transition-all duration-500 ${
                              opt.has_voted ? 'bg-brand-primary' : 'bg-text-muted'
                            }`}
                            style={{ width: `${votePct}%` }}
                          />

                          <div className="relative z-10 flex items-center justify-between text-xs font-medium">
                            <span className="flex items-center gap-2">
                              {opt.has_voted && (
                                <CheckCircle2 className="h-4 w-4 text-brand-primary shrink-0" />
                              )}
                              {opt.label}
                            </span>
                            <span className="font-bold text-text-secondary">
                              {votePct}% ({opt.votes_count})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 text-[10px] text-text-muted text-right">
                    Total votes: {poll.total_votes || 0}
                  </div>
                </div>
              );
            })}

            {polls.length === 0 && (
              <div className="py-16 text-center text-text-muted">
                <Vote className="h-10 w-10 mx-auto text-border-subtle mb-2" />
                <p className="text-sm font-medium">No polls active.</p>
                <p className="text-xs text-text-muted mt-1">Create a quick poll to gather consensus.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Idea Modal */}
      {showIdeaModal && (
        <div className="fixed inset-0 z-50 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-bg-sidebar border border-border-subtle rounded-lg p-6">
            <h3 className="text-sm font-bold text-text-primary mb-3">Share New Idea</h3>
            <form onSubmit={handleCreateIdea} className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Add LoRa mesh networking for mine rover"
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">Category</label>
                <select
                  value={newIdeaCategory}
                  onChange={(e) => setNewIdeaCategory(e.target.value)}
                  className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none"
                >
                  <option value="General">General</option>
                  <option value="Robotics">Robotics</option>
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Design">Design</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Why is this idea valuable? How does it solve our problem?"
                  value={newIdeaDesc}
                  onChange={(e) => setNewIdeaDesc(e.target.value)}
                  className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIdeaModal(false)}
                  className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary text-white font-semibold rounded-md text-xs shadow-md"
                >
                  Post Idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-bg-sidebar border border-border-subtle rounded-lg p-6">
            <h3 className="text-sm font-bold text-text-primary mb-3">Create Team Poll</h3>
            <form onSubmit={handleCreatePoll} className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which sprint day works best for demo?"
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">Options</label>
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[idx] = e.target.value;
                        setPollOptions(next);
                      }}
                      className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                    />
                  ))}
                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-xs text-brand-secondary hover:underline font-medium flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add another option
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary text-white font-semibold rounded-md text-xs shadow-md"
                >
                  Create Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
