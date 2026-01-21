import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../store/user.store";

import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import Home from "../pages/Home.vue";
import CreateTrip from "../pages/CreateTrip.vue";
import ListTrips from "../pages/ListTrips.vue";
import MyTrips from "../pages/MyTrips.vue";
import TripInProgress from "../pages/TripInProgress.vue";
import Profile from "../pages/Profile.vue";
import AdminDashboard from "../pages/AdminDashboard.vue";
import MarketerDashboard from "../pages/MarketerDashboard.vue";
import PromotionList from "../pages/PromotionList.vue";
import PromotionForm from "../pages/PromotionForm.vue";
import SubscriptionList from "../pages/SubscriptionList.vue";
import SubscriptionForm from "../pages/SubscriptionForm.vue";
import SubscriptionPlans from "../pages/SubscriptionPlans.vue";
import ComponentPlayground from "../pages/ComponentPlayground.vue";

const routes = [
  // 🎨 DEV ONLY - Page de test des composants
  {
    path: "/playground",
    component: ComponentPlayground,
    name: "ComponentPlayground"
    // Accessible à tous (mode développement)
  },
  {
    path: "/",
    component: Home,
    name: "Home"
  },
  {
    path: "/login",
    component: Login,
    name: "Login"
    // Pas de meta - accessible à tous, mais on redirigera si déjà connecté dans le composant
  },
  {
    path: "/register",
    component: Register,
    name: "Register"
    // Pas de meta - accessible à tous, mais on redirigera si déjà connecté dans le composant
  },
  {
    path: "/create-trip",
    component: CreateTrip,
    name: "CreateTrip",
    meta: { requiresAuth: true } // Nécessite une connexion
  },
  {
    path: "/trips",
    component: ListTrips,
    name: "ListTrips",
    meta: { requiresAuth: true }, // Nécessite une connexion
    alias: "/trajets" // Alias français
  },
  {
    path: "/mes-trajets",
    component: MyTrips,
    name: "MyTrips",
    meta: { requiresAuth: true } // Nécessite une connexion
  },
  {
    path: "/trajet-en-cours",
    component: TripInProgress,
    name: "TripInProgress",
    meta: { requiresAuth: true } // Nécessite une connexion
  },
  {
    path: "/profil",
    component: Profile,
    name: "Profile",
    meta: { requiresAuth: true } // Nécessite une connexion
  },
  {
    path: "/admin",
    component: AdminDashboard,
    name: "AdminDashboard",
    meta: { requiresAuth: true, requiresRole: 'admin' } // Nécessite une connexion et rôle admin
  },
  {
    path: "/marketer",
    redirect: "/marketer/promotion"
  },
  {
    path: "/marketer/promotion",
    component: PromotionList,
    name: "PromotionList",
    meta: { requiresAuth: true, requiresRole: ['marketer', 'admin'] }
  },
  {
    path: "/marketer/promotion/create",
    component: PromotionForm,
    name: "PromotionCreate",
    meta: { requiresAuth: true, requiresRole: ['marketer', 'admin'] }
  },
  {
    path: "/marketer/promotion/:id/edit",
    component: PromotionForm,
    name: "PromotionEdit",
    meta: { requiresAuth: true, requiresRole: ['marketer', 'admin'] }
  },
  {
    path: "/marketer/subscriptions",
    component: SubscriptionList,
    name: "SubscriptionList",
    meta: { requiresAuth: true, requiresRole: ['marketer', 'admin'] }
  },
  {
    path: "/marketer/subscriptions/create",
    component: SubscriptionForm,
    name: "SubscriptionCreate",
    meta: { requiresAuth: true, requiresRole: ['marketer', 'admin'] }
  },
  {
    path: "/marketer/subscriptions/:id/edit",
    component: SubscriptionForm,
    name: "SubscriptionEdit",
    meta: { requiresAuth: true, requiresRole: ['marketer', 'admin'] }
  },
  {
    path: "/subscriptions",
    component: SubscriptionPlans,
    name: "SubscriptionPlans"
    // Accessible à tous (public)
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard - Protection des routes
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  // Vérifier si l'utilisateur est connecté
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  // Récupérer le rôle de l'utilisateur depuis le store Pinia
  const userRole = userStore.user?.role || null;

  console.log('Navigation guard:', {
    to: to.path,
    isAuthenticated,
    userRole,
    requiresAuth: to.meta.requiresAuth,
    requiresRole: to.meta.requiresRole
  });

  // Si l'utilisateur est connecté et essaie d'accéder à login/register → rediriger vers home
  if (isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
    console.log('Redirecting to home - already authenticated');
    next({ name: 'Home' });
    return;
  }

  // Si la route nécessite une authentification et que l'utilisateur n'est pas connecté
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('Redirecting to login - not authenticated');
    // Rediriger vers la page de connexion avec l'URL de destination
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    });
  }
  // Si la route nécessite un rôle spécifique
  else if (to.meta.requiresRole) {
    const allowedRoles = Array.isArray(to.meta.requiresRole) ? to.meta.requiresRole : [to.meta.requiresRole];
    if (!allowedRoles.includes(userRole)) {
      console.log('Redirecting to home - wrong role');
      // Rediriger vers la page d'accueil si l'utilisateur n'a pas le bon rôle
      next({ name: 'Home' });
    } else {
      console.log('Navigation allowed - correct role');
      next();
    }
  }
  // Sinon, laisser passer
  else {
    console.log('Navigation allowed');
    next();
  }
});

export default router;
