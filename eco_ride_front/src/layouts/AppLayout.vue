<template>
  <div class="flex flex-col min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
    <Header />

    <!-- Carrousel de promotions -->
    <PromotionCarousel />

    <main class="flex-grow w-full pt-28 pb-12">
      <RouterView />
    </main>
    <Footer />
    <!-- Système de notifications global -->
    <NotificationToast />
  </div>
</template>

<script setup>
import Header from "../components/layout/Header.vue";
import Footer from "../components/layout/Footer.vue";
import NotificationToast from "../components/ui/NotificationToast.vue";
import PromotionCarousel from "../components/promotion/PromotionCarousel.vue";
</script>
