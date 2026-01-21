import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3000/api", // ton futur backend Node
  timeout: 30000,
});


instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===========================
// INTERCEPTEUR DE RÉPONSE
// ===========================
// Gérer les erreurs HTTP communes
instance.interceptors.response.use(
  // Si la requête réussit (status 200-299)
  (response) => {
    return response;
  },

  // Si la requête échoue (status 400+)
  (error) => {
    // 1. Token expiré ou invalide → Déconnexion automatique
    if (error.response?.status === 401) {
      const url = error.config?.url || '';

      // Ne PAS déconnecter pour les routes optionnelles
      const optionalRoutes = ['/subscriptions/my'];
      const isOptional = optionalRoutes.some(route => url.includes(route));

      if (!isOptional) {
        console.warn('🔒 Session expirée, déconnexion...');
        console.warn('URL:', url);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        console.warn('⚠️ Token invalide pour route optionnelle:', url);
      }

      return Promise.reject(error);
    }

    // 2. Serveur inaccessible (pas de réponse)
    if (!error.response) {
      console.error('❌ Serveur inaccessible. Vérifiez votre connexion.');
      // Optionnel: Vous pouvez afficher une notification ici
    }

    // 3. Erreur serveur 500
    if (error.response?.status === 500) {
      console.error('❌ Erreur serveur:', error.response.data);
    }

    // 4. Laisser passer l'erreur pour que le store la gère
    return Promise.reject(error);
  }
);

export default instance;

