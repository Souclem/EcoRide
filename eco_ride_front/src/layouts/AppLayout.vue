<template>
  <div class="flex flex-col min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
    <Header />
    <main class="flex-grow w-full pt-20 pb-12">
      <RouterView />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Header from "../components/header.vue";
import Footer from "../components/footer.vue";
</script>
