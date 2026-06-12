import api from './api';

export const getApplicants = (projectId) => {
  return api.get(`/api/projects/${projectId}/applicants`);
};

export const getInterview = (applicationId) => {
  return api.get(`/api/applications/${applicationId}/interview`);
};

export const updateApplicationStatus = (applicationId, status) => {
  return api.put(`/api/applications/${applicationId}/status`, { status });
};

export const getMyApplications = () => {
  return api.get('/api/applications/my');
};

export const applyToProject = (projectId) => {
  return api.post('/api/applications', { projectId });
};

export const getAllApplications = () => {
  return api.get('/api/applications');
};
