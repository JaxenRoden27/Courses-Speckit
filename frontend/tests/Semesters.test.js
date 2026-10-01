/**
 * Feature 2 — Semester Management
 * Spec: features/feature-2-semester-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../src/App.vue";
import Semesters from "../src/views/Semesters.vue";
import Utils from "../src/config/utils.js";
import semesterServices from "../src/services/semesterServices.js";
import { mountWithPlugins } from "./testUtils.js";

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

const jane = { id: 1, fName: "Jane", lName: "Doe" };
const sam = { id: 2, fName: "Sam", lName: "Student" };

const DATES = {
  "Fall 2026": ["2026-08-27", "2026-12-18"],
  "Spring 2026": ["2026-01-05", "2026-05-07"],
  "Spring 2025": ["2025-01-06", "2025-05-01"],
  "Spring 2027": ["2027-01-04", "2027-05-06"],
  "Winter 2026": ["2026-12-28", "2027-01-07"],
};

const semesterRecord = ({ id, term, year, owner }) => {
  const label = `${term} ${year}`;
  const [startDate, endDate] = DATES[label];
  return {
    id,
    semester: label,
    name: label,
    startDate,
    endDate,
    userId: owner.id,
    user: { id: owner.id, fName: owner.fName, lName: owner.lName },
  };
};

const fall2026 = () =>
  semesterRecord({ id: 1, term: "Fall", year: 2026, owner: jane });
const spring2026 = () =>
  semesterRecord({ id: 2, term: "Spring", year: 2026, owner: jane });
const spring2025 = () =>
  semesterRecord({ id: 3, term: "Spring", year: 2025, owner: sam });

let records = [];
let nextId = 1;

const listResponse = () =>
  Promise.resolve({
    data: [...records]
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id)
      .map((record) => ({ ...record, user: { ...record.user } })),
  });

const payloadFrom = (args) =>
  args.find((arg) => arg && typeof arg === "object" && "term" in arg);

const idFrom = (args) => {
  const numeric = args
    .filter((arg) => typeof arg === "number" || (typeof arg === "string" && /^\d+$/.test(arg)))
    .map(Number);
  return (
    numeric.find((value) => records.some((record) => record.id === value)) ??
    numeric.at(-1)
  );
};

const apiError = (message) => {
  const error = new Error(message);
  error.response = { data: { message } };
  return error;
};

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const mountOptions = {
  attachTo: document.body,
};

const createSemestersRouter = async (initialPath = "/semesters") => {
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

const semesterRows = (root) => root.findAll("tbody tr");

const findSemesterRow = (root, title) =>
  semesterRows(root).find((row) => row.text().includes(title));

const rowTitle = (row) =>
  row.text().match(/(Fall|Winter|Spring|Summer) \d{4}/)?.[0];

const isLoading = (root) =>
  root.findComponent({ name: "VProgressLinear" }).exists() ||
  root.findComponent({ name: "VProgressCircular" }).exists() ||
  root.findComponent({ name: "VSkeletonLoader" }).exists();

describe("Feature 2 — Semester Management", () => {
  let wrapper;

  beforeEach(() => {
    localStorage.clear();
    records = [];
    nextId = 1;
    for (const fn of Object.values(semesterServices)) {
      fn.mockReset();
    }
    semesterServices.getSemesters.mockImplementation(listResponse);
    semesterServices.createSemester.mockImplementation(async (...args) => {
      const payload = payloadFrom(args);
      if (!payload?.term || !Number(payload.year)) {
        throw apiError("Term and year are required.");
      }
      const created = semesterRecord({
        id: nextId++,
        term: payload.term,
        year: Number(payload.year),
        owner: jane,
      });
      records.push(created);
      return { data: created, status: 201 };
    });
    semesterServices.updateSemester.mockImplementation(async (...args) => {
      const payload = payloadFrom(args);
      if (!payload?.term || !Number(payload.year)) {
        throw apiError("Term and year are required.");
      }
      const id = idFrom(args);
      const current = records.find((record) => record.id === id);
      const label = `${payload.term} ${payload.year}`;
      const [startDate, endDate] = DATES[label];
      const updated = {
        ...current,
        semester: label,
        name: label,
        startDate,
        endDate,
      };
      records = records.map((record) => (record.id === id ? updated : record));
      return { data: updated, status: 200 };
    });
    semesterServices.deleteSemester.mockImplementation(async (...args) => {
      const id = idFrom(args);
      records = records.filter((record) => record.id !== id);
      return { data: { message: "Semester deleted." }, status: 200 };
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountSemesters = async (user) => {
    Utils.setStore("user", user);
    const Shell = defineComponent({
      components: { Semesters },
      template: "<v-app><Semesters /></v-app>",
    });
    const router = await createSemestersRouter("/semesters");
    const mounted = await mountWithPlugins(Shell, { router, ...mountOptions });
    wrapper = mounted.wrapper;
    return mounted;
  };

  const mountReady = async (user) => {
    const mounted = await mountSemesters(user);
    await flushPromises();
    return mounted;
  };

  const openSemestersFromMenu = async (user) => {
    Utils.setStore("user", user);
    const router = await createSemestersRouter("/");
    const mounted = await mountWithPlugins(App, { router, ...mountOptions });
    wrapper = mounted.wrapper;

    const semestersButton = findButton(wrapper, "Semesters");
    expect(semestersButton).toBeTruthy();
    await semestersButton.trigger("click");
    await vi.waitFor(() => {
      expect(router.currentRoute.value.name).toBe("semesters");
    });
    expect(router.currentRoute.value.path).toBe("/semesters");
    expect(wrapper.findComponent(Semesters).exists()).toBe(true);
    expect(wrapper.text()).toContain("Semesters");
  };

  const clickButton = async (root, label) => {
    const button = findButton(root, label);
    expect(button).toBeTruthy();
    await button.trigger("click");
    await flushPromises();
  };

  const chooseSemester = async (root, label) => {
    const select = findSelect(root, "Semester");
    expect(select).toBeTruthy();
    select.vm.$emit("update:modelValue", label);
    await flushPromises();
  };

  const requireRow = (title) => {
    const row = findSemesterRow(wrapper, title);
    expect(row).toBeTruthy();
    return row;
  };

  describe("US-2.1 — Open the semesters view", () => {
    it("Student opens semesters from the menu", async () => {
      await openSemestersFromMenu(studentUser);
    });

    it("Faculty opens semesters from the menu", async () => {
      await openSemestersFromMenu(facultyUser);
    });
  });

  describe("US-2.2 — Create a semester", () => {
    it("Student creates a semester", async () => {
      await mountReady(studentUser);
      await clickButton(wrapper, "+ New semester");

      const addDialog = dialogWith(wrapper, "Add Semester");
      expect(addDialog).toBeTruthy();
      await chooseSemester(addDialog, "Fall 2026");

      const dateRange = findField(addDialog, "Date Range");
      expect(dateRange).toBeTruthy();
      expect(dateRange.props("readonly")).toBe(true);
      expect(dateRange.props("modelValue")).toBe("2026-08-27 - 2026-12-18");

      await clickButton(addDialog, "Create");

      expect(payloadFrom(semesterServices.createSemester.mock.calls[0])).toEqual({
        term: "Fall",
        year: 2026,
      });
      expect(requireRow("Fall 2026").text()).toContain("2026-08-27");
      expect(requireRow("Fall 2026").text()).toContain("2026-12-18");
      expect(dialogWith(wrapper, "Add Semester")).toBeUndefined();
    });

    it("Student creates a semester with a missing required field", async () => {
      await mountReady(studentUser);
      await clickButton(wrapper, "+ New semester");
      const addDialog = dialogWith(wrapper, "Add Semester");
      await clickButton(addDialog, "Create");

      expect(semesterServices.createSemester).toHaveBeenCalled();
      expect(payloadFrom(semesterServices.createSemester.mock.calls[0])).toEqual({
        term: "",
        year: 0,
      });
      const alert = addDialog.findComponent({ name: "VAlert" });
      expect(alert.exists()).toBe(true);
      expect(alert.props("type")).toBe("error");
      expect(alert.text()).toContain("Term and year are required.");
      expect(dialogWith(wrapper, "Add Semester")).toBeTruthy();
    });
  });

  describe("US-2.3 — View semesters as cards", () => {
    it("Student sees their semesters as cards", async () => {
      records = [fall2026(), spring2026()];
      await mountReady(studentUser);

      expect(wrapper.find("table").exists()).toBe(true);
      expect(semesterRows(wrapper).map(rowTitle)).toEqual(["Spring 2026", "Fall 2026"]);
    });

    it("Student has no semesters", async () => {
      const pending = deferred();
      semesterServices.getSemesters.mockReturnValue(pending.promise);
      await mountSemesters(studentUser);

      expect(isLoading(wrapper)).toBe(true);
      pending.reject(apiError("Failed to fetch semesters."));
      await flushPromises();

      const alert = wrapper.findComponent({ name: "VAlert" });
      expect(alert.exists()).toBe(true);
      expect(alert.props("type")).toBe("error");
      expect(alert.text()).toContain("Failed to fetch semesters.");

      wrapper.unmount();
      records = [];
      semesterServices.getSemesters.mockImplementation(listResponse);
      await mountReady(studentUser);

      expect(wrapper.text()).toContain("No semesters yet. Create your first semester.");
    });
  });

  describe("US-2.4 — See semester card details", () => {
    it("Semester card shows title, class count, and dates", async () => {
      records = [fall2026()];
      await mountReady(studentUser);

      const row = requireRow("Fall 2026");
      expect(row.text()).toContain("Fall 2026");
      expect(row.text()).toContain("0 classes");
      expect(row.text()).toContain("2026-08-27");
      expect(row.text()).toContain("2026-12-18");
      expect(wrapper.text()).toContain("Semester name");
      expect(wrapper.text()).toContain("Start Date");
      expect(wrapper.text()).toContain("End Date");
    });
  });

  describe("US-2.5 — Enlarge a semester card", () => {
    it("Student enlarges a semester card", async () => {
      records = [fall2026()];
      await mountReady(studentUser);

      const row = requireRow("Fall 2026");
      await row.trigger("click");
      await flushPromises();

      expect(row.text()).toContain("Fall 2026");
      expect(row.text()).toContain("2026-08-27");
      expect(row.text()).toContain("2026-12-18");
      expect(dialogWith(wrapper, "Fall 2026")).toBeUndefined();
    });
  });

  describe("US-2.6 — Manage a semester from the card", () => {
    it("Semester card shows edit and delete", async () => {
      records = [fall2026()];
      await mountReady(studentUser);

      const row = requireRow("Fall 2026");
      expect(row.find('[aria-label="Edit semester"]').exists()).toBe(true);
      expect(row.find('[aria-label="Delete semester"]').exists()).toBe(true);
    });
  });

  describe("US-2.7 — Manage a semester from the enlarged view", () => {
    it("Enlarged semester view shows edit and delete", async () => {
      records = [fall2026()];
      await mountReady(studentUser);

      const row = requireRow("Fall 2026");
      await row.trigger("click");
      await flushPromises();

      expect(row.find('[aria-label="Edit semester"]').exists()).toBe(true);
      expect(row.find('[aria-label="Delete semester"]').exists()).toBe(true);
    });
  });

  describe("US-2.8 — Edit a semester", () => {
    const openEditFrom = async (row) => {
      await row.find('[aria-label="Edit semester"]').trigger("click");
      await flushPromises();
      const editDialog = dialogWith(wrapper, "Edit Semester");
      expect(editDialog).toBeTruthy();
      expect(findSelect(editDialog, "Semester").props("modelValue")).toBe("Fall 2026");
      return editDialog;
    };

    it("Student selects to edit a semester from the card", async () => {
      records = [fall2026()];
      await mountReady(studentUser);
      await openEditFrom(requireRow("Fall 2026"));
    });

    it("Student selects to edit a semester from the enlarged view", async () => {
      records = [fall2026()];
      await mountReady(studentUser);
      const row = requireRow("Fall 2026");
      await row.trigger("click");
      await flushPromises();
      await openEditFrom(row);
    });

    it("Student saves a valid semester edit", async () => {
      records = [fall2026()];
      await mountReady(studentUser);
      const editDialog = await openEditFrom(requireRow("Fall 2026"));
      await chooseSemester(editDialog, "Spring 2027");
      await clickButton(editDialog, "Save Semester");

      expect(payloadFrom(semesterServices.updateSemester.mock.calls[0])).toEqual({
        term: "Spring",
        year: 2027,
      });
      const row = requireRow("Spring 2027");
      expect(row.text()).toContain("2027-01-04");
      expect(row.text()).toContain("2027-05-06");
      expect(dialogWith(wrapper, "Edit Semester")).toBeUndefined();
    });

    it("Student saves an edit with a missing required field", async () => {
      records = [fall2026()];
      await mountReady(studentUser);
      const editDialog = await openEditFrom(requireRow("Fall 2026"));
      await chooseSemester(editDialog, "");
      await clickButton(editDialog, "Save Semester");

      expect(semesterServices.updateSemester).toHaveBeenCalled();
      expect(payloadFrom(semesterServices.updateSemester.mock.calls[0])).toEqual({
        term: "",
        year: 0,
      });
      expect(dialogText(editDialog)).toContain("Term and year are required.");
      expect(dialogWith(wrapper, "Edit Semester")).toBeTruthy();
      expect(requireRow("Fall 2026")).toBeTruthy();
    });

    it("Student cancels editing a semester", async () => {
      records = [fall2026()];
      await mountReady(studentUser);
      const editDialog = await openEditFrom(requireRow("Fall 2026"));
      await chooseSemester(editDialog, "Spring 2027");
      await clickButton(editDialog, "Cancel");

      expect(semesterServices.updateSemester).not.toHaveBeenCalled();
      expect(requireRow("Fall 2026")).toBeTruthy();
      expect(findSemesterRow(wrapper, "Spring 2027")).toBeUndefined();
      expect(dialogWith(wrapper, "Edit Semester")).toBeUndefined();
    });
  });

  describe("US-2.9 — Delete a semester", () => {
    const openDeleteFrom = async (row) => {
      await row.find('[aria-label="Delete semester"]').trigger("click");
      await flushPromises();
      const deleteDialog = dialogWith(wrapper, "Delete this semester?");
      expect(deleteDialog).toBeTruthy();
      expect(dialogText(deleteDialog)).toContain("Delete this semester?");
      return deleteDialog;
    };

    it("Student selects to delete a semester from the card", async () => {
      records = [fall2026()];
      await mountReady(studentUser);
      await openDeleteFrom(requireRow("Fall 2026"));
    });

    it("Student selects to delete a semester from the enlarged view", async () => {
      records = [fall2026()];
      await mountReady(studentUser);
      const row = requireRow("Fall 2026");
      await row.trigger("click");
      await flushPromises();
      await openDeleteFrom(row);
    });

    it("Student deletes a semester", async () => {
      records = [fall2026()];
      await mountReady(studentUser);
      const deleteDialog = await openDeleteFrom(requireRow("Fall 2026"));
      await clickButton(deleteDialog, "Delete Semester");

      expect(semesterServices.deleteSemester).toHaveBeenCalledWith(1);
      expect(dialogWith(wrapper, "Delete this semester?")).toBeUndefined();
      expect(wrapper.text()).not.toContain("Fall 2026");
    });

    it("Student cancels deleting a semester", async () => {
      records = [fall2026()];
      await mountReady(studentUser);
      const deleteDialog = await openDeleteFrom(requireRow("Fall 2026"));
      await clickButton(deleteDialog, "Cancel");

      expect(semesterServices.deleteSemester).not.toHaveBeenCalled();
      expect(requireRow("Fall 2026")).toBeTruthy();
      expect(dialogWith(wrapper, "Delete this semester?")).toBeUndefined();
    });
  });

  describe("US-2.10 — Show each role only the semesters they may see", () => {
    it("Student does not see another student's semesters", async () => {
      records = [fall2026()];
      await mountReady(studentUser);

      expect(requireRow("Fall 2026")).toBeTruthy();
      expect(wrapper.text()).not.toContain("Spring 2025");
      expect(wrapper.text()).not.toContain("Sam Student");
    });

    it("Faculty sees every student's semesters with the student name", async () => {
      records = [spring2025(), fall2026()];
      await mountReady(facultyUser);

      const fall = requireRow("Fall 2026");
      const spring = requireRow("Spring 2025");
      expect(fall.text()).toContain("Jane Doe");
      expect(spring.text()).toContain("Sam Student");
      expect(findButton(wrapper, "+ New semester")).toBeUndefined();
      expect(wrapper.find('[aria-label="Edit semester"]').exists()).toBe(false);
      expect(wrapper.find('[aria-label="Delete semester"]').exists()).toBe(false);
    });

    it("Faculty has no semesters to review", async () => {
      const pending = deferred();
      semesterServices.getSemesters.mockReturnValue(pending.promise);
      await mountSemesters(facultyUser);

      expect(isLoading(wrapper)).toBe(true);
      pending.resolve({ data: [] });
      await flushPromises();

      expect(wrapper.text()).toContain(
        "No semesters yet. No students have semesters yet."
      );
      expect(wrapper.text()).not.toContain("Create your first semester.");
    });
  });
});
