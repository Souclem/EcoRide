<template>
  <footer class="bg-gradient-to-br from-gray-900 to-gray-800 text-white mt-auto">
    <div class="container mx-auto px-4 py-12">
      <!-- Ligne principale -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

        <!-- Section À propos -->
        <div>
          <h3 class="text-xl font-bold text-ecoGreen mb-4">{{ $t('footer.about.title') }}</h3>
          <p class="text-gray-300 text-sm leading-relaxed">
            {{ $t('footer.about.description') }}
          </p>
        </div>

        <!-- Section Liens rapides -->
        <div>
          <h3 class="text-xl font-bold text-ecoGreen mb-4">{{ $t('footer.quickLinks.title') }}</h3>
          <ul class="space-y-2">
            <li>
              <router-link to="/" class="text-gray-300 hover:text-ecoGreen transition-colors text-sm">
                {{ $t('nav.home') }}
              </router-link>
            </li>
            <li>
              <router-link to="/login" class="text-gray-300 hover:text-ecoGreen transition-colors text-sm">
                {{ $t('nav.login') }}
              </router-link>
            </li>
            <li>
              <router-link to="/register" class="text-gray-300 hover:text-ecoGreen transition-colors text-sm">
                {{ $t('nav.register') }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Section Contact/Info -->
        <div>
          <h3 class="text-xl font-bold text-ecoGreen mb-4">{{ $t('footer.contact.title') }}</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-2 text-gray-300 text-sm">
              <span>📧</span>
              <span>contact@ecoride.com</span>
            </div>
            <div class="flex items-center gap-2 text-gray-300 text-sm">
              <span>🌍</span>
              <span>{{ $t('footer.contact.location') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Séparateur -->
      <div class="border-t border-gray-700 pt-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <!-- Copyright -->
          <p class="text-gray-400 text-sm">
            © 2025 EcoRide. {{ $t('footer.rights') }}
          </p>

          <!-- Indicateurs écologiques -->
          <div class="flex items-center gap-6 text-sm">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🌱</span>
              <span class="text-gray-300">{{ $t('footer.eco.carpooling') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-2xl">♻️</span>
              <span class="text-gray-300">{{ $t('footer.eco.co2') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>
