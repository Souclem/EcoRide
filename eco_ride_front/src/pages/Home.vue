<script setup>
import { useUserStore } from "../store/user.store";

const userStore = useUserStore();
</script>

<template>
  <div class="w-full px-4">
    <div class="container mx-auto max-w-6xl">

    <!-- HERO SECTION -->
    <div class="text-center mb-16">
      <h1 class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-ecoGreen to-green-600 bg-clip-text text-transparent mb-6">
        {{ $t('home.welcome') }}
      </h1>
      <p class="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
        {{ $t('home.tagline') }}
      </p>
    </div>

    <!-- SI NON CONNECTÉ -->
    <div v-if="!userStore.isLoggedIn">
      <!-- Call to Action -->
      <div class="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12">
        <p class="text-center text-lg text-gray-700 mb-8">
          {{ $t('home.notLoggedIn.message') }}
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link
            to="/login"
            class="bg-gradient-to-r from-ecoGreen to-green-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-center"
          >
            {{ $t('home.notLoggedIn.login') }}
          </router-link>

          <router-link
            to="/register"
            class="bg-white border-2 border-ecoGreen text-ecoGreen px-8 py-4 rounded-xl font-semibold hover:bg-ecoGreen hover:text-white transition-all duration-200 text-center"
          >
            {{ $t('home.notLoggedIn.register') }}
          </router-link>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Économie -->
        <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
          <div class="text-5xl mb-4">💰</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Économisez</h3>
          <p class="text-gray-600 text-sm">Réduisez vos frais de transport en partageant vos trajets</p>
        </div>

        <!-- Écologie -->
        <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
          <div class="text-5xl mb-4">🌱</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Écologique</h3>
          <p class="text-gray-600 text-sm">Réduisez votre empreinte carbone et plantez des arbres</p>
        </div>

        <!-- Communauté -->
        <div class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
          <div class="text-5xl mb-4">🤝</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Communauté</h3>
          <p class="text-gray-600 text-sm">Rencontrez de nouvelles personnes et partagez vos trajets</p>
        </div>
      </div>
    </div>

    <!-- SI CONNECTÉ -->
    <div v-else>
      <div class="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          {{ $t('home.loggedIn.greeting', { name: userStore.user.name || userStore.user.email }) }}
        </h2>

        <p class="text-lg text-gray-600 mb-8">
          {{ $t('home.loggedIn.message') }}
        </p>

        <!-- Stats utilisateur -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
            <div class="text-3xl font-bold text-ecoGreen">{{ userStore.user.co2_saved || 0 }} kg</div>
            <div class="text-sm text-gray-600 mt-1">CO₂ économisé</div>
          </div>
          <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
            <div class="text-3xl font-bold text-ecoGreen">{{ userStore.user.tree_planted || 0 }}</div>
            <div class="text-sm text-gray-600 mt-1">Arbres plantés</div>
          </div>
          <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
            <div class="text-3xl font-bold text-ecoGreen">0</div>
            <div class="text-sm text-gray-600 mt-1">Trajets partagés</div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link
            to="/create-trip"
            class="bg-gradient-to-r from-ecoGreen to-green-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-center flex items-center justify-center gap-2"
          >
            <span>🚗</span> Créer un trajet
          </router-link>

          <router-link
            to="/trajets"
            class="bg-white border-2 border-ecoGreen text-ecoGreen px-8 py-4 rounded-xl font-semibold hover:bg-ecoGreen hover:text-white transition-all duration-200 text-center"
          >
            {{ $t('home.loggedIn.seeTrips') }}
          </router-link>
        </div>
      </div>
    </div>

    </div>
  </div>
</template>
