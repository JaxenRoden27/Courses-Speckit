/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, beforeEach } from "vitest";
import router from "../src/router.js";
import Utils from "../src/config/utils.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user visits login page", async () => {
      Utils.setStore("user", {
        userId: 1,
        username: "jdoe",
        fName: "Jane",
        lName: "Doe",
        role: "student",
        token: "valid-token",
      });

      await router.push("/");
      await router.push("/login");

      expect(router.currentRoute.value.name).toBe("home");
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      await router.push("/login");
      await router.push("/");

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});

describe("Feature 2 — Season Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-2.7 — Restrict season management to admins", () => {
    it("Unauthenticated user navigates to seasons", async () => {
      await router.push("/login");
      await router.push("/seasons");

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});

describe("Feature 7 — Season View", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-7.4 — Restrict the season view to admins", () => {
    it("Unauthenticated user navigates to a season", async () => {
      await router.push("/login");
      await router.push("/seasons/1");

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});

describe("Feature 3 — League Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-3.7 — Restrict league management to admins", () => {
    it("Unauthenticated user navigates to leagues", async () => {
      await router.push("/login");
      await router.push("/leagues");

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});

describe("Feature 4 — People Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-4.7 — Restrict people management to admins", () => {
    it("Unauthenticated user navigates to people", async () => {
      await router.push("/login");
      await router.push("/people");

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});

describe("Feature 5 — Team Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-5.7 — Restrict team management to admins", () => {
    it("Unauthenticated user navigates to teams", async () => {
      await router.push("/login");
      await router.push("/teams");

      expect(router.currentRoute.value.name).toBe("login");
    });

    it("Unauthenticated user navigates to a team", async () => {
      await router.push("/login");
      await router.push("/teams/1");

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});

describe("Feature 6 — Game Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-6.7 — Restrict game management to admins", () => {
    it("Unauthenticated user navigates to games", async () => {
      await router.push("/login");
      await router.push("/games");

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
