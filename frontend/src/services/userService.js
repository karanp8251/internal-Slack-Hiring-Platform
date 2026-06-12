import api from './api';

export const getUserProfile = () => {
  return api.get('/api/users/profile');
};

export const getAllUsers = () => {
  return api.get('/api/users');
};

export const createUser = (payload) => {
  return api.post('/api/users', payload);
};

export const updateUserRole = (userId, role) => {
  return api.put(`/api/users/${userId}`, { role });
};

export const deleteUser = (userId) => {
  return api.delete(`/api/users/${userId}`);
};

export const addSkill = (skillName, proficiency) => {
  return api.post('/api/users/skills', { skillName, proficiency });
};

export const updateAvailability = (status) => {
  return api.put('/api/users/availability', { status });
};

export const getAuditLogs = () => {
  return api.get('/api/users/audit-logs');
};
