/**
 * Feature 8 — Section Student Listing
 * Spec: features/feature-8-section-student-listing.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import SectionStudents from "../src/views/SectionStudents.vue";
import Sections from "../src/views/Sections.vue";
import CourseEnrollmentForm from "../src/components/CourseEnrollmentForm.vue";
import sectionServices from "../src/services/sectionServices.js";
import studentServices from "../src/services/studentServices.js";
import enrollmentServices from "../src/services/enrollmentServices.js";
import courseServices from "../src/services/courseServices.js";
import facultyServices from "../src/services/facultyServices.js";
import { vuetify } from "./testUtils.js";

vi.mock("../src/services/sectionServices.js", () => ({
  default: {
    getSections: vi.fn(),
    getSectionStudents: vi.fn(),
    enrollStudent: vi.fn(),
    deleteSection: vi.fn(),
  },
}));

vi.mock("../src/services/courseServices.js", () => ({
  default: {
    findAll: vi.fn(),
  },
}));

vi.mock("../src/services/facultyServices.js", () => ({
  default: {
    getFaculty: vi.fn(),
  },
}));

vi.mock("../src/services/studentServices.js", () => ({
  default: {
    getStudents: vi.fn(),
  },
}));

vi.mock("../src/services/enrollmentServices.js", () => ({
  default: {
    updateEnrollment: vi.fn(),
    deleteEnrollment: vi.fn(),
  },
}));

const introCourse = {
  id: 1,
  courseNumber: "CS-101",
  courseName: "Intro to Programming",
};

const fallSemester = {
  id: 1,
  name: "2026 Fall",
};

const facultySmith = {
  id: 1,
  firstName: "John",
  lastName: "Smith",
};

const cs101Section = {
  id: 1,
  sectionNumber: "CS-101-01",
  courseId: 1,
  course: introCourse,
  semesterId: 1,
  semester: fallSemester,
  facultyId: 1,
  faculty: facultySmith,
  daysOfWeek: "MWF",
  startTime: "10:00 AM",
  endTime: "10:50 AM",
};

const otherSection = {
  id: 2,
  sectionNumber: "CS-101-02",
  courseId: 1,
  course: introCourse,
  semesterId: 1,
  semester: fallSemester,
};

const janeDoeStudent = {
  id: 1,
  firstName: "Jane",
  lastName: "Doe",
  universityId: "U12345678",
  email: "jane.doe@example.com",
  sectionId: 1,
};

const otherStudent = {
  id: 2,
  firstName: "Bob",
  lastName: "Smith",
  universityId: "U87654321",
  email: "bob.smith@example.com",
  sectionId: 2,
};

const VDialogStub = {
  name: "VDialog",
  props: { modelValue: Boolean },
  template: `<div v-if="modelValue" class="v-dialog-stub"><slot /></div>`,
};

const clickButton = async (wrapper, label) => {
  const buttons = wrapper.findAll("button");
  const button =
    buttons.find((item) => item.text().trim() === label) ??
    buttons.find((item) => item.text().includes(label));
  expect(button).toBeTruthy();
  await button.trigger("click");
};

const findRow = (wrapper, text) => {
  const rows = wrapper.findAll("tbody tr");
  return rows.find((row) => row.text().includes(text));
};

async function createSectionRouter(initialPath = "/sections/1/students") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/sections",
        name: "sections",
        component: Sections,
      },
      {
        path: "/sections/:sectionId/students",
        name: "section",
        component: SectionStudents,
        props: true,
      },
    ],
  });

  await router.push(initialPath);
  await router.isReady();
  return router;
}

const mountSectionStudents = async (sectionId = 1) => {
  const router = await createSectionRouter(`/sections/${sectionId}/students`);

  const wrapper = mount(SectionStudents, {
    global: {
      plugins: [vuetify, router],
      stubs: {
        VDialog: VDialogStub,
      },
    },
  });

  await flushPromises();
  return { wrapper, router };
};

describe("Feature 8: Section Student Listing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sectionServices.getSections.mockResolvedValue({
      data: [cs101Section, otherSection],
    });
    studentServices.getStudents.mockResolvedValue({
      data: [janeDoeStudent, otherStudent],
    });
    sectionServices.getSectionStudents.mockResolvedValue({
      data: [janeDoeStudent],
    });
    courseServices.findAll.mockResolvedValue({
      data: [
        {
          id: 1,
          courseName: "Intro to Programming",
          courseNumber: "CS-101",
          sections: [cs101Section],
        },
      ],
    });
    facultyServices.getFaculty.mockResolvedValue({
      data: [facultySmith],
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("Section Student View shows Section Info", async () => {
    const { wrapper } = await mountSectionStudents(1);

    expect(wrapper.text()).toContain("CS-101-01");
    expect(wrapper.text()).toContain("Intro to Programming");
    expect(wrapper.text()).toContain("Enroll Student");
  });

  it("Section Student View lists students for that section", async () => {
    const { wrapper } = await mountSectionStudents(1);

    expect(wrapper.text()).toContain("Doe, Jane");
    expect(wrapper.text()).toContain("U12345678");
    expect(wrapper.text()).toContain("jane.doe@example.com");
  });

  it("Section Student View does not list students from another section", async () => {
    sectionServices.getSectionStudents.mockResolvedValue({
      data: [otherStudent],
    });

    const { wrapper } = await mountSectionStudents(1);
    const row = findRow(wrapper, "Smith, Bob");
    expect(row).toBeUndefined();
  });

  it("User has no students in the section", async () => {
    sectionServices.getSectionStudents.mockResolvedValue({
      data: [],
    });

    const { wrapper } = await mountSectionStudents(1);
    expect(wrapper.text()).toContain("No students enrolled yet. Enroll your first student.");
  });

  it("User selects to enroll a student from the Section Student View", async () => {
    const { wrapper } = await mountSectionStudents(1);

    await clickButton(wrapper, "Enroll Student");
    await flushPromises();

    expect(wrapper.find(".v-dialog-stub").exists()).toBe(true);
    expect(wrapper.text()).toContain("Enroll Student");
  });

  it("User creates an enrollment from the Section Student View", async () => {
    sectionServices.enrollStudent.mockResolvedValue({
      data: {
        id: 3,
        sectionId: 1,
        studentId: 1,
      },
    });

    const { wrapper } = await mountSectionStudents(1);
    await clickButton(wrapper, "Enroll Student");
    await flushPromises();

    const formComponent = wrapper.findComponent(CourseEnrollmentForm);
    expect(formComponent.exists()).toBe(true);

    formComponent.vm.$emit("update:modelValue", {
      sectionId: 1,
      studentId: 1,
    });

    await clickButton(wrapper, "Create");
    await flushPromises();

    expect(sectionServices.enrollStudent).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        sectionId: 1,
        studentId: 1,
      }),
    );
  });

  it("User creates an enrollment from the Section Student View with a missing required field", async () => {
    const { wrapper } = await mountSectionStudents(1);
    await clickButton(wrapper, "Enroll Student");
    await flushPromises();

    const formComponent = wrapper.findComponent(CourseEnrollmentForm);
    formComponent.vm.$emit("update:modelValue", {
      sectionId: 1,
      studentId: null,
    });

    await clickButton(wrapper, "Create");
    await flushPromises();

    expect(sectionServices.enrollStudent).not.toHaveBeenCalled();
  });

  it("Section Student View student rows show an edit action", async () => {
    const { wrapper } = await mountSectionStudents(1);

    const editIcon = wrapper.find('i[aria-label="Edit Enrollment"]');
    expect(editIcon.exists()).toBe(true);
  });

  it("User selects to edit an enrollment from the Section Student View", async () => {
    const { wrapper } = await mountSectionStudents(1);

    const editIcon = wrapper.find('i[aria-label="Edit Enrollment"]');
    await editIcon.trigger("click");
    await flushPromises();

    expect(wrapper.find(".v-dialog-stub").exists()).toBe(true);
    expect(wrapper.text()).toContain("Edit Enrollment");
  });

  it("User edits an enrollment from the Section Student View", async () => {
    enrollmentServices.updateEnrollment.mockResolvedValue({
      data: { id: 1, sectionId: 1, studentId: 1 },
    });

    const { wrapper } = await mountSectionStudents(1);
    const editIcon = wrapper.find('i[aria-label="Edit Enrollment"]');
    await editIcon.trigger("click");
    await flushPromises();

    const formComponent = wrapper.findComponent(CourseEnrollmentForm);
    formComponent.vm.$emit("update:modelValue", {
      sectionId: 1,
      studentId: 1,
    });

    await clickButton(wrapper, "Save Enrollment");
    await flushPromises();

    expect(enrollmentServices.updateEnrollment).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        sectionId: 1,
        studentId: 1,
      }),
    );
  });

  it("User enrolls a student who is already in the section", async () => {
    sectionServices.enrollStudent.mockRejectedValue({
      response: {
        status: 400,
        data: { message: "Student is already enrolled in this section." },
      },
    });

    const { wrapper } = await mountSectionStudents(1);
    await clickButton(wrapper, "Enroll Student");
    await flushPromises();

    const formComponent = wrapper.findComponent(CourseEnrollmentForm);
    formComponent.vm.$emit("update:modelValue", {
      sectionId: 1,
      studentId: 1,
    });

    await clickButton(wrapper, "Create");
    await flushPromises();

    expect(wrapper.text()).toContain("Student is already enrolled in this section.");
  });

  it("section rows show a view students action", async () => {
    const router = await createSectionRouter("/sections");

    const wrapper = mount(Sections, {
      global: { plugins: [vuetify, router] },
    });
    await flushPromises();

    const viewStudentsBtn = wrapper.find('i[aria-label="View students"]');
    expect(viewStudentsBtn.exists()).toBe(true);
  });

  it("User opens a section from the Sections List", async () => {
    const router = await createSectionRouter("/sections");

    const wrapper = mount(Sections, {
      global: { plugins: [vuetify, router] },
    });
    await flushPromises();

    const viewStudentsBtn = wrapper.find('i[aria-label="View students"]');
    await viewStudentsBtn.trigger("click");
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe("/sections/1/students");
    });
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/sections/1/students");
  });
});
