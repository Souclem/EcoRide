<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTripStore } from '../store/trip.store'

const tripStore = useTripStore()

const ongoingTrips = ref([])
const upcomingTrips = ref([])
const pastTrips = ref([])

onMounted(async () => {
  try {
    console.log('🔍 Chargement des trajets...')
    const data = await tripStore.fetchMyTrips()
    console.log('📦 Données reçues:', data)
    console.log('📊 Ongoing:', data.ongoing?.length, data.ongoing)
    console.log('📊 Upcoming:', data.upcoming?.length, data.upcoming)
    console.log('📊 Past:', data.past?.length, data.past)

    ongoingTrips.value = data.ongoing || []
    upcomingTrips.value = data.upcoming || []
    pastTrips.value = data.past || []

    console.log('✅ State updated:', {
      ongoing: ongoingTrips.value.length,
      upcoming: upcomingTrips.value.length,
      past: pastTrips.value.length
    })
  } catch (error) {
    console.error('❌ Erreur chargement trajets:', error)
  }
})

// Formater la date
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Obtenir le badge de rôle
function getRoleBadge(role) {
  return role === 'driver'
    ? { text: 'Conducteur', class: 'bg-blue-100 text-blue-800' }
    : { text: 'Passager', class: 'bg-green-100 text-green-800' }
}
</script>

<template>
  <div class="w-full px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <!-- En-tête -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-ecoGreen to-green-600 bg-clip-text text-transparent mb-2">
          Mes trajets
        </h1>
        <p class="text-gray-600">Gérez vos trajets en cours, à venir et votre historique</p>
      </div>

      <!-- Loading -->
      <div v-if="tripStore.loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ecoGreen"></div>
      </div>

      <!-- Contenu -->
      <div v-else class="space-y-8">

        <!-- 🔴 TRAJETS EN COURS (Priorité maximale) -->
        <section v-if="ongoingTrips.length > 0" class="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
          <h2 class="text-2xl font-bold text-red-700 mb-4 flex items-center gap-2">
            🚗 En cours maintenant
            <span class="text-sm font-normal text-red-600">({{ ongoingTrips.length }})</span>
          </h2>

          <div class="space-y-4">
            <div
              v-for="trip in ongoingTrips"
              :key="trip.id"
              class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div class="flex justify-between items-start mb-4">
                <div>
                  <span
                    :class="getRoleBadge(trip.role).class"
                    class="px-3 py-1 rounded-full text-xs font-semibold"
                  >
                    {{ getRoleBadge(trip.role).text }}
                  </span>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-ecoGreen">{{ trip.price_per_seat }}€</div>
                  <div class="text-xs text-gray-500">par siège</div>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">🟢</span>
                  <div class="flex-1">
                    <div class="font-semibold text-gray-900">{{ trip.start_address }}</div>
                    <div class="text-sm text-gray-500">Départ</div>
                  </div>
                </div>

                <div class="flex items-center gap-3 pl-9">
                  <div class="text-sm text-gray-400">{{ trip.distance_km }} km • {{ formatDate(trip.start_date) }}</div>
                </div>

                <div class="flex items-start gap-3">
                  <span class="text-2xl">🔴</span>
                  <div class="flex-1">
                    <div class="font-semibold text-gray-900">{{ trip.end_address }}</div>
                    <div class="text-sm text-gray-500">Arrivée</div>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t flex justify-between items-center">
                <div class="text-sm text-gray-600">
                  <span v-if="trip.role === 'driver'">
                    {{ trip.taken_seats || 0 }}/{{ trip.total_seats }} places réservées
                  </span>
                  <span v-else>
                    {{ trip.seats_booked }} place(s) réservée(s)
                  </span>
                </div>
                <div class="text-sm font-semibold text-red-600 animate-pulse">
                  ⏱️ En cours
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 🟡 TRAJETS À VENIR -->
        <section>
          <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📅 À venir
            <span class="text-sm font-normal text-gray-600">({{ upcomingTrips.length }})</span>
          </h2>

          <div v-if="upcomingTrips.length === 0" class="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
            Aucun trajet à venir
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="trip in upcomingTrips"
              :key="trip.id"
              class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div class="flex justify-between items-start mb-4">
                <span
                  :class="getRoleBadge(trip.role).class"
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                >
                  {{ getRoleBadge(trip.role).text }}
                </span>
                <div class="text-right">
                  <div class="text-xl font-bold text-ecoGreen">{{ trip.price_per_seat }}€</div>
                </div>
              </div>

              <div class="space-y-2 mb-4">
                <div class="flex items-center gap-2">
                  <span>🟢</span>
                  <div class="text-sm font-medium truncate">{{ trip.start_address.split(',')[0] }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span>🔴</span>
                  <div class="text-sm font-medium truncate">{{ trip.end_address.split(',')[0] }}</div>
                </div>
              </div>

              <div class="text-xs text-gray-500 mb-2">
                {{ formatDate(trip.start_date) }}
              </div>

              <div class="text-sm text-gray-600">
                <span v-if="trip.role === 'driver'">
                  {{ trip.taken_seats || 0 }}/{{ trip.total_seats }} places
                </span>
                <span v-else>
                  {{ trip.seats_booked }} place(s)
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- 📦 HISTORIQUE -->
        <section>
          <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📦 Historique
            <span class="text-sm font-normal text-gray-600">({{ pastTrips.length }})</span>
          </h2>

          <div v-if="pastTrips.length === 0" class="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
            Aucun trajet dans l'historique
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="trip in pastTrips"
              :key="trip.id"
              class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-4 flex-1">
                  <span
                    :class="getRoleBadge(trip.role).class"
                    class="px-2 py-1 rounded-full text-xs font-semibold"
                  >
                    {{ getRoleBadge(trip.role).text }}
                  </span>

                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">
                      {{ trip.start_address.split(',')[0] }} → {{ trip.end_address.split(',')[0] }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ formatDate(trip.start_date) }}
                    </div>
                  </div>
                </div>

                <div class="text-right">
                  <div class="font-bold text-gray-700">{{ trip.price_per_seat }}€</div>
                  <div class="text-xs text-gray-500">
                    <span v-if="trip.role === 'driver'">{{ trip.total_seats }} places</span>
                    <span v-else>{{ trip.seats_booked }} place(s)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animations personnalisées si nécessaire */
</style>
