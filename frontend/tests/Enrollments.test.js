/**
 * Feature 6 — Enrollment Management
 * Spec: features/feature-6-enrollment-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../src/App.vue";
import Enrollments from "../src/views/Enrollments.vue";
import Utils from "../src/config/utils.js";
import enrollmentServices from "../src/services/enrollmentServices.js";
import courseServices from "../src/services/courseServices.js";
import sectionServices from "../src/services/sectionServices.js";
import semesterServices from "../src/services/semesterServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/enrollmentServices.js", () => ({
  default: {
    getStudentEnrollments: vi.fn(),
    getEnrollments: vi.fn(),
    createEnrollment: vi.fn(),
    updateEnrollment: vi.fn(),
    deleteEnrollment: vi.fn(),
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

vi.mock("../src/services/sectionServices.js", () => ({
  default: {
    getSections: vi.fn(),
    createSection: vi.fn(),
    updateSection: vi.fn(),
    deleteSection: vi.fn(),
  },
}));

vi.mock("../src/services/semesterServices.js", () => ({
  default: {
    getSemesters: vi.fn(),
    createSemester: vi.fn(),
    updateSemester: vi.fn(),
    deleteSemester: vi.fn(),
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

const studentUser = {
  userId: 4,
  universityId: "st1111",
  email: "sam@example.com",
  fName: "Sam",
  lName: "Student",
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

const programming1 = () => ({
  id: 1,
  courseNumber: "CS101",
  courseName: "Programming 1",
  courseDescription: "Intro programming",
  courseTerm: "Fall",
});

const section01 = () => ({
  id: 1,
  sectionNumber: "01",
  courseId: 1,
  facultyId: 7,
  daysOfWeek: "MWF",
  startTime: "09:00:00",
  endTime: "09:50:00",
});

const section02 = () => ({
  id: 2,
  sectionNumber: "02",
  courseId: 1,
  facultyId: 7,
  daysOfWeek: "TR",
  startTime: "10:00:00",
  endTime: "10:50:00",
});

const fall2026 = () => ({
  id: 1,
  name: "Fall 2026",
});

const enrollmentRecord = (overrides = {}) => ({
  id: 1,
  sectionId: 1,
  semesterId: 1,
  studentId: studentUser.userId,
  createdAt: "2026-07-02T12:00:00.000Z",
  updatedAt: "2026-07-02T12:00:00.000Z",
  ...overrides,
});

let courses = [];
let sections = [];
let semesters = [];
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

const createEnrollmentsRouter = async (initialPath = "/enrollments") => {
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
      { path: "/enrollments", name: "enrollments", component: Enrollments },
    ],
  });
  await router.push(initialPath);
  await router.isReady();
  return router;
};

const findButton = (root, label) =>
  root.findAllComponents({ name: "VBtn" }).find((btn) => btn.text().trim() === label);

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

describe("Feature 6 — Enrollment Management", () => {
  let wrapper;

  beforeEach(() => {
    localStorage.clear();
    courses = [];
    sections = [];
    semesters = [];
    records = [];
    nextId = 1;

    for (const fn of Object.values(enrollmentServices)) {
      fn.mockReset();
    }
    for (const fn of Object.values(courseServices)) {
      fn.mockReset();
    }
    for (const fn of Object.values(sectionServices)) {
      fn.mockReset();
    }
    for (const fn of Object.values(semesterServices)) {
      fn.mockReset();
    }

    courseServices.findAll.mockImplementation(() =>
      Promise.resolve({ data: courses.map((row) => ({ ...row })) }),
    );
    sectionServices.getSections.mockImplementation(() =>
      Promise.resolve({ data: sections.map((row) => ({ ...row })) }),
    );
    semesterServices.getSemesters.mockImplementation(() =>
      Promise.resolve({ data: semesters.map((row) => ({ ...row })) }),
    );
    enrollmentServices.getStudentEnrollments.mockImplementation((studentId) =>
      Promise.resolve({
        data: records
          .filter((row) => row.studentId === studentId)
          .map((row) => ({ ...row })),
      }),
    );
    enrollmentServices.getEnrollments.mockImplementation(() =>
      Promise.resolve({ data: records.map((row) => ({ ...row })) }),
    );
    enrollmentServices.createEnrollment.mockImplementation(async (studentId, payload) => {
      const created = enrollmentRecord({
        id: nextId++,
        sectionId: payload.sectionId,
        semesterId: payload.semesterId,
        studentId,
      });
      records.push(created);
      return { data: created, status: 201 };
    });
    enrollmentServices.updateEnrollment.mockImplementation(
      async (studentId, enrollmentId, payload) => {
        const row = records.find(
          (item) => item.id === enrollmentId && item.studentId === studentId,
        );
        Object.assign(row, {
          sectionId: payload.sectionId,
          semesterId: payload.semesterId,
        });
        return { data: { ...row }, status: 200 };
      },
    );
    enrollmentServices.deleteEnrollment.mockImplementation(async (_studentId, enrollmentId) => {
      records = records.filter((row) => row.id !== enrollmentId);
      return { data: { message: "Enrollment deleted." }, status: 200 };
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountEnrollments = async (user = studentUser, initialPath = "/enrollments") => {
    Utils.setStore("user", user);
    const router = await createEnrollmentsRouter(initialPath);
    const Shell = defineComponent({
      template: "<v-app><router-view /></v-app>",
    });
    const mounted = await mountWithPlugins(Shell, { router, ...mountOptions });
    wrapper = mounted.wrapper;
    return mounted;
  };

  const mountReady = async (user = studentUser) => {
    const mounted = await mountEnrollments(user);
    await flushPromises();
    return mounted;
  };

  const clickButton = async (root, label) => {
    const button = findButton(root, label);
    expect(button).toBeTruthy();
    await button.trigger("click");
    await flushPromises();
  };

  const chooseSelect = async (root, label, value) => {
    const select = findSelect(root, label);
    expect(select).toBeTruthy();
    select.vm.$emit("update:modelValue", value);
    await flushPromises();
  };

  const enrollmentRow = (sectionNumber) => {
    const row = wrapper
      .findAll("tbody tr")
      .find((tr) => tr.text().includes(sectionNumber));
    expect(row).toBeTruthy();
    return row;
  };

  const openAddDialog = async () => {
    await clickButton(wrapper, "+ New enrollment");
    const dialog = dialogWith(wrapper, "Add Enrollment");
    expect(dialog).toBeTruthy();
    return dialog;
  };

  const openEditFrom = async (row) => {
    await row.find('[aria-label="Edit enrollment"]').trigger("click");
    await flushPromises();
    const dialog = dialogWith(wrapper, "Edit Enrollment");
    expect(dialog).toBeTruthy();
    return dialog;
  };

  const openDeleteFrom = async (row) => {
    await row.find('[aria-label="Delete enrollment"]').trigger("click");
    await flushPromises();
    const dialog = dialogWith(wrapper, "Delete this enrollment?");
    expect(dialog).toBeTruthy();
    return dialog;
  };

  describe("US-6.1 — Select to work with Enrollments", () => {
    const mountAppAtHome = async (user) => {
      Utils.setStore("user", user);
      const router = await createEnrollmentsRouter("/");
      const mounted = await mountWithPlugins(App, { router, ...mountOptions });
      wrapper = mounted.wrapper;
      return router;
    };

    it("Student opens enrollments from the menu", async () => {
      const router = await mountAppAtHome(studentUser);

      await clickButton(wrapper, "Enrollments");
      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("enrollments");
      });

      expect(router.currentRoute.value.path).toBe("/enrollments");
      expect(wrapper.findComponent(Enrollments).exists()).toBe(true);
      expect(wrapper.text()).toContain("Enrollments");
    });

    it("Faculty opens enrollments from the menu", async () => {
      const router = await mountAppAtHome(facultyUser);

      await clickButton(wrapper, "Enrollments");
      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("enrollments");
      });

      expect(router.currentRoute.value.path).toBe("/enrollments");
      expect(wrapper.findComponent(Enrollments).exists()).toBe(true);
      expect(wrapper.text()).toContain("Enrollments");
    });
  });

  describe("US-6.2 — Create enrollment", () => {
    it("User creates a new enrollment", async () => {
      courses = [programming1()];
      sections = [section01()];
      semesters = [fall2026()];
      await mountReady();
      const dialog = await openAddDialog();
      await chooseSelect(dialog, "Course", programming1().id);
      await chooseSelect(dialog, "Section", section01().id);
      await chooseSelect(dialog, "Semester", fall2026().id);
      await clickButton(dialog, "Create");

      expect(enrollmentServices.createEnrollment).toHaveBeenCalledWith(studentUser.userId, {
        sectionId: section01().id,
        semesterId: fall2026().id,
      });
      const result = await enrollmentServices.createEnrollment.mock.results[0].value;
      expect(result.status).toBe(201);
      expect(result.data).toMatchObject({
        id: expect.any(Number),
        sectionId: section01().id,
        semesterId: fall2026().id,
        studentId: studentUser.userId,
      });
      expect(enrollmentRow("01").text()).toContain("Programming 1");
      expect(dialogWith(wrapper, "Add Enrollment")).toBeUndefined();
    });

    it("User creates an enrollment with a missing required field", async () => {
      courses = [programming1()];
      sections = [section01()];
      semesters = [fall2026()];
      await mountReady();
      const dialog = await openAddDialog();
      await clickButton(dialog, "Create");

      expect(enrollmentServices.createEnrollment).not.toHaveBeenCalled();
      expect(dialogText(dialog)).toContain("Required");
      expect(dialogWith(wrapper, "Add Enrollment")).toBeTruthy();
    });

    it("User creates an enrollment with a faculty account", async () => {
      courses = [programming1()];
      sections = [section01()];
      semesters = [fall2026()];
      await mountReady(facultyUser);

      expect(findButton(wrapper, "+ New enrollment")).toBeUndefined();
    });
  });

  describe("US-6.3 — Student View enrollments", () => {
    it("Student enrollments view loads with existing enrollments", async () => {
      courses = [programming1()];
      sections = [section01(), section02()];
      semesters = [fall2026()];
      records = [
        enrollmentRecord({ id: 2, sectionId: 2, studentId: 8 }),
        enrollmentRecord({ id: 1, sectionId: 1 }),
        enrollmentRecord({ id: 3, sectionId: 2 }),
      ];

      enrollmentServices.getStudentEnrollments.mockRejectedValueOnce(
        apiError("Failed to fetch enrollments.", 500),
      );
      await mountReady();
      expect(wrapper.getComponent({ name: "VAlert" }).text()).toContain(
        "Failed to fetch enrollments.",
      );
      wrapper.unmount();

      let releaseList;
      enrollmentServices.getStudentEnrollments.mockImplementation(
        (studentId) =>
          new Promise((resolve) => {
            releaseList = () =>
              resolve({
                data: records
                  .filter((row) => row.studentId === studentId)
                  .map((row) => ({ ...row })),
              });
          }),
      );
      await mountEnrollments();
      expect(wrapper.findComponent({ name: "VProgressLinear" }).exists()).toBe(true);
      releaseList();
      await flushPromises();

      const rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(2);
      expect(rows[0].text()).toContain("Programming 1");
      expect(rows[0].text()).toContain("01");
      expect(rows[1].text()).toContain("02");
      expect(wrapper.text()).not.toContain("studentId");
      expect(enrollmentServices.getStudentEnrollments).toHaveBeenCalledWith(
        studentUser.userId,
      );
      expect(enrollmentServices.getEnrollments).not.toHaveBeenCalled();
    });

    it("Student has no enrollments", async () => {
      await mountReady();

      expect(wrapper.text()).toContain(
        "No enrollments yet. Create your first enrollment.",
      );
      expect(wrapper.find("tbody tr").exists()).toBe(false);
    });
  });

  describe("US-6.4 — Faculty View enrollments", () => {
    it("Faculty enrollments view loads with existing enrollments", async () => {
      courses = [programming1()];
      sections = [section01(), section02()];
      semesters = [fall2026()];
      records = [
        enrollmentRecord({ id: 1, sectionId: 1, studentId: 4 }),
        enrollmentRecord({ id: 2, sectionId: 2, studentId: 8 }),
      ];
      await mountReady(facultyUser);

      const rows = wrapper.findAll("tbody tr");
      expect(rows).toHaveLength(2);
      expect(rows[0].text()).toContain("Programming 1");
      expect(rows[0].text()).toContain("01");
      expect(rows[0].text()).toContain("4");
      expect(rows[1].text()).toContain("02");
      expect(rows[1].text()).toContain("8");
      expect(wrapper.text()).toContain("studentId");
      expect(enrollmentServices.getEnrollments).toHaveBeenCalled();
      expect(enrollmentServices.getStudentEnrollments).not.toHaveBeenCalled();
    });

    it("Faculty has no enrollments", async () => {
      await mountReady(facultyUser);

      expect(wrapper.text()).toContain("No enrollments yet for students.");
      expect(wrapper.find("tbody tr").exists()).toBe(false);
    });
  });

  describe("US-6.5 — Manage enrollment rows", () => {
    it("Student enrollment rows show edit and delete actions", async () => {
      courses = [programming1()];
      sections = [section01()];
      semesters = [fall2026()];
      records = [enrollmentRecord()];
      await mountReady();

      const row = enrollmentRow("01");
      expect(row.find('[aria-label="Edit enrollment"]').exists()).toBe(true);
      expect(row.find('[aria-label="Delete enrollment"]').exists()).toBe(true);
    });

    it("Faculty enrollment rows do not show edit and delete actions", async () => {
      courses = [programming1()];
      sections = [section01()];
      semesters = [fall2026()];
      records = [enrollmentRecord({ studentId: 8 })];
      await mountReady(facultyUser);

      const row = enrollmentRow("01");
      expect(row.find('[aria-label="Edit enrollment"]').exists()).toBe(false);
      expect(row.find('[aria-label="Delete enrollment"]').exists()).toBe(false);
    });
  });

  describe("US-6.6 — Edit an enrollment", () => {
    const withEditableEnrollment = async () => {
      courses = [programming1()];
      sections = [section01(), section02()];
      semesters = [fall2026()];
      records = [enrollmentRecord()];
      nextId = 2;
      await mountReady();
    };

    it("User selects to edit an enrollment", async () => {
      await withEditableEnrollment();
      const dialog = await openEditFrom(enrollmentRow("01"));

      expect(findSelect(dialog, "Section").props("modelValue")).toBe(section01().id);
      expect(findSelect(dialog, "Course").props("modelValue")).toBe(programming1().id);
      expect(findSelect(dialog, "Semester").props("modelValue")).toBe(fall2026().id);
    });

    it("User edits an enrollment with valid values and saves", async () => {
      await withEditableEnrollment();
      const dialog = await openEditFrom(enrollmentRow("01"));
      await chooseSelect(dialog, "Course", programming1().id);
      await chooseSelect(dialog, "Section", section02().id);
      await clickButton(dialog, "Save Enrollment");

      expect(enrollmentServices.updateEnrollment).toHaveBeenCalledWith(
        studentUser.userId,
        1,
        {
          sectionId: section02().id,
          semesterId: fall2026().id,
        },
      );
      const result = await enrollmentServices.updateEnrollment.mock.results[0].value;
      expect(result.status).toBe(200);
      expect(result.data.sectionId).toBe(section02().id);
      expect(enrollmentRow("02").text()).toContain("Programming 1");
      expect(dialogWith(wrapper, "Edit Enrollment")).toBeUndefined();
    });

    it("User edits an enrollment with invalid values and saves", async () => {
      await withEditableEnrollment();
      const dialog = await openEditFrom(enrollmentRow("01"));
      await chooseSelect(dialog, "Section", null);
      await clickButton(dialog, "Save Enrollment");

      expect(enrollmentServices.updateEnrollment).not.toHaveBeenCalled();
      expect(dialogText(dialog)).toContain("Required");
      expect(dialogWith(wrapper, "Edit Enrollment")).toBeTruthy();
    });

    it("User edits an enrollment and cancels", async () => {
      await withEditableEnrollment();
      const dialog = await openEditFrom(enrollmentRow("01"));
      await chooseSelect(dialog, "Section", section02().id);
      await clickButton(dialog, "Cancel");

      expect(enrollmentServices.updateEnrollment).not.toHaveBeenCalled();
      expect(enrollmentRow("01").text()).toContain("Programming 1");
      expect(
        wrapper.findAll("tbody tr").some((row) => row.text().includes("02")),
      ).toBe(false);
      expect(dialogWith(wrapper, "Edit Enrollment")).toBeUndefined();
    });
  });

  describe("US-6.7 — Delete an enrollment", () => {
    const withDeletableEnrollment = async () => {
      courses = [programming1()];
      sections = [section01()];
      semesters = [fall2026()];
      records = [enrollmentRecord()];
      await mountReady();
    };

    it("User selects to delete an enrollment", async () => {
      await withDeletableEnrollment();
      await openDeleteFrom(enrollmentRow("01"));
    });

    it("User deletes an enrollment", async () => {
      await withDeletableEnrollment();
      const dialog = await openDeleteFrom(enrollmentRow("01"));
      await clickButton(dialog, "Delete Enrollment");

      expect(enrollmentServices.deleteEnrollment).toHaveBeenCalledWith(
        studentUser.userId,
        1,
      );
      expect(dialogWith(wrapper, "Delete this enrollment?")).toBeUndefined();
      expect(wrapper.find("tbody tr").exists()).toBe(false);
      expect(wrapper.text()).toContain(
        "No enrollments yet. Create your first enrollment.",
      );
    });

    it("User cancels deleting an enrollment", async () => {
      await withDeletableEnrollment();
      const dialog = await openDeleteFrom(enrollmentRow("01"));
      await clickButton(dialog, "Cancel");

      expect(enrollmentServices.deleteEnrollment).not.toHaveBeenCalled();
      expect(enrollmentRow("01")).toBeTruthy();
      expect(dialogWith(wrapper, "Delete this enrollment?")).toBeUndefined();
    });
  });
});
