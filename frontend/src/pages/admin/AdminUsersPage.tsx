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
  UserCheck,
  Mail,
  Edit2,
  Check,
  X,
  RefreshCw,
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

  const roleBadgeStyles: Record<UserRole, { badge: string; text: string }> = {
    admin: { badge: 'bg-slate-100 text-slate-800 border-slate-200', text: 'Administrator' },
    reviewer: { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80', text: 'Reviewer' },
    author: { badge: 'bg-slate-50 text-slate-700 border-slate-200', text: 'Author' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <span>ICDS 2026</span>
              <span>/</span>
              <span>Participants</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">Directory</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Users & Committee Directory
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Conference participants, institutional affiliations, double-blind pseudonym mappings, and committee role permissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, institutional email, or pseudonym..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="all">All Roles</option>
            <option value="author">Authors (Researchers / Students)</option>
            <option value="reviewer">Reviewers (Program Committee)</option>
            <option value="admin">Administrators (Chairs)</option>
          </select>

          <span className="text-xs font-mono text-slate-400 pl-2 border-l border-slate-200 tabular-nums">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </span>
        </div>
      </div>

      {/* Academic Users Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading registered directory..." />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No participants found"
              description="Adjust search keywords or reset active role filter."
              actionText="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setRoleFilter('all');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="academic-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Role</th>
                  <th>Double-Blind Pseudonym</th>
                  <th>Institutional Affiliation</th>
                  <th>Registered</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isEditing = editingUserId === u.id;
                  const roleStyle = roleBadgeStyles[u.role] || roleBadgeStyles.author;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="font-semibold text-slate-900 text-xs">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-300" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                              className="text-xs px-2 py-1 border border-slate-300 rounded bg-white text-slate-800"
                            >
                              <option value="author">Author</option>
                              <option value="reviewer">Reviewer</option>
                              <option value="admin">Administrator</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRoleUpdate(u.id)}
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                              title="Confirm Role"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${roleStyle.badge}`}
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>{roleStyle.text}</span>
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap">
                        <span className="font-mono text-xs bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {u.pseudonymId}
                        </span>
                      </td>

                      <td className="text-xs text-slate-600">
                        {u.affiliation || 'Department of Computer Science'}
                      </td>

                      <td className="text-xs text-slate-400 whitespace-nowrap tabular-nums">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="text-right whitespace-nowrap">
                        {!isEditing && (
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
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
