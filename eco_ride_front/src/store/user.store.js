import { defineStore } from "pinia";
import { login, register } from "../api/auth.api";
import * as userAPI from "../api/user.api";
import i18n from "../i18n";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null, // utilisateur connecté ou null
    allUsers: [], // ADMIN: liste de tous les utilisateurs
    loading: false,
    error: null,
  }),

  getters: {
      isLoggedIn: (state) => state.user !== null,
      isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    // Helper pour mettre à jour la langue de l'utilisateur
    updateUserLanguage(user) {
      // Utiliser la langue préférée de l'utilisateur, ou 'fr' par défaut
      const locale = user?.preferred_language || 'fr';
      localStorage.setItem("language", locale);
      i18n.global.locale.value = locale;
    },

    async loginUser(credentials) {
      const response = await login(credentials);
      this.user = response.data.user;
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Charger la langue préférée de l'utilisateur
      this.updateUserLanguage(response.data.user);

      return response;
    },

    async registerUser(userData) {
      const response = await register(userData);
      this.user = response.data.user;
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Charger la langue préférée de l'utilisateur
      this.updateUserLanguage(response.data.user);

      return response;
    },

    login(userData) {
      this.user = userData;
      localStorage.setItem("user", JSON.stringify(userData));

      // Charger la langue préférée de l'utilisateur
      this.updateUserLanguage(userData);
    },

    logout() {
      this.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Optionnel: Réinitialiser la langue à la valeur par défaut
      // localStorage.removeItem("language");
      // i18n.global.locale.value = 'fr';
    },

    // Restaurer l'utilisateur depuis localStorage au démarrage
    initFromLocalStorage() {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        try {
          this.user = JSON.parse(userStr);

          // Charger la langue préférée de l'utilisateur au démarrage
          this.updateUserLanguage(this.user);
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
          this.logout();
        }
      }
    },

    async updateUserProfile(profileData) {
      const response = await userAPI.updateMyProfile(profileData);
      this.user = response.data.user;
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Mettre à jour la langue si elle a changé
      this.updateUserLanguage(response.data.user);

      return response;
    },

    // ==================== ADMIN ONLY ====================

    async fetchAllUsers() {
      this.loading = true;
      this.error = null;

      try {
        const response = await userAPI.getAllUsers();
        this.allUsers = response.data.users || response.data;
        return this.allUsers;
      } catch (err) {
        this.error = err.response?.data?.error || 'Erreur lors de la récupération des utilisateurs';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateUser(userId, updates) {
      this.loading = true;
      this.error = null;

      try {
        const response = await userAPI.updateUser(userId, updates);
        // Mettre à jour localement si possible
        const index = this.allUsers.findIndex(u => u.id === userId);
        if (index !== -1) {
          this.allUsers[index] = { ...this.allUsers[index], ...updates };
        }
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Erreur lors de la mise à jour';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteUser(userId) {
      this.loading = true;
      this.error = null;

      try {
        const response = await userAPI.deleteUser(userId);
        await this.fetchAllUsers(); // Rafraîchir la liste
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Erreur lors de la suppression';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    clearError() {
      this.error = null;
    },
  },
});
