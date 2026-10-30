import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { Bell, Check, CheckSquare, MessageSquareQuote, Users, X } from 'lucide-react';

export default function NotificationsPopover({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/notifications/')
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load notifications", err);
        setLoading(false);
      });
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/mark_all_read/', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await apiRequest(`/notifications/${id}/mark_read/`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col">
      <div className="p-3.5 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-brand-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Notifications
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] text-brand-400 hover:text-brand-300 font-medium"
          >
            Mark all read
          </button>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
        {loading ? (
          <div className="text-center py-6 text-xs text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No notifications yet</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n.id)}
              className={`p-2.5 rounded-xl text-xs flex items-start gap-2.5 cursor-pointer transition-colors ${
                n.is_read ? 'opacity-60 hover:opacity-100 hover:bg-slate-800/30' : 'bg-slate-800/60 hover:bg-slate-800'
              }`}
            >
              <div className="mt-0.5 h-6 w-6 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                {n.type === 'task_assigned' ? (
                  <CheckSquare className="h-3.5 w-3.5" />
                ) : n.type === 'workspace_invite' ? (
                  <Users className="h-3.5 w-3.5" />
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white truncate">{n.title}</span>
                  <span className="text-[9px] text-slate-500">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

