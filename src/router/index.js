import { createRouter, createWebHistory } from "vue-router/auto";
import { routes } from "vue-router/auto-routes";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  extendRoutes: (routes) => {
    // This is where you would typically modify the routes
    // For example, adding a catch-all route or meta fields
    return routes;
  },
});

router.beforeEach(async (to, from, next) => {
  const { useAuthStore } = await import("@/stores/auth");
  const authStore = useAuthStore();

  // Ensure session is loaded
  if (!authStore.session && !authStore.user) {
    await authStore.fetchSession();
  }

  const isAuthenticated = !!authStore.user;
  const isLoginPage = to.path === "/login";

  if (!isAuthenticated && !isLoginPage) {
    next("/login");
  } else if (isAuthenticated && isLoginPage) {
    next("/");
  } else {
    next();
  }
});

export default router;
