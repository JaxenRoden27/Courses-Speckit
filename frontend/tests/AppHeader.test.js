/**
 * Feature 3 — Course Management
 * Spec: features/feature-3-course-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../src/App.vue";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const facultyUser = {
  userId: 9,
  universityId: "fa0001",
  email: "faculty@example.com",
  fName: "Alex",
  lName: "Faculty",
  role: "faculty",
  token: "faculty-token",
};

const MenuStub = {
  name: "VMenu",
  template: `
    <div class="v-menu-stub">
      <slot name="activator" :props="{}" />
      <slot />
    </div>
  `,
};

const mountOptions = {
  attachTo: document.body,
  global: {
    stubs: { VMenu: MenuStub },
  },
};

const courseNavLabels = (root) =>
  root
    .findAllComponents({ name: "VBtn" })
    .map((btn) => btn.text().trim())
    .filter((label) => /^courses?$/i.test(label));

describe("Feature 3 — Course Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-3.1 — View Course List Page", () => {
    it("Course menu item hidden for faculty", async () => {
      Utils.setStore("user", facultyUser);
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: "/", name: "home", component: { template: "<div>Home</div>" } },
          { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
          {
            path: "/register",
            name: "register",
            component: { template: "<div>Register</div>" },
          },
        ],
      });
      await router.push("/");
      await router.isReady();

      const mounted = await mountWithPlugins(App, { router, ...mountOptions });
      wrapper = mounted.wrapper;

      expect(wrapper.find(".v-app-bar").exists()).toBe(true);
      expect(courseNavLabels(wrapper)).toEqual([]);
    });
  });
});
