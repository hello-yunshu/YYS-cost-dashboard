import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

const SETTINGS_KEY = 'cost-dashboard-settings';

const DEFAULT_SETTINGS = {
  riskThreshold: 5,
  amountUnit: 'wan',
};

function loadLocalSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

const useSettingsStore = create((set, get) => ({
  settings: loadLocalSettings(),
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/settings');
      const serverSettings = data.data || data || {};
      const merged = {
        ...DEFAULT_SETTINGS,
        riskThreshold: serverSettings.riskThreshold ? Number(serverSettings.riskThreshold) : DEFAULT_SETTINGS.riskThreshold,
        amountUnit: serverSettings.amountUnit || DEFAULT_SETTINGS.amountUnit,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      set({ settings: merged, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  saveSettings: async (newSettings) => {
    set({ loading: true, error: null });
    try {
      await api.put('/settings', newSettings);
      const merged = { ...get().settings, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      set({ settings: merged, loading: false });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  getRiskThreshold: () => {
    const { riskThreshold } = get().settings;
    return riskThreshold / 100;
  },

  getAmountUnit: () => {
    return get().settings.amountUnit || DEFAULT_SETTINGS.amountUnit;
  },
}));

export default useSettingsStore;
