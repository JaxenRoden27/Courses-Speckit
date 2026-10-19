/**
 * Feature 5 — Section Management
 * Spec: features/feature-5-section-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../src/App.vue";
import Sections from "../src/views/Sections.vue";
import Section from "../src/views/Section.vue";
import Utils from "../src/config/utils.js";
import sectionServices from "../src/services/sectionServices.js";
import courseServices from "../src/services/courseServices.js";
import facultyServices from "../src/services/facultyServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/sectionServices.js", () => ({
  default: {
    getSections: vi.fn(),
    createSection: vi.fn(),
    updateSection: vi.fn(),
    deleteSection: vi.fn(),
  },
}));

vi.mock("../src/services/courseServices.js", () => ({
  default: {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

const facultyUser = {
  userId: 2,
  universityId: "fa0001",
  email: "faculty@example.com",
  fName: "Alex",
  lName: "Faculty",
  role: "faculty",
  token: "faculty-token",
};

const programming1 = () => ({
  id: 1,
  courseNumber: "CS101",
  courseName: "Programming 1",
  courseDescription: "Intro programming",
  courseTerm: "Fall",
});

const programming2 = () => ({
  id: 2,
  courseNumber: "CS102",
  courseName: "Programming 2",
  courseDescription: "More programming",
  courseTerm: "Fall",
});

const davidNorth = () => ({
  id: 7,
  firstName: "David",
  lastName: "North",
  dept: "Computer Science",
});

const sectionRecord = (overrides = {}) => ({
  id: 1,
  sectionNumber: "01",
  courseId: 1,
  facultyId: 7,
  daysOfWeek: "MWF",
  startTime: "09:00:00",
  endTime: "09:50:00",
  course: { id: 1, courseName: "Programming 1" },
  ...overrides,
});

let courses = [];
let facultyRows = [];
let records = [];
let nextId = 1;

const apiError = (message, status = 400) => {
  const error = new Error(message);
  error.response = { status, data: { message } };
  return error;
};

const mountOptions = {
  attachTo: document.body,
};

const createSectionsRouter = async (initialPath = "/sections") => {
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
      { path: "/sections", name: "sections", component: Sections },
      {
        path: "/sections/:sectionId",
        name: "section",
        component: Section,
      },
    ],
  });
  await router.push(initialPath);
  await router.isReady();
  return router;
};

const findButton = (root, label) =>
  root.findAllComponents({ name: "VBtn" }).find((btn) => btn.text().trim() === label);

const findField = (root, label) =>
  root
    .findAllComponents({ name: "VTextField" })
    .find((field) => field.props("label") === label);

const findSelect = (root, label) =>
  root.findAllComponents({ name: "VSelect" }).find((field) => field.props("label") === label);

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

const courseGroupElement = (root, courseName) => {
  const heading = root.findAll("h2").find((node) => node.text() === courseName);
  expect(heading).toBeTruthy();
  const group = heading.element.closest(".mb-8");
  expect(group).toBeTruthy();
  return group;
};

const sectionRow = (root, courseName, sectionNumber) => {
  const group = courseGroupElement(root, courseName);
  const row = root
    .findAll("tbody tr")
    .find(
      (tr) => group.contains(tr.element) && tr.text().includes(sectionNumber),
    );
  expect(row).toBeTruthy();
  return row;
};

describe("Feature 5 — Section Management", () => {
  let wrapper;

  beforeEach(() => {
    localStorage.clear();
    courses = [];
    facultyRows = [];
    records = [];
    nextId = 1;
    for (const fn of Object.values(sectionServices)) {
      fn.mockReset();
    }

    courseServices.findAll.mockImplementation(() =>
      Promise.resolve({ data: courses.map((row) => ({ ...row })) }),
    );
    facultyServices.getFaculty.mockImplementation(() =>
      Promise.resolve({ data: facultyRows.map((row) => ({ ...row })) }),
    );
    sectionServices.getSections.mockImplementation(() =>
      Promise.resolve({
        data: records.map((row) => ({
          ...row,
          course: row.course ? { ...row.course } : null,
        })),
      }),
    );
    sectionServices.createSection.mockImplementation(async (payload) => {
      const duplicate = records.some(
        (row) =>
          row.courseId === payload.courseId &&
          row.sectionNumber === payload.sectionNumber,
      );
      if (duplicate) {
        throw apiError("Section number is already taken in this course.");
      }
      const course = courses.find((row) => row.id === payload.courseId);
      const created = {
        id: nextId++,
        ...payload,
        course: course ? { id: course.id, courseName: course.courseName } : null,
      };
      records.push(created);
      return { data: created, status: 201 };
    });
    sectionServices.deleteSection.mockImplementation(async (sectionId) => {
      records = records.filter((row) => row.id !== sectionId);
      return { data: { message: "section deleted successfully." }, status: 200 };
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountSections = async (initialPath = "/sections") => {
    Utils.setStore("user", facultyUser);
    const router = await createSectionsRouter(initialPath);
    const Shell = defineComponent({
      template: "<v-app><router-view /></v-app>",
    });
    const mounted = await mountWithPlugins(Shell, { router, ...mountOptions });
    wrapper = mounted.wrapper;
    return mounted;
  };

  const mountReady = async () => {
    const mounted = await mountSections();
    await flushPromises();
    return mounted;
  };

  const clickButton = async (root, label) => {
    const button = findButton(root, label);
    expect(button).toBeTruthy();
    await button.trigger("click");
    await flushPromises();
  };

  const setField = async (root, label, value) => {
    const field = findField(root, label);
    expect(field).toBeTruthy();
    field.vm.$emit("update:modelValue", value);
    await flushPromises();
  };

  const chooseFaculty = async (root, facultyId) => {
    const select = findSelect(root, "Faculty");
    expect(select).toBeTruthy();
    select.vm.$emit("update:modelValue", facultyId);
    await flushPromises();
  };

  const openAddDialog = async (courseName) => {
    const group = courseGroupElement(wrapper, courseName);
    const button = wrapper
      .findAllComponents({ name: "VBtn" })
      .find(
        (btn) =>
          btn.text().trim() === "+ New section" && group.contains(btn.element),
      );
    expect(button).toBeTruthy();
    await button.trigger("click");
    await flushPromises();
    const dialog = dialogWith(wrapper, "Add Section");
    expect(dialog).toBeTruthy();
    return dialog;
  };

  const fillSection = async (dialog, fields) => {
    await setField(dialog, "Section Number", fields.sectionNumber);
    await chooseFaculty(dialog, fields.facultyId);
    await setField(dialog, "Days of Week", fields.daysOfWeek);
    await setField(dialog, "Start Time", fields.startTime);
    await setField(dialog, "End Time", fields.endTime);
  };

  describe("US-5.1 — Select to work with Sections", () => {
    it("Menu Selection", async () => {
      Utils.setStore("user", facultyUser);
      const router = await createSectionsRouter("/");
      const mounted = await mountWithPlugins(App, { router, ...mountOptions });
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "Sections");
      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("sections");
      });
      expect(router.currentRoute.value.path).toBe("/sections");
      expect(wrapper.findComponent(Sections).exists()).toBe(true);
      expect(wrapper.text()).toContain("Sections");
    });
  });

  describe("US-5.2 — Create section", () => {
    it("User creates a new section", async () => {
      courses = [programming1()];
      facultyRows = [davidNorth()];
      await mountReady();
      const dialog = await openAddDialog("Programming 1");
      await fillSection(dialog, {
        sectionNumber: "01",
        facultyId: davidNorth().id,
        daysOfWeek: "MWF",
        startTime: "09:00:00",
        endTime: "09:50:00",
      });
      await clickButton(dialog, "Create");

      expect(sectionServices.createSection).toHaveBeenCalledWith({
        sectionNumber: "01",
        courseId: programming1().id,
        facultyId: davidNorth().id,
        daysOfWeek: "MWF",
        startTime: "09:00:00",
        endTime: "09:50:00",
      });
      const result = await sectionServices.createSection.mock.results[0].value;
      expect(result.status).toBe(201);
      expect(result.data).toMatchObject({
        id: expect.any(Number),
        sectionNumber: "01",
        daysOfWeek: "MWF",
        startTime: "09:00:00",
        endTime: "09:50:00",
      });
      expect(result.data.course.courseName).toBe("Programming 1");
      expect(courseGroupElement(wrapper, "Programming 1").textContent).toContain(
        "01",
      );
      expect(dialogWith(wrapper, "Add Section")).toBeUndefined();
    });

    it("User creates a section with a missing required field", async () => {
      courses = [programming1()];
      facultyRows = [davidNorth()];
      await mountReady();
      const dialog = await openAddDialog("Programming 1");
      await clickButton(dialog, "Create");

      expect(sectionServices.createSection).not.toHaveBeenCalled();
      expect(dialogText(dialog)).toContain("Required");
      expect(dialogWith(wrapper, "Add Section")).toBeTruthy();
    });

    it("User creates a section with a number that is too long", async () => {
      courses = [programming1()];
      facultyRows = [davidNorth()];
      await mountReady();
      const dialog = await openAddDialog("Programming 1");
      await fillSection(dialog, {
        sectionNumber: "12345678901",
        facultyId: davidNorth().id,
        daysOfWeek: "MWF",
        startTime: "09:00:00",
        endTime: "09:50:00",
      });
      await clickButton(dialog, "Create");

      expect(sectionServices.createSection).not.toHaveBeenCalled();
      expect(dialogText(dialog)).toContain(
        "Section name must be 10 characters or fewer.",
      );
      expect(dialogWith(wrapper, "Add Section")).toBeTruthy();
    });

    it("User creates a section with a duplicate number in the same course", async () => {
      courses = [programming1()];
      facultyRows = [davidNorth()];
      records = [sectionRecord()];
      nextId = 2;
      await mountReady();
      const dialog = await openAddDialog("Programming 1");
      await fillSection(dialog, {
        sectionNumber: "01",
        facultyId: davidNorth().id,
        daysOfWeek: "MWF",
        startTime: "09:00:00",
        endTime: "09:50:00",
      });
      await clickButton(dialog, "Create");

      expect(sectionServices.createSection).toHaveBeenCalled();
      await expect(
        sectionServices.createSection.mock.results[0].value,
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: { message: "Section number is already taken in this course." },
        },
      });
      expect(dialogText(dialog)).toContain(
        "Section number is already taken in this course.",
      );
      const rows = [
        ...courseGroupElement(wrapper, "Programming 1").querySelectorAll(
          "tbody tr",
        ),
      ];
      expect(rows.filter((row) => row.textContent.includes("01"))).toHaveLength(
        1,
      );
      expect(dialogWith(wrapper, "Add Section")).toBeTruthy();
    });

    it("User creates a section with an end time earlier than start time", async () => {
      courses = [programming1()];
      facultyRows = [davidNorth()];
      await mountReady();
      const dialog = await openAddDialog("Programming 1");
      await fillSection(dialog, {
        sectionNumber: "01",
        facultyId: davidNorth().id,
        daysOfWeek: "MWF",
        startTime: "09:50:00",
        endTime: "09:00:00",
      });
      await clickButton(dialog, "Create");

      expect(sectionServices.createSection).not.toHaveBeenCalled();
      expect(dialogText(dialog)).toContain(
        "Section start time must be before end time.",
      );
      expect(dialogWith(wrapper, "Add Section")).toBeTruthy();
    });
  });

  describe("US-5.3 — View sections", () => {
    it("Sections are shown under their course", async () => {
      courses = [programming2(), programming1()];
      records = [
        sectionRecord({
          id: 2,
          sectionNumber: "02",
          courseId: 2,
          course: { id: 2, courseName: "Programming 2" },
        }),
        sectionRecord(),
      ];
      await mountReady();

      const headings = wrapper.findAll("h2").map((heading) => heading.text());
      expect(headings).toEqual(["Programming 1", "Programming 2"]);
      const firstGroup = courseGroupElement(wrapper, "Programming 1").textContent;
      const secondGroup = courseGroupElement(wrapper, "Programming 2").textContent;
      expect(firstGroup).toContain("01");
      expect(firstGroup).not.toContain("02");
      expect(secondGroup).toContain("02");
      expect(secondGroup).not.toContain("01");
    });

    it("A course has no sections", async () => {
      courses = [programming1()];
      await mountReady();

      expect(courseGroupElement(wrapper, "Programming 1").textContent).toContain(
        "Programming 1",
      );
      expect(courseGroupElement(wrapper, "Programming 1").textContent).toContain(
        "No sections for this course.",
      );
    });

    it("There are no courses", async () => {
      await mountReady();

      expect(wrapper.text()).toContain("No courses yet.");
      expect(findButton(wrapper, "+ New section")).toBeUndefined();
    });
  });

  describe("US-5.4 — Manage section rows", () => {
    it("section rows open the section view and show a delete action", async () => {
      courses = [programming1()];
      records = [sectionRecord()];
      await mountReady();

      const row = sectionRow(wrapper, "Programming 1", "01");
      const numberCell = row.findAll("td")[0];
      expect(numberCell.text()).toBe("01");
      expect(numberCell.find("a").exists()).toBe(false);
      expect(row.find('[aria-label="Open section"]').exists()).toBe(true);
      expect(row.find('[aria-label="Delete section"]').exists()).toBe(true);
    });
  });

  describe("US-5.5 — View a section", () => {
    it("User opens a section from the sections list", async () => {
      courses = [programming1()];
      records = [sectionRecord({ sectionNumber: "1" })];
      const { router } = await mountReady();
      const row = sectionRow(wrapper, "Programming 1", "1");

      await row.find('[aria-label="Open section"]').trigger("click");
      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("section");
      });
      await flushPromises();

      expect(router.currentRoute.value.name).toBe("section");
      expect(String(router.currentRoute.value.params.sectionId)).toBe("1");
      expect(wrapper.findComponent(Section).exists()).toBe(true);
      expect(wrapper.getComponent({ name: "VCardTitle" }).text().trim()).toBe("1");
    });
  });

  describe("US-5.7 — Delete a section", () => {
    const openDeleteFrom = async (row) => {
      await row.find('[aria-label="Delete section"]').trigger("click");
      await flushPromises();
      const deleteDialog = dialogWith(wrapper, "Delete this section?");
      expect(deleteDialog).toBeTruthy();
      return deleteDialog;
    };

    it("User selects to delete a section", async () => {
      courses = [programming1()];
      records = [sectionRecord()];
      await mountReady();
      await openDeleteFrom(sectionRow(wrapper, "Programming 1", "01"));
    });

    it("User deletes a section", async () => {
      courses = [programming1()];
      records = [sectionRecord()];
      await mountReady();
      const deleteDialog = await openDeleteFrom(
        sectionRow(wrapper, "Programming 1", "01"),
      );
      await clickButton(deleteDialog, "Delete Section");

      expect(sectionServices.deleteSection).toHaveBeenCalledWith(1);
      expect(dialogWith(wrapper, "Delete this section?")).toBeUndefined();
      expect(wrapper.find("tbody tr").exists()).toBe(false);
      expect(wrapper.text()).toContain("No sections for this course.");
    });

    it("User cancels deleting a section", async () => {
      courses = [programming1()];
      records = [sectionRecord()];
      await mountReady();
      const deleteDialog = await openDeleteFrom(
        sectionRow(wrapper, "Programming 1", "01"),
      );
      await clickButton(deleteDialog, "Cancel");

      expect(sectionServices.deleteSection).not.toHaveBeenCalled();
      expect(sectionRow(wrapper, "Programming 1", "01")).toBeTruthy();
      expect(dialogWith(wrapper, "Delete this section?")).toBeUndefined();
    });
  });
});
