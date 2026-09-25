/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import authServices from "../src/services/authServices.js";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const fillLoginForm = async (wrapper, { username = "jdoe", password = "password123" } = {}) => {
  await wrapper.get('input[autocomplete="username"]').setValue(username);
  await wrapper.get('input[autocomplete="current-password"]').setValue(password);
};

const submitForm = async (wrapper) => {
  await wrapper.find("form").trigger("submit.prevent");
  await flushPromises();
};

describe("Feature 1 — User Authentication & Session Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      authServices.loginUser.mockRejectedValue({
        response: { data: { message: "Invalid username or password." } },
      });

      const router = await createTestRouter("/login");
      ({ wrapper } = await mountWithPlugins(Login, {
        router,
        attachTo: document.body,
      }));

      await fillLoginForm(wrapper, { username: "jdoe", password: "wrong-password" });
      await submitForm(wrapper);

      expect(authServices.loginUser).toHaveBeenCalled();
      expect(router.currentRoute.value.name).toBe("login");
      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("Invalid username or password.");
    });

    it("User signs in with missing username", async () => {
      const router = await createTestRouter("/login");
      ({ wrapper } = await mountWithPlugins(Login, {
        router,
        attachTo: document.body,
      }));

      await fillLoginForm(wrapper, { username: "", password: "password123" });
      await submitForm(wrapper);

      expect(authServices.loginUser).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Username is required.");
    });

    it("User signs in with missing password", async () => {
      const router = await createTestRouter("/login");
      ({ wrapper } = await mountWithPlugins(Login, {
        router,
        attachTo: document.body,
      }));

      await fillLoginForm(wrapper, { username: "jdoe", password: "" });
      await submitForm(wrapper);

      expect(authServices.loginUser).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Password is required.");
    });
  });
});
