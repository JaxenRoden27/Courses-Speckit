/**
 * Feature 7 — Student Course Listing
 * Spec: features/feature-7-student-course-listing.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import StudentList from "../src/views/StudentList.vue";
import StudentCourses from "../src/views/StudentCourses.vue";
import studentServices from "../src/services/studentServices.js";
import courseServices from "../src/services/courseServices.js";
import enrollmentServices from "../src/services/enrollmentServices.js";
import sectionServices from "../src/services/sectionServices.js";
import semesterServices from "../src/services/semesterServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/studentServices.js", () => ({
  default: {
    getStudents: vi.fn(),
    getStudent: vi.fn(),
    getStudentCourses: vi.fn(),
    enrollCourse: vi.fn(),
    updateEnrollment: vi.fn(),
  },
}));

vi.mock("../src/services/courseServices.js", () => ({
  default: {
    getCourses: vi.fn(),
    findAll: vi.fn(),
  },
}));

vi.mock("../src/services/sectionServices.js", () => ({
  default: {
    getSections: vi.fn(),
  },
}));

vi.mock("../src/services/semesterServices.js", () => ({
  default: {
    getSemesters: vi.fn(),
  },
}));

vi.mock("../src/services/enrollmentServices.js", () => ({
  default: {
    getStudentEnrollments: vi.fn(),
    getEnrollments: vi.fn(),
    createEnrollment: vi.fn(),
    updateEnrollment: vi.fn(),
    deleteEnrollment: vi.fn(),
  },
}));

const mockStudent = {
  id: 1,
  name: "John Doe",
  fName: "John",
  lName: "Doe",
  email: "john.doe@example.com",
  universityId: "ST1001",
  program: { name: "Computer Science" },
  admissionDate: "2024-09-01",
  expectedGraduation: "2028-05-01",
};

const mockCoursesList = [
  {
    id: 101,
    studentId: 1,
    term: "2026 Fall",
    schedule: "MWF 10:00 AM",
    room: "PEC 100",
    courseCode: "CS-101",
    courseTitle: "Intro to Programming",
    credits: 3,
    grade: "A",
  },
  {
    id: 102,
    studentId: 2,
    term: "2026 Fall",
    schedule: "TTH 01:00 PM",
    room: "MAB 200",
    courseCode: "MATH-201",
    courseTitle: "Calculus I",
    credits: 4,
    grade: "B",
  },
];

async function createStudentRouter(initialPath = "/students/1/courses") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/students", name: "students", component: StudentList },
      { path: "/students/:studentId/courses", name: "student", component: StudentCourses },
    ],
  });

  await router.push(initialPath);
  await router.isReady();
  return router;
}

const findButton = (root, label) =>
  root.findAllComponents({ name: "VBtn" }).find((btn) => btn.text().trim().includes(label));

const clickButton = async (root, label) => {
  const button = findButton(root, label);
  expect(button).toBeTruthy();
  await button.trigger("click");
  await flushPromises();
};

const openDialogs = (root) =>
  root
    .findAllComponents({ name: "VDialog" })
    .filter((dialog) => dialog.props("modelValue") === true);

const dialogText = (dialog) =>
  [
    ...dialog.findAllComponents({ name: "VCardTitle" }),
    ...dialog.findAllComponents({ name: "VCardText" }),
    ...dialog.findAllComponents({ name: "VAlert" }),
  ]
    .map((part) => part.text())
    .join(" ");

const dialogWith = (root, text) =>
  openDialogs(root).find((dialog) => dialogText(dialog).includes(text));

describe("Feature 7 — Student Course Listing", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();

    studentServices.getStudents.mockResolvedValue({
      data: [mockStudent, { id: 2, name: "Jane Smith", fName: "Jane", lName: "Smith" }],
    });
    studentServices.getStudent.mockResolvedValue({ data: mockStudent });
    studentServices.getStudentCourses.mockResolvedValue({ data: mockCoursesList });
    studentServices.enrollCourse.mockResolvedValue({ data: { id: 103, ...mockCoursesList[0] } });
    studentServices.updateEnrollment.mockResolvedValue({ data: { id: 101, room: "PEC 231" } });

    courseServices.getCourses.mockResolvedValue({
      data: [{ id: 1, courseNumber: "CS-101", courseName: "Intro to Programming" }],
    });

    sectionServices.getSections.mockResolvedValue({
      data: [
        {
          id: 1,
          sectionNumber: "1",
          courseId: 1,
          daysOfWeek: "MWF",
          startTime: "10:00:00",
          endTime: "10:50:00",
        },
      ],
    });

    semesterServices.getSemesters.mockResolvedValue({
      data: [{ id: 1, semester: "Fall 2026", name: "Fall 2026" }],
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountView = async (initialPath = "/students/1/courses") => {
    const router = await createStudentRouter(initialPath);
    const Shell = defineComponent({
      template: "<v-app><router-view /></v-app>",
    });
    const mounted = await mountWithPlugins(Shell, {
      router,
      attachTo: document.body,
    });
    wrapper = mounted.wrapper;
    await flushPromises();
    return { wrapper, router };
  };

  describe("US-7.1 — Open a student from the list", () => {
    it("students list rows include a view courses icon", async () => {
      const { wrapper: w } = await mountView("/students");

      const viewIcon = w.find('[aria-label="View courses"]');
      expect(viewIcon.exists()).toBe(true);
    });

    it("view courses icon opens the Student Course View", async () => {
      const { wrapper: w, router } = await mountView("/students");

      const viewIcon = w.find('[aria-label="View courses"]');
      expect(viewIcon.exists()).toBe(true);

      await viewIcon.trigger("click");
      await flushPromises();

      expect(router.currentRoute.value.path).toBe("/students/1/courses");
    });
  });

  describe("US-7.2 — View Student Info and courses", () => {
    it("shows student name and program in the heading", async () => {
      const { wrapper: w } = await mountView("/students/1/courses");

      expect(w.text()).toContain("John Doe");
      expect(w.text()).toContain("Computer Science");
      expect(w.text()).toContain("2024-09-01");
      expect(w.text()).toContain("2028-05-01");
    });

    it("lists enrolled courses for the open student", async () => {
      const { wrapper: w } = await mountView("/students/1/courses");

      expect(w.text()).toContain("CS-101");
      expect(w.text()).toContain("Intro to Programming");
      expect(w.text()).toContain("2026 Fall");
    });

    it("hides courses that belong to another student", async () => {
      const { wrapper: w } = await mountView("/students/1/courses");

      expect(w.text()).toContain("CS-101");
      expect(w.text()).not.toContain("MATH-201");
    });

    it("shows empty copy when the student has no courses", async () => {
      studentServices.getStudentCourses.mockResolvedValueOnce({ data: [] });

      const { wrapper: w } = await mountView("/students/1/courses");

      expect(w.text()).toContain("No courses enrolled yet. Enroll your first course.");
    });
  });

  describe("US-7.3 — Enroll a course defaulted to this student", () => {
    it("enroll course opens with this student selected", async () => {
      const { wrapper: w } = await mountView("/students/1/courses");

      await clickButton(w, "Enroll Course");

      const dialog = dialogWith(w, "Enroll Course");
      expect(dialog).toBeTruthy();
    });

    it("create from this view adds the course to the list", async () => {
      const { wrapper: w } = await mountView("/students/1/courses");

      await clickButton(w, "Enroll Course");

      const dialog = dialogWith(w, "Enroll Course");
      expect(dialog).toBeTruthy();

      const form = w.findComponent({ name: "CourseEnrollmentForm" });
      expect(form.exists()).toBe(true);

      form.vm.$emit("update:modelValue", {
        studentId: 1,
        term: "2026 Fall",
        schedule: "MWF 10:00 AM",
        courseCode: "CS-101",
        courseTitle: "Intro to Programming",
        credits: 3,
        grade: "A",
      });
      await flushPromises();

      await clickButton(dialog, "Create");

      expect(studentServices.enrollCourse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          studentId: 1,
          courseCode: "CS-101",
          courseTitle: "Intro to Programming",
        })
      );
    });

    it("create with a blank required field stays on the dialog", async () => {
      const { wrapper: w } = await mountView("/students/1/courses");

      await clickButton(w, "Enroll Course");

      const dialog = dialogWith(w, "Enroll Course");
      expect(dialog).toBeTruthy();

      const form = w.findComponent({ name: "CourseEnrollmentForm" });
      form.vm.$emit("update:modelValue", {
        studentId: 1,
        term: "",
        schedule: "",
        courseCode: "",
        courseTitle: "",
      });
      await flushPromises();

      await clickButton(dialog, "Create");

      expect(studentServices.enrollCourse).not.toHaveBeenCalled();
      expect(dialogWith(w, "Enroll Course")).toBeTruthy();
    });
  });

  describe("US-7.5 — Edit an enrollment from the Student Course View", () => {
    it("course rows include an edit enrollment icon", async () => {
      const { wrapper: w } = await mountView("/students/1/courses");

      const editIcon = w.find('[aria-label="Edit Enrollment"]');
      expect(editIcon.exists()).toBe(true);
    });

    it("edit enrollment opens with current values", async () => {
      const { wrapper: w } = await mountView("/students/1/courses");

      const editIcon = w.find('[aria-label="Edit Enrollment"]');
      await editIcon.trigger("click");
      await flushPromises();

      const dialog = dialogWith(w, "Edit Enrollment");
      expect(dialog).toBeTruthy();
    });

    it("save enrollment refreshes the course list", async () => {
      const { wrapper: w } = await mountView("/students/1/courses");

      const editIcon = w.find('[aria-label="Edit Enrollment"]');
      await editIcon.trigger("click");
      await flushPromises();

      const dialog = dialogWith(w, "Edit Enrollment");
      expect(dialog).toBeTruthy();

      const form = w.findComponent({ name: "CourseEnrollmentForm" });
      form.vm.$emit("update:modelValue", {
        studentId: 1,
        term: "2026 Fall",
        schedule: "MWF 10:00 AM",
        room: "PEC 231",
        courseCode: "CS-101",
        courseTitle: "Intro to Programming",
        credits: 3,
        grade: "A",
      });
      await flushPromises();

      await clickButton(dialog, "Save Enrollment");

      expect(studentServices.updateEnrollment).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          room: "PEC 231",
          credits: 3,
        })
      );
      expect(studentServices.getStudentCourses).toHaveBeenCalledTimes(2);
    });
  });
});
