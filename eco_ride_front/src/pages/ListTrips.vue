<script setup>
import { ref, onMounted, computed } from 'vue'
import 'leaflet/dist/leaflet.css'
import { formatDateLong as formatDate } from '../utils/formatters'
import { useLeafletMap } from '../composables/useLeafletMap'
import AddressAutocompleteInput from '../components/ui/AddressAutocompleteInput.vue'
import TripCard from '../components/trip/TripCard.vue'
import BookingModal from '../components/booking/BookingModal.vue'
import DriverReviewsModal from '../components/review/DriverReviewsModal.vue'
import AlertMessage from '../components/ui/AlertMessage.vue'
import { useUserStore } from '@/store/index.js'
import { useTripStore } from '@/store/index.js'

const userStore = useUserStore()
const tripStore = useTripStore()

// Filtres de recherche
const startAddress = ref('')
const startLat = ref(null)
const startLng = ref(null)
const endAddress = ref('')
const endLat = ref(null)
const endLng = ref(null)
const startDate = ref('')
const endDate = ref('')
const radius = ref(50) // Rayon de recherche en km

// Carte Leaflet (via composable)
const leafletMap = useLeafletMap({
  center: [46.603354, 1.888334],
  zoom: 6,
  onMapClick: async (lat, lng) => {
    const address = await reverseGeocode(lat, lng)
    if (!startLat.value) {
      handleStartSelected({ lat, lng, address })
    } else if (!endLat.value) {
      handleEndSelected({ lat, lng, address })
    } else {
      handleEndSelected({ lat, lng, address })
    }
  }
})

// Données
const trips = ref([])
const loading = ref(false)
const error = ref('')

// Modale de réservation
const showBookingModal = ref(false)
const selectedTrip = ref(null)

// Modale des avis du conducteur
const showDriverReviewsModal = ref(false)
const selectedDriver = ref(null)

// Filtrer les trajets pour ne pas afficher ceux où l'utilisateur est conducteur
const filteredTrips = computed(() => {
  if (!userStore.user) return trips.value
  return trips.value.filter(trip => trip.driver_id !== userStore.user.id)
})

// Charger les trajets au montage
onMounted(() => {
  setTimeout(() => {
    leafletMap.initMap('map')
  }, 100)
  loadTrips()
})

// Gérer la sélection d'une adresse de départ
function handleStartSelected(result) {
  startLat.value = result.lat
  startLng.value = result.lng
  startAddress.value = result.address
  leafletMap.setStartPoint(result.lat, result.lng, result.address, radius.value)
}

// Gérer la sélection d'une adresse d'arrivée
function handleEndSelected(result) {
  endLat.value = result.lat
  endLng.value = result.lng
  endAddress.value = result.address
  leafletMap.setEndPoint(result.lat, result.lng, result.address, radius.value)
}

// Mettre à jour le rayon de recherche
function updateRadiusCircles() {
  leafletMap.updateRadius(radius.value)
}

// Géocodage inversé
async function reverseGeocode(lat, lng) {
  try {
    const result = await tripStore.reverseGeocode(lat, lng)
    return result.display_name
  } catch (error) {
    console.error('Erreur géocodage inversé:', error)
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
}

// Charger les trajets avec filtres
async function loadTrips() {
  loading.value = true
  error.value = ''

  // Nettoyer les marqueurs de trajets précédents
  leafletMap.clearTripMarkers()

  try {
    const filters = {}

    // Recherche géographique (prioritaire)
    if (startLat.value && startLng.value && endLat.value && endLng.value) {
      filters.startLat = startLat.value
      filters.startLng = startLng.value
      filters.endLat = endLat.value
      filters.endLng = endLng.value
      filters.radius = radius.value
    }

    // Filtres de date
    if (startDate.value) {
      filters.startDate = startDate.value
    }
    if (endDate.value) {
      filters.endDate = endDate.value
    }

    trips.value = await tripStore.fetchTrips(filters)

    // Afficher les trajets sur la carte
    leafletMap.displayTrips(trips.value)
  } catch (err) {
    console.error('Erreur chargement trajets:', err)
    error.value = 'Impossible de charger les trajets'
  } finally {
    loading.value = false
  }
}

// Réinitialiser les filtres
function resetFilters() {
  startAddress.value = ''
  startLat.value = null
  startLng.value = null
  endAddress.value = ''
  endLat.value = null
  endLng.value = null
  startDate.value = ''
  endDate.value = ''
  radius.value = 50

  // Réinitialiser la carte
  leafletMap.reset()

  loadTrips()
}

// Ouvrir la modale de réservation
function openBookingModal(trip, event) {
  event.stopPropagation() // Empêcher le clic sur la carte
  selectedTrip.value = trip
  showBookingModal.value = true
}

// Fermer la modale
function closeBookingModal() {
  showBookingModal.value = false
  selectedTrip.value = null
}

// Ouvrir la modale des avis du conducteur
function openDriverReviewsModal(trip, event) {
  event.stopPropagation() // Empêcher le clic sur la carte
  selectedDriver.value = {
    name: trip.driver_name,
    lastName: trip.driver_last_name,
    rating: trip.driver_rating,
    ratingCount: trip.driver_rating_count,
    reviews: trip.driver_reviews || []
  }
  showDriverReviewsModal.value = true
}

// Fermer la modale des avis
function closeDriverReviewsModal() {
  showDriverReviewsModal.value = false
  selectedDriver.value = null
}

// Succès de la réservation
function handleBookingSuccess() {
  showBookingModal.value = false
  selectedTrip.value = null
  // Recharger les trajets pour mettre à jour les places disponibles
  loadTrips()
}
</script>

<template>
  <main class="w-full px-4 pb-8">
    <div class="max-w-7xl mx-auto">
      <!-- En-tête -->
      <header class="mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-ecoGreen to-green-600 bg-clip-text text-transparent mb-2">
          {{ $t('listTrips.title') }}
        </h1>
        <p class="text-gray-600">{{ $t('listTrips.subtitle') }}</p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Formulaire de recherche -->
        <div class="card card-body">
          <h2 class="text-xl font-bold mb-4">{{ $t('listTrips.searchTitle') }}</h2>
          <p class="text-sm text-gray-600 mb-4">
            {{ $t('listTrips.searchDescription', { radius }) }}
          </p>

          <!-- Départ -->
          <AddressAutocompleteInput
            v-model:latitude="startLat"
            v-model:longitude="startLng"
            v-model:address="startAddress"
            :label="`🟢 ${$t('listTrips.startPoint')}`"
            :placeholder="$t('listTrips.startPlaceholder')"
            class="mb-4"
            @select="handleStartSelected"
          />

          <!-- Arrivée -->
          <AddressAutocompleteInput
            v-model:latitude="endLat"
            v-model:longitude="endLng"
            v-model:address="endAddress"
            :label="`🔴 ${$t('listTrips.endPoint')}`"
            :placeholder="$t('listTrips.endPlaceholder')"
            class="mb-4"
            @select="handleEndSelected"
          />

          <!-- Rayon de recherche -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              📏 {{ $t('listTrips.radius', { radius }) }}
            </label>
            <input
              v-model="radius"
              @input="updateRadiusCircles"
              type="range"
              min="10"
              max="100"
              step="10"
              class="w-full"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>10 km</span>
              <span>100 km</span>
            </div>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ $t('listTrips.startDate') }}
              </label>
              <input
                v-model="startDate"
                type="date"
                class="input-field w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ $t('listTrips.endDate') }}
              </label>
              <input
                v-model="endDate"
                type="date"
                class="input-field w-full"
              />
            </div>
          </div>

          <!-- Boutons -->
          <div class="flex gap-3">
            <button
              @click="loadTrips"
              :disabled="!startLat || !endLat"
              class="btn btn-primary btn-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t('listTrips.search') }}
            </button>
            <button
              @click="resetFilters"
              class="btn btn-secondary btn-sm px-6"
            >
              {{ $t('listTrips.reset') }}
            </button>
          </div>
        </div>

        <!-- Carte -->
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">📍 {{ $t('listTrips.mapTitle') }}</h3>
            <p class="text-sm text-green-100">{{ $t('listTrips.mapDescription') }}</p>
            <p class="text-xs text-green-200 mt-1">💡 {{ $t('listTrips.mapZoomTip') }}</p>
          </div>
          <div id="map" style="height: 500px;" class="focus:outline-none" tabindex="0"></div>
        </div>
      </div>

      <!-- Message d'erreur -->
      <AlertMessage
        v-if="error"
        type="error"
        :message="error"
        class="mb-6"
      />

      <!-- Chargement -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-ecoGreen"></div>
        <p class="mt-4 text-gray-600">{{ $t('listTrips.loading') }}</p>
      </div>

      <!-- Aucun trajet trouvé -->
      <div v-else-if="!loading && filteredTrips.length === 0" class="card card-body text-center">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-bold text-gray-700 mb-2">{{ $t('listTrips.noTripsFound') }}</h3>
        <p class="text-gray-600 mb-6">{{ $t('listTrips.noTripsMessage') }}</p>
        <button
          @click="resetFilters"
          class="btn btn-primary btn-sm"
        >
          {{ $t('listTrips.resetFilters') }}
        </button>
      </div>

      <!-- Liste des trajets -->
      <section v-else class="grid grid-cols-1 gap-6">
        <TripCard
          v-for="trip in filteredTrips"
          :key="trip.id"
          :trip="trip"
          :show-driver="true"
          :show-price="true"
          :show-eco-impact="true"
          :clickable="false"
          :seats="1"
        >
          <!-- Actions conducteur -->
          <template #driver-actions>
            <button
              v-if="trip.driver_rating_count > 0"
              @click="openDriverReviewsModal(trip, $event)"
              class="text-xs text-ecoGreen hover:text-green-700 font-medium underline"
            >
              Voir les avis
            </button>
          </template>

          <!-- Footer avec actions -->
          <template #footer>
            <div class="flex justify-between items-center">
              <div class="text-sm text-gray-500">
                {{ $t('listTrips.clickForDetails') }}
              </div>
              <button
                @click="openBookingModal(trip, $event)"
                class="btn btn-primary btn-sm"
              >
                {{ $t('listTrips.book') }}
              </button>
            </div>
          </template>
        </TripCard>
      </section>

      <!-- Message nombre de résultats -->
      <div v-if="!loading && filteredTrips.length > 0" class="mt-6 text-center text-gray-600">
        {{ filteredTrips.length }} trajet{{ filteredTrips.length > 1 ? 's' : '' }} trouvé{{ filteredTrips.length > 1 ? 's' : '' }} dans un rayon de {{ radius }}km
      </div>
    </div>

    <!-- Modale de réservation -->
    <BookingModal
      v-if="selectedTrip"
      :trip="selectedTrip"
      :show="showBookingModal"
      @close="closeBookingModal"
      @success="handleBookingSuccess"
    />

    <!-- Modale des avis du conducteur -->
    <DriverReviewsModal
      v-if="selectedDriver"
      :show="showDriverReviewsModal"
      :driver-name="selectedDriver.name"
      :driver-last-name="selectedDriver.lastName"
      :driver-rating="selectedDriver.rating"
      :driver-rating-count="selectedDriver.ratingCount"
      :reviews="selectedDriver.reviews"
      @close="closeDriverReviewsModal"
    />
  </main>
</template>
