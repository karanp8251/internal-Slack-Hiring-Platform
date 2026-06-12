import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject } from '../services/projectService';
import { getUserProfile, addSkill } from '../services/userService';
import { applyToProject, getMyApplications } from '../services/applicationService';
import { 
  Plus, Check, Award, Briefcase, Calendar, Users, 
  AlertCircle, Star
} from 'lucide-react';
import SecureInput from '../components/SecureInput';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Create Project State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    openings: 1,
    deadline: '',
    durationMonths: 6,
    targetSlackChannel: '#general',
    skills: '' // comma-separated strings
  });

  // User skills state
  const [userProfile, setUserProfile] = useState(null);
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 5 });
  
  // Application tracking state
  const [myApplications, setMyApplications] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProjectsAndProfile();
  }, []);

  async function fetchProjectsAndProfile() {
    setLoading(true);
    setErrorMsg('');
    try {
      const projRes = await getProjects();
      const profileRes = await getUserProfile();
      setUserProfile(profileRes.data);

      if (user.role === 'ROLE_EMPLOYEE') {
        const appsRes = await getMyApplications();
        setMyApplications(appsRes.data);
      }

      setProjects(projRes.data);
      if (projRes.data.length > 0 && !selectedProject) {
        setSelectedProject(projRes.data[0]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load projects database.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const skillsList = createForm.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const payload = {
        ...createForm,
        openings: parseInt(createForm.openings),
        durationMonths: parseInt(createForm.durationMonths),
        skills: skillsList
      };

      const res = await createProject(payload, user.userId);
      setProjects(prev => [...prev, res.data]);
      setSelectedProject(res.data);
      setShowCreateModal(false);
      setSuccessMsg('Project created successfully and announced to Slack!');
      
      setCreateForm({
        title: '',
        description: '',
        openings: 1,
        deadline: '',
        durationMonths: 6,
        targetSlackChannel: '#general',
        skills: ''
      });
      
      fetchProjectsAndProfile();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSkillSubmit = async (e) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;
    setActionLoading(true);
    try {
      await addSkill(newSkill.name.trim(), parseInt(newSkill.proficiency));
      setNewSkill({ name: '', proficiency: 5 });
      await fetchProjectsAndProfile();
      setSuccessMsg('Skill added! Your AI match scores have been recalculated.');
    } catch (err) {
      setErrorMsg('Failed to add skill');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApply = async (projectId) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await applyToProject(projectId);
      setMyApplications(prev => [...prev, res.data]);
      setSuccessMsg(`Applied successfully! AI Match Score: ${res.data.matchScore}%`);
      fetchProjectsAndProfile();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Already applied or failed to submit application.');
    } finally {
      setActionLoading(false);
    }
  };

  const calculateLocalMatchScore = (project) => {
    if (!userProfile || !userProfile.skills || userProfile.skills.length === 0) return 0;
    
    const empSkillsSet = new Set(userProfile.skills.map(s => s.skillName.toLowerCase()));
    
    const title = project.title.toLowerCase();
    const desc = project.description.toLowerCase();
    
    let reqSkills = [];
    if (title.includes('java') || desc.includes('java')) reqSkills.push('java');
    if (title.includes('spring') || desc.includes('spring')) reqSkills.push('spring boot');
    if (title.includes('react') || desc.includes('react')) reqSkills.push('react');
    if (title.includes('python') || desc.includes('python')) reqSkills.push('python');
    if (title.includes('aws') || desc.includes('aws')) reqSkills.push('aws');
    if (title.includes('postgres') || desc.includes('postgres')) reqSkills.push('postgresql');
    if (title.includes('docker') || desc.includes('docker')) reqSkills.push('docker');

    if (reqSkills.length === 0) return 60;

    let intersection = reqSkills.filter(s => empSkillsSet.has(s));
    
    return Math.round((intersection.length / reqSkills.length) * 100);
  };

  const hasApplied = (projectId) => {
    return myApplications.some(app => app.projectId === projectId);
  };

  const getApplicationStatus = (projectId) => {
    const app = myApplications.find(app => app.projectId === projectId);
    return app ? app.status : null;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-teal-750 bg-teal-50 border-teal-200';
    if (score >= 50) return 'text-amber-750 bg-amber-50 border-amber-200';
    return 'text-red-750 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6 text-left">
      {/* Messages */}
      {successMsg && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 text-xs p-4 rounded-xl flex items-center gap-3 font-semibold shadow-sm">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-4 rounded-xl flex items-center gap-3 font-semibold shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Header */}
      <div className="flex justify-between items-center bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-serif flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-teal-650" />
            <span>Project Openings</span>
          </h2>
          <p className="text-[#5a7682] text-xs mt-1 font-semibold">Browse open project openings or post new requests.</p>
        </div>
        
        {['ROLE_MANAGER', 'ROLE_SUPER_ADMIN'].includes(user.role) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-md shadow-slate-200"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs italic">
          Loading project portal...
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-12 text-center rounded-2xl">
          <Briefcase className="w-12 h-12 text-slate-350 mx-auto mb-4" />
          <h3 className="text-slate-800 font-serif font-bold">No projects found</h3>
          <p className="text-[#5a7682] text-xs mt-1">Create a project posting to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Projects List Panel */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-[#5a7682] text-[10px] font-bold uppercase tracking-widest mb-1 pl-1">Available Roles</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {projects.map((proj) => {
                const isSelected = selectedProject?.id === proj.id;
                const matchScore = calculateLocalMatchScore(proj);
                const appliedStatus = getApplicationStatus(proj.id);
                
                return (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProject(proj)}
                    className={`p-5 border cursor-pointer text-left transition-all rounded-2xl ${
                      isSelected
                        ? 'bg-slate-50 border-slate-900 border-2 shadow-md font-medium'
                        : 'bg-white border-slate-150/60 hover:border-slate-300 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-slate-800 font-bold text-sm leading-tight line-clamp-1 font-serif">{proj.title}</h4>
                      {user.role === 'ROLE_EMPLOYEE' && (
                        <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase rounded-lg ${getScoreColor(matchScore)}`}>
                          {matchScore}% Fit
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed font-semibold">{proj.description}</p>
                    
                    <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{proj.openings} open</span>
                      </span>
                      {appliedStatus ? (
                        <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 font-bold uppercase rounded-lg text-[8px]">
                          {appliedStatus}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>by {proj.deadline}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Details Panel */}
          {selectedProject && (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 space-y-6 rounded-2xl">
                {/* Title */}
                <div className="border-b border-slate-100 pb-4 flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 font-serif leading-tight">{selectedProject.title}</h3>
                    <div className="flex flex-wrap gap-4 items-center text-xs text-slate-500 mt-2.5 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-700" />
                        <span>{selectedProject.openings} Openings</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-700" />
                        <span>Deadline: {selectedProject.deadline}</span>
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-[9px] font-bold uppercase rounded-lg text-slate-700">
                        {selectedProject.status}
                      </span>
                    </div>
                  </div>

                  {user.role === 'ROLE_EMPLOYEE' && (
                    <div>
                      {hasApplied(selectedProject.id) ? (
                        <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold select-none uppercase tracking-wider">
                          Applied ({getApplicationStatus(selectedProject.id)})
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApply(selectedProject.id)}
                          disabled={actionLoading}
                          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition border-none shadow-md shadow-slate-200 cursor-pointer"
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-[#5a7682] text-[10px] font-bold uppercase tracking-wider mb-2">Project Brief</h4>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">{selectedProject.description}</p>
                </div>

                {/* AI Talent Matching Card */}
                {user.role === 'ROLE_EMPLOYEE' && (
                  <div className="bg-slate-50 border border-slate-100 p-5 space-y-4 rounded-xl">
                    <div className="flex justify-between items-center">
                      <h4 className="text-slate-800 font-bold font-serif text-sm flex items-center gap-2">
                        <Award className="w-5 h-5 text-teal-600" />
                        <span>AI Talent Match Analysis</span>
                      </h4>
                      <span className={`px-2.5 py-0.5 border text-xs font-bold uppercase rounded-lg ${getScoreColor(calculateLocalMatchScore(selectedProject))}`}>
                        {calculateLocalMatchScore(selectedProject)}% Fit Score
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 space-y-3 leading-relaxed border-t border-slate-200/60 pt-3">
                      <div>
                        <span className="text-slate-700 font-bold block mb-1 font-serif">Match Reasoning:</span>
                        <p className="italic font-medium text-[#5a7682]">
                          {calculateLocalMatchScore(selectedProject) >= 80 
                            ? "Candidate profile is an extremely strong match. Holds all required technologies. Highly recommended for shortlisting." 
                            : calculateLocalMatchScore(selectedProject) >= 50
                            ? "Good structural fit. Covers core competencies, but missing some secondary backend framework integrations. Recommend quick interview review."
                            : "Weak fit. Main programming methodologies do not align with requirements. Recommend upskilling in requested tech Stack."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <span className="text-slate-700 font-bold block mb-1">Your Matching Skills:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {userProfile?.skills?.map(sk => sk.skillName).filter(s => 
                              selectedProject.title.toLowerCase().includes(s.toLowerCase()) || 
                              selectedProject.description.toLowerCase().includes(s.toLowerCase())
                            ).map(s => (
                              <span key={s} className="px-2 py-0.5 bg-white border border-slate-200 text-teal-700 text-[9px] font-bold rounded-md">
                                ✓ {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-700 font-bold block mb-1">Missing Requirements:</span>
                          <span className="text-[10px] text-[#5a7682] italic font-semibold">
                            {calculateLocalMatchScore(selectedProject) === 100 ? "None! Complete match." : "Level up other framework proficiencies to improve fit."}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills customizer panel */}
              {user.role === 'ROLE_EMPLOYEE' && (
                <div className="bg-white shadow-md shadow-slate-100 border border-slate-100/50 p-6 space-y-4 rounded-2xl">
                  <h4 className="text-slate-800 font-bold font-serif text-sm flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-amber-500" />
                    <span>Real-Time Skill Recalculator</span>
                  </h4>
                  
                  <form onSubmit={handleAddSkillSubmit} className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Skill Name</label>
                      <SecureInput
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                        placeholder="e.g. React, Docker, Python"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="w-32">
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Proficiency (1-5)</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                        value={newSkill.proficiency}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, proficiency: e.target.value }))}
                      >
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>Lvl {n}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition border-none shadow-sm cursor-pointer"
                    >
                      Update Profile
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/30 flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-lg bg-white border border-slate-100 p-6 space-y-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold text-slate-850 font-serif border-b border-slate-100 pb-3">Post New Hiring Request</h3>
            
            <form onSubmit={handleCreateProjectSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Project Title</label>
                  <SecureInput
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-medium"
                    placeholder="e.g. Cloud API Gateway integration"
                    value={createForm.title}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Project Description</label>
                  <textarea
                    required
                    rows="3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-medium"
                    placeholder="Provide details about milestones, stack, and responsibilities..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Required Openings</label>
                  <SecureInput
                    type="number"
                    required
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-medium"
                    value={createForm.openings}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, openings: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Duration (Months)</label>
                  <SecureInput
                    type="number"
                    required
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-medium"
                    value={createForm.durationMonths}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, durationMonths: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Hiring Deadline</label>
                  <SecureInput
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-medium"
                    value={createForm.deadline}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Slack Target Channel</label>
                  <SecureInput
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-medium"
                    placeholder="e.g. #hiring-feed"
                    value={createForm.targetSlackChannel}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, targetSlackChannel: e.target.value }))}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Required Skills (Comma-separated)</label>
                  <SecureInput
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-medium"
                    placeholder="e.g. Java, Spring Boot, React"
                    value={createForm.skills}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, skills: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition border-none shadow-md shadow-slate-200 cursor-pointer"
                >
                  Post Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
