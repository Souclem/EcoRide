<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "../store/user.store";
import { useRouter } from "vue-router";

const { t } = useI18n();

const email = ref("");
const name = ref("");
const last_name = ref("");
const password = ref("");
const confirmPassword = ref("");
const language = ref("fr");

const userStore = useUserStore();
const router = useRouter();

async function submit() {
  // Validation de la confirmation du mot de passe
  if (password.value !== confirmPassword.value) {
    alert(t('auth.register.errors.passwordMismatch'));
    return;
  }

  // Validation des champs obligatoires
  if (!email.value || !name.value || !last_name.value || !password.value) {
    alert(t('auth.register.errors.fillRequired'));
    return;
  }

  try {
    await userStore.registerUser({
      email: email.value,
      name: name.value,
      last_name: last_name.value,
      password: password.value,
      language: language.value,
    });
    router.push("/");
  } catch (err) {
    console.error("Erreur complète:", err);
    const message = err.response?.data?.message || err.message || t('auth.register.errors.fillRequired');
    alert(message);
  }
}
</script>

<template>
  <div class="w-full px-4">
    <div class="max-w-2xl mx-auto">
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
      <!-- En-tête avec gradient -->
      <div class="bg-gradient-to-r from-ecoGreen to-green-600 p-8 text-white">
        <h2 class="text-3xl font-bold mb-2">{{ $t('auth.register.title') }}</h2>
        <p class="text-green-100 text-sm">{{ $t('home.tagline') }}</p>
      </div>

      <!-- Formulaire -->
      <div class="p-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Prénom -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t('auth.register.firstname') }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="name"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              required
            />
          </div>

          <!-- Nom -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t('auth.register.lastname') }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="last_name"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div class="space-y-5 mt-5">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t('auth.register.email') }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="email"
              type="email"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              placeholder="votre@email.com"
              required
            />
          </div>

          <!-- Mot de passe -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t('auth.register.password') }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="password"
              type="password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <!-- Confirmation mot de passe -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t('auth.register.confirmPassword') }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <!-- Langue -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t('auth.register.language') }}
            </label>
            <select
              v-model="language"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ecoGreen focus:border-transparent transition-all bg-white"
            >
              <option value="fr">{{ $t('languages.fr') }}</option>
              <option value="en">{{ $t('languages.en') }}</option>
            </select>
          </div>

          <button
            @click="submit"
            class="w-full bg-gradient-to-r from-ecoGreen to-green-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {{ $t('auth.register.submit') }}
          </button>
        </div>

        <!-- Lien vers connexion -->
        <div class="mt-6 pt-6 border-t border-gray-200 text-center">
          <p class="text-gray-600 text-sm">
            {{ $t('auth.register.hasAccount') }}
            <router-link to="/login" class="text-ecoGreen font-semibold hover:underline">
              {{ $t('auth.register.loginLink') }}
            </router-link>
          </p>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>


