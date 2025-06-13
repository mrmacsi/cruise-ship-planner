export const BASE_URL = 'https://uno-game-eta.vercel.app/api/redis-cache';
export const CACHE_KEY = 'planner';

export const apiEndpoints = {
  getCache: (key: string) => `${BASE_URL}?key=${key}`,
  getAllCache: () => BASE_URL,
  updateCache: () => BASE_URL,
}; 