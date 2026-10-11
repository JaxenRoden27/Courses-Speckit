/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import authServices from "../src/services/authServices.js";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const setField = async (wrapper, label, value) => {
  const field = wrapper
    .findAllComponents({ name: "VTextField" })
    .find((component) => component.props("label") === label);

  if (!field) {
    throw new Error(`Field not found: ${label}`);
  }

  await field.find("input").setValue(value);
};

const fillRegisterForm = async (wrapper, overrides = {}) => {
  const values = {
    fName: "Jane",
    lName: "Doe",
    email: "jane@example.com",
    universityId: "ST1111",
    password: "password123",
    confirmPassword: "password123",
    ...overrides,
  };

  await setField(wrapper, "First name", values.fName);
  await setField(wrapper, "Last name", values.lName);
  await setField(wrapper, "Email", values.email);
  await setField(wrapper, "University ID", values.universityId);
  await setField(wrapper, "Password", values.password);
  await setField(wrapper, "Confirm password", values.confirmPassword);
};

const submitForm = async (wrapper) => {
  await wrapper.find("form").trigger("submit.prevent");
  await flushPromises();
};

describe("Feature 1 — User Authentication & Session Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

    it("User submits registration with missing universityId", async () => {
      const router = await createTestRouter("/register");
      ({ wrapper } = await mountWithPlugins(Register, {
        router,
        attachTo: document.body,
      }));

      await fillRegisterForm(wrapper, { universityId: "" });
      await submitForm(wrapper);

      expect(authServices.registerUser).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("University ID is required.");
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
});
