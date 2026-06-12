import React, { useState } from 'react';
import { createDepartment, deleteDepartment } from '../../services/reportService';
import { updateProject, deleteProject } from '../../services/projectService';
import { RefreshCw } from 'lucide-react';
import SecureInput from '../SecureInput';

const AdminPortal = ({
  user,
  departments,
  projectsList,
  usersList,
  loading,
  onRefresh
}) => {
  // Department Form State
  const [newDeptName, setNewDeptName] = useState('');
  
  // Project Edit State
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    openings: 1,
    status: 'OPEN',
    managerId: ''
  });

  const [msg, setMsg] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await createDepartment(newDeptName.trim());
      setMsg({ type: 'success', text: `Department "${newDeptName}" created!` });
      setNewDeptName('');
      onRefresh(true);
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to create department.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    setMsg({ type: '', text: '' });
    try {
      await deleteDepartment(id);
      setMsg({ type: 'success', text: 'Department deleted successfully.' });
      onRefresh(true);
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to delete department.' });
    }
  };

  const handleEditProject = (proj) => {
    setEditingProject(proj);
    setEditForm({
      title: proj.title,
      description: proj.description,
      openings: proj.openings,
      status: proj.status,
      managerId: proj.managerId || ''
    });
  };

  const handleUpdateProjectSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await updateProject(editingProject.id, {
        title: editForm.title,
        description: editForm.description,
        openings: parseInt(editForm.openings),
        status: editForm.status,
        managerId: editForm.managerId ? parseInt(editForm.managerId) : null
      }, user.userId);
      setMsg({ type: 'success', text: 'Project requirements & allocation updated!' });
      setEditingProject(null);
      onRefresh(true);
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update project.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    setMsg({ type: '', text: '' });
    try {
      await deleteProject(id, user.userId);
      setMsg({ type: 'success', text: 'Project deleted successfully.' });
      onRefresh(true);
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to delete project.' });
    }
  };

  // Managers for assignment dropdown
  const managers = usersList.filter(u => u.role === 'ROLE_MANAGER');

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 rounded-2xl gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-serif">Admin Portal</h2>
          <p className="text-xs text-[#5a7682] mt-1 font-semibold">Manage departments, view active project postings, and assign project managers.</p>
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

      {loading ? (
        <div className="text-center py-8 text-xs text-slate-400 italic">Fetching Admin Portal records...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Manage Departments Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 rounded-2xl">
              <h3 className="text-base font-bold text-slate-800 font-serif mb-3">Manage Departments</h3>
              <p className="text-xs text-slate-500 mb-4 font-semibold">Organize organizational units for team tagging and capacity funnels.</p>
              
              <form onSubmit={handleAddDept} className="flex gap-2 mb-4">
                <SecureInput
                  type="text"
                  required
                  placeholder="New Dept Name..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-teal-500 font-medium"
                  value={newDeptName}
                  onChange={e => setNewDeptName(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition shadow-sm"
                >
                  Add
                </button>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {departments.map(d => (
                  <div key={d.id} className="p-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">{d.name}</span>
                    <button
                      onClick={() => handleDeleteDept(d.id)}
                      className="text-[10px] text-red-650 hover:underline font-bold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Manage Projects / Assign Managers Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Project Edit Form (conditionally visible) */}
            {editingProject && (
              <div className="bg-white shadow-md shadow-slate-100 border border-teal-200 p-6 rounded-2xl">
                <h3 className="text-base font-bold text-slate-800 font-serif mb-4">Edit Project Specs & Manager</h3>
                <form onSubmit={handleUpdateProjectSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Project Title</label>
                      <SecureInput
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-teal-500 font-medium"
                        value={editForm.title}
                        onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Description</label>
                      <textarea
                        required
                        rows="2.5"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-teal-500 font-medium"
                        value={editForm.description}
                        onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Openings</label>
                      <SecureInput
                        type="number"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 outline-none focus:border-teal-500 font-medium"
                        value={editForm.openings}
                        onChange={e => setEditForm(prev => ({ ...prev, openings: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Status</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-855 outline-none focus:border-teal-500 font-medium"
                        value={editForm.status}
                        onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Assign Project Manager</label>
                      <select
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-855 outline-none focus:border-teal-500 font-medium"
                        value={editForm.managerId}
                        onChange={e => setEditForm(prev => ({ ...prev, managerId: e.target.value }))}
                      >
                        <option value="">-- Select Project Manager --</option>
                        {managers.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                    >
                      Save Specs
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Projects List with Admin controls */}
            <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 rounded-2xl">
              <h3 className="text-base font-bold text-slate-800 font-serif mb-4">Administrative Project Control</h3>
              <div className="space-y-4">
                {projectsList.map(p => {
                  const managerName = usersList.find(u => u.id === p.managerId)?.name || 'Unassigned';
                  return (
                    <div key={p.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex justify-between items-start gap-4">
                      <div className="text-left space-y-1">
                        <h4 className="font-bold text-slate-850 text-sm font-serif">{p.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">{p.description}</p>
                        <div className="text-[10px] font-semibold text-slate-500 pt-1 flex gap-3 uppercase tracking-wider">
                          <span>Openings: <strong className="text-slate-850">{p.openings}</strong></span>
                          <span>Manager: <strong className="text-slate-850">{managerName}</strong></span>
                          <span>Status: <strong className="text-teal-700">{p.status}</strong></span>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleEditProject(p)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider transition shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl text-[10px] font-bold uppercase tracking-wider transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};


export default AdminPortal;
