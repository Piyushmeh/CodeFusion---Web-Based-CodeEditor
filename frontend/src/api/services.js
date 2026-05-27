import api from './axios';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removeAvatar: () => api.delete('/users/avatar'),
  getActivities: () => api.get('/users/activities'),
};

export const projectAPI = {
  getStats: () => api.get('/projects/stats'),
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getRecent: () => api.get('/projects/recent'),
};

export const fileAPI = {
  getByProject: (projectId) => api.get(`/files/project/${projectId}`),
  getOne: (id) => api.get(`/files/${id}`),
  save: (id, content) => api.put(`/files/${id}/save`, { content }),
  create: (projectId, data) => api.post(`/files/project/${projectId}`, data),
  delete: (id) => api.delete(`/files/${id}`),
};

export const teamAPI = {
  getAll: () => api.get('/teams'),
  getOne: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  invite: (id, data) => api.post(`/teams/${id}/invite`, data),
  acceptInvite: (token) => api.post('/teams/accept-invite', { token }),
  removeMember: (id, memberId) => api.delete(`/teams/${id}/members/${memberId}`),
  linkProject: (id, projectId) =>
    api.post(`/teams/${id}/projects`, { projectId }),
};

export const activityAPI = {
  getAll: () => api.get('/activities'),
};

export const runAPI = {
  execute: (data) => api.post('/run/execute', data),
};

export const teamCollaborationAPI = {
  getProjects: (teamId) => api.get(`/teams/${teamId}/projects`),
  createProject: (teamId, data) => api.post(`/teams/${teamId}/projects`, data),
  getFiles: (projectId) => api.get(`/team-projects/${projectId}/files`),
  createFile: (projectId, data) => api.post(`/team-projects/${projectId}/files`, data),
  updateFile: (fileId, data) => api.put(`/team-files/${fileId}`, data),
  deleteFile: (fileId) => api.delete(`/team-files/${fileId}`),
  getMessages: (teamId) => api.get(`/teams/${teamId}/messages`),
};
