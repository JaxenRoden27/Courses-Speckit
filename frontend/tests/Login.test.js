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

const setField = async (wrapper, label, value) => {
  const field = wrapper
    .findAllComponents({ name: "VTextField" })
    .find((component) => component.props("label") === label);

  if (!field) {
    throw new Error(`Field not found: ${label}`);
  }

  await field.find("input").setValue(value);
};

const fillLoginForm = async (
  wrapper,
  { universityId = "ST2222", password = "password123" } = {}
) => {
  await setField(wrapper, "University ID", universityId);
  await setField(wrapper, "Password", password);
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

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      authServices.loginUser.mockRejectedValue({
        response: { data: { message: "Invalid University ID or password." } },
      });

      const router = await createTestRouter("/login");
      ({ wrapper } = await mountWithPlugins(Login, {
        router,
        attachTo: document.body,
      }));

      await fillLoginForm(wrapper, {
        universityId: "ST2222",
        password: "wrong-password",
      });
      await submitForm(wrapper);

      expect(authServices.loginUser).toHaveBeenCalledWith({
        universityId: "ST2222",
        password: "wrong-password",
      });
      expect(router.currentRoute.value.name).toBe("login");
      const alert = wrapper.findComponent({ name: "VAlert" });
      expect(alert.exists()).toBe(true);
      expect(alert.props("type")).toBe("error");
      expect(alert.text()).toContain("Invalid University ID or password.");
      expect(localStorage.getItem("user")).toBeNull();
    });

    it("User signs in with missing universityId", async () => {
      const router = await createTestRouter("/login");
      ({ wrapper } = await mountWithPlugins(Login, {
        router,
        attachTo: document.body,
      }));

      await fillLoginForm(wrapper, { universityId: "", password: "password123" });
      await submitForm(wrapper);

      expect(authServices.loginUser).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("University ID is required.");
    });

    it("User signs in with missing password", async () => {
      const router = await createTestRouter("/login");
      ({ wrapper } = await mountWithPlugins(Login, {
        router,
        attachTo: document.body,
      }));

      await fillLoginForm(wrapper, { universityId: "ST2222", password: "" });
      await submitForm(wrapper);

      expect(authServices.loginUser).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Password is required.");
    });
  });
});
