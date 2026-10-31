import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import {
  Users, UserPlus, Shield, ShieldAlert, ShieldCheck, UserCheck,
  Search, CheckCircle2, X
} from 'lucide-react';

export default function MembersView() {
  const { activeWorkspace, members, refreshDetails } = useWorkspace();
  const { user } = useAuth();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRole, setSelectedRole] = useState('member');
  const [searching, setSearching] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  const isOwner = activeWorkspace?.my_role === 'owner';
  const isAdmin = activeWorkspace?.my_role === 'admin' || isOwner;

  const handleSearchUsers = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await apiRequest(`/auth/users/search/?q=${encodeURIComponent(q)}`);
      const existingUserIds = new Set(members.map((m) => m.user.id));
      setSearchResults(results.filter((u) => !existingUserIds.has(u.id)));
    } catch (err) {
      console.error("Failed to search users", err);
    } finally {
      setSearching(false);
    }
  };

  const handleInviteUser = async (targetUserId) => {
    try {
      await apiRequest(`/workspaces/${activeWorkspace.id}/invite_member/`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: targetUserId,
          role: selectedRole
        })
      });
      setInviteSuccess('User invited successfully!');
      refreshDetails();
      setTimeout(() => {
        setInviteSuccess('');
        setShowInviteModal(false);
        setSearchQuery('');
        setSearchResults([]);
      }, 1200);
    } catch (err) {
      console.error("Failed to invite user", err);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await apiRequest(`/workspaces/${activeWorkspace.id}/update_member_role/`, {
        method: 'PATCH',
        body: JSON.stringify({
          member_id: memberId,
          role: newRole
        })
      });
      refreshDetails();
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-main overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 border-b border-border-subtle flex items-center justify-between bg-bg-main shrink-0">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-primary" />
          <h2 className="text-sm font-bold text-text-primary">
            Workspace Members ({members.length})
          </h2>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-hover text-white rounded-md text-xs font-semibold shadow-md shadow-brand-primary/20 transition-all flex items-center gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Members Table */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        <div className="bg-bg-sidebar border border-border-subtle rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-surface text-text-muted font-semibold border-b border-border-subtle uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined</th>
                {isOwner && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-bg-hover transition-colors">
                  <td className="py-3 px-4 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-primary to-indigo-600 flex items-center justify-center font-bold text-white text-[11px] uppercase shadow-sm">
                      {m.user.username.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary">
                        {m.user.first_name ? `${m.user.first_name} ${m.user.last_name || ''}` : m.user.username}
                        {m.user.id === user?.id && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-text-muted">@{m.user.username}</div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-text-secondary">{m.user.email}</td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        m.role === 'owner'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : m.role === 'admin'
                          ? 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/30'
                          : 'bg-bg-surface text-text-secondary border border-border-subtle'
                      }`}
                    >
                      {m.role === 'owner' && <Shield className="h-3 w-3" />}
                      {m.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
                      {m.role}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-text-muted">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </td>

                  {isOwner && (
                    <td className="py-3 px-4 text-right">
                      {m.role !== 'owner' ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          className="bg-bg-surface border border-border-subtle rounded px-2 py-1 text-[11px] text-text-primary focus:outline-none"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="guest">Guest</option>
                        </select>
                      ) : (
                        <span className="text-[10px] text-text-muted italic">Owner</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-bg-sidebar border border-border-subtle rounded-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-brand-primary" />
                Invite Teammate
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded text-text-muted hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {inviteSuccess && (
              <div className="mb-4 p-3 rounded-md bg-status-online/10 border border-status-online/30 text-status-online text-xs flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {inviteSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Search by username or email
                </label>
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="w-full bg-bg-surface border border-border-subtle rounded-md pl-9 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Assign Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
              </div>

              {/* Results list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pt-2">
                {searching ? (
                  <div className="text-xs text-text-muted text-center py-2">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="p-2.5 rounded-md bg-bg-surface border border-border-subtle flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-text-primary">
                          {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                        </div>
                        <div className="text-[10px] text-text-muted">@{u.username} • {u.email}</div>
                      </div>
                      <button
                        onClick={() => handleInviteUser(u.id)}
                        className="px-3 py-1 bg-brand-primary hover:bg-brand-hover text-white rounded-md text-xs font-semibold shadow-sm transition-all"
                      >
                        Invite
                      </button>
                    </div>
                  ))
                ) : searchQuery ? (
                  <div className="text-xs text-text-muted text-center py-2">No matching users found</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
