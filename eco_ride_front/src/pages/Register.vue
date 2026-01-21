<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "../store/user.store";
import { useRouter } from "vue-router";
import AlertMessage from "../components/ui/AlertMessage.vue";
import FormField from "../components/ui/FormField.vue";

const { t } = useI18n();

const email = ref("");
const name = ref("");
const last_name = ref("");
const password = ref("");
const confirmPassword = ref("");
const language = ref("fr");

// Gestion des erreurs
const errors = ref({});
const errorMessage = ref("");
const isLoading = ref(false);

const userStore = useUserStore();
const router = useRouter();

// Validation du formulaire
function validateForm() {
  errors.value = {};
  errorMessage.value = "";

  // 1. Validation des champs obligatoires
  if (!name.value || name.value.trim() === "") {
    errors.value.name = "Le prénom est obligatoire";
  }

  if (!last_name.value || last_name.value.trim() === "") {
    errors.value.last_name = "Le nom est obligatoire";
  }

  if (!email.value || email.value.trim() === "") {
    errors.value.email = "L'email est obligatoire";
  } else if (!email.value.includes("@") || !email.value.includes(".")) {
    errors.value.email = "Format d'email invalide";
  }

  // 2. Validation du mot de passe
  if (!password.value) {
    errors.value.password = "Le mot de passe est obligatoire";
  } else if (password.value.length < 6) {
    errors.value.password = "Le mot de passe doit contenir au moins 6 caractères";
  }

  // 3. Validation de la confirmation
  if (!confirmPassword.value) {
    errors.value.confirmPassword = "Veuillez confirmer le mot de passe";
  } else if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = "Les mots de passe ne correspondent pas";
  }

  return Object.keys(errors.value).length === 0;
}

async function submit() {
  // Validation côté client
  if (!validateForm()) {
    errorMessage.value = "Veuillez corriger les erreurs dans le formulaire";
    return;
  }

  try {
    isLoading.value = true;
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
    errorMessage.value = err.response?.data?.message || err.message || "Erreur lors de l'inscription";
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <main class="w-full px-4">
    <div class="max-w-2xl mx-auto">
    <article class="card">
      <!-- En-tête avec gradient -->
      <header class="card-header">
        <h2 class="text-3xl font-bold mb-2">{{ $t('auth.register.title') }}</h2>
        <p class="text-green-100 text-sm">{{ $t('home.tagline') }}</p>
      </header>

      <!-- Formulaire -->
      <section class="card-body">
        <!-- Message d'erreur général -->
        <AlertMessage
          v-if="errorMessage"
          type="error"
          :message="errorMessage"
          class="mb-5"
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            v-model="name"
            :label="$t('auth.register.firstname')"
            type="text"
            required
            :error="errors.name"
          />

          <FormField
            v-model="last_name"
            :label="$t('auth.register.lastname')"
            type="text"
            required
            :error="errors.last_name"
          />
        </div>

        <div class="space-y-5 mt-5">
          <FormField
            v-model="email"
            :label="$t('auth.register.email')"
            type="email"
            placeholder="votre@email.com"
            autocomplete="email"
            required
            :error="errors.email"
          />

          <FormField
            v-model="password"
            :label="$t('auth.register.password')"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
            required
            :error="errors.password"
          />

          <FormField
            v-model="confirmPassword"
            :label="$t('auth.register.confirmPassword')"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
            required
            :error="errors.confirmPassword"
          />

          <!-- Langue -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t('auth.register.language') }}
            </label>
            <select
              v-model="language"
              class="input-field w-full bg-white"
            >
              <option value="fr">{{ $t('languages.fr') }}</option>
              <option value="en">{{ $t('languages.en') }}</option>
            </select>
          </div>

          <button
            @click="submit"
            :disabled="isLoading"
            class="btn btn-primary btn-md w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {{ isLoading ? 'Inscription en cours...' : $t('auth.register.submit') }}
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
      </section>
    </article>
    </div>
  </main>
</template>


