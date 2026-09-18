import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { createMemoryHistory, createRouter } from "vue-router";

export const vuetify = createVuetify({ components, directives });

export async function createTestRouter(initialPath = "/") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div>Home</div>" } },
      { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
      { path: "/register", name: "register", component: { template: "<div>Register</div>" } },
    ],
  });

  await router.push(initialPath);
  await router.isReady();

  return router;
}

export async function mountWithPlugins(component, options = {}) {
  const { router: providedRouter, global, ...rest } = options;
  const router = providedRouter ?? (await createTestRouter());

  const wrapper = mount(component, {
    ...rest,
    global: {
      plugins: [vuetify, router],
      ...global,
    },
  });

  return { wrapper, router };
}
