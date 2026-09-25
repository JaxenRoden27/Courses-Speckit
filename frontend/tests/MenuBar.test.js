/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import App from "../src/App.vue";
import MenuBar from "../src/components/MenuBar.vue";
import Utils from "../src/config/utils.js";
import authServices from "../src/services/authServices.js";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

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

const studentUser = {
  userId: 1,
  username: "jdoe",
  email: "jdoe@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "student",
  token: "student-token",
};

const adminUser = {
  ...studentUser,
  userId: 2,
  username: "admin",
  email: "admin@example.com",
  fName: "Alex",
  lName: "Admin",
  role: "admin",
  token: "admin-token",
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

const mountApp = async (path) => {
  const router = await createTestRouter(path);
  return mountWithPlugins(App, {
    router,
    attachTo: document.body,
    global: {
      stubs: { VMenu: MenuStub },
    },
  });
};

const mountMenuBar = async (path = "/") => {
  const router = await createTestRouter(path);
  const Shell = defineComponent({
    components: { MenuBar },
    template: "<v-app><MenuBar /></v-app>",
  });

  return mountWithPlugins(Shell, {
    router,
    attachTo: document.body,
    global: {
      stubs: { VMenu: MenuStub },
    },
  });
};

describe("Feature 1 — User Authentication & Session Management", () => {
  let wrapper;
  let router;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      Utils.setStore("user", studentUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;
      router = mounted.router;

      authServices.logoutUser.mockImplementation(async () => {
        Utils.removeItem("user");
        window.dispatchEvent(new CustomEvent("user-logged-out"));
        await router.push("/login");
      });

      const signOut = wrapper.findAll(".v-list-item").find((item) => item.text().includes("Sign out"));
      expect(signOut).toBeTruthy();
      await signOut.trigger("click");
      await flushPromises();
      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("login");
      });

      expect(authServices.logoutUser).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
      expect(wrapper.find(".v-app-bar").exists()).toBe(true);
      expect(wrapper.text()).not.toContain("Sign out");
    });
  });

  describe("US-1.6 — Role-based MenuBar", () => {
    it("MenuBar is visible on the login page", async () => {
      const mounted = await mountApp("/login");
      wrapper = mounted.wrapper;

      expect(wrapper.findComponent(MenuBar).exists()).toBe(true);
      expect(wrapper.text()).not.toContain("Sign out");
      expect(wrapper.text()).not.toContain("Seasons");
      expect(wrapper.text()).not.toContain("Leagues");
      expect(wrapper.text()).not.toContain("People");
      expect(wrapper.text()).not.toContain("Teams");
      expect(wrapper.text()).not.toContain("Games");
    });

    it("Signed-in user sees Sign out in MenuBar", async () => {
      Utils.setStore("user", studentUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expect(wrapper.find(".v-app-bar").exists()).toBe(true);
      expect(wrapper.text()).toContain("Sign out");
      expect(wrapper.text()).toContain("Jane Doe");
    });

    it("Student does not see admin-only menu items", async () => {
      Utils.setStore("user", studentUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expect(wrapper.text()).not.toContain("Seasons");
      expect(wrapper.text()).not.toContain("Leagues");
      expect(wrapper.text()).not.toContain("People");
      expect(wrapper.text()).not.toContain("Teams");
      expect(wrapper.text()).not.toContain("Games");
    });

    it("Admin MenuBar in Feature 1 has Sign out but no catalog links yet", async () => {
      Utils.setStore("user", adminUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Sign out");
      const catalogOrder = wrapper
        .findAll("a, button")
        .map((item) => item.text().trim())
        .filter((label) =>
          ["Leagues", "Teams", "Games", "People", "Seasons"].includes(label)
        );
      expect(catalogOrder).toEqual(["Leagues", "Teams", "Games", "People", "Seasons"]);
    });
  });
});

describe("Feature 2 — Season Management", () => {
  let wrapper;
  let router;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-2.1 — Select to work with Seasons", () => {
    it("Menu Selection", async () => {
      Utils.setStore("user", adminUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;
      router = mounted.router;

      const seasonsBtn = wrapper.findAllComponents({ name: "VBtn" }).find((btn) =>
        btn.text().includes("Seasons")
      );
      expect(seasonsBtn).toBeTruthy();
      expect(seasonsBtn.props("to")).toBe("/seasons");

      const link = seasonsBtn.find("a");
      if (link.exists()) {
        link.element.click();
      } else {
        seasonsBtn.element.click();
      }
      await flushPromises();

      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("seasons");
      });
    });
  });

  describe("US-2.7 — Restrict season management to admins", () => {
    it("Student does not see Seasons in the menu", async () => {
      Utils.setStore("user", studentUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expect(wrapper.text()).not.toContain("Seasons");
    });
  });
});

describe("Feature 3 — League Management", () => {
  let wrapper;
  let router;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-3.1 — Select to work with Leagues", () => {
    it("Menu Selection", async () => {
      Utils.setStore("user", adminUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;
      router = mounted.router;

      const leaguesBtn = wrapper.findAllComponents({ name: "VBtn" }).find((btn) =>
        btn.text().includes("Leagues")
      );
      expect(leaguesBtn).toBeTruthy();
      expect(leaguesBtn.props("to")).toBe("/leagues");

      const link = leaguesBtn.find("a");
      if (link.exists()) {
        link.element.click();
      } else {
        leaguesBtn.element.click();
      }
      await flushPromises();

      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("leagues");
      });
    });
  });

  describe("US-3.7 — Restrict league management to admins", () => {
    it("Student does not see Leagues in the menu", async () => {
      Utils.setStore("user", studentUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expect(wrapper.text()).not.toContain("Leagues");
    });
  });
});

describe("Feature 4 — People Management", () => {
  let wrapper;
  let router;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-4.1 — Select to work with People", () => {
    it("Menu Selection", async () => {
      Utils.setStore("user", adminUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;
      router = mounted.router;

      const peopleBtn = wrapper.findAllComponents({ name: "VBtn" }).find((btn) =>
        btn.text().includes("People")
      );
      expect(peopleBtn).toBeTruthy();
      expect(peopleBtn.props("to")).toBe("/people");

      const link = peopleBtn.find("a");
      if (link.exists()) {
        link.element.click();
      } else {
        peopleBtn.element.click();
      }
      await flushPromises();

      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("people");
      });
    });
  });

  describe("US-4.7 — Restrict people management to admins", () => {
    it("Student does not see People in the menu", async () => {
      Utils.setStore("user", studentUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expect(wrapper.text()).not.toContain("People");
    });
  });
});

describe("Feature 5 — Team Management", () => {
  let wrapper;
  let router;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-5.1 — Select to work with Teams", () => {
    it("Menu Selection", async () => {
      Utils.setStore("user", adminUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;
      router = mounted.router;

      const teamsBtn = wrapper.findAllComponents({ name: "VBtn" }).find((btn) =>
        btn.text().includes("Teams")
      );
      expect(teamsBtn).toBeTruthy();
      expect(teamsBtn.props("to")).toBe("/teams");

      const link = teamsBtn.find("a");
      if (link.exists()) {
        link.element.click();
      } else {
        teamsBtn.element.click();
      }
      await flushPromises();

      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("teams");
      });
    });
  });

  describe("US-5.7 — Restrict team management to admins", () => {
    it("Student does not see Teams in the menu", async () => {
      Utils.setStore("user", studentUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expect(wrapper.text()).not.toContain("Teams");
    });

    it("Manager sees Teams in the menu", async () => {
      Utils.setStore("user", { ...studentUser, role: "manager" });
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Teams");
      expect(wrapper.text()).not.toContain("Leagues");
      expect(wrapper.text()).not.toContain("People");
    });
  });
});

describe("Feature 6 — Game Management", () => {
  let wrapper;
  let router;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-6.1 — Select to work with Games", () => {
    it("Menu Selection", async () => {
      Utils.setStore("user", adminUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;
      router = mounted.router;

      const gamesBtn = wrapper.findAllComponents({ name: "VBtn" }).find((btn) =>
        btn.text().includes("Games")
      );
      expect(gamesBtn).toBeTruthy();
      expect(gamesBtn.props("to")).toBe("/games");

      const link = gamesBtn.find("a");
      if (link.exists()) {
        link.element.click();
      } else {
        gamesBtn.element.click();
      }
      await flushPromises();

      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("games");
      });
    });
  });

  describe("US-6.7 — Restrict game management to admins", () => {
    it("Student does not see Games in the menu", async () => {
      Utils.setStore("user", studentUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expect(wrapper.text()).not.toContain("Games");
    });
  });
});
