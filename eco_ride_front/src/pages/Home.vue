<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/store/index.js';
import { useStatsStore } from '@/store/index.js'
import AlertMessage from '@/components/ui/AlertMessage.vue'

const userStore = useUserStore();
const statsStore = useStatsStore();

onMounted(async () => {
  try {
    await statsStore.fetchGlobalStats()
  } catch (error) {
    console.error('Erreur chargement statistiques:', error)
  }
})
</script>

<template>
  <main class="w-full px-4">
    <div class="container mx-auto max-w-6xl">

    <!-- HERO SECTION -->
    <header class="text-center mb-16">
      <h1 class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-ecoGreen to-green-600 bg-clip-text text-transparent mb-6">
        {{ $t('home.welcome') }}
      </h1>
      <p class="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
        {{ $t('home.tagline') }}
      </p>
    </header>

    <!-- Message d'erreur -->
    <AlertMessage
      v-if="statsStore.error"
      type="error"
      :message="statsStore.error"
      class="mb-6"
    />

    <!-- SI NON CONNECTÉ -->
    <section v-if="!userStore.isLoggedIn">
      <!-- Call to Action -->
      <article class="card card-body mb-12">
        <p class="text-center text-lg text-gray-700 mb-8">
          {{ $t('home.notLoggedIn.message') }}
        </p>

        <!-- Statistiques globales -->
        <section v-if="!statsStore.loading && statsStore.globalStats" class="mb-8">
          <div class="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-8 text-white shadow-xl">
            <h3 class="text-2xl md:text-3xl font-bold text-center mb-8">
              🌍 {{ $t('home.globalStats.title') }}
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div class="text-center">
                <div class="text-4xl md:text-5xl font-black mb-2">{{ statsStore.globalStats.total_co2_saved?.toFixed(2) || 0 }}</div>
                <div class="text-sm md:text-base opacity-90">{{ $t('home.globalStats.co2') }}</div>
              </div>
              <div class="text-center">
                <div class="text-4xl md:text-5xl font-black mb-2">{{ statsStore.globalStats.total_trees_planted?.toFixed(2) || 0 }}</div>
                <div class="text-sm md:text-base opacity-90">{{ $t('home.globalStats.trees') }}</div>
              </div>
              <div class="text-center">
                <div class="text-4xl md:text-5xl font-black mb-2">{{ statsStore.globalStats.total_trips || 0 }}</div>
                <div class="text-sm md:text-base opacity-90">{{ $t('home.globalStats.trips') }}</div>
              </div>
              <div class="text-center">
                <div class="text-4xl md:text-5xl font-black mb-2">{{ statsStore.globalStats.total_users || 0 }}</div>
                <div class="text-sm md:text-base opacity-90">{{ $t('home.globalStats.users') }}</div>
              </div>
            </div>
          </div>
        </section>

        <nav class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link to="/login" class="btn-primary btn-lg text-center">
            {{ $t('home.notLoggedIn.login') }}
          </router-link>

          <router-link to="/register" class="btn-secondary btn-lg text-center">
            {{ $t('home.notLoggedIn.register') }}
          </router-link>
        </nav>
      </article>

      <!-- Features Grid -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Économie -->
        <article class="card-hover p-6 text-center">
          <div class="text-5xl mb-4">💰</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">{{ $t('home.features.save.title') }}</h3>
          <p class="text-gray-600 text-sm">{{ $t('home.features.save.description') }}</p>
        </article>

        <!-- Écologie -->
        <article class="card-hover p-6 text-center">
          <div class="text-5xl mb-4">🌱</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">{{ $t('home.features.eco.title') }}</h3>
          <p class="text-gray-600 text-sm">{{ $t('home.features.eco.description') }}</p>
        </article>

        <!-- Communauté -->
        <article class="card-hover p-6 text-center">
          <div class="text-5xl mb-4">🤝</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">{{ $t('home.features.community.title') }}</h3>
          <p class="text-gray-600 text-sm">{{ $t('home.features.community.description') }}</p>
        </article>
      </section>
    </section>

    <!-- SI CONNECTÉ -->
    <section v-else>
      <article class="card card-body text-center">
        <header>
          <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {{ $t('home.loggedIn.greeting', { name: userStore.user.name || userStore.user.email }) }}
          </h2>
          <p class="text-lg text-gray-600 mb-8">
            {{ $t('home.loggedIn.message') }}
          </p>
        </header>

        <!-- Statistiques globales -->
        <section v-if="!statsStore.loading && statsStore.globalStats" class="mb-8">
          <div class="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-8 text-white shadow-xl">
            <h3 class="text-2xl md:text-3xl font-bold text-center mb-8">
              🌍 {{ $t('home.globalStats.title') }}
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div class="text-center">
                <div class="text-4xl md:text-5xl font-black mb-2">{{ statsStore.globalStats.total_co2_saved?.toFixed(2) || 0 }}</div>
                <div class="text-sm md:text-base opacity-90">{{ $t('home.globalStats.co2') }}</div>
              </div>
              <div class="text-center">
                <div class="text-4xl md:text-5xl font-black mb-2">{{ statsStore.globalStats.total_trees_planted?.toFixed(2) || 0 }}</div>
                <div class="text-sm md:text-base opacity-90">{{ $t('home.globalStats.trees') }}</div>
              </div>
              <div class="text-center">
                <div class="text-4xl md:text-5xl font-black mb-2">{{ statsStore.globalStats.total_trips || 0 }}</div>
                <div class="text-sm md:text-base opacity-90">{{ $t('home.globalStats.trips') }}</div>
              </div>
              <div class="text-center">
                <div class="text-4xl md:text-5xl font-black mb-2">{{ statsStore.globalStats.total_users || 0 }}</div>
                <div class="text-sm md:text-base opacity-90">{{ $t('home.globalStats.users') }}</div>
              </div>
            </div>
          </div>
        </section>

        <nav class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link to="/create-trip" class="btn-primary btn-lg text-center flex items-center justify-center gap-2">
            <span>🚗</span> {{ $t('home.loggedIn.createTrip') }}
          </router-link>

          <router-link to="/trajets" class="btn-secondary btn-lg text-center">
            {{ $t('home.loggedIn.seeTrips') }}
          </router-link>
        </nav>
      </article>
    </section>

    </div>
  </main>
</template>
