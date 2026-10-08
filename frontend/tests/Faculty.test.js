/**
 * Feature 4 — Faculty Management
 * Spec: features/feature-4-faculty-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../src/App.vue";
import Faculty from "../src/views/Faculty.vue";
import Utils from "../src/config/utils.js";
import facultyServices from "../src/services/facultyServices.js";
import userServices from "../src/services/userServices.js";
import { mountWithPlugins } from "./testUtils.js";

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
  userId: 9,
  universityId: "fa0001",
  email: "faculty@example.com",
  fName: "Alex",
  lName: "Faculty",
  role: "faculty",
  token: "faculty-token",
};

const fa1111User = {
  id: 11,
  universityId: "fa1111",
  fName: "Pat",
  lName: "Link",
};

const janeDoe = () => ({
  id: 1,
  firstName: "Jane",
  lastName: "Doe",
  dept: "Computer Science",
  userId: null,
});

let records = [];
let nextId = 1;
let users = [];

const listResponse = () =>
  Promise.resolve({
    data: records.map((record) => ({ ...record })),
  });

const facultyPayload = (args) =>
  args.find((arg) => arg && typeof arg === "object" && "firstName" in arg);

const idFrom = (args) => {
  const numeric = args
    .filter(
      (arg) =>
        typeof arg === "number" ||
        (typeof arg === "string" && /^\d+$/.test(arg))
    )
    .map(Number);
  return (
    numeric.find((value) => records.some((record) => record.id === value)) ??
    numeric.at(-1)
  );
};

const apiError = (message, status = 400) => {
  const error = new Error(message);
  error.response = { status, data: { message } };
  return error;
};

const mountOptions = {
  attachTo: document.body,
};

const createFacultyRouter = async (initialPath = "/faculty") => {
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

const facultyRows = (root) => root.findAll("tbody tr");

const findFacultyRow = (root, lastName) =>
  facultyRows(root).find((row) => row.text().includes(lastName));

describe("Feature 4 — Faculty Management", () => {
  let wrapper;

  beforeEach(() => {
    localStorage.clear();
    records = [];
    nextId = 1;
    users = [fa1111User];
    for (const fn of Object.values(facultyServices)) {
      fn.mockReset();
    }
    userServices.getUsers.mockReset();
    userServices.getUsers.mockResolvedValue({ data: users });
    facultyServices.getFaculty.mockImplementation(listResponse);
    facultyServices.createFaculty.mockImplementation(async (...args) => {
      const payload = facultyPayload(args);
      if (
        payload?.userId != null &&
        records.some((record) => record.userId === payload.userId)
      ) {
        throw apiError("User is already linked to a faculty member.");
      }
      const created = {
        id: nextId++,
        firstName: payload.firstName,
        lastName: payload.lastName,
        dept: payload.dept,
        userId: payload.userId ?? null,
      };
      records.push(created);
      return { data: created, status: 201 };
    });
    facultyServices.updateFaculty.mockImplementation(async (...args) => {
      const payload = facultyPayload(args);
      const id = idFrom(args);
      const current = records.find((record) => record.id === id);
      const updated = {
        ...current,
        firstName: payload.firstName,
        lastName: payload.lastName,
        dept: payload.dept,
        userId: payload.userId ?? null,
      };
      records = records.map((record) => (record.id === id ? updated : record));
      return { data: updated, status: 200 };
    });
    facultyServices.deleteFaculty.mockImplementation(async (...args) => {
      const id = idFrom(args);
      records = records.filter((record) => record.id !== id);
      return { data: { message: "Faculty deleted." }, status: 200 };
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  const mountFaculty = async (user) => {
    Utils.setStore("user", user);
    const Shell = defineComponent({
      components: { Faculty },
      template: "<v-app><Faculty /></v-app>",
    });
    const router = await createFacultyRouter("/faculty");
    const mounted = await mountWithPlugins(Shell, { router, ...mountOptions });
    wrapper = mounted.wrapper;
    return mounted;
  };

  const mountReady = async (user = facultyUser) => {
    const mounted = await mountFaculty(user);
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

  const chooseUser = async (root, userId) => {
    const select = findSelect(root, "User");
    expect(select).toBeTruthy();
    select.vm.$emit("update:modelValue", userId);
    await flushPromises();
  };

  const openAddDialog = async () => {
    await clickButton(wrapper, "+ New faculty");
    const dialog = dialogWith(wrapper, "Add Faculty");
    expect(dialog).toBeTruthy();
    return dialog;
  };

  const fillJaneDoe = async (dialog) => {
    await setField(dialog, "First Name", "Jane");
    await setField(dialog, "Last Name", "Doe");
    await setField(dialog, "Department", "Computer Science");
  };

  const requireRow = (lastName) => {
    const row = findFacultyRow(wrapper, lastName);
    expect(row).toBeTruthy();
    return row;
  };

  describe("US-4.1 — Select to work with Faculty", () => {
    it("Menu Selection", async () => {
      Utils.setStore("user", facultyUser);
      const router = await createFacultyRouter("/");
      const mounted = await mountWithPlugins(App, { router, ...mountOptions });
      wrapper = mounted.wrapper;

      const facultyButton = findButton(wrapper, "Faculty");
      expect(facultyButton).toBeTruthy();
      await facultyButton.trigger("click");
      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("faculty");
      });
      expect(router.currentRoute.value.path).toBe("/faculty");
      expect(wrapper.findComponent(Faculty).exists()).toBe(true);
      expect(wrapper.text()).toContain("Faculty");
    });
  });

  describe("US-4.2 — Create faculty member", () => {
    it("User creates a new faculty member without a linked user", async () => {
      await mountReady();
      const dialog = await openAddDialog();
      await fillJaneDoe(dialog);
      await clickButton(dialog, "Create");

      expect(facultyServices.createFaculty).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Doe",
        dept: "Computer Science",
        userId: null,
      });
      const row = requireRow("Doe");
      expect(row.text()).toContain("Jane");
      expect(row.text()).toContain("Computer Science");
      expect(dialogWith(wrapper, "Add Faculty")).toBeUndefined();
    });

    it("User creates a new faculty member with a linked user", async () => {
      await mountReady();
      const dialog = await openAddDialog();
      await fillJaneDoe(dialog);
      await chooseUser(dialog, fa1111User.id);
      await clickButton(dialog, "Create");

      expect(facultyServices.createFaculty).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Doe",
        dept: "Computer Science",
        userId: fa1111User.id,
      });
      const row = requireRow("Doe");
      expect(row.text()).toContain("fa1111");
      expect(dialogWith(wrapper, "Add Faculty")).toBeUndefined();
    });

    it("User creates a faculty member with a missing required field", async () => {
      await mountReady();
      const dialog = await openAddDialog();
      await setField(dialog, "Last Name", "Doe");
      await setField(dialog, "Department", "Computer Science");
      await clickButton(dialog, "Create");

      expect(facultyServices.createFaculty).not.toHaveBeenCalled();
      expect(dialogText(dialog)).toContain("Required");
      expect(dialogWith(wrapper, "Add Faculty")).toBeTruthy();
    });

    it("User creates a faculty member with a first name that is too long", async () => {
      await mountReady();
      const dialog = await openAddDialog();
      await setField(dialog, "First Name", "J".repeat(51));
      await setField(dialog, "Last Name", "Doe");
      await setField(dialog, "Department", "Computer Science");
      await clickButton(dialog, "Create");

      expect(facultyServices.createFaculty).not.toHaveBeenCalled();
      expect(dialogText(dialog)).toContain(
        "First name must be 50 characters or fewer."
      );
      expect(dialogWith(wrapper, "Add Faculty")).toBeTruthy();
    });

    it("User creates a faculty member with a last name that is too long", async () => {
      await mountReady();
      const dialog = await openAddDialog();
      await setField(dialog, "First Name", "Jane");
      await setField(dialog, "Last Name", "D".repeat(51));
      await setField(dialog, "Department", "Computer Science");
      await clickButton(dialog, "Create");

      expect(facultyServices.createFaculty).not.toHaveBeenCalled();
      expect(dialogText(dialog)).toContain(
        "Last name must be 50 characters or fewer."
      );
      expect(dialogWith(wrapper, "Add Faculty")).toBeTruthy();
    });

    it("User creates a faculty member with a department that is too long", async () => {
      await mountReady();
      const dialog = await openAddDialog();
      await setField(dialog, "First Name", "Jane");
      await setField(dialog, "Last Name", "Doe");
      await setField(dialog, "Department", "C".repeat(51));
      await clickButton(dialog, "Create");

      expect(facultyServices.createFaculty).not.toHaveBeenCalled();
      expect(dialogText(dialog)).toContain(
        "Department must be 50 characters or fewer."
      );
      expect(dialogWith(wrapper, "Add Faculty")).toBeTruthy();
    });

    it("User creates a faculty member with a user that is already linked", async () => {
      records = [{ ...janeDoe(), userId: fa1111User.id }];
      await mountReady();
      const dialog = await openAddDialog();
      await setField(dialog, "First Name", "Robert");
      await setField(dialog, "Last Name", "Smith");
      await setField(dialog, "Department", "Mathematics");
      await chooseUser(dialog, fa1111User.id);
      await clickButton(dialog, "Create");

      expect(facultyServices.createFaculty).toHaveBeenCalled();
      expect(dialogText(dialog)).toContain(
        "User is already linked to a faculty member."
      );
      expect(dialogWith(wrapper, "Add Faculty")).toBeTruthy();
      expect(records.filter((record) => record.userId === fa1111User.id)).toHaveLength(
        1
      );
    });
  });

  describe("US-4.3 — View faculty", () => {
    it("Faculty view loads with existing faculty", async () => {
      records = [
        janeDoe(),
        {
          id: 2,
          firstName: "Robert",
          lastName: "Smith",
          dept: "Mathematics",
          userId: null,
        },
      ];
      await mountReady();

      expect(requireRow("Doe").text()).toContain("Jane");
      expect(requireRow("Doe").text()).toContain("Computer Science");
      expect(requireRow("Smith").text()).toContain("Robert");
      expect(requireRow("Smith").text()).toContain("Mathematics");
    });

    it("User has no faculty", async () => {
      await mountReady();

      expect(wrapper.text()).toContain(
        "No faculty yet. Create your first faculty member."
      );
    });
  });

  describe("US-4.4 — Manage faculty rows", () => {
    it("faculty rows show edit and delete actions", async () => {
      records = [janeDoe()];
      await mountReady();

      const row = requireRow("Doe");
      expect(row.find('[aria-label="Edit faculty"]').exists()).toBe(true);
      expect(row.find('[aria-label="Delete faculty"]').exists()).toBe(true);
    });
  });

  describe("US-4.5 — Edit a faculty member", () => {
    const openEditFrom = async (row) => {
      await row.find('[aria-label="Edit faculty"]').trigger("click");
      await flushPromises();
      const editDialog = dialogWith(wrapper, "Edit Faculty");
      expect(editDialog).toBeTruthy();
      return editDialog;
    };

    it("User selects to edit a faculty member", async () => {
      records = [janeDoe()];
      await mountReady();
      await openEditFrom(requireRow("Doe"));
    });

    it("User edits a faculty member with valid values and saves", async () => {
      records = [janeDoe()];
      await mountReady();
      const editDialog = await openEditFrom(requireRow("Doe"));
      await setField(editDialog, "First Name", "Janet");
      await setField(editDialog, "Last Name", "Doer");
      await setField(editDialog, "Department", "Physics");
      await clickButton(editDialog, "Save Faculty");

      expect(facultyServices.updateFaculty).toHaveBeenCalledWith(1, {
        firstName: "Janet",
        lastName: "Doer",
        dept: "Physics",
        userId: null,
      });
      const row = requireRow("Doer");
      expect(row.text()).toContain("Janet");
      expect(row.text()).toContain("Physics");
      expect(dialogWith(wrapper, "Edit Faculty")).toBeUndefined();
    });

    it("User edits a faculty member with invalid values and saves", async () => {
      records = [janeDoe()];
      await mountReady();
      const editDialog = await openEditFrom(requireRow("Doe"));
      await setField(editDialog, "First Name", "");
      await clickButton(editDialog, "Save Faculty");

      expect(facultyServices.updateFaculty).not.toHaveBeenCalled();
      expect(dialogText(editDialog)).toContain("Required");
      expect(dialogWith(wrapper, "Edit Faculty")).toBeTruthy();
      expect(requireRow("Doe")).toBeTruthy();
    });

    it("User edits a faculty member and cancels", async () => {
      records = [janeDoe()];
      await mountReady();
      const editDialog = await openEditFrom(requireRow("Doe"));
      await setField(editDialog, "Last Name", "Changed");
      await clickButton(editDialog, "Cancel");

      expect(facultyServices.updateFaculty).not.toHaveBeenCalled();
      expect(requireRow("Doe")).toBeTruthy();
      expect(findFacultyRow(wrapper, "Changed")).toBeUndefined();
      expect(dialogWith(wrapper, "Edit Faculty")).toBeUndefined();
    });
  });

  describe("US-4.6 — Delete a faculty member", () => {
    const openDeleteFrom = async (row) => {
      await row.find('[aria-label="Delete faculty"]').trigger("click");
      await flushPromises();
      const deleteDialog = dialogWith(wrapper, "Delete this faculty member?");
      expect(deleteDialog).toBeTruthy();
      return deleteDialog;
    };

    it("User selects to delete a faculty member", async () => {
      records = [janeDoe()];
      await mountReady();
      await openDeleteFrom(requireRow("Doe"));
    });

    it("User deletes a faculty member", async () => {
      records = [janeDoe()];
      await mountReady();
      const deleteDialog = await openDeleteFrom(requireRow("Doe"));
      await clickButton(deleteDialog, "Delete Faculty");

      expect(facultyServices.deleteFaculty).toHaveBeenCalledWith(1);
      expect(dialogWith(wrapper, "Delete this faculty member?")).toBeUndefined();
      expect(wrapper.text()).not.toContain("Doe");
    });

    it("User cancels deleting a faculty member", async () => {
      records = [janeDoe()];
      await mountReady();
      const deleteDialog = await openDeleteFrom(requireRow("Doe"));
      await clickButton(deleteDialog, "Cancel");

      expect(facultyServices.deleteFaculty).not.toHaveBeenCalled();
      expect(requireRow("Doe")).toBeTruthy();
      expect(dialogWith(wrapper, "Delete this faculty member?")).toBeUndefined();
    });
  });
});
