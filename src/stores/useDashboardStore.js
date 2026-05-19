import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

const STORAGE_KEY = 'cost-dashboard-selected-month';
const YEAR_STORAGE_KEY = 'cost-dashboard-selected-year';

const useDashboardStore = create((set, get) => ({
  overview: null,
  branchDetail: null,
  projectDetail: null,
  months: [],
  selectedMonth: localStorage.getItem(STORAGE_KEY) || null,
  annualData: null,
  selectedYear: localStorage.getItem(YEAR_STORAGE_KEY) || new Date().getFullYear().toString(),
  annualLoading: false,
  loading: false,
  error: null,

  fetchMonths: async () => {
    try {
      const { data } = await api.get('/months');
      const raw = data.data || data || [];
      const months = raw.map((m) => (typeof m === 'string' ? m : m.yearMonth));
      set({ months });
      const latestMonth = [...months].sort((a, b) => b.localeCompare(a))[0];
      if (months.length > 0 && !get().selectedMonth) {
        set({ selectedMonth: latestMonth });
      }
      const current = get().selectedMonth;
      if (current && !months.includes(current)) {
        set({ selectedMonth: latestMonth });
      }
      const years = [...new Set(months.map((m) => m.substring(0, 4)))].sort((a, b) => b.localeCompare(a));
      if (years.length > 0) {
        const curYear = get().selectedYear;
        if (!curYear || !years.includes(curYear)) {
          set({ selectedYear: years[0] });
        }
      }
      return months;
    } catch (err) {
      set({ error: err.message });
      return [];
    }
  },

  fetchOverview: async (month) => {
    set({ loading: true, error: null });
    try {
      const params = month ? { month } : {};
      const { data } = await api.get('/dashboard/overview', { params });
      set({ overview: data.data || data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchBranchDetail: async (id, month) => {
    set({ loading: true, error: null, branchDetail: null });
    try {
      const params = month ? { month } : {};
      const { data } = await api.get(`/dashboard/branch/${id}`, { params });
      set({ branchDetail: data.data || data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchProjectDetail: async (id, month) => {
    set({ loading: true, error: null, projectDetail: null });
    try {
      const params = month ? { month } : {};
      const { data } = await api.get(`/dashboard/project/${id}`, { params });
      set({ projectDetail: data.data || data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  setSelectedMonth: (month) => {
    localStorage.setItem(STORAGE_KEY, month);
    set({ selectedMonth: month });
  },

  fetchAnnualData: async (year) => {
    set({ annualLoading: true, error: null });
    try {
      const params = year ? { year } : {};
      const { data } = await api.get('/dashboard/annual', { params });
      set({ annualData: data.data || data, annualLoading: false });
    } catch (err) {
      set({ error: err.message, annualLoading: false });
    }
  },

  setSelectedYear: (year) => {
    localStorage.setItem(YEAR_STORAGE_KEY, year);
    set({ selectedYear: year });
  },
}));

export default useDashboardStore;
