import api from './api';

export const getProjects = () => {
  return api.get('/api/projects');
};

export const createProject = (payload, userId) => {
  return api.post('/api/projects', payload, {
    headers: { 'X-User-Id': userId.toString() }
  });
};

export const updateProject = (projectId, payload, userId) => {
  return api.put(`/api/projects/${projectId}`, payload, {
    headers: { 'X-User-Id': userId.toString() }
  });
};

export const deleteProject = (projectId, userId) => {
  return api.delete(`/api/projects/${projectId}`, {
    headers: { 'X-User-Id': userId.toString() }
  });
};
