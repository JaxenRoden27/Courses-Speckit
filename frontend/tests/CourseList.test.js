/**
 * Feature 3 — Course Management
 * Spec: features/feature-3-course-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../src/App.vue";
import Courses from "../src/views/Courses.vue";
import Utils from "../src/config/utils.js";
import courseServices from "../src/services/courseServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/courseServices.js", () => ({
  default: {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

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
  universityId: "st1111",
  email: "jane@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "student",
  token: "student-token",
};

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

const cs101 = () => ({
  id: 7,
  courseNumber: "CS101",
  courseName: "Intro to CS",
  courseDescription: "Basic concepts",
  courseTerm: "Spring",
});

const algorithms = () => ({
  id: 8,
  courseNumber: "CS201",
  courseName: "Algorithms",
  courseDescription: "Design of algorithms.",
  courseTerm: "Fall",
});

let records = [];
let nextId = 1;

const listResponse = () =>
  Promise.resolve({
    data: [...records]
      .sort((a, b) => a.courseName.localeCompare(b.courseName) || a.id - b.id)
      .map((record) => ({ ...record })),
  });

describe("Feature 3 — Course Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    records = [];
    nextId = 1;

    courseServices.findAll.mockImplementation(listResponse);
    courseServices.create.mockImplementation(async (payload) => {
      const created = { id: nextId++, ...payload };
      records.push(created);
      return { data: created, status: 201 };
    });
    courseServices.update.mockImplementation(async (id, payload) => {
      const numericId = Number(id);
      records = records.map((record) =>
        record.id === numericId ? { ...record, ...payload } : record,
      );
      return {
        data: { message: "Course was updated successfully." },
        status: 200,
      };
    });
    courseServices.delete.mockImplementation(async (id) => {
      const numericId = Number(id);
      records = records.filter((record) => record.id !== numericId);
      return {
        data: { message: "Course was deleted successfully!" },
        status: 200,
      };
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const createCoursesRouter = async (initialPath = "/course") => {
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
        { path: "/course", name: "course", component: Courses },
        { path: "/courses", name: "courses", component: Courses },
      ],
    });
    await router.push(initialPath);
    await router.isReady();
    return router;
  };

  const findButton = (root, label) =>
    root.findAllComponents({ name: "VBtn" }).find((btn) => btn.text().trim() === label);

  const findField = (root, label) =>
    [
      ...root.findAllComponents({ name: "VTextField" }),
      ...root.findAllComponents({ name: "VTextarea" }),
      ...root.findAllComponents({ name: "VSelect" }),
    ].find((field) => field.props("label") === label);

  const dialogText = (dialog) =>
    [
      ...dialog.findAllComponents({ name: "VCardTitle" }),
      ...dialog.findAllComponents({ name: "VCardText" }),
      ...dialog.findAllComponents({ name: "VAlert" }),
    ]
      .map((part) => part.text())
      .join(" ");

  const openDialogs = (root) =>
    root
      .findAllComponents({ name: "VDialog" })
      .filter((dialog) => dialog.props("modelValue") === true);

  const dialogWith = (root, text) =>
    openDialogs(root).find((dialog) => dialogText(dialog).includes(text));

  const courseRows = (root) => root.findAll("tbody tr");

  const findCourseRow = (root, label) =>
    courseRows(root).find((row) => row.text().includes(label));

  const visibleText = () => `${wrapper.text()}\n${document.body.textContent}`;

  const mountCourses = async (user, initialPath = "/course") => {
    Utils.setStore("user", user);
    const Shell = defineComponent({
      components: { Courses },
      template: "<v-app><Courses /></v-app>",
    });
    const router = await createCoursesRouter(initialPath);
    const mounted = await mountWithPlugins(Shell, { router, ...mountOptions });
    wrapper = mounted.wrapper;
    await flushPromises();
    return mounted;
  };

  const clickButton = async (root, label) => {
    const button = findButton(root, label);
    expect(button, `button "${label}"`).toBeTruthy();
    await button.trigger("click");
    await flushPromises();
  };

  const setField = async (root, label, value) => {
    const field = findField(root, label);
    expect(field, `field "${label}"`).toBeTruthy();
    field.vm.$emit("update:modelValue", value);
    await flushPromises();
  };

  const openCourseFromMenu = async (user) => {
    Utils.setStore("user", user);
    const router = await createCoursesRouter("/");
    const mounted = await mountWithPlugins(App, { router, ...mountOptions });
    wrapper = mounted.wrapper;

    const courseButton = wrapper
      .findAllComponents({ name: "VBtn" })
      .find((btn) => btn.text().trim() === "Course");
    expect(courseButton).toBeTruthy();
    await courseButton.trigger("click");
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe("/course");
    });
    await flushPromises();
    return router;
  };

  describe("US-3.1 — View Course List Page", () => {
    it("Signed-in faculty navigates to course page", async () => {
      await openCourseFromMenu(facultyUser);

      expect(wrapper.findComponent(Courses).exists()).toBe(true);
      expect(wrapper.text()).toContain("Courses");
    });

    it("Signed-in student navigates to course page", async () => {
      await openCourseFromMenu(studentUser);

      expect(wrapper.findComponent(Courses).exists()).toBe(true);
      expect(wrapper.text()).toContain("Courses");
    });
  });

  describe("US-3.2 — Create Course", () => {
    it("Signed-in faculty creates a new course", async () => {
      await mountCourses(facultyUser);
      await clickButton(wrapper, "Add Course");

      const addDialog = dialogWith(wrapper, "Add Course");
      expect(addDialog).toBeTruthy();

      await setField(addDialog, "Course Number", "CS101");
      await setField(addDialog, "Course Name", "Intro to CS");
      await setField(addDialog, "Description", "Basic concepts");
      await setField(addDialog, "courseTerm", "Spring");
      await clickButton(addDialog, "Save");

      expect(courseServices.create).toHaveBeenCalledTimes(1);
      const payload = courseServices.create.mock.calls[0][0];
      expect(payload).toMatchObject({
        courseNumber: "CS101",
        courseName: "Intro to CS",
        courseDescription: "Basic concepts",
        courseTerm: "Spring",
      });
      expect(payload.userId).toBeUndefined();

      expect(findCourseRow(wrapper, "Intro to CS")).toBeTruthy();
      expect(visibleText()).toContain("Intro to CS added successfully!");
      expect(dialogWith(wrapper, "Add Course")).toBeUndefined();
    });
  });

  describe("US-3.3 — Read Course Catalog", () => {
    it("Signed-in faculty views courses catalog", async () => {
      records = [cs101(), algorithms()];
      await mountCourses(facultyUser);

      expect(courseServices.findAll).toHaveBeenCalled();
      expect(wrapper.find("table").exists()).toBe(true);
      const rows = courseRows(wrapper);
      expect(rows).toHaveLength(2);
      expect(rows[0].text()).toContain("CS201");
      expect(rows[0].text()).toContain("Algorithms");
      expect(rows[1].text()).toContain("CS101");
      expect(rows[1].text()).toContain("Intro to CS");
    });
  });

  describe("US-3.4 — Row Action Icons", () => {
    it("Row action buttons visible for faculty", async () => {
      records = [cs101(), algorithms()];
      await mountCourses(facultyUser);

      const rows = courseRows(wrapper);
      expect(rows).toHaveLength(2);
      for (const row of rows) {
        expect(row.find('[aria-label="Edit course"]').exists()).toBe(true);
        expect(row.find('[aria-label="Delete course"]').exists()).toBe(true);
      }
    });
  });

  describe("US-3.5 — Edit Course", () => {
    it("Signed-in faculty updates course details", async () => {
      records = [cs101()];
      await mountCourses(facultyUser);

      const row = findCourseRow(wrapper, "Intro to CS");
      expect(row).toBeTruthy();
      await row.find('[aria-label="Edit course"]').trigger("click");
      await flushPromises();

      const editDialog = dialogWith(wrapper, "Edit Course");
      expect(editDialog).toBeTruthy();
      await setField(editDialog, "courseTerm", "Fall");
      await clickButton(editDialog, "Update Course");

      expect(courseServices.update).toHaveBeenCalled();
      const [courseId, payload] = courseServices.update.mock.calls[0];
      expect(Number(courseId)).toBe(7);
      expect(payload.courseTerm).toBe("Fall");

      const updated = findCourseRow(wrapper, "Intro to CS");
      expect(updated).toBeTruthy();
      expect(updated.text()).toContain("Fall");
      expect(visibleText()).toContain("Intro to CS updated successfully!");
    });
  });

  describe("US-3.6 — Delete Course", () => {
    it("Signed-in faculty deletes a course with confirmation", async () => {
      records = [cs101()];
      await mountCourses(facultyUser);

      const row = findCourseRow(wrapper, "Intro to CS");
      expect(row).toBeTruthy();
      await row.find('[aria-label="Delete course"]').trigger("click");
      await flushPromises();

      const deleteDialog = openDialogs(wrapper).find((dialog) =>
        /delete/i.test(dialogText(dialog)),
      );
      expect(deleteDialog).toBeTruthy();

      await clickButton(deleteDialog, "Delete Course");

      expect(courseServices.delete).toHaveBeenCalledWith(7);
      expect(findCourseRow(wrapper, "Intro to CS")).toBeUndefined();
      expect(visibleText()).toContain("Course deleted successfully!");
    });
  });

  describe("US-3.7 — Role-Based Access Control", () => {
    it("Student user edit access restricted", async () => {
      await openCourseFromMenu(studentUser);
      expect(wrapper.text()).toContain("Course");

      wrapper.unmount();
      records = [cs101()];
      await mountCourses(studentUser);

      const labels = wrapper
        .findAllComponents({ name: "VBtn" })
        .map((btn) => btn.text().trim());
      expect(labels.filter((label) => label === "Add Course")).toEqual([]);
      expect(wrapper.find('[aria-label="Edit course"]').exists()).toBe(false);
      expect(wrapper.find('[aria-label="Delete course"]').exists()).toBe(false);
      expect(courseServices.create).not.toHaveBeenCalled();
      expect(courseServices.update).not.toHaveBeenCalled();
      expect(courseServices.delete).not.toHaveBeenCalled();
    });

    it("Student user view list of courses access", async () => {
      records = [cs101(), algorithms()];
      await openCourseFromMenu(studentUser);

      expect(courseServices.findAll).toHaveBeenCalled();
      expect(wrapper.find("table").exists()).toBe(true);
      expect(wrapper.text()).toContain("Intro to CS");
      expect(wrapper.text()).toContain("Algorithms");
    });
  });
});
