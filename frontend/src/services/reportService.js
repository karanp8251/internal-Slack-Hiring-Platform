import api from './api';

export const getHiringStats = () => {
  return api.get('/api/reports/hiring');
};

export const getProjectStats = () => {
  return api.get('/api/reports/projects');
};

export const getSkillStats = () => {
  return api.get('/api/reports/skills');
};

export const getDepartmentStats = () => {
  return api.get('/api/reports/departments');
};

export const getDepartments = () => {
  return api.get('/api/departments');
};

export const createDepartment = (name) => {
  return api.post('/api/departments', { name });
};

export const deleteDepartment = (id) => {
  return api.delete(`/api/departments/${id}`);
};

export const getNotifications = () => {
  return api.get('/api/notifications');
};

export const markNotificationRead = (id) => {
  return api.put(`/api/notifications/${id}`);
};
