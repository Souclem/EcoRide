<script setup>
import { ref } from "vue";
import { useUserStore } from "../store/user.store";
import { useRouter, useRoute } from "vue-router";
import AlertMessage from "../components/ui/AlertMessage.vue";
import FormField from "../components/ui/FormField.vue";

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

async function submit() {
  // Réinitialiser l'erreur
  errorMessage.value = "";

  // Validation côté client
  if (!email.value || !password.value) {
    errorMessage.value = "Veuillez remplir tous les champs";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    errorMessage.value = "Email invalide";
    return;
  }

  try {
    isLoading.value = true;
    await userStore.loginUser({ email: email.value, password: password.value });

    // Rediriger vers la page demandée ou vers l'accueil
    const redirectTo = route.query.redirect || '/';
    router.push(redirectTo);
  } catch (err) {
    console.error("Erreur complète:", err);
    errorMessage.value = err.response?.data?.message || err.message || "Identifiants incorrects";
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <main class="w-full px-4">
    <div class="max-w-md mx-auto">
    <article class="card">
      <!-- En-tête avec gradient -->
      <header class="card-header">
        <h2 class="text-3xl font-bold mb-2">{{ $t('auth.login.title') }}</h2>
        <p class="text-green-100 text-sm">{{ $t('home.tagline') }}</p>
      </header>

      <!-- Formulaire -->
      <section class="card-body">
        <!-- Message d'erreur -->
        <AlertMessage
          v-if="errorMessage"
          type="error"
          :message="errorMessage"
          class="mb-5"
        />

        <div class="space-y-5">
          <FormField
            v-model="email"
            :label="$t('auth.login.email')"
            type="email"
            placeholder="votre@email.com"
            autocomplete="email"
            @keyup.enter="submit"
          />

          <FormField
            v-model="password"
            :label="$t('auth.login.password')"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            @keyup.enter="submit"
          />

          <button
            type="button"
            @click.prevent="submit"
            :disabled="isLoading"
            class="btn btn-primary btn-md w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {{ isLoading ? 'Connexion en cours...' : $t('auth.login.submit') }}
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
      </section>
    </article>
    </div>
  </main>
</template>

