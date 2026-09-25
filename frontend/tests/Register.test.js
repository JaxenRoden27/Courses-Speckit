/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import authServices from "../src/services/authServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const fillRegisterForm = async (wrapper, overrides = {}) => {
  const values = {
    fName: "Jane",
    lName: "Doe",
    email: "jane@example.com",
    username: "jdoe",
    password: "password123",
    confirmPassword: "password123",
    ...overrides,
  };

  await wrapper.get('input[autocomplete="given-name"]').setValue(values.fName);
  await wrapper.get('input[autocomplete="family-name"]').setValue(values.lName);
  await wrapper.get('input[autocomplete="email"]').setValue(values.email);
  await wrapper.get('input[autocomplete="username"]').setValue(values.username);

  const passwordInputs = wrapper.findAll('input[autocomplete="new-password"]');
  await passwordInputs[0].setValue(values.password);
  await passwordInputs[1].setValue(values.confirmPassword);
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

  describe("US-1.1 — Registration", () => {
    it("User submits registration with invalid email format", async () => {
      const router = await createTestRouter("/register");
      ({ wrapper } = await mountWithPlugins(Register, {
        router,
        attachTo: document.body,
      }));

      await fillRegisterForm(wrapper, { email: "notanemail" });
      await submitForm(wrapper);

      expect(authServices.registerUser).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Enter a valid email address.");
    });

    it("User submits registration with missing username", async () => {
      const router = await createTestRouter("/register");
      ({ wrapper } = await mountWithPlugins(Register, {
        router,
        attachTo: document.body,
      }));

      await fillRegisterForm(wrapper, { username: "" });
      await submitForm(wrapper);

      expect(authServices.registerUser).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Username is required.");
    });

    it("User submits registration with password too short", async () => {
      const router = await createTestRouter("/register");
      ({ wrapper } = await mountWithPlugins(Register, {
        router,
        attachTo: document.body,
      }));

      await fillRegisterForm(wrapper, {
        password: "short",
        confirmPassword: "short",
      });
      await submitForm(wrapper);

      expect(authServices.registerUser).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
    });

    it("User submits registration with mismatched passwords", async () => {
      const router = await createTestRouter("/register");
      ({ wrapper } = await mountWithPlugins(Register, {
        router,
        attachTo: document.body,
      }));

      await fillRegisterForm(wrapper, {
        password: "password123",
        confirmPassword: "password456",
      });
      await submitForm(wrapper);

      expect(authServices.registerUser).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Passwords do not match.");
    });
  });

  describe("US-9.3 — Default new-user role is manager", () => {
    it("User registers with role manager", async () => {
      const router = await createTestRouter("/register");
      authServices.registerUser.mockResolvedValue({
        data: {
          userId: 1,
          username: "jdoe",
          email: "jane@example.com",
          fName: "Jane",
          lName: "Doe",
          role: "manager",
          token: "token",
        },
      });

      ({ wrapper } = await mountWithPlugins(Register, {
        router,
        attachTo: document.body,
      }));

      await fillRegisterForm(wrapper);
      await submitForm(wrapper);

      expect(authServices.registerUser).toHaveBeenCalled();
      expect(Utils.getStore("user").role).toBe("manager");
    });
  });
});
