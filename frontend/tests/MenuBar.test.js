/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 *
 * Feature 2 — Semester Management
 * Spec: features/feature-2-semester-management.md
 *
 * Feature 4 — Faculty Management
 * Spec: features/feature-4-faculty-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../src/App.vue";
import MenuBar from "../src/components/MenuBar.vue";
import Semesters from "../src/views/Semesters.vue";
import Faculty from "../src/views/Faculty.vue";
import Utils from "../src/config/utils.js";
import authServices from "../src/services/authServices.js";
import semesterServices from "../src/services/semesterServices.js";
import facultyServices from "../src/services/facultyServices.js";
import userServices from "../src/services/userServices.js";
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
    getUsers: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

vi.mock("../src/services/facultyServices.js", () => ({
  default: {
    getFaculty: vi.fn(),
    createFaculty: vi.fn(),
    updateFaculty: vi.fn(),
    deleteFaculty: vi.fn(),
  },
}));

vi.mock("../src/services/semesterServices.js", () => ({
  default: {
    getSemesters: vi.fn(),
    getStudentSemesters: vi.fn(),
    getAllSemesters: vi.fn(),
    createSemester: vi.fn(),
    updateSemester: vi.fn(),
    deleteSemester: vi.fn(),
  },
}));

const studentUser = {
  userId: 1,
  universityId: "st2222",
  email: "sam@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "student",
  token: "student-token",
};

const facultyUser = {
  userId: 2,
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

const mountApp = async (path) => {
  const router = await createTestRouter(path);
  return mountWithPlugins(App, {
    router,
    ...mountOptions,
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
    ...mountOptions,
  });
};

const navLinkLabels = (wrapper) =>
  wrapper
    .findAllComponents({ name: "VBtn" })
    .filter((btn) => btn.props("to"))
    .map((btn) => btn.text().trim());

const expectLabelAbsent = (wrapper, label) => {
  const matches = navLinkLabels(wrapper).filter((item) =>
    item.includes(label)
  );
  expect(matches).toEqual([]);
};

const findSignOut = (wrapper) =>
  wrapper.findAllComponents({ name: "VListItem" }).find((item) => {
    return item.props("title") === "Sign out" || item.text().includes("Sign out");
  });

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

      const signOut = findSignOut(wrapper);
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
      expect(findSignOut(wrapper)).toBeUndefined();
    });
  });

  describe("US-1.6 — Role-based MenuBar", () => {
    it("MenuBar is visible on the login page", async () => {
      const mounted = await mountApp("/login");
      wrapper = mounted.wrapper;

      expect(wrapper.findComponent(MenuBar).exists()).toBe(true);
      expect(findSignOut(wrapper)).toBeUndefined();
      expectLabelAbsent(wrapper, "Semester");
      expectLabelAbsent(wrapper, "Course");
      expect(navLinkLabels(wrapper)).toEqual([]);
    });

    it("Signed-in user sees Sign out in MenuBar", async () => {
      Utils.setStore("user", studentUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expect(wrapper.find(".v-app-bar").exists()).toBe(true);
      expect(findSignOut(wrapper)).toBeTruthy();
      expect(wrapper.text()).toContain("Jane Doe");
    });

    it("Student does not see faculty-only menu items", async () => {
      Utils.setStore("user", studentUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expectLabelAbsent(wrapper, "Faculty");
      expectLabelAbsent(wrapper, "Section");
      expectLabelAbsent(wrapper, "Student Course Listing");
      expectLabelAbsent(wrapper, "Section Student Listing");
    });

    it("Faculty MenuBar in Feature 1 has Sign out but no catalog links yet", async () => {
      Utils.setStore("user", facultyUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expect(findSignOut(wrapper)).toBeTruthy();
      expectLabelAbsent(wrapper, "Semester");
      expectLabelAbsent(wrapper, "Course");
      expectLabelAbsent(wrapper, "Faculty");
      expectLabelAbsent(wrapper, "Section");
      expectLabelAbsent(wrapper, "Enrollment");
      expectLabelAbsent(wrapper, "Student Course Listing");
      expectLabelAbsent(wrapper, "Section Student Listing");
      expect(navLinkLabels(wrapper)).toEqual([]);
    });

    it("Signed-in student MenuBar has Sign out but no catalog links yet", async () => {
      Utils.setStore("user", studentUser);
      const mounted = await mountMenuBar("/");
      wrapper = mounted.wrapper;

      expect(findSignOut(wrapper)).toBeTruthy();
      expectLabelAbsent(wrapper, "Semester");
      expectLabelAbsent(wrapper, "Course");
      expect(navLinkLabels(wrapper)).toEqual([]);
    });
  });
});

describe("Feature 2 — Semester Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    const empty = { data: [] };
    semesterServices.getSemesters.mockResolvedValue(empty);
    semesterServices.getStudentSemesters.mockResolvedValue(empty);
    semesterServices.getAllSemesters.mockResolvedValue(empty);
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountSignedInApp = async (user) => {
    Utils.setStore("user", user);
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
        { path: "/semesters", name: "semesters", component: Semesters },
      ],
    });
    await router.push("/");
    await router.isReady();

    const mounted = await mountWithPlugins(App, {
      router,
      ...mountOptions,
    });
    wrapper = mounted.wrapper;
    return mounted.router;
  };

  const openSemesters = async (user) => {
    const router = await mountSignedInApp(user);
    const semestersButton = wrapper
      .findAllComponents({ name: "VBtn" })
      .find((btn) => btn.text().trim() === "Semesters");

    expect(semestersButton).toBeTruthy();
    await semestersButton.trigger("click");
    await vi.waitFor(() => {
      expect(router.currentRoute.value.name).toBe("semesters");
    });
    expect(router.currentRoute.value.path).toBe("/semesters");
    expect(wrapper.findComponent(Semesters).exists()).toBe(true);
  };

  describe("US-2.1 — Open the semesters view", () => {
    it("Student opens semesters from the menu", async () => {
      await openSemesters(studentUser);
    });

    it("Faculty opens semesters from the menu", async () => {
      await openSemesters(facultyUser);
    });
  });
});

describe("Feature 4 — Faculty Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    facultyServices.getFaculty.mockResolvedValue({ data: [] });
    userServices.getUsers.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const findButton = (root, label) =>
    root.findAllComponents({ name: "VBtn" }).find((btn) => btn.text().trim() === label);

  const mountSignedInApp = async (user) => {
    Utils.setStore("user", user);
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
        { path: "/faculty", name: "faculty", component: Faculty },
      ],
    });
    await router.push("/");
    await router.isReady();

    const mounted = await mountWithPlugins(App, {
      router,
      ...mountOptions,
    });
    wrapper = mounted.wrapper;
    return mounted.router;
  };

  describe("US-4.1 — Select to work with Faculty", () => {
    it("Menu Selection", async () => {
      const router = await mountSignedInApp(facultyUser);
      const facultyButton = findButton(wrapper, "Faculty");

      expect(facultyButton).toBeTruthy();
      await facultyButton.trigger("click");
      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("faculty");
      });
      expect(router.currentRoute.value.path).toBe("/faculty");
      expect(wrapper.findComponent(Faculty).exists()).toBe(true);
    });
  });

  describe("US-4.7 — Restrict faculty management to faculty users", () => {
    it("Student does not see Faculty in the menu", async () => {
      await mountSignedInApp(studentUser);

      expect(findButton(wrapper, "Faculty")).toBeUndefined();
    });
  });
});
