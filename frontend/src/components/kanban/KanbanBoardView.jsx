import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { apiRequest } from '../../api/client';
import TaskDetailModal from './TaskDetailModal';
import CreateTaskModal from './CreateTaskModal';
import {
  FolderKanban, Plus, Filter, MessageSquareQuote, Calendar, Flag,
  CheckCircle2, ChevronRight, ChevronLeft, Search, CheckSquare
} from 'lucide-react';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'border-slate-700/60 bg-slate-900/40 text-slate-400' },
  { id: 'todo', title: 'To Do', color: 'border-sky-500/30 bg-sky-950/20 text-sky-400' },
  { id: 'in_progress', title: 'In Progress', color: 'border-amber-500/30 bg-amber-950/20 text-amber-400' },
  { id: 'review', title: 'Review', color: 'border-indigo-500/30 bg-indigo-950/20 text-indigo-400' },
  { id: 'done', title: 'Done', color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' },
];

const PRIORITY_BADGES = {
  low: { label: 'Low', color: 'bg-slate-800 text-slate-400 border-slate-700' },
  medium: { label: 'Med', color: 'bg-blue-950/60 text-blue-300 border-blue-500/30' },
  high: { label: 'High', color: 'bg-amber-950/60 text-amber-300 border-amber-500/30' },
  urgent: { label: 'Urgent', color: 'bg-rose-950/60 text-rose-300 border-rose-500/30' },
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

  // Load tasks for active project
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <FolderKanban className="h-12 w-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-white">No Projects Yet</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Create a project to organize tasks and manage your Kanban workflow.
        </p>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium shadow-lg shadow-brand-600/30 transition-all flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Create First Project
        </button>

        {showNewProjectModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left">
              <h3 className="text-base font-bold text-white mb-3">Create Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Project name (e.g. Telemetry Dashboard)"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <textarea
                  rows={2}
                  placeholder="Description (optional)"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-medium"
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
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Subheader: Project Selector, Progress Bar & Filters */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Project switcher */}
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-brand-400" />
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                const found = projects.find((p) => p.id === parseInt(e.target.value, 10));
                if (found) setActiveProject(found);
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="Add Project"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Progress overview */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {progressPct}% ({completedCount}/{tasks.length})
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3 w-3 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/80 rounded-lg pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 w-36"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={() => setCreateModalColumn('todo')}
            className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium shadow-sm transition-all flex items-center gap-1"
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
                className="flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 shadow-sm"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{col.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setCreateModalColumn(col.id)}
                    className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
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
                        className="group bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl p-3.5 cursor-pointer shadow-sm hover:shadow-md transition-all relative"
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
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-brand-300 bg-brand-950/70 border border-brand-500/30 px-1.5 py-0.5 rounded">
                              <MessageSquareQuote className="h-2.5 w-2.5 text-brand-400" />
                              From Chat
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-2 mb-2">
                          {t.title}
                        </h4>

                        {/* Footer: Assignee & Date & Column Quick-Move Controls */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/40">
                          <div className="flex items-center gap-1.5">
                            {t.assignee ? (
                              <div
                                className="h-5 w-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[9px] uppercase"
                                title={`Assigned to ${t.assignee.username}`}
                              >
                                {t.assignee.username.substring(0, 2)}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Unassigned</span>
                            )}
                            {t.due_date && (
                              <span className="flex items-center gap-0.5 text-slate-400">
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
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                                title="Move left"
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                onClick={(e) => handleMoveStatus(e, t, 'next')}
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
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
                    <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center text-[11px] text-slate-600">
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
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-3">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Telemetry Dashboard"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Goals and milestones..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-medium shadow-md"
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

