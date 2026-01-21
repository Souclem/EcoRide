<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useTripStore } from '../store/trip.store'
import { useBookingStore } from '../store/booking.store'
import { useTripReview } from '../composables/useTripReview'
import { formatDate } from '../utils/formatters'
import TripCard from '../components/trip/TripCard.vue'
import AlertMessage from '../components/ui/AlertMessage.vue'

const { t } = useI18n()
const router = useRouter()
const tripStore = useTripStore()
const bookingStore = useBookingStore()

const ongoingTrips = ref([])
const upcomingTrips = ref([])
const pastTrips = ref([])
const errorMessage = ref('')

// Composable pour les avis
const review = useTripReview(bookingStore)

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

    // Déboguer les passagers
    upcomingTrips.value.forEach(trip => {
      if (trip.role === 'driver' && trip.passengers) {
        console.log('👥 Passagers du trajet', trip.id, ':', trip.passengers)
      }
    })
  } catch (error) {
    console.error('❌ Erreur chargement trajets:', error)
    errorMessage.value = error.response?.data?.message || error.message || 'Erreur lors du chargement de vos trajets'
  }
})

// Obtenir le badge de rôle
function getRoleBadge(role) {
  return role === 'driver'
    ? { text: t('myTrips.driver'), class: 'badge-info' }
    : { text: t('myTrips.passenger'), class: 'badge-success' }
}

// Naviguer vers la page trajet en cours
function goToOngoingTrip() {
  router.push('/trajet-en-cours')
}
</script>

<template>
  <main class="w-full px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <!-- En-tête -->
      <header class="mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-ecoGreen to-green-600 bg-clip-text text-transparent mb-2">
          {{ $t('myTrips.title') }}
        </h1>
        <p class="text-gray-600">{{ $t('myTrips.subtitle') }}</p>
      </header>

      <!-- Message d'erreur -->
      <AlertMessage
        v-if="errorMessage"
        type="error"
        :message="errorMessage"
        class="mb-6"
      />

      <!-- Loading -->
      <div v-if="tripStore.loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ecoGreen"></div>
      </div>

      <!-- Contenu -->
      <div v-else class="space-y-8">

        <!-- 🔴 LIEN VERS TRAJETS EN COURS -->
        <section
          v-if="ongoingTrips.length > 0"
          class="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-300 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          @click="goToOngoingTrip"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center animate-pulse">
                <span class="text-3xl">🚗</span>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-1">
                  {{ ongoingTrips.length }} trajet{{ ongoingTrips.length > 1 ? 's' : '' }} en cours
                </h2>
                <p class="text-gray-600">
                  Cliquez pour gérer {{ ongoingTrips.length > 1 ? 'vos trajets actifs' : 'votre trajet actif' }}
                </p>
              </div>
            </div>
            <button
              class="btn btn-primary flex items-center gap-2 shadow-md"
              @click.stop="goToOngoingTrip"
            >
              Voir le trajet
              <span class="text-xl">→</span>
            </button>
          </div>
        </section>

        <!-- 🟡 TRAJETS À VENIR -->
        <section>
          <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📅 {{ $t('myTrips.upcoming') }}
            <span class="text-sm font-normal text-gray-600">({{ upcomingTrips.length }})</span>
          </h2>

          <div v-if="upcomingTrips.length === 0" class="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
            {{ $t('myTrips.noUpcoming') }}
          </div>

          <div v-else class="grid grid-cols-1 gap-4">
            <TripCard
              v-for="trip in upcomingTrips"
              :key="trip.id"
              :trip="trip"
              :show-driver="false"
              :show-price="true"
              :show-eco-impact="true"
              :seats="trip.role === 'passenger' ? trip.seats_booked : 1"
            >
              <!-- Badge de rôle -->
              <template #badge>
                <span :class="getRoleBadge(trip.role).class">
                  {{ getRoleBadge(trip.role).text }}
                </span>
              </template>

              <!-- Contenu additionnel -->
              <template #additional-content>
                <!-- Code de validation pour passager -->
                <div v-if="trip.role === 'passenger' && trip.validation_code" class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div class="text-xs text-gray-600 mb-1">{{ $t('myTrips.validationCode') }}</div>
                  <div class="text-2xl font-bold text-ecoGreen tracking-wider">{{ trip.validation_code }}</div>
                  <div class="text-xs text-gray-500 mt-1">{{ $t('myTrips.showToDriver') }}</div>
                </div>

                <!-- Liste des participants pour conducteur -->
                <div v-if="trip.role === 'driver' && trip.passengers && trip.passengers.length > 0" class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="text-sm font-semibold text-gray-700 mb-2">
                    👥 Passagers ({{ trip.passengers.length }})
                  </div>
                  <div class="space-y-2">
                    <div v-for="passenger in trip.passengers" :key="passenger.id" class="bg-white p-3 rounded">
                      <div class="flex items-start gap-2">
                        <span class="text-lg">👤</span>
                        <div class="flex-1">
                          <div class="font-medium text-sm">{{ passenger.passenger_name || passenger.name }} {{ passenger.passenger_last_name || passenger.last_name }}</div>
                          <div class="text-xs text-gray-600 mt-1">📧 {{ passenger.passenger_email || passenger.email }}</div>
                          <div class="text-xs text-gray-500 mt-1">{{ passenger.seats_booked }} place{{ passenger.seats_booked > 1 ? 's' : '' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Message si aucun passager -->
                <div v-else-if="trip.role === 'driver' && trip.taken_seats === 0" class="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm text-gray-500">
                  Aucun passager pour ce trajet
                </div>
              </template>
            </TripCard>
          </div>
        </section>

        <!-- 📦 HISTORIQUE -->
        <section>
          <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📦 {{ $t('myTrips.history') }}
            <span class="text-sm font-normal text-gray-600">({{ pastTrips.length }})</span>
          </h2>

          <div v-if="pastTrips.length === 0" class="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
            {{ $t('myTrips.noHistory') }}
          </div>

          <div v-else class="grid grid-cols-1 gap-4">
            <TripCard
              v-for="trip in pastTrips"
              :key="trip.id"
              :trip="trip"
              :show-driver="false"
              :show-price="true"
              :show-eco-impact="trip.role === 'driver'"
              :seats="trip.role === 'passenger' ? trip.seats_booked : 1"
            >
              <!-- Badge de rôle -->
              <template #badge>
                <span :class="getRoleBadge(trip.role).class">
                  {{ getRoleBadge(trip.role).text }}
                </span>
              </template>

              <!-- Contenu additionnel: gains pour conducteur OU avis pour passager -->
              <template #additional-content>
                <!-- Gains conducteur -->
                <div v-if="trip.role === 'driver'" class="mt-3 flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <span class="text-2xl">💰</span>
                  <div>
                    <div class="text-xs text-gray-500">{{ $t('myTrips.earnings') }}</div>
                    <div class="font-bold text-ecoGreen text-lg">{{ trip.earnings || 0 }}€</div>
                  </div>
                </div>

                <!-- Section avis passagers -->
                <div v-else-if="trip.role === 'passenger'" class="mt-3 pt-3 border-t border-gray-200">
                <!-- Avis déjà soumis -->
                <div v-if="trip.rating" class="bg-green-50 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm font-medium text-gray-700">Votre avis :</span>
                    <div class="flex gap-0.5">
                      <span
                        v-for="star in 5"
                        :key="star"
                        :class="star <= trip.rating ? 'text-yellow-400' : 'text-gray-300'"
                      >
                        ★
                      </span>
                    </div>
                  </div>
                  <p v-if="trip.review_comment" class="text-sm text-gray-600 italic">
                    "{{ trip.review_comment }}"
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    Noté le {{ new Date(trip.reviewed_at).toLocaleDateString('fr-FR') }}
                  </p>
                </div>

                <!-- Formulaire de notation (si pas encore noté et dans les délais) -->
                <div v-else-if="review.canReview(trip)">
                  <!-- Bouton pour ouvrir le formulaire -->
                  <button
                    v-if="!review.isReviewFormOpen(trip.id)"
                    @click="review.openReviewForm(trip.id)"
                    class="text-sm text-ecoGreen hover:text-green-700 font-medium flex items-center gap-1"
                  >
                    ⭐ Noter ce trajet
                  </button>

                  <!-- Formulaire de notation -->
                  <div v-else class="bg-blue-50 rounded-lg p-4">
                    <h4 class="text-sm font-semibold text-gray-800 mb-3">Noter ce trajet</h4>

                    <!-- Sélection des étoiles -->
                    <div class="mb-3">
                      <label class="block text-xs text-gray-600 mb-2">Votre note *</label>
                      <div class="flex gap-1">
                        <button
                          v-for="star in 5"
                          :key="star"
                          @click="review.setRating(trip.id, star)"
                          type="button"
                          :class="[
                            'text-3xl transition-all',
                            review.reviewForms.value[trip.id]?.rating >= star ? 'text-yellow-400 scale-110' : 'text-gray-300 hover:text-yellow-200'
                          ]"
                        >
                          ★
                        </button>
                      </div>
                    </div>

                    <!-- Commentaire optionnel -->
                    <div class="mb-3">
                      <label class="block text-xs text-gray-600 mb-1">Commentaire (optionnel)</label>
                      <textarea
                        v-model="review.reviewForms.value[trip.id].comment"
                        rows="2"
                        placeholder="Partagez votre expérience..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ecoGreen focus:border-transparent"
                      ></textarea>
                    </div>

                    <!-- Erreur -->
                    <div v-if="review.getReviewError(trip.id)" class="mb-3 text-xs text-red-600">
                      {{ review.getReviewError(trip.id) }}
                    </div>

                    <!-- Boutons -->
                    <div class="flex gap-2">
                      <button
                        @click="review.submitReview(trip)"
                        :disabled="review.reviewForms.value[trip.id]?.submitting"
                        class="btn btn-sm btn-primary flex-1"
                      >
                        <span v-if="review.reviewForms.value[trip.id]?.submitting">Envoi...</span>
                        <span v-else>Soumettre</span>
                      </button>
                      <button
                        @click="review.closeReviewForm(trip.id)"
                        :disabled="review.reviewForms.value[trip.id]?.submitting"
                        class="btn btn-sm btn-secondary"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Délai dépassé -->
                <div v-else class="text-xs text-gray-400 italic">
                  Le délai pour noter ce trajet est dépassé (max 1 mois)
                </div>
                </div>
              </template>
            </TripCard>
          </div>
        </section>

      </div>
    </div>
  </main>
</template>
