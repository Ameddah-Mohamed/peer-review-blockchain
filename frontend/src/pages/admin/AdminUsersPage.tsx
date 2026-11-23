import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { User, UserRole } from '../../types';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import {
  Search,
  UserCheck,
  Mail,
  Edit2,
  CheckCircle,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { showToast } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
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
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.pseudonymId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage academic identities, committee roles, and pseudonym mappings.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadUsers}>
          Refresh Users
        </Button>
      </div>

      {/* Filter and Search */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, institutional email, or pseudonym..."
              className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="all">All Roles</option>
              <option value="author">Authors (Students / Researchers)</option>
              <option value="reviewer">Reviewers (Professors / Experts)</option>
              <option value="admin">Administrators (Chairs)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader
          title={`Registered Users (${filteredUsers.length})`}
          description="Institutional affiliations and pseudonym IDs"
        />

        <CardBody className="p-0">
          {isLoading ? (
            <LoadingSpinner message="Loading registered users..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Pseudonym</th>
                    <th className="py-3 px-4">Affiliation</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                              className="text-xs p-1 border rounded bg-white"
                            >
                              <option value="author">Author</option>
                              <option value="reviewer">Reviewer</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleRoleUpdate(u.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'reviewer'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-brand-100 text-brand-800'
                            }`}
                          >
                            <UserCheck className="w-3 h-3" />
                            {u.role}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                          {u.pseudonymId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {u.affiliation || 'Academic Institution'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">{formatDate(u.createdAt)}</td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingUserId(u.id);
                            setSelectedRole(u.role);
                          }}
                          leftIcon={<Edit2 className="w-3 h-3" />}
                        >
                          Change Role
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
