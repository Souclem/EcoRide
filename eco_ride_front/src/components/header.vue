<template>
  <header
    class="fixed top-0 left-0 w-full bg-ecoGreen text-white px-4 py-3 flex items-center justify-between shadow-lg z-50"
  >
    <!-- Logo -->
    <RouterLink to="/" class="font-bold text-lg">EcoRide</RouterLink>

    <!-- Bouton burger (mobile) -->
    <button
      @click="toggleMenu"
      class="md:hidden text-white text-2xl focus:outline-none"
    >
      ☰
    </button>

    <!-- Navigation desktop -->
    <div class="hidden md:flex items-center gap-6">
      <nav class="flex gap-6 text-sm font-medium">
        <template v-if="!userStore.isLoggedIn">
          <RouterLink to="/login" class="hover:text-gray-200">{{ $t('nav.login') }}</RouterLink>
          <RouterLink to="/register" class="hover:text-gray-200">{{ $t('nav.register') }}</RouterLink>
        </template>
        <template v-else>
          <RouterLink to="/" class="hover:text-gray-200">{{ $t('nav.home') }}</RouterLink>
          <RouterLink to="/trips" class="hover:text-gray-200 flex items-center gap-1">
            <span>🔍</span> Rechercher
          </RouterLink>
          <RouterLink to="/create-trip" class="hover:text-gray-200 flex items-center gap-1">
            <span>🚗</span> Créer un trajet
          </RouterLink>
          <RouterLink to="/mes-trajets" class="hover:text-gray-200 flex items-center gap-1">
            <span>📋</span> Mes trajets
          </RouterLink>
          <RouterLink to="/profile" class="hover:text-gray-200">Profil</RouterLink>
          <button @click="logout" class="hover:text-red-300">{{ $t('nav.logout') }}</button>
        </template>
      </nav>

      <!-- Sélecteur de langue -->
      <select
        v-model="currentLocale"
        @change="changeLanguage"
        class="bg-white text-ecoGreen px-3 py-1 rounded text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
      >
        <option value="fr">🇫🇷 FR</option>
        <option value="en">🇬🇧 EN</option>
      </select>
    </div>
  </header>

  <!-- Menu mobile déroulant -->
  <nav
    v-if="menuOpen"
    class="md:hidden bg-ecoGreen text-white px-4 py-4 space-y-3 text-base mt-[56px]"
  >
    <template v-if="!userStore.isLoggedIn">
      <RouterLink @click="closeMenu" to="/login" class="block">{{ $t('nav.login') }}</RouterLink>
      <RouterLink @click="closeMenu" to="/register" class="block">{{ $t('nav.register') }}</RouterLink>
    </template>

    <template v-else>
      <RouterLink @click="closeMenu" to="/" class="block">{{ $t('nav.home') }}</RouterLink>
      <RouterLink @click="closeMenu" to="/trips" class="block flex items-center gap-2">
        <span>🔍</span> Rechercher
      </RouterLink>
      <RouterLink @click="closeMenu" to="/create-trip" class="block flex items-center gap-2">
        <span>🚗</span> Créer un trajet
      </RouterLink>
      <RouterLink @click="closeMenu" to="/mes-trajets" class="block flex items-center gap-2">
        <span>📋</span> Mes trajets
      </RouterLink>
      <RouterLink @click="closeMenu" to="/profile" class="block">Profil</RouterLink>
      <button @click="logout" class="block text-left">{{ $t('nav.logout') }}</button>
    </template>

    <!-- Sélecteur de langue mobile -->
    <div class="pt-3 border-t border-white/20">
      <label class="block text-xs mb-2">{{ $t('nav.language') }}</label>
      <select
        v-model="currentLocale"
        @change="changeLanguage"
        class="w-full bg-white text-ecoGreen px-3 py-2 rounded text-sm font-medium cursor-pointer"
      >
        <option value="fr">🇫🇷 Français</option>
        <option value="en">🇬🇧 English</option>
      </select>
    </div>
  </nav>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "../store/user.store.js";

const { locale } = useI18n();
const userStore = useUserStore();
const menuOpen = ref(false);
const currentLocale = ref(locale.value);

const toggleMenu = () => menuOpen.value = !menuOpen.value;
const closeMenu = () => menuOpen.value = false;

const changeLanguage = () => {
  locale.value = currentLocale.value;
  localStorage.setItem('language', currentLocale.value);
};

const logout = () => {
  userStore.logout();
  closeMenu();
};
</script>
