<script setup>
import { ref } from "vue";
import { useUserStore } from "../store/user.store";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const userStore = useUserStore();
const router = useRouter();

async function submit() {
  try {
    await userStore.loginUser({ email: email.value, password: password.value });
    router.push("/");
  } catch (err) {
    console.error("Erreur complète:", err);
    const message = err.response?.data?.message || err.message || "Identifiants incorrects";
    alert(message);
  }
}
</script>

<template>
  <div class="w-full px-4">
    <div class="max-w-md mx-auto">
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
      <!-- En-tête avec gradient -->
      <div class="bg-gradient-to-r from-ecoGreen to-green-600 p-8 text-white">
        <h2 class="text-3xl font-bold mb-2">{{ $t('auth.login.title') }}</h2>
        <p class="text-green-100 text-sm">{{ $t('home.tagline') }}</p>
      </div>

      <!-- Formulaire -->
      <div class="p-8">
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t('auth.login.email') }}
            </label>
            <input
              v-model="email"
              type="email"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t('auth.login.password') }}
            </label>
            <input
              v-model="password"
              type="password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            @click="submit"
            class="w-full bg-gradient-to-r from-ecoGreen to-green-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {{ $t('auth.login.submit') }}
          </button>
        </div>

        <!-- Lien vers inscription -->
        <div class="mt-6 pt-6 border-t border-gray-200 text-center">
          <p class="text-gray-600 text-sm">
            {{ $t('auth.login.noAccount') }}
            <router-link to="/register" class="text-ecoGreen font-semibold hover:underline">
              {{ $t('auth.login.createAccount') }}
            </router-link>
          </p>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

