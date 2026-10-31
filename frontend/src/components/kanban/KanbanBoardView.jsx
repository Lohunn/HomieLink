import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { apiRequest } from '../../api/client';
import TaskDetailModal from './TaskDetailModal';
import CreateTaskModal from './CreateTaskModal';
import {
  FolderKanban, Plus, Filter, MessageSquareQuote, Calendar, Flag,
  CheckCircle2, ChevronRight, ChevronLeft, Search, CheckSquare, Sparkles
} from 'lucide-react';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'border-border-subtle bg-bg-surface/40 text-text-muted' },
  { id: 'todo', title: 'To Do', color: 'border-brand-secondary/30 bg-brand-secondary/5 text-brand-secondary' },
  { id: 'in_progress', title: 'In Progress', color: 'border-brand-primary/30 bg-brand-primary/5 text-brand-primary' },
  { id: 'review', title: 'Review', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
  { id: 'done', title: 'Done', color: 'border-status-online/30 bg-status-online/5 text-status-online' },
];

const PRIORITY_BADGES = {
  low: { label: 'Low', color: 'bg-bg-surface text-text-muted border-border-subtle' },
  medium: { label: 'Med', color: 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/30' },
  high: { label: 'High', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  urgent: { label: 'Urgent', color: 'bg-status-error/10 text-status-error border-status-error/30' },
};

export default function KanbanBoardView({ onJumpToChannel }) {
  const { activeWorkspace, projects, activeProject, setActiveProject, createProject } = useWorkspace();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createModalColumn, setCreateModalColumn] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const loadTasks = () => {
    if (!activeProject) return;
    setLoading(true);
    apiRequest(`/tasks/?project_id=${activeProject.id}`)
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load tasks", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTasks();
  }, [activeProject]);

  const handleMoveStatus = async (e, task, direction) => {
    e.stopPropagation();
    const colOrder = ['backlog', 'todo', 'in_progress', 'review', 'done'];
    const currentIndex = colOrder.indexOf(task.status);
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex < 0 || nextIndex >= colOrder.length) return;
    const newStatus = colOrder[nextIndex];

    try {
      const updated = await apiRequest(`/tasks/${task.id}/update_status/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const proj = await createProject(newProjectName.trim(), newProjectDesc.trim());
      setNewProjectName('');
      setNewProjectDesc('');
      setShowNewProjectModal(false);
      setActiveProject(proj);
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  // Filtered tasks
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (projects.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted bg-bg-main">
        <FolderKanban className="h-12 w-12 text-border-subtle mb-3" />
        <h3 className="text-base font-semibold text-text-primary">No Projects Yet</h3>
        <p className="text-xs text-text-secondary mt-1 mb-4">
          Create a project board to organize tasks converted from your chat conversations.
        </p>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="px-4 py-2 rounded-md bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold shadow-md shadow-brand-primary/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Create First Project
        </button>

        {showNewProjectModal && (
          <div className="fixed inset-0 z-50 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-bg-sidebar border border-border-subtle rounded-lg p-6 text-left">
              <h3 className="text-sm font-bold text-text-primary mb-3">Create Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Project name (e.g. Telemetry Dashboard)"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                />
                <textarea
                  rows={2}
                  placeholder="Description (optional)"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-brand-primary text-white rounded-md text-xs font-semibold"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-main overflow-hidden">
      {/* Subheader: Project Selector, Progress Bar & Filters */}
      <div className="px-6 py-3 border-b border-border-subtle bg-bg-main shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Project switcher */}
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-brand-primary" />
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                const found = projects.find((p) => p.id === parseInt(e.target.value, 10));
                if (found) setActiveProject(found);
              }}
              className="bg-bg-surface border border-border-subtle rounded-md px-2.5 py-1 text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-primary"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover"
              title="Add Project"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Progress overview */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border-subtle">
            <div className="w-24 h-1.5 bg-bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] text-text-muted font-medium">
              {progressPct}% ({completedCount}/{tasks.length})
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3 w-3 absolute left-2.5 top-2.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-bg-surface border border-border-subtle rounded-md pl-7 pr-2.5 py-1 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-primary w-36"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-bg-surface border border-border-subtle rounded-md px-2 py-1 text-xs text-text-secondary focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={() => setCreateModalColumn('todo')}
            className="px-3 py-1 bg-brand-primary hover:bg-brand-hover text-white rounded-md text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* 5 Column Kanban Grid */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="grid grid-cols-5 gap-4 min-w-[1000px] h-full items-start">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="flex flex-col h-full bg-bg-sidebar/80 border border-border-subtle rounded-lg p-3 shadow-sm"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">{col.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-bg-surface text-text-secondary">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setCreateModalColumn(col.id)}
                    className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                    title={`Add task to ${col.title}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Task Cards Column Stream */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {columnTasks.map((t) => {
                    const priorityBadge = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.medium;

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTask(t)}
                        className="group bg-bg-surface hover:bg-bg-hover border border-border-subtle rounded-md p-3 cursor-pointer shadow-sm hover:shadow-md transition-all relative"
                      >
                        {/* Priority & Source Badge */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${priorityBadge.color}`}
                          >
                            {priorityBadge.label}
                          </span>

                          {/* SIGNATURE FEATURE: CONVERTED FROM CHAT BADGE */}
                          {t.source_message && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-brand-primary bg-brand-primary/10 border border-brand-primary/30 px-1.5 py-0.5 rounded">
                              <Sparkles className="h-2.5 w-2.5 text-brand-secondary" />
                              From Chat
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-text-primary group-hover:text-brand-secondary transition-colors line-clamp-2 mb-2">
                          {t.title}
                        </h4>

                        {/* Footer: Assignee & Date & Quick-Move Controls */}
                        <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-border-subtle">
                          <div className="flex items-center gap-1.5">
                            {t.assignee ? (
                              <div
                                className="h-5 w-5 rounded-full bg-gradient-to-tr from-brand-primary to-indigo-600 text-white flex items-center justify-center font-bold text-[9px] uppercase"
                                title={`Assigned to ${t.assignee.username}`}
                              >
                                {t.assignee.username.substring(0, 2)}
                              </div>
                            ) : (
                              <span className="text-text-muted italic">Unassigned</span>
                            )}
                            {t.due_date && (
                              <span className="flex items-center gap-0.5 text-text-secondary">
                                <Calendar className="h-2.5 w-2.5" />
                                {t.due_date.slice(5)}
                              </span>
                            )}
                          </div>

                          {/* Quick move buttons */}
                          <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                            {col.id !== 'backlog' && (
                              <button
                                onClick={(e) => handleMoveStatus(e, t, 'prev')}
                                className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary"
                                title="Move left"
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                onClick={(e) => handleMoveStatus(e, t, 'next')}
                                className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary"
                                title="Move right"
                              >
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnTasks.length === 0 && (
                    <div className="border border-dashed border-border-subtle rounded-md p-4 text-center text-[11px] text-text-muted">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setSelectedTask(null);
          }}
          onJumpToChannel={onJumpToChannel}
        />
      )}

      {/* Create Task Modal */}
      {createModalColumn && (
        <CreateTaskModal
          initialStatus={createModalColumn}
          onClose={() => setCreateModalColumn(null)}
          onTaskCreated={(created) => {
            setTasks((prev) => [created, ...prev]);
            setCreateModalColumn(null);
          }}
        />
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-bg-sidebar border border-border-subtle rounded-lg p-6">
            <h3 className="text-sm font-bold text-text-primary mb-3">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Telemetry Dashboard"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Description (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Goals and milestones..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary text-white rounded-md text-xs font-semibold shadow-md"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
