<script setup>
import { computed, onMounted, ref } from "vue";
import FacultyForm from "../components/FacultyForm.vue";
import facultyServices from "../services/facultyServices.js";
import userServices from "../services/userServices.js";

const emptyForm = () => ({
  firstName: "",
  lastName: "",
  dept: "",
  userId: null,
});

const faculty = ref([]);
const users = ref([]);
const facultyLoading = ref(false);
const facultyError = ref("");
const formDialogOpen = ref(false);
const isAddMode = ref(true);
const form = ref(emptyForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);
const deleteDialogOpen = ref(false);
const facultyToDelete = ref(null);
const deleting = ref(false);

const formTitle = computed(() =>
  isAddMode.value ? "Add Faculty" : "Edit Faculty",
);
const saveLabel = computed(() =>
  isAddMode.value ? "Create" : "Save Faculty",
);

const universityIdFor = (userId) => {
  if (userId == null) {
    return "";
  }

  const user = users.value.find((entry) => entry.id === userId);
  return user?.universityId ?? "";
};

const retrieveUsers = async () => {
  try {
    const response = await userServices.getUsers();
    users.value = response.data;
  } catch (error) {
    facultyError.value =
      error.response?.data?.message || "Failed to fetch users.";
  }
};

const retrieveFaculty = async () => {
  facultyLoading.value = true;
  facultyError.value = "";

  try {
    const response = await facultyServices.getFaculty();
    faculty.value = response.data;
  } catch (error) {
    facultyError.value =
      error.response?.data?.message || "Failed to fetch faculty.";
  } finally {
    facultyLoading.value = false;
  }
};

const openAddDialog = () => {
  isAddMode.value = true;
  editingId.value = null;
  form.value = emptyForm();
  formError.value = "";
  formDialogOpen.value = true;
};

const openEditDialog = (member) => {
  isAddMode.value = false;
  editingId.value = member.id;
  form.value = {
    firstName: member.firstName ?? "",
    lastName: member.lastName ?? "",
    dept: member.dept ?? "",
    userId: member.userId ?? null,
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
};

const saveFaculty = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid) {
    return;
  }

  saving.value = true;

  const payload = {
    firstName: form.value.firstName.trim(),
    lastName: form.value.lastName.trim(),
    dept: form.value.dept.trim(),
    userId: form.value.userId ?? null,
  };

  try {
    if (isAddMode.value) {
      await facultyServices.createFaculty(payload);
    } else {
      await facultyServices.updateFaculty(editingId.value, payload);
    }

    closeFormDialog();
    await retrieveFaculty();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value
        ? "Failed to create faculty."
        : "Failed to update faculty.");
  } finally {
    saving.value = false;
  }
};
