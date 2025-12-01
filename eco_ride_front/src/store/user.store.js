import { defineStore } from "pinia";
import { login, register } from "../api/auth.api";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null, // utilisateur connecté ou null
  }),

  getters: {
    isLoggedIn: (state) => state.user !== null,
  },

  actions: {
    async loginUser(credentials) {
      const response = await login(credentials);
      this.user = response.data.user;
      localStorage.setItem("token", response.data.token);
      return response;
    },

    async registerUser(userData) {
      const response = await register(userData);
      this.user = response.data.user;
      localStorage.setItem("token", response.data.token);
      return response;
    },

    login(userData) {
      this.user = userData;
    },

    logout() {
      this.user = null;
      localStorage.removeItem("token");
    },
  },
});
