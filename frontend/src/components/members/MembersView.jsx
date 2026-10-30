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
      // Filter out users who are already members
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
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-400" />
          <h2 className="text-sm font-bold text-white">
            Workspace Members ({members.length})
          </h2>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-medium shadow-md transition-all flex items-center gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Members Table */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        <div className="bg-slate-800/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/60 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined</th>
                {isOwner && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-white text-[11px] uppercase shadow-sm">
                      {m.user.username.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {m.user.first_name ? `${m.user.first_name} ${m.user.last_name || ''}` : m.user.username}
                        {m.user.id === user?.id && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-500/20">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">@{m.user.username}</div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-300">{m.user.email}</td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        m.role === 'owner'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : m.role === 'admin'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {m.role === 'owner' && <Shield className="h-3 w-3" />}
                      {m.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
                      {m.role}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-400">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </td>

                  {isOwner && (
                    <td className="py-3 px-4 text-right">
                      {m.role !== 'owner' ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="guest">Guest</option>
                        </select>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Workspace Owner</span>
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
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-brand-400" />
                Invite Teammate
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {inviteSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {inviteSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Search by username or email
                </label>
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Assign Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
              </div>

              {/* Results list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pt-2">
                {searching ? (
                  <div className="text-xs text-slate-500 text-center py-2">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                        </div>
                        <div className="text-[10px] text-slate-400">@{u.username} • {u.email}</div>
                      </div>
                      <button
                        onClick={() => handleInviteUser(u.id)}
                        className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium shadow-sm transition-all"
                      >
                        Invite
                      </button>
                    </div>
                  ))
                ) : searchQuery ? (
                  <div className="text-xs text-slate-500 text-center py-2">No matching users found</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

