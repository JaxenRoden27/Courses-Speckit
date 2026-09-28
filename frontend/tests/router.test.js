/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, beforeEach } from "vitest";
import router from "../src/router.js";
import Utils from "../src/config/utils.js";

const signedInStudent = {
  userId: 1,
  universityId: "st2222",
  email: "sam@example.com",
  fName: "Sam",
  lName: "Student",
  role: "student",
  token: "valid-token",
};

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    localStorage.clear();
    await router.push("/login");
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user visits login page", async () => {
      Utils.setStore("user", signedInStudent);

      await router.push("/");
      await router.push("/login");

      expect(router.currentRoute.value.name).toBe("home");
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      await router.push("/");

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
