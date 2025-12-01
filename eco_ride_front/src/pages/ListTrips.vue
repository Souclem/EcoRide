<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const router = useRouter()

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

// Suggestions d'autocomplétion
const startSuggestions = ref([])
const endSuggestions = ref([])
const showStartSuggestions = ref(false)
const showEndSuggestions = ref(false)
let searchTimeout = null

// Carte et marqueurs
let map = null
let startMarker = null
let endMarker = null
let startCircle = null
let endCircle = null
let tripMarkers = []
let tripLines = []

// Données
const trips = ref([])
const loading = ref(false)
const error = ref('')

// Charger les trajets au montage
onMounted(() => {
  setTimeout(() => {
    initMap()
  }, 100)
  loadTrips()
})

// Initialiser la carte
function initMap() {
  map = L.map('map').setView([46.603354, 1.888334], 6)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  // Clic sur la carte pour définir des points
  map.on('click', async (e) => {
    const { lat, lng } = e.latlng
    const address = await reverseGeocode(lat, lng)

    if (!startLat.value) {
      setStartPoint(lat, lng, address)
    } else if (!endLat.value) {
      setEndPoint(lat, lng, address)
    } else {
      setEndPoint(lat, lng, address)
    }
  })
}

// Recherche d'adresses avec autocomplétion
function searchAddress(query, type) {
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
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&limit=5&countrycodes=fr`
      )

      if (type === 'start') {
        startSuggestions.value = response.data
        showStartSuggestions.value = response.data.length > 0
      } else {
        endSuggestions.value = response.data
        showEndSuggestions.value = response.data.length > 0
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
  if (startCircle) {
    map.removeLayer(startCircle)
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

  startMarker.bindPopup('🟢 Départ: ' + address)

  // Cercle de rayon de recherche
  startCircle = L.circle([lat, lng], {
    radius: radius.value * 1000,
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.1
  }).addTo(map)

  updateMapView()
}

// Définir le point d'arrivée
function setEndPoint(lat, lng, address) {
  endLat.value = lat
  endLng.value = lng
  endAddress.value = address

  if (endMarker) {
    map.removeLayer(endMarker)
  }
  if (endCircle) {
    map.removeLayer(endCircle)
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

  endMarker.bindPopup('🔴 Arrivée: ' + address)

  // Cercle de rayon de recherche
  endCircle = L.circle([lat, lng], {
    radius: radius.value * 1000,
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.1
  }).addTo(map)

  updateMapView()
}

// Ajuster la vue de la carte
function updateMapView() {
  const bounds = []
  if (startMarker) bounds.push(startMarker.getLatLng())
  if (endMarker) bounds.push(endMarker.getLatLng())

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [100, 100] })
  }
}

// Mettre à jour le rayon de recherche
function updateRadius() {
  if (startCircle) {
    startCircle.setRadius(radius.value * 1000)
  }
  if (endCircle) {
    endCircle.setRadius(radius.value * 1000)
  }
}

// Géocodage inversé
async function reverseGeocode(lat, lng) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${lat}&lon=${lng}&format=json`
    )
    return response.data.display_name
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
  tripMarkers.forEach(marker => map.removeLayer(marker))
  tripLines.forEach(line => map.removeLayer(line))
  tripMarkers = []
  tripLines = []

  try {
    const params = new URLSearchParams()

    // Recherche géographique (prioritaire)
    if (startLat.value && startLng.value && endLat.value && endLng.value) {
      params.append('startLat', startLat.value)
      params.append('startLng', startLng.value)
      params.append('endLat', endLat.value)
      params.append('endLng', endLng.value)
      params.append('radius', radius.value)
    }

    // Filtres de date
    if (startDate.value) {
      params.append('startDate', startDate.value)
    }
    if (endDate.value) {
      params.append('endDate', endDate.value)
    }

    const url = `http://localhost:3000/api/trips${params.toString() ? '?' + params.toString() : ''}`
    const response = await axios.get(url)

    trips.value = response.data.trips

    // Afficher les trajets sur la carte
    displayTripsOnMap(trips.value)
  } catch (err) {
    console.error('Erreur chargement trajets:', err)
    error.value = 'Impossible de charger les trajets'
  } finally {
    loading.value = false
  }
}

// Afficher les trajets sur la carte
function displayTripsOnMap(tripsToDisplay) {
  if (!map) return

  tripsToDisplay.forEach(trip => {
    // Ligne du trajet
    const line = L.polyline(
      [[trip.start_latitude, trip.start_longitude], [trip.end_latitude, trip.end_longitude]],
      { color: '#3b82f6', weight: 2, opacity: 0.6 }
    ).addTo(map)
    tripLines.push(line)

    // Marqueur au départ (bleu)
    const marker = L.circleMarker([trip.start_latitude, trip.start_longitude], {
      radius: 6,
      fillColor: '#3b82f6',
      color: '#1e40af',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map)

    marker.bindPopup(`
      <b>${trip.start_address}</b><br>
      → ${trip.end_address}<br>
      ${trip.price_per_seat}€/place
    `)

    tripMarkers.push(marker)
  })
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

  if (startMarker) map.removeLayer(startMarker)
  if (endMarker) map.removeLayer(endMarker)
  if (startCircle) map.removeLayer(startCircle)
  if (endCircle) map.removeLayer(endCircle)
  tripMarkers.forEach(marker => map.removeLayer(marker))
  tripLines.forEach(line => map.removeLayer(line))

  startMarker = null
  endMarker = null
  startCircle = null
  endCircle = null
  tripMarkers = []
  tripLines = []

  map.setView([46.603354, 1.888334], 6)
  loadTrips()
}

// Formater la date
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Naviguer vers les détails d'un trajet
function viewTripDetails(tripId) {
  router.push(`/trips/${tripId}`)
}
</script>

<template>
  <div class="w-full px-4 pb-8">
    <div class="max-w-7xl mx-auto">
      <!-- En-tête -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-ecoGreen to-green-600 bg-clip-text text-transparent mb-2">
          Rechercher un trajet
        </h1>
        <p class="text-gray-600">Trouvez un covoiturage qui correspond à vos besoins</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Formulaire de recherche -->
        <div class="bg-white rounded-2xl shadow-xl p-6">
          <h2 class="text-xl font-bold mb-4">Recherche géographique</h2>
          <p class="text-sm text-gray-600 mb-4">
            Utilisez la carte ou la recherche pour définir votre trajet. Les trajets dans un rayon de {{ radius }}km seront affichés.
          </p>

          <!-- Départ -->
          <div class="mb-4 relative">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              🟢 Point de départ
            </label>
            <input
              v-model="startAddress"
              @input="searchAddress(startAddress, 'start')"
              @focus="showStartSuggestions = startSuggestions.length > 0"
              @blur="() => setTimeout(() => showStartSuggestions = false, 200)"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              placeholder="Ville de départ"
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
          <div class="mb-4 relative">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              🔴 Point d'arrivée
            </label>
            <input
              v-model="endAddress"
              @input="searchAddress(endAddress, 'end')"
              @focus="showEndSuggestions = endSuggestions.length > 0"
              @blur="() => setTimeout(() => showEndSuggestions = false, 200)"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              placeholder="Ville d'arrivée"
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

          <!-- Rayon de recherche -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              📏 Rayon de recherche: {{ radius }} km
            </label>
            <input
              v-model="radius"
              @input="updateRadius"
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
                Date de début
              </label>
              <input
                v-model="startDate"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                v-model="endDate"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              />
            </div>
          </div>

          <!-- Boutons -->
          <div class="flex gap-3">
            <button
              @click="loadTrips"
              :disabled="!startLat || !endLat"
              class="flex-1 bg-gradient-to-r from-ecoGreen to-green-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rechercher
            </button>
            <button
              @click="resetFilters"
              class="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        <!-- Carte -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div class="p-4 bg-gradient-to-r from-ecoGreen to-green-600 text-white">
            <h3 class="font-semibold">📍 Carte de recherche</h3>
            <p class="text-sm text-green-100">Cliquez pour définir votre trajet - Les cercles montrent le rayon de recherche</p>
          </div>
          <div id="map" style="height: 500px;"></div>
        </div>
      </div>

      <!-- Message d'erreur -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        {{ error }}
      </div>

      <!-- Chargement -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-ecoGreen"></div>
        <p class="mt-4 text-gray-600">Chargement des trajets...</p>
      </div>

      <!-- Aucun trajet trouvé -->
      <div v-else-if="!loading && trips.length === 0" class="text-center py-12 bg-white rounded-2xl shadow-xl">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-bold text-gray-700 mb-2">Aucun trajet trouvé</h3>
        <p class="text-gray-600 mb-6">Essayez d'augmenter le rayon de recherche ou de modifier vos critères</p>
        <button
          @click="resetFilters"
          class="bg-gradient-to-r from-ecoGreen to-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          Réinitialiser les filtres
        </button>
      </div>

      <!-- Liste des trajets -->
      <div v-else class="grid grid-cols-1 gap-6">
        <div
          v-for="trip in trips"
          :key="trip.id"
          class="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
          @click="viewTripDetails(trip.id)"
        >
          <div class="p-6">
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1">
                <!-- Départ et Arrivée -->
                <div class="space-y-3 mb-4">
                  <div class="flex items-start gap-3">
                    <span class="text-2xl">🟢</span>
                    <div>
                      <div class="text-sm text-gray-500">Départ</div>
                      <div class="font-semibold text-gray-900">{{ trip.start_address }}</div>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="text-2xl">🔴</span>
                    <div>
                      <div class="text-sm text-gray-500">Arrivée</div>
                      <div class="font-semibold text-gray-900">{{ trip.end_address }}</div>
                    </div>
                  </div>
                </div>

                <!-- Informations du trajet -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">📅</span>
                    <div>
                      <div class="text-xs text-gray-500">Date</div>
                      <div class="font-medium text-sm">{{ formatDate(trip.start_date) }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xl">📏</span>
                    <div>
                      <div class="text-xs text-gray-500">Distance</div>
                      <div class="font-medium text-sm">{{ trip.distance_km }} km</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xl">👥</span>
                    <div>
                      <div class="text-xs text-gray-500">Places</div>
                      <div class="font-medium text-sm">{{ trip.total_seats - trip.taken_seats }} / {{ trip.total_seats }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xl">💰</span>
                    <div>
                      <div class="text-xs text-gray-500">Prix</div>
                      <div class="font-medium text-sm">{{ trip.price_per_seat }}€ / place</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Prix en grand -->
              <div class="ml-4 text-right">
                <div class="text-3xl font-bold text-ecoGreen">{{ trip.price_per_seat }}€</div>
                <div class="text-sm text-gray-500">par place</div>
              </div>
            </div>

            <!-- Économie CO2 -->
            <div v-if="trip.co2" class="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
              <span class="text-xl">🌱</span>
              <div class="text-sm">
                <span class="font-semibold text-ecoGreen">{{ trip.co2 }} kg CO2</span>
                <span class="text-gray-600"> économisés par ce trajet</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-3 flex justify-between items-center">
            <div class="text-sm text-gray-500">
              Cliquez pour voir les détails
            </div>
            <button
              class="bg-gradient-to-r from-ecoGreen to-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
            >
              Voir le trajet
            </button>
          </div>
        </div>
      </div>

      <!-- Message nombre de résultats -->
      <div v-if="!loading && trips.length > 0" class="mt-6 text-center text-gray-600">
        {{ trips.length }} trajet{{ trips.length > 1 ? 's' : '' }} trouvé{{ trips.length > 1 ? 's' : '' }} dans un rayon de {{ radius }}km
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
