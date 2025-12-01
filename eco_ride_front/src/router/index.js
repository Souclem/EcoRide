import { createRouter, createWebHistory } from "vue-router";

import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import Home from "../pages/Home.vue";
import CreateTrip from "../pages/CreateTrip.vue";
import ListTrips from "../pages/ListTrips.vue";
import MyTrips from "../pages/MyTrips.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/create-trip", component: CreateTrip },
  { path: "/trips", component: ListTrips },
  { path: "/mes-trajets", component: MyTrips },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
