<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTripStore } from '../store/trip.store'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const router = useRouter()
const tripStore = useTripStore()

// Données du formulaire
const startAddress = ref('')
const startLat = ref(null)
const startLng = ref(null)
const endAddress = ref('')
const endLat = ref(null)
const endLng = ref(null)
const startDate = ref('')
const startTime = ref('')
const pricePerSeat = ref(10)
const suggestedPrice = ref(null)
const totalSeats = ref(3)
const distance = ref(0)
const duration = ref(0) // Durée en minutes

// Suggestions d'autocomplétion
const startSuggestions = ref([])
const endSuggestions = ref([])
const showStartSuggestions = ref(false)
const showEndSuggestions = ref(false)

// Carte Leaflet
let map = null
let startMarker = null
let endMarker = null
let routeLine = null
let searchTimeout = null

// Note: Le prix suggéré est calculé dans updateRoute() avec la distance réelle de l'itinéraire

// Computed : Heure d'arrivée estimée
const estimatedArrivalTime = computed(() => {
  if (startDate.value && startTime.value && duration.value > 0) {
    const departure = new Date(`${startDate.value}T${startTime.value}`)
    const arrival = new Date(departure.getTime() + duration.value * 60000) // Ajouter les minutes
    return arrival.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  return null
})

// Computed : Durée formatée (Xh Ymin)
const formattedDuration = computed(() => {
  if (duration.value > 0) {
    const hours = Math.floor(duration.value / 60)
    const minutes = Math.round(duration.value % 60)
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }
  return null
})

onMounted(() => {
  setTimeout(() => {
    initMap()
  }, 100)
})

// Initialiser la carte
function initMap() {
  map = L.map('map').setView([46.603354, 1.888334], 6)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  map.on('click', async (e) => {
    const { lat, lng } = e.latlng

    // Géocodage inversé via le backend
    const addressData = await tripStore.reverseGeocode(lat, lng)
    const address = addressData.display_name

    if (!startLat.value) {
      setStartPoint(lat, lng, address)
    } else if (!endLat.value) {
      setEndPoint(lat, lng, address)
    } else {
      setEndPoint(lat, lng, address)
    }
  })
}

// Rechercher des adresses via le backend
async function searchAddress(query, type) {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (query.length < 3) {
    if (type === 'start') {
      startSuggestions.value = []
      showStartSuggestions.value = false
    } else {
      endSuggestions.value = []
      showEndSuggestions.value = false
    }
    return
  }

  searchTimeout = setTimeout(async () => {
    try {
      // Appeler le backend au lieu de Nominatim directement
      const results = await tripStore.searchAddress(query, 5)

      if (type === 'start') {
        startSuggestions.value = results
        showStartSuggestions.value = results.length > 0
      } else {
        endSuggestions.value = results
        showEndSuggestions.value = results.length > 0
      }
    } catch (error) {
      console.error('Erreur recherche adresse:', error)
      if (type === 'start') {
        showStartSuggestions.value = false
      } else {
        showEndSuggestions.value = false
      }
    }
  }, 500)
}

// Sélectionner une adresse
function selectAddress(type, suggestion) {
  const lat = parseFloat(suggestion.lat)
  const lng = parseFloat(suggestion.lon)
  const address = suggestion.display_name

  if (type === 'start') {
    setStartPoint(lat, lng, address)
    showStartSuggestions.value = false
  } else {
    setEndPoint(lat, lng, address)
    showEndSuggestions.value = false
  }
}

// Définir le point de départ
function setStartPoint(lat, lng, address) {
  startLat.value = lat
  startLng.value = lng
  startAddress.value = address

  if (startMarker) {
    map.removeLayer(startMarker)
  }

  startMarker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }).addTo(map)

  startMarker.bindPopup('🟢 Départ: ' + address).openPopup()
  updateRoute()
}

// Définir le point d'arrivée
function setEndPoint(lat, lng, address) {
  endLat.value = lat
  endLng.value = lng
  endAddress.value = address

  if (endMarker) {
    map.removeLayer(endMarker)
  }

  endMarker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }).addTo(map)

  endMarker.bindPopup('🔴 Arrivée: ' + address).openPopup()
  updateRoute()
}

// Mettre à jour la ligne d'itinéraire
async function updateRoute() {
  if (startLat.value && startLng.value && endLat.value && endLng.value) {
    try {
      // Récupérer l'itinéraire réel via le backend (OSRM)
      const route = await tripStore.getRoute(startLat.value, startLng.value, endLat.value, endLng.value)

      // Mettre à jour la distance et la durée RÉELLES (pas à vol d'oiseau)
      distance.value = Math.round(route.distance * 100) / 100 // Arrondi à 2 décimales
      duration.value = Math.round(route.duration) // Arrondi en minutes

      // Calculer le prix suggéré basé sur la distance réelle de l'itinéraire
      // Formule : distance × 0.06€/km (même que le backend)
      const calculatedPrice = Math.ceil(distance.value * 0.06)
      suggestedPrice.value = calculatedPrice
      pricePerSeat.value = calculatedPrice

      // Supprimer l'ancienne ligne
      if (routeLine) {
        map.removeLayer(routeLine)
      }

      // Convertir les coordonnées OSRM [lng, lat] en format Leaflet [lat, lng]
      const leafletCoords = route.coordinates.map(coord => [coord[1], coord[0]])

      // Tracer l'itinéraire réel
      routeLine = L.polyline(leafletCoords, {
        color: '#10b981',
        weight: 4,
        opacity: 0.8
      }).addTo(map)

      // Ajuster la vue pour montrer tout l'itinéraire
      map.fitBounds(routeLine.getBounds(), { padding: [50, 50] })
    } catch (error) {
      console.error('Erreur calcul itinéraire:', error)
      // Fallback : ligne droite en cas d'erreur
      if (routeLine) {
        map.removeLayer(routeLine)
      }
      routeLine = L.polyline(
        [[startLat.value, startLng.value], [endLat.value, endLng.value]],
        { color: '#10b981', weight: 3, opacity: 0.7, dashArray: '10, 10' }
      ).addTo(map)
      map.fitBounds(routeLine.getBounds(), { padding: [50, 50] })
    }
  }
}

// Soumettre le formulaire
async function createTrip() {
  // Validation
  if (!startLat.value || !endLat.value) {
    alert('Veuillez sélectionner un point de départ et d\'arrivée')
    return
  }

  if (!startDate.value || !startTime.value) {
    alert('Veuillez sélectionner une date et heure de départ')
    return
  }

  try {
    const startDateTime = `${startDate.value}T${startTime.value}:00`

    const tripData = {
      start_address: startAddress.value,
      start_latitude: startLat.value,
      start_longitude: startLng.value,
      end_address: endAddress.value,
      end_latitude: endLat.value,
      end_longitude: endLng.value,
      start_date: startDateTime,
      price_per_seat: parseInt(pricePerSeat.value),
      total_seats: parseInt(totalSeats.value)
    }

    // Utiliser le store au lieu d'axios direct
    await tripStore.createTrip(tripData)

    alert('Trajet créé avec succès !')
    router.push('/trajets')
  } catch (error) {
    console.error('Erreur création trajet:', error)
    alert(tripStore.error || 'Erreur lors de la création du trajet')
  }
}
</script>

<template>
  <div class="w-full px-4">
    <div class="max-w-7xl mx-auto">
      <!-- En-tête -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-ecoGreen to-green-600 bg-clip-text text-transparent mb-2">
          Créer un trajet
        </h1>
        <p class="text-gray-600">Proposez un covoiturage et partagez vos frais de transport</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Formulaire -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <h2 class="text-2xl font-bold mb-6">Détails du trajet</h2>

          <!-- Départ -->
          <div class="mb-5 relative">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              🟢 Point de départ *
            </label>
            <input
              v-model="startAddress"
              @input="searchAddress(startAddress, 'start')"
              @focus="showStartSuggestions = startSuggestions.length > 0"
              @blur="() => setTimeout(() => showStartSuggestions = false, 200)"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              placeholder="Ex: 10 Rue de la Gare, Paris"
              autocomplete="off"
            />
            <!-- Suggestions -->
            <ul
              v-if="showStartSuggestions && startSuggestions.length > 0"
              class="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto"
            >
              <li
                v-for="suggestion in startSuggestions"
                :key="suggestion.place_id"
                @mousedown="selectAddress('start', suggestion)"
                class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                {{ suggestion.display_name }}
              </li>
            </ul>
          </div>

          <!-- Arrivée -->
          <div class="mb-5 relative">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              🔴 Point d'arrivée *
            </label>
            <input
              v-model="endAddress"
              @input="searchAddress(endAddress, 'end')"
              @focus="showEndSuggestions = endSuggestions.length > 0"
              @blur="() => setTimeout(() => showEndSuggestions = false, 200)"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              placeholder="Ex: 5 Place Bellecour, Lyon"
              autocomplete="off"
            />
            <!-- Suggestions -->
            <ul
              v-if="showEndSuggestions && endSuggestions.length > 0"
              class="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto"
            >
              <li
                v-for="suggestion in endSuggestions"
                :key="suggestion.place_id"
                @mousedown="selectAddress('end', suggestion)"
                class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                {{ suggestion.display_name }}
              </li>
            </ul>
          </div>

          <!-- Informations sur l'itinéraire -->
          <div v-if="distance > 0" class="mb-5 p-4 bg-green-50 rounded-lg space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-2xl">📏</span>
              <div>
                <div class="font-semibold text-ecoGreen">Distance: {{ distance }} km</div>
                <div class="text-sm text-gray-600">Itinéraire routier (OSRM)</div>
              </div>
            </div>

            <div v-if="formattedDuration" class="flex items-center gap-2">
              <span class="text-2xl">⏱️</span>
              <div>
                <div class="font-semibold text-ecoGreen">Durée estimée: {{ formattedDuration }}</div>
                <div v-if="estimatedArrivalTime" class="text-sm text-gray-600">
                  Arrivée prévue: {{ estimatedArrivalTime }}
                </div>
              </div>
            </div>
          </div>

          <!-- Date et heure -->
          <div class="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                📅 Date *
              </label>
              <input
                v-model="startDate"
                type="date"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ⏰ Heure *
              </label>
              <input
                v-model="startTime"
                type="time"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              />
            </div>
          </div>

          <!-- Prix et places -->
          <div class="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                💰 Prix par siège (€) *
                <span v-if="suggestedPrice" class="text-xs text-gray-500 font-normal ml-1">
                  (suggéré: {{ suggestedPrice }}€)
                </span>
              </label>
              <input
                v-model="pricePerSeat"
                type="number"
                min="1"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              />
              <p v-if="suggestedPrice && pricePerSeat != suggestedPrice" class="text-xs text-gray-500 mt-1">
                💡 Vous pouvez ajuster le prix suggéré
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                👥 Places disponibles *
              </label>
              <input
                v-model="totalSeats"
                type="number"
                min="1"
                max="8"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              />
            </div>
          </div>

          <!-- Bouton -->
          <button
            @click="createTrip"
            :disabled="tripStore.loading"
            class="w-full bg-gradient-to-r from-ecoGreen to-green-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ tripStore.loading ? 'Création en cours...' : 'Créer le trajet 🚗' }}
          </button>

          <p class="text-xs text-gray-500 mt-4 text-center">
            * Champs obligatoires
          </p>
        </div>

        <!-- Carte -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div class="p-4 bg-gradient-to-r from-ecoGreen to-green-600 text-white">
            <h3 class="font-semibold">📍 Cliquez sur la carte pour définir votre itinéraire</h3>
            <p class="text-sm text-green-100">Ou utilisez la recherche d'adresse</p>
          </div>
          <div id="map" style="height: 600px;"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fix pour les icônes Leaflet */
:deep(.leaflet-default-icon-path) {
  background-image: url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png');
}
</style>
