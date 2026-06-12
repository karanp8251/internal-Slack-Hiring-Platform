import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users } from 'lucide-react';

const ResourceMatrix = () => {
  const [usersList, setUsersList] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [filterSkill, setFilterSkill] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const res = await api.get('/api/users');
      setUsersList(res.data);
    } catch (err) {
      console.error('Failed to load resources', err);
    } finally {
      setLoadingResources(false);
    }
  };

  const filteredUsers = filterSkill
    ? usersList.filter(u => u.skills.some(sk => sk.skillName.toLowerCase().includes(filterSkill.toLowerCase())))
    : usersList;

  return (
    <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 text-left rounded-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 font-serif flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>Resource Availability Matrix</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Live database of all employee availability, skill vectors, and active allocations.</p>
        </div>
        <div className="w-full sm:w-64">
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500"
            placeholder="Search by skill (e.g. Java, Python)..."
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
          />
        </div>
      </div>

      {loadingResources ? (
        <div className="text-center text-slate-400 text-xs italic py-8">Loading resources list...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center text-slate-400 text-xs italic py-8">No employees match this filter.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 bg-slate-50/70 text-slate-500 text-[10px] uppercase tracking-wider font-extrabold">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4 border-l border-slate-100">Department</th>
                <th className="py-3 px-4 border-l border-slate-100">Availability</th>
                <th className="py-3 px-4 border-l border-slate-100">Skill Set & Proficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredUsers.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/30">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{emp.name}</div>
                    <div className="text-slate-500 text-[10px] font-medium">{emp.email}</div>
                  </td>
                  <td className="py-3 px-4 border-l border-slate-100 font-semibold text-slate-650">{emp.departmentName || 'N/A'}</td>
                  <td className="py-3 px-4 border-l border-slate-100">
                    <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-lg ${
                      emp.availabilityStatus === 'AVAILABLE'
                        ? 'bg-teal-50 border-teal-200 text-teal-700'
                        : emp.availabilityStatus === 'PARTIALLY_AVAILABLE'
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      {emp.availabilityStatus ? emp.availabilityStatus.replace('_', ' ') : 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-l border-slate-100">
                    <div className="flex flex-wrap gap-1.5">
                      {emp.skills && emp.skills.length > 0 ? (
                        emp.skills.map((sk, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-700 font-semibold">
                            {sk.skillName} <strong className="text-teal-700 text-[9px]">(L{sk.proficiency})</strong>
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">No skills declared</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


export default ResourceMatrix;
