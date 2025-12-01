import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as tripApi from '../api/trip.api'
import { Trip } from '../models/Trip'

export const useTripStore = defineStore('trip', () => {
  // State
  const trips = ref([])
  const currentTrip = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchTrips(filters = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await tripApi.getAvailableTrips(filters)
      trips.value = response.data.trips.map(tripData => new Trip(tripData))
      return trips.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des trajets'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTripById(id) {
    loading.value = true
    error.value = null

    try {
      const response = await tripApi.getTripById(id)
      currentTrip.value = new Trip(response.data.trip)
      return currentTrip.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération du trajet'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTrip(tripData) {
    loading.value = true
    error.value = null

    try {
      const response = await tripApi.createTrip(tripData)
      const newTrip = new Trip(response.data.trip)
      trips.value.unshift(newTrip)
      return newTrip
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la création du trajet'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function calculateEstimate(startLat, startLng, endLat, endLng) {
    try {
      const response = await tripApi.calculateEstimate(startLat, startLng, endLat, endLng)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du calcul'
      throw err
    }
  }

  async function searchAddress(query, limit = 5) {
    try {
      const response = await tripApi.searchAddress(query, limit)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la recherche d\'adresse'
      throw err
    }
  }

  async function reverseGeocode(lat, lng) {
    try {
      const response = await tripApi.reverseGeocode(lat, lng)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du géocodage inversé'
      throw err
    }
  }

  async function getRoute(startLat, startLng, endLat, endLng) {
    try {
      const response = await tripApi.getRoute(startLat, startLng, endLat, endLng)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du calcul de l\'itinéraire'
      throw err
    }
  }

  async function fetchMyTrips() {
    loading.value = true
    error.value = null

    try {
      const response = await tripApi.getMyTrips()
      return response.data // { ongoing, upcoming, past }
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération de vos trajets'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    trips,
    currentTrip,
    loading,
    error,
    // Actions
    fetchTrips,
    fetchTripById,
    createTrip,
    calculateEstimate,
    searchAddress,
    reverseGeocode,
    getRoute,
    fetchMyTrips,
    clearError
  }
})
