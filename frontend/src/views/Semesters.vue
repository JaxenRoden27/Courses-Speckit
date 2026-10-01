<script setup>
import { computed, onMounted, ref } from "vue";
import Utils from "../config/utils.js";
import SemesterForm from "../components/SemesterForm.vue";
import semesterServices from "../services/semesterServices.js";

const emptyForm = () => ({
  term: "",
  year: "",
});

const semesters = ref([]);
const semestersLoading = ref(false);
const semestersError = ref("");
const formDialogOpen = ref(false);
const isAddMode = ref(true);
const form = ref(emptyForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);
const deleteDialogOpen = ref(false);
const semesterToDelete = ref(null);
const deleting = ref(false);

const currentUser = ref(Utils.getStore("user"));
const isStudent = computed(() => {
  const role = currentUser.value?.role?.toLowerCase?.().trim();
  const universityId = String(currentUser.value?.universityId ?? "")
    .trim()
    .toLowerCase();
  return role === "student" && !universityId.startsWith("fa");
});
const formTitle = computed(() =>
  isAddMode.value ? "Add Semester" : "Edit Semester",
);

const classCountLabel = (semester) => {
  const count = Number(semester.classCount ?? 0);
  const safeCount = Number.isFinite(count) ? count : 0;
  return `${safeCount} ${safeCount === 1 ? "class" : "classes"}`;
};

const semesterTitle = (semester) => semester.name || semester.semester || "";
const saveLabel = computed(() =>
  isAddMode.value ? "Create" : "Save Semester",
);

const retrieveSemesters = async () => {
  semestersLoading.value = true;
  semestersError.value = "";

  try {
    const response = await semesterServices.getSemesters();
    semesters.value = response.data;
  } catch (error) {
    semestersError.value =
      error.response?.data?.message || "Failed to fetch semesters.";
  } finally {
    semestersLoading.value = false;
  }
};

const openAddDialog = () => {
  isAddMode.value = true;
  editingId.value = null;
  form.value = emptyForm();
  formError.value = "";
  formDialogOpen.value = true;
};

const openEditDialog = (semester) => {
  isAddMode.value = false;
  editingId.value = semester.id;

  const [term = "", year = ""] = (semester.name ?? "").split(" ");

  form.value = {
    term,
    year: year ? Number(year) : "",
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
};

const saveSemester = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid) {
    return;
  }

  saving.value = true;

  const payload = {
    term: form.value.term,
    year: Number(form.value.year),
  };

  try {
    if (isAddMode.value) {
      await semesterServices.createSemester(payload);
    } else {
      await semesterServices.updateSemester(editingId.value, payload);
    }

    closeFormDialog();
    await retrieveSemesters();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value
        ? "Failed to create semester."
        : "Failed to update semester.");
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (semester) => {
  semesterToDelete.value = semester;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  semesterToDelete.value = null;
};

const confirmDeleteSemester = async () => {
  if (!semesterToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  semestersError.value = "";

  try {
    await semesterServices.deleteSemester(semesterToDelete.value.id);
    closeDeleteDialog();
    await retrieveSemesters();
  } catch (error) {
    semestersError.value =
      error.response?.data?.message || "Failed to delete semester.";
  } finally {
    deleting.value = false;
  }
};

onMounted(retrieveSemesters);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Semesters</v-card-title>
        <template v-if="isStudent" #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New semester
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="semestersLoading" indeterminate class="mb-4" />

        <v-alert v-if="semestersError" type="error" density="compact" class="mb-4">
          {{ semestersError }}
        </v-alert>

        <p v-if="!semestersLoading && semesters.length === 0" class="text-body-1">
          {{
            isStudent
              ? "No semesters yet. Create your first semester."
              : "No semesters yet. No students have semesters yet."
          }}
        </p>

        <v-table v-if="!semestersLoading && semesters.length > 0">
          <thead>
            <tr>
              <th v-if="!isStudent" class="text-left">Student Name</th>
              <th class="text-left">Semester name</th>
              <th class="text-left">Classes</th>
              <th class="text-left">Start Date</th>
              <th class="text-left">End Date</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="semester in semesters" :key="semester.id">
              <td v-if="!isStudent">{{ semester.user?.fName }} {{ semester.user?.lName }}</td>
              <td>{{ semesterTitle(semester) }}</td>
              <td class="text-no-wrap">{{ classCountLabel(semester) }}</td>
              <td class="text-no-wrap">{{ semester.startDate }}</td>
              <td class="text-no-wrap">{{ semester.endDate }}</td>
              <td>
                <router-link :to="`/semesters/${semester.id}`">
                  <v-icon
                    size="small"
                    class="mx-4"
                    aria-label="View semester"
                  >
                    mdi-eye
                  </v-icon>
                </router-link>
                <v-icon
                  v-if="isStudent"
                  size="small"
                  class="mx-4"
                  aria-label="Edit semester"
                  @click.stop="openEditDialog(semester)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  v-if="isStudent"
                  size="small"
                  class="mx-4"
                  aria-label="Delete semester"
                  @click.stop="openDeleteDialog(semester)"
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
          <SemesterForm ref="formRef" v-model="form" @submit="saveSemester" />
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
            @click="saveSemester"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete Semester</v-card-title>
        <v-card-text>Delete this semester?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleting"
            @click="confirmDeleteSemester"
          >
            Delete Semester
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
