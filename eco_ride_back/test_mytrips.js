// Script de test pour l'endpoint /api/trips/my/trips
// Exécuter avec: node test_mytrips.js

const axios = require('axios');

async function testMyTrips() {
    try {
        // 1. Se connecter pour obtenir un token
        console.log('1. Connexion...');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'test1@test.com',
            password: 'test'
        });

        const token = loginResponse.data.token;
        console.log('✅ Token obtenu:', token.substring(0, 20) + '...');

        // 2. Appeler l'endpoint /api/trips/my/trips avec le token
        console.log('\n2. Récupération des trajets...');
        const tripsResponse = await axios.get('http://localhost:3000/api/trips/my/trips', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('\n✅ Réponse reçue:');
        console.log('Ongoing trips:', tripsResponse.data.ongoing?.length || 0);
        console.log('Upcoming trips:', tripsResponse.data.upcoming?.length || 0);
        console.log('Past trips:', tripsResponse.data.past?.length || 0);

        console.log('\n📋 Détails:');
        console.log(JSON.stringify(tripsResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
    }
}

testMyTrips();
