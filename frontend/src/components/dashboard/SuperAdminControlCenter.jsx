import React, { useState } from 'react';
import { createUser, updateUserRole, deleteUser } from '../../services/userService';
import { Shield, RefreshCw } from 'lucide-react';
import SlackIcon from '../SlackIcon';
import SecureInput from '../SecureInput';
import AdminLogsPanel from './AdminLogsPanel';

const SuperAdminControlCenter = ({
  user,
  fetchMetrics,
  usersList,
  departments,
  adminLogs,
  loading,
  onRefresh
}) => {
  // Employee Add Form State
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    role: 'ROLE_EMPLOYEE',
    departmentId: ''
  });

  // Slack settings State
  const [slackSettings, setSlackSettings] = useState({
    token: 'xoxb-mock-9812739812-738917298371-token',
    clientId: '12873891.127838912',
    channelName: '#engineering-hiring',
    status: 'CONNECTED'
  });

  const [formLoading, setFormLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await createUser(addForm);
      setMsg({ type: 'success', text: `Employee "${addForm.name}" created successfully!` });
      setAddForm({ name: '', email: '', role: 'ROLE_EMPLOYEE', departmentId: '' });
      onRefresh(true);
      fetchMetrics();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add employee.' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setMsg({ type: '', text: '' });
    try {
      await updateUserRole(userId, newRole);
      setMsg({ type: 'success', text: 'User role updated successfully!' });
      onRefresh(true);
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update user role.' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setMsg({ type: '', text: '' });
    try {
      await deleteUser(userId);
      setMsg({ type: 'success', text: 'User deleted successfully!' });
      onRefresh(true);
      fetchMetrics();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to delete user.' });
    }
  };

  const handleSaveSlackConfig = (e) => {
    e.preventDefault();
    setMsg({ type: 'success', text: 'Slack Workspace OAuth settings updated!' });
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 rounded-2xl gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-serif">Super Admin Control Center</h2>
          <p className="text-xs text-[#5a7682] mt-1 font-semibold">Manage system configuration, employees, roles, and view live audit trails.</p>
        </div>
        <button
          onClick={() => onRefresh(true)}
          disabled={loading}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-md shadow-slate-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-bold ${
          msg.type === 'success' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Employee Form */}
        <div className="lg:col-span-1 bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 rounded-2xl">
          <h3 className="text-base font-bold text-slate-800 font-serif mb-4">Add New Employee</h3>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Full Name</label>
              <SecureInput 
                type="text" 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-teal-500 font-medium"
                value={addForm.name}
                onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Email Address</label>
              <SecureInput 
                type="email" 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-teal-500 font-medium"
                value={addForm.email}
                onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Assign Role</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-teal-500 font-medium"
                value={addForm.role}
                onChange={e => setAddForm(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="ROLE_EMPLOYEE">Employee</option>
                <option value="ROLE_MANAGER">Project Manager</option>
                <option value="ROLE_HR">HR</option>
                <option value="ROLE_ADMIN">Admin</option>
                <option value="ROLE_SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Department</label>
              <select 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-teal-500 font-medium"
                value={addForm.departmentId}
                onChange={e => setAddForm(prev => ({ ...prev, departmentId: e.target.value }))}
              >
                <option value="">-- Select Department --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <button 
              type="submit" 
              disabled={formLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition cursor-pointer shadow-md shadow-slate-200"
            >
              {formLoading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Manage Slack Workspace Settings */}
        <div className="lg:col-span-1 bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-serif mb-4 flex items-center gap-2">
              <SlackIcon className="text-[#e01e5a] w-4.5 h-4.5" />
              <span>Slack Workspace Integration</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-semibold">Configure connection channels and OAuth settings for real-time alerts.</p>
            
            <form onSubmit={handleSaveSlackConfig} className="space-y-4 text-left">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Slack Bot OAuth Token</label>
                <SecureInput 
                  type="password" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  value={slackSettings.token}
                  onChange={e => setSlackSettings(prev => ({ ...prev, token: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Announcements Channel</label>
                <SecureInput 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none"
                  value={slackSettings.channelName}
                  onChange={e => setSlackSettings(prev => ({ ...prev, channelName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Workspace Connection</label>
                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-teal-50 text-teal-750 border border-teal-100 mt-1">
                  🟢 {slackSettings.status}
                </span>
              </div>
            </form>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button 
              onClick={() => alert('Slack test signal sent successfully!')}
              className="flex-1 py-2 border border-slate-250 hover:bg-slate-55 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Test Signal
            </button>
            <button 
              onClick={() => setMsg({ type: 'success', text: 'Slack settings saved successfully.' })}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md shadow-slate-200"
            >
              Save Config
            </button>
          </div>
        </div>

        {/* System Audit logs */}
        <div className="lg:col-span-1">
          <AdminLogsPanel logs={adminLogs} loading={loading} />
        </div>
      </div>

      <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 rounded-2xl relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-800 font-serif">Users Role Administration</h3>
          {loading && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 bg-slate-50/70 text-slate-500 text-[10px] uppercase tracking-wider font-extrabold">
                <th className="py-3 px-4">User Info</th>
                <th className="py-3 px-4 border-l border-slate-100">Role Configuration</th>
                <th className="py-3 px-4 border-l border-slate-100">Department</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {usersList.length === 0 && !loading ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400 italic">No users found.</td>
                </tr>
              ) : (
                usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/30">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-slate-500 text-[10px] font-semibold">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 border-l border-slate-100">
                      <select
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-850 outline-none focus:border-teal-500 font-medium"
                        value={u.role}
                        disabled={loading}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="ROLE_EMPLOYEE">EMPLOYEE</option>
                        <option value="ROLE_MANAGER">MANAGER</option>
                        <option value="ROLE_HR">HR</option>
                        <option value="ROLE_ADMIN">ADMIN</option>
                        <option value="ROLE_SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 border-l border-slate-100 font-semibold text-slate-650">{u.departmentName || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        disabled={u.id === user.userId || loading}
                        onClick={() => handleDeleteUser(u.id)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl disabled:opacity-30 transition cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                        title="Delete User"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default SuperAdminControlCenter;
