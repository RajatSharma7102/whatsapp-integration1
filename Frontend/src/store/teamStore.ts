import { create } from 'zustand';
import { Team } from '../types';
import { teamService } from '../services/team.service';

interface TeamState {
  teams: Team[];
  loading: boolean;
  fetchTeams: () => Promise<void>;
  createTeam: (data: { name: string; description?: string; color?: string }) => Promise<Team>;
  updateTeam: (id: string, data: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  loading: false,

  fetchTeams: async () => {
    set({ loading: true });
    try {
      const res = await teamService.getTeams();
      set({ teams: res.data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createTeam: async (data) => {
    const res = await teamService.createTeam(data);
    const newTeam = res.data.data;
    set((state) => ({ teams: [...state.teams, newTeam] }));
    return newTeam;
  },

  updateTeam: async (id, data) => {
    const res = await teamService.updateTeam(id, data);
    const updated = res.data.data;
    set((state) => ({
      teams: state.teams.map((t) => (t._id === id ? updated : t)),
    }));
  },

  deleteTeam: async (id) => {
    await teamService.deleteTeam(id);
    set((state) => ({ teams: state.teams.filter((t) => t._id !== id) }));
  },
}));
