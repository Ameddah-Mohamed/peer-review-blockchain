import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { mockAdapter } from '../../services/mockAdapter';
import { User, UserRole } from '../../types';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import {
  Search,
  Edit2,
  Check,
  X,
  RefreshCw,
  Building,
  Mail,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { showToast } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('author');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users, falling back to mock users:', err);
      try {
        const fallback = await mockAdapter.getAllUsers();
        setUsers(fallback);
      } catch (mockErr) {
        console.error('Mock fallback error:', mockErr);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUsers();
  };

  const handleRoleUpdate = async (userId: string) => {
    try {
      await adminService.updateUserRole(userId, selectedRole);
      showToast('success', 'Role Updated', `User permissions changed to ${selectedRole}.`);
      setEditingUserId(null);
      loadUsers();
    } catch {
      showToast('error', 'Update Failed', 'Failed to update user role.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.pseudonymId.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const reviewersCount = users.filter((u) => u.role === 'reviewer').length;
  const authorsCount = users.filter((u) => u.role === 'author').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Governance Directory
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {users.length} Registered Identities
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Committee & Participant Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Inspect verified university affiliations, cryptographically assigned pseudonyms, and grant reviewer or administrator permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Sync Directory
          </Button>
        </div>
      </div>

      {/* Role Distribution Ribbon */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-slate-500">Total Participants</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{users.length}</div>
            <div className="text-[11px] text-slate-400">All registered conference accounts</div>
          </div>
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-slate-500">Peer Reviewers</div>
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">{reviewersCount}</div>
            <div className="text-[11px] text-slate-400">Qualified academic evaluators</div>
          </div>
          <div className="p-4 space-y-1">
            <div className="text-xs font-medium text-slate-500">Authors</div>
            <div className="text-2xl font-bold text-sky-600 tabular-nums">{authorsCount}</div>
            <div className="text-[11px] text-slate-400">Researchers & student submitters</div>
          </div>
          <div className="p-4 space-y-1 bg-slate-50/50">
            <div className="text-xs font-medium text-slate-500">Program Chairs</div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums">{adminCount}</div>
            <div className="text-[11px] text-slate-400">Editorial decision authorities</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, institutional email, or pseudonym..."
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium text-xs">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="reviewer">Reviewers ({reviewersCount})</option>
            <option value="author">Authors ({authorsCount})</option>
            <option value="admin">Administrators ({adminCount})</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading && users.length === 0 ? (
          <div className="py-12">
            <LoadingSpinner message="Loading user directory..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Identity & Email</th>
                  <th>Cryptographic Pseudonym</th>
                  <th>Affiliation</th>
                  <th>Conference Role</th>
                  <th>Registered</th>
                  <th className="text-right">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isEditing = editingUserId === u.id;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold shrink-0">
                            {u.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">{u.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {u.pseudonymId}
                        </span>
                      </td>

                      <td>
                        <div className="text-xs text-slate-700 flex items-center gap-1.5 truncate max-w-xs">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{u.affiliation || 'Academic Institution'}</span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                            className="text-xs p-1 rounded border border-slate-300 bg-white"
                          >
                            <option value="author">Author</option>
                            <option value="reviewer">Reviewer</option>
                            <option value="admin">Administrator</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize border ${
                              u.role === 'admin'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : u.role === 'reviewer'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap text-xs text-slate-500 font-mono">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRoleUpdate(u.id)}
                              className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                              title="Save Changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setSelectedRole(u.role);
                            }}
                            leftIcon={<Edit2 className="w-3 h-3 text-slate-400" />}
                          >
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12">
                      <EmptyState
                        title="No users matched your query"
                        description="Try searching for another name or changing the role filter."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
