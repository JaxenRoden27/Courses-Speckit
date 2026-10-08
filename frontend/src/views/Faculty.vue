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

const openDeleteDialog = (member) => {
  facultyToDelete.value = member;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  facultyToDelete.value = null;
};

const confirmDeleteFaculty = async () => {
  if (!facultyToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  facultyError.value = "";

  try {
    await facultyServices.deleteFaculty(facultyToDelete.value.id);
    closeDeleteDialog();
    await retrieveFaculty();
  } catch (error) {
    facultyError.value =
      error.response?.data?.message || "Failed to delete faculty.";
  } finally {
    deleting.value = false;
  }
};

onMounted(async () => {
  await Promise.all([retrieveFaculty(), retrieveUsers()]);
});
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Faculty</v-card-title>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New faculty
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="facultyLoading" indeterminate class="mb-4" />

        <v-alert v-if="facultyError" type="error" density="compact" class="mb-4">
          {{ facultyError }}
        </v-alert>

        <p v-if="!facultyLoading && faculty.length === 0" class="text-body-1">
          No faculty yet. Create your first faculty member.
        </p>

        <v-table v-if="!facultyLoading && faculty.length > 0">
          <thead>
            <tr>
              <th class="text-left">Last name</th>
              <th class="text-left">First name</th>
              <th class="text-left">Department</th>
              <th class="text-left">User</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in faculty" :key="member.id">
              <td>{{ member.lastName }}</td>
              <td>{{ member.firstName }}</td>
              <td>{{ member.dept }}</td>
              <td>{{ universityIdFor(member.userId) }}</td>
              <td>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Edit faculty"
                  @click.stop="openEditDialog(member)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Delete faculty"
                  @click.stop="openDeleteDialog(member)"
                >
                  mdi-trash-can
                </v-icon>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <FacultyForm
            ref="formRef"
            v-model="form"
            :users="users"
            @submit="saveFaculty"
          />
          <v-alert v-if="formError" type="error" density="compact" class="mt-2">
            {{ formError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeFormDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="saveFaculty"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete Faculty</v-card-title>
        <v-card-text>Delete this faculty member?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleting"
            @click="confirmDeleteFaculty"
          >
            Delete Faculty
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>