<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTripStore } from '@/store/index.js'
import { Trip } from '@/models/Trip.js'
import TripMap from '../components/trip/TripMap.vue'
import AlertMessage from '../components/ui/AlertMessage.vue'
import FormField from '../components/ui/FormField.vue'
import AddressAutocompleteInput from '../components/ui/AddressAutocompleteInput.vue'

const router = useRouter()
const tripStore = useTripStore()

// Utilisation du modèle Trip
const trip = reactive(new Trip())

// Gestion des erreurs
const errors = ref({})
const errorMessage = ref('')
const successMessage = ref('')

// Computed : Heure d'arrivée estimée
const estimatedArrivalTime = computed(() => {
  if (trip.start_date && trip.start_time && trip.duration_minutes > 0) {
    const departure = new Date(`${trip.start_date}T${trip.start_time}`)
    const arrival = new Date(departure.getTime() + trip.duration_minutes * 60000) // Ajouter les minutes
    return arrival.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  return null
})

// Computed : Durée formatée (Xh Ymin)
const formattedDuration = computed(() => {
  if (trip.duration_minutes > 0) {
    const hours = Math.floor(trip.duration_minutes / 60)
    const minutes = Math.round(trip.duration_minutes % 60)
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }
  return null
})

// Gérer la sélection d'une adresse de départ
function handleStartSelected() {
  updateRoute()
}

// Gérer la sélection d'une adresse d'arrivée
function handleEndSelected() {
  updateRoute()
}

// Gérer l'effacement du point de départ
function handleStartCleared() {
  trip.distance_km = 0
  trip.duration_minutes = 0
  trip.suggested_price = null
}

// Gérer l'effacement du point d'arrivée
function handleEndCleared() {
  trip.distance_km = 0
  trip.duration_minutes = 0
  trip.suggested_price = null
}

// Calculer la distance et le prix
async function updateRoute() {
  if (trip.start_latitude && trip.start_longitude && trip.end_latitude && trip.end_longitude) {
    try {
      // Récupérer l'itinéraire réel via le backend (OSRM)
      const route = await tripStore.getRoute(trip.start_latitude, trip.start_longitude, trip.end_latitude, trip.end_longitude)

      // Mettre à jour la distance et la durée RÉELLES (pas à vol d'oiseau)
      trip.distance_km = Math.round(route.distance * 100) / 100 // Arrondi à 2 décimales
      trip.duration_minutes = Math.round(route.duration) // Arrondi en minutes

      // Calculer le prix suggéré basé sur la distance réelle de l'itinéraire
      // Formule : distance × 0.06€/km (même que le backend)
      const calculatedPrice = Math.ceil(trip.distance_km * 0.06)
      trip.suggested_price = calculatedPrice
      trip.price_per_seat = calculatedPrice

      // La carte TripMap tracera automatiquement la route via son watch
    } catch (error) {
      console.error('Erreur calcul itinéraire:', error)
    }
  }
}

// Valider le formulaire
function validateForm() {
  errors.value = {}
  errorMessage.value = ''

  // Utiliser la validation du modèle comme base
  if (!trip.isValid()) {
    if (!trip.start_latitude || !trip.end_latitude) {
      errors.value.addresses = 'Veuillez sélectionner un point de départ et d\'arrivée'
    }
    if (!trip.start_date) {
      errors.value.date = 'La date de départ est obligatoire'
    }
    if (!trip.start_time) {
      errors.value.time = 'L\'heure de départ est obligatoire'
    }
  }

  // Validation supplémentaire de la distance
  if (trip.distance_km === 0) {
    errors.value.distance = 'L\'itinéraire n\'a pas été calculé'
  }

  // Vérifier que la date est dans le futur
  if (trip.start_date && trip.start_time) {
    const departureDate = new Date(`${trip.start_date}T${trip.start_time}`)
    if (departureDate < new Date()) {
      errors.value.date = 'La date de départ doit être dans le futur'
    }
  }

  // Validation du prix
  if (!trip.price_per_seat || trip.price_per_seat < 1) {
    errors.value.price = 'Le prix doit être supérieur à 0€'
  }

  if (trip.price_per_seat > 500) {
    errors.value.price = 'Le prix semble trop élevé (max 500€)'
  }

  // Validation des places
  if (!trip.total_seats || trip.total_seats < 1) {
    errors.value.seats = 'Le nombre de places doit être supérieur à 0'
  }

  if (trip.total_seats > 8) {
    errors.value.seats = 'Le nombre de places ne peut pas dépasser 8'
  }

  return Object.keys(errors.value).length === 0
}

// Soumettre le formulaire
async function createTrip() {
  // Réinitialiser les messages
  successMessage.value = ''
  errorMessage.value = ''

  // Validation
  if (!validateForm()) {
    errorMessage.value = 'Veuillez corriger les erreurs dans le formulaire'
    return
  }

  try {
    // Utiliser la méthode toDTO() du modèle Trip
    const tripData = trip.toDTO()

    // Utiliser le store au lieu d'axios direct
    await tripStore.createTrip(tripData)

    successMessage.value = 'Trajet créé avec succès !'
    setTimeout(() => {
      router.push('/mes-trajets')
    }, 1500)
  } catch (error) {
    console.error('Erreur création trajet:', error)
    errorMessage.value = tripStore.error || error.response?.data?.message || 'Erreur lors de la création du trajet'
  }
}
</script>

<template>
  <main class="w-full px-4">
    <div class="max-w-7xl mx-auto">
      <!-- En-tête -->
      <header class="mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-ecoGreen to-green-600 bg-clip-text text-transparent mb-2">
          {{ $t('createTrip.title') }}
        </h1>
        <p class="text-gray-600">{{ $t('createTrip.subtitle') }}</p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Formulaire -->
        <div class="card card-body">
          <h2 class="text-2xl font-bold mb-6">{{ $t('createTrip.formTitle') }}</h2>

          <!-- Message d'erreur général -->
          <AlertMessage
            v-if="errorMessage"
            type="error"
            :message="errorMessage"
            class="mb-5"
          />

          <!-- Message de succès -->
          <AlertMessage
            v-if="successMessage"
            type="success"
            :message="successMessage"
            class="mb-5"
          />

          <!-- Départ -->
          <AddressAutocompleteInput
            v-model:latitude="trip.start_latitude"
            v-model:longitude="trip.start_longitude"
            v-model:address="trip.start_address"
            :label="`🟢 ${$t('createTrip.startPoint')}`"
            :placeholder="$t('createTrip.startPlaceholder')"
            :error="errors.addresses"
            required
            class="mb-5"
            @select="handleStartSelected"
            @clear="handleStartCleared"
          />

          <!-- Arrivée -->
          <AddressAutocompleteInput
            v-model:latitude="trip.end_latitude"
            v-model:longitude="trip.end_longitude"
            v-model:address="trip.end_address"
            :label="`🔴 ${$t('createTrip.endPoint')}`"
            :placeholder="$t('createTrip.endPlaceholder')"
            :error="errors.addresses"
            required
            class="mb-5"
            @select="handleEndSelected"
            @clear="handleEndCleared"
          />

          <!-- Informations sur l'itinéraire -->
          <div v-if="trip.distance_km > 0" class="mb-5 p-4 bg-green-50 rounded-lg space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-2xl">📏</span>
              <div>
                <div class="font-semibold text-ecoGreen">{{ $t('createTrip.routeInfo.distance', { distance: trip.distance_km }) }}</div>
                <div class="text-sm text-gray-600">{{ $t('createTrip.routeInfo.routeType') }}</div>
              </div>
            </div>

            <div v-if="formattedDuration" class="flex items-center gap-2">
              <span class="text-2xl">⏱️</span>
              <div>
                <div class="font-semibold text-ecoGreen">{{ $t('createTrip.routeInfo.duration', { duration: formattedDuration }) }}</div>
                <div v-if="estimatedArrivalTime" class="text-sm text-gray-600">
                  {{ $t('createTrip.routeInfo.arrival', { time: estimatedArrivalTime }) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Date et heure -->
          <div class="grid grid-cols-2 gap-4 mb-5">
            <FormField
              v-model="trip.start_date"
              :label="$t('createTrip.date')"
              type="date"
              icon="📅"
              required
              :error="errors.date"
            />
            <FormField
              v-model="trip.start_time"
              :label="$t('createTrip.time')"
              type="time"
              icon="⏰"
              required
              :error="errors.time"
            />
          </div>

          <!-- Prix et places -->
          <div class="grid grid-cols-2 gap-4 mb-5">
            <div>
              <FormField
                v-model="trip.price_per_seat"
                :label="$t('createTrip.pricePerSeat')"
                type="number"
                icon="💰"
                required
                min="1"
                :error="errors.price"
              />
              <p v-if="trip.suggested_price" class="text-xs text-gray-500 -mt-3 mb-3">
                <span v-if="trip.price_per_seat != trip.suggested_price">💡 {{ $t('createTrip.adjustPrice') }} - </span>
                {{ $t('createTrip.suggestedPrice', { price: trip.suggested_price }) }}
              </p>
            </div>
            <FormField
              v-model="trip.total_seats"
              :label="$t('createTrip.availableSeats')"
              type="number"
              icon="👥"
              required
              min="1"
              max="8"
              :error="errors.seats"
            />
          </div>

          <!-- Bouton -->
          <button
            @click="createTrip"
            :disabled="tripStore.loading"
            class="btn btn-primary btn-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ tripStore.loading ? $t('createTrip.creating') : $t('createTrip.submit') }}
          </button>

          <p class="text-xs text-gray-500 mt-4 text-center">
            * {{ $t('createTrip.requiredFields') }}
          </p>
        </div>

        <!-- Carte -->
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">📍 {{ $t('createTrip.mapTitle') }}</h3>
            <p class="text-sm text-green-100">{{ $t('createTrip.mapSubtitle') }}</p>
          </div>
          <div class="p-4">
            <TripMap
              :start-lat="trip.start_latitude"
              :start-lng="trip.start_longitude"
              :end-lat="trip.end_latitude"
              :end-lng="trip.end_longitude"
              :start-address="trip.start_address"
              :end-address="trip.end_address"
              height="600px"
            />
            <p v-if="!trip.start_latitude || !trip.end_latitude" class="text-sm text-gray-500 mt-3 text-center">
              💡 Sélectionnez un point de départ et d'arrivée pour afficher l'itinéraire
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Fix pour les icônes Leaflet */
:deep(.leaflet-default-icon-path) {
  background-image: url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png');
}
</style>
