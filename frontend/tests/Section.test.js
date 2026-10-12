/**
 * Feature 5 — Section Management
 * Spec: features/feature-5-section-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
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

const facultyUser = {
  userId: 2,
  universityId: "fa0001",
  email: "faculty@example.com",
  fName: "Alex",
  lName: "Faculty",
  role: "faculty",
  token: "faculty-token",
};

const programming1 = {
  id: 1,
  courseNumber: "CS101",
  courseName: "Programming 1",
  courseDescription: "Intro programming",
  courseTerm: "Fall",
};

const davidNorth = {
  id: 7,
  firstName: "David",
  lastName: "North",
  dept: "Computer Science",
};

let courses = [];
let facultyRows = [];
let records = [];

const sectionRecord = (overrides = {}) => ({
  id: 1,
  sectionNumber: "1",
  courseId: 1,
  facultyId: 7,
  daysOfWeek: "MWF",
  startTime: "09:00:00",
  endTime: "09:50:00",
  course: { id: 1, courseName: "Programming 1" },
  ...overrides,
});

const mountOptions = {
  attachTo: document.body,
};

const createSectionRouter = async (initialPath = "/sections/1") => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div>Home</div>" } },
      { path: "/login", name: "login", component: { template: "<div>Login</div>" } },
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

describe("Feature 5 — Section Management", () => {
  let wrapper;

  beforeEach(() => {
    localStorage.clear();
    courses = [programming1];
    facultyRows = [davidNorth];
    records = [sectionRecord()];
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
    sectionServices.updateSection.mockImplementation(async (sectionId, payload) => {
      const current = records.find((row) => row.id === sectionId);
      const course = courses.find((row) => row.id === payload.courseId);
      const updated = {
        ...current,
        ...payload,
        course: course
          ? { id: course.id, courseName: course.courseName }
          : current.course,
      };
      records = records.map((row) => (row.id === sectionId ? updated : row));
      return { data: updated, status: 200 };
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountReady = async () => {
    Utils.setStore("user", facultyUser);
    const router = await createSectionRouter("/sections/1");
    const Shell = defineComponent({
      template: "<v-app><router-view /></v-app>",
    });
    const mounted = await mountWithPlugins(Shell, { router, ...mountOptions });
    wrapper = mounted.wrapper;
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

  const headingTitle = () =>
    wrapper.getComponent({ name: "VCardTitle" }).text().trim();

  const headingSubtitle = () =>
    wrapper.getComponent({ name: "VCardSubtitle" }).text();

  const openEditDialog = async () => {
    await clickButton(wrapper, "Edit section");
    const editDialog = dialogWith(wrapper, "Edit Section");
    expect(editDialog).toBeTruthy();
    return editDialog;
  };

  describe("US-5.5 — View a section", () => {
    it("Section view shows section info and actions", async () => {
      await mountReady();

      expect(headingTitle()).toBe("1");
      expect(headingSubtitle()).toContain("Programming 1");
      expect(findButton(wrapper, "Edit section")).toBeTruthy();
    });
  });

  describe("US-5.6 — Edit a section", () => {
    it("User selects to edit a section", async () => {
      await mountReady();
      await openEditDialog();
    });

    it("User edits a section with valid values and saves", async () => {
      await mountReady();
      const editDialog = await openEditDialog();
      await setField(editDialog, "Section Number", "02");
      await setField(editDialog, "Days of Week", "TR");
      await setField(editDialog, "Start Time", "10:00:00");
      await setField(editDialog, "End Time", "10:50:00");
      await clickButton(editDialog, "Save Section");

      expect(sectionServices.updateSection).toHaveBeenCalledWith(1, {
        sectionNumber: "02",
        courseId: programming1.id,
        facultyId: davidNorth.id,
        daysOfWeek: "TR",
        startTime: "10:00:00",
        endTime: "10:50:00",
      });
      expect(headingTitle()).toBe("02");
      expect(headingSubtitle()).toContain("Programming 1");
      expect(headingSubtitle()).toContain("TR");
      expect(headingSubtitle()).toContain("10:00:00");
      expect(headingSubtitle()).toContain("10:50:00");
      expect(dialogWith(wrapper, "Edit Section")).toBeUndefined();
    });

    it("User edits a section with invalid values and saves", async () => {
      await mountReady();
      const editDialog = await openEditDialog();
      await setField(editDialog, "Section Number", "");
      await setField(editDialog, "Start Time", "10:00:00");
      await setField(editDialog, "End Time", "09:00:00");
      await clickButton(editDialog, "Save Section");

      expect(sectionServices.updateSection).not.toHaveBeenCalled();
      expect(dialogText(editDialog)).toContain("Required");
      expect(dialogText(editDialog)).toContain(
        "Section start time must be before end time.",
      );
      expect(dialogWith(wrapper, "Edit Section")).toBeTruthy();
      expect(headingTitle()).toBe("1");
    });

    it("User edits a section and cancels", async () => {
      await mountReady();
      const editDialog = await openEditDialog();
      await setField(editDialog, "Section Number", "99");
      await clickButton(editDialog, "Cancel");

      expect(sectionServices.updateSection).not.toHaveBeenCalled();
      expect(headingTitle()).toBe("1");
      expect(headingSubtitle()).toContain("Programming 1");
      expect(dialogWith(wrapper, "Edit Section")).toBeUndefined();
    });
  });
});
