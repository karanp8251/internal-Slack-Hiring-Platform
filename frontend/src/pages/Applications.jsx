import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../services/projectService';
import { getApplicants, getInterview, updateApplicationStatus } from '../services/applicationService';
import { getAllUsers } from '../services/userService';
import { 
  Users, Check, X, Award, FileText, Calendar, 
  AlertTriangle, Clock, UserCheck
} from 'lucide-react';

const Applications = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Dynamic employee profiles
  const [employeeProfiles, setEmployeeProfiles] = useState({});
  // Interview scheduling data
  const [interviewData, setInterviewData] = useState({});
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchApplicants(selectedProjectId);
    } else {
      setApplicants([]);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
      if (res.data.length > 0) {
        setSelectedProjectId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load projects');
    }
  };

  const fetchApplicants = async (projectId) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getApplicants(projectId);
      const applicantsData = res.data;
      setApplicants(applicantsData);
      
      // Fetch dynamic user profiles
      const resUsers = await getAllUsers();
      const profilesMap = {};
      resUsers.data.forEach(u => {
        profilesMap[u.id] = {
          name: u.name,
          email: u.email,
          skills: u.skills.map(sk => `${sk.skillName} (L${sk.proficiency})`).join(', ') || 'No skills declared',
          availabilityStatus: u.availabilityStatus
        };
      });
      setEmployeeProfiles(profilesMap);

      // Fetch interview slots info for applicants
      const interviewPromises = applicantsData.map(app => 
        getInterview(app.id)
          .then(res => ({ appId: app.id, interview: res.status === 200 ? res.data : null }))
          .catch(() => ({ appId: app.id, interview: null }))
      );
      
      const interviewResults = await Promise.all(interviewPromises);
      const interviewMap = {};
      interviewResults.forEach(r => {
        if (r.interview) {
          interviewMap[r.appId] = r.interview;
        }
      });
      setInterviewData(interviewMap);

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load applicants.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await updateApplicationStatus(applicationId, newStatus);
      
      setApplicants(prev => prev.map(app => app.id === applicationId ? res.data : app));
      setSuccessMsg(`Candidate application has been successfully updated to ${newStatus}!`);
      
      if (selectedProjectId) {
        fetchApplicants(selectedProjectId);
      }
    } catch (err) {
      setErrorMsg('Failed to update candidate status.');
    } finally {
      setActionLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-teal-700';
    if (score >= 50) return 'text-amber-700';
    return 'text-red-700';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SELECTED':
        return 'bg-teal-50 border border-teal-200 text-teal-700';
      case 'SHORTLISTED':
        return 'bg-indigo-50 border border-indigo-200 text-indigo-700';
      case 'REJECTED':
        return 'bg-red-50 border border-red-200 text-red-700';
      case 'UNDER_REVIEW':
        return 'bg-amber-50 border border-amber-200 text-amber-750';
      case 'APPLIED':
      default:
        return 'bg-slate-50 border border-slate-200 text-slate-500';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Messages */}
      {successMsg && (
        <div className="bg-teal-50 border border-teal-150 text-teal-800 text-xs p-4 rounded-xl flex items-center gap-3 font-semibold shadow-sm">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-150 text-red-800 text-xs p-4 rounded-xl flex items-center gap-3 font-semibold shadow-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-serif flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-605" />
            <span>Candidate Review Panel</span>
          </h2>
          <p className="text-[#5a7682] text-xs mt-1 font-semibold">Review candidates ranked by multi-factor AI Talent Match scores.</p>
        </div>

        <div className="flex gap-2.5 items-center w-full sm:w-auto">
          <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Filter Project:</label>
          <select
            className="w-full sm:w-64 bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-medium focus:border-teal-500"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">-- Select Project --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs italic">
          Fetching candidates database...
        </div>
      ) : applicants.length === 0 ? (
        <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-12 text-center rounded-2xl">
          <FileText className="w-12 h-12 text-slate-350 mx-auto mb-4" />
          <h3 className="text-slate-800 font-serif font-bold">No candidates found</h3>
          <p className="text-[#5a7682] text-xs mt-1">No applications have been submitted for this project role yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-[#5a7682] text-[10px] font-bold uppercase tracking-widest pl-1">
            Applicants List ({applicants.length})
          </h3>

          <div className="space-y-4">
            {applicants.map((app) => {
              const empProfile = employeeProfiles[app.employeeId] || { 
                name: 'Employee ID: ' + app.employeeId, 
                email: 'employee_' + app.employeeId + '@company.com',
                skills: 'Loading...',
                availabilityStatus: 'AVAILABLE'
              };

              const interview = interviewData[app.id];
              const isShortlisted = app.status === 'SHORTLISTED';
              const hasConflict = empProfile.availabilityStatus !== 'AVAILABLE';

              return (
                <div key={app.id} className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-2xl">
                  {/* Left Section: Profile detail */}
                  <div className="space-y-3 flex-1 text-left">
                    <div className="flex flex-wrap gap-2.5 items-center">
                      <h4 className="text-slate-800 font-bold text-base leading-tight font-serif">{empProfile.name}</h4>
                      <span className="text-xs text-slate-450 font-semibold">({empProfile.email})</span>
                      <span className={`px-2.5 py-0.5 border text-[9px] font-bold rounded-lg uppercase ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800">
                      <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1 text-[9px]">Listed Skills:</span>
                      <p className="text-slate-600 font-semibold">{empProfile.skills}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3.5 text-xs text-slate-700 leading-relaxed max-w-2xl font-medium rounded-xl">
                      <span className="text-slate-800 font-bold block mb-1 font-serif">AI Match analysis:</span>
                      <p className="italic">"{app.matchReason || 'Calculating Match Reasoning factors...'}"</p>
                    </div>

                    {/* Google Calendar Interview Info */}
                    {isShortlisted && (
                      <div className="pt-1">
                        {interview ? (
                          <div className="px-3 py-2.5 bg-teal-50/50 border border-teal-150 text-teal-850 text-xs rounded-xl flex items-center gap-2 font-bold shadow-sm">
                            <Calendar className="w-4 h-4 text-teal-700" />
                            <span>📅 Interview Scheduled: {new Date(interview.scheduledAt).toLocaleString()} (GCal ID: {interview.googleEventId})</span>
                          </div>
                        ) : (
                          <div className="px-3 py-2.5 bg-amber-50/65 border border-amber-150 text-amber-800 text-xs rounded-xl flex items-center gap-2 font-bold shadow-sm">
                            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                            <span>⏳ Waiting for candidate to select booking slot via Slack Bot DM...</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Conflict detection alert */}
                    {hasConflict && app.status !== 'SELECTED' && (
                      <div className="px-3 py-2.5 bg-red-50/65 border border-red-155 text-red-850 text-xs rounded-xl flex items-center gap-2 font-bold shadow-sm">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>⚠️ Conflict Warning: Candidate is currently {empProfile.availabilityStatus.replace('_', ' ')}. Confirming selection will override status to BUSY.</span>
                      </div>
                    )}
                  </div>

                  {/* Right Section: Action and Match Percentage */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-4 shrink-0 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[#5a7682] text-[9px] uppercase font-bold tracking-widest block">AI Match Score</span>
                        <span className={`text-2xl font-black block font-serif ${getScoreColor(app.matchScore)}`}>
                          {app.matchScore}%
                        </span>
                      </div>
                      <div className="w-11 h-11 bg-slate-50 border border-slate-200 flex items-center justify-center rounded-xl shadow-sm">
                        <Award className={`w-5 h-5 ${app.matchScore >= 80 ? 'text-teal-600' : 'text-slate-400'}`} />
                      </div>
                    </div>

                    {/* Review Actions */}
                    <div className="flex gap-2 w-full sm:w-auto">
                      {['ROLE_MANAGER', 'ROLE_HR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].includes(user.role) && ['APPLIED', 'PENDING'].includes(app.status) && (
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'SHORTLISTED')}
                          disabled={actionLoading}
                          className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 border-none shadow-sm cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Shortlist Candidate</span>
                        </button>
                      )}

                      {['ROLE_MANAGER', 'ROLE_HR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN'].includes(user.role) && ['APPLIED', 'PENDING', 'SHORTLISTED', 'UNDER_REVIEW'].includes(app.status) && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'SELECTED')}
                            disabled={actionLoading}
                            className="w-full sm:w-auto px-4 py-2 bg-teal-650 hover:bg-teal-500 disabled:opacity-50 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 border-none shadow-sm cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Select Candidate</span>
                          </button>
                          
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                            disabled={actionLoading}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-50 text-red-650 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
