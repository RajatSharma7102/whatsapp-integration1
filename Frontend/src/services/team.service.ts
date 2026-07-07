import api from '../lib/api';

export const teamService = {
  getTeams: () => api.get('/teams'),
  createTeam: (data: { name: string; description?: string; color?: string; members?: string[] }) =>
    api.post('/teams', data),
  updateTeam: (id: string, data: { name?: string; description?: string; color?: string; members?: string[] }) =>
    api.put(`/teams/${id}`, data),
  deleteTeam: (id: string) => api.delete(`/teams/${id}`),
};
