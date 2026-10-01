<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import semesterServices from "../services/semesterServices.js";
import SemesterForm from "../components/SemesterForm.vue";

const emptyForm = () => ({
  term: "",
  year: "",
});

const props = defineProps({
  semesterId: { type: [String, Number], required: true },
});

const router = useRouter();
const semester = ref(null);
const loading = ref(false);
const formDialogOpen = ref(false);
const error = ref("");
const form = ref(emptyForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);
const isAddMode = ref(true);
const deleteDialogOpen = ref(false);
const semesterToDelete = ref(null);
const deleting = ref(false);

const classCountLabel = (count) => {
  const numeric = Number(count ?? 0);
  const safeCount = Number.isFinite(numeric) ? numeric : 0;
  return `${safeCount} ${safeCount === 1 ? "class" : "classes"}`;
};

const title = computed(
  () => semester.value?.name || semester.value?.semester || "",
);
const formTitle = computed(() =>
  isAddMode.value ? "Add Semester" : "Edit Semester",
);
const saveLabel = computed(() =>
  isAddMode.value ? "Create" : "Save Semester",
);
const dateRange = computed(() => {
  if (!semester.value) return "";
  return `${semester.value.startDate} - ${semester.value.endDate}`;
});

const loadSemester = async () => {
  loading.value = true;
  error.value = "";
  semester.value = null;

  try {
    const response = await semesterServices.getSemesters();
    const match = response.data.find(
      (item) => String(item.id) === String(props.semesterId),
    );
    if (!match) {
      error.value = "Semester not found.";
      return;
    }
    semester.value = match;
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to fetch semesters.";
  } finally {
    loading.value = false;
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
  error.value = "";

  try {
    await semesterServices.deleteSemester(semesterToDelete.value.id);
    closeDeleteDialog();
    await router.push({ name: "semesters" });
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to delete semester.";
  } finally {
    deleting.value = false;
  }
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
    await loadSemester();
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

onMounted(loadSemester);
</script>

<template>
  <v-container class="py-8">
    <v-btn variant="text" class="mb-4" @click="router.push({ name: 'semesters' })">
      Back to semesters
    </v-btn>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-alert v-if="error" type="error" density="compact">
      {{ error }}
    </v-alert>

    <v-card v-if="semester" rounded="lg">
      <v-card-item>
        <div class="d-flex align-center">
          <v-card-title>{{ title }}</v-card-title>
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
                <v-btn color="primary" variant="elevated" class="oc-cta" :loading="saving" @click="saveSemester">
                  {{ saveLabel }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-icon size="small" class="mx-4" aria-label="Edit semester" @click.stop="openEditDialog(semester)">
            mdi-pencil
          </v-icon>
          <v-dialog v-model="deleteDialogOpen" max-width="420">
            <v-card rounded="lg">
              <v-card-title>Delete Semester</v-card-title>
              <v-card-text>Delete this semester?</v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
                <v-btn color="error" variant="elevated" class="text" :loading="deleting" @click="confirmDeleteSemester">
                  Delete Semester
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-icon size="small" class="oc-cta ml-auto" aria-label="Delete semester"
            @click.stop="openDeleteDialog(semester)">
            mdi-trash-can
          </v-icon>
        </div>
      </v-card-item>
      <v-card-text>
        <p class="text-body-1 mb-2">Date range {{ dateRange }}</p>
        <p class="text-body-1 mb-6">
          Classes {{ classCountLabel(semester.classCount) }}
        </p>

        <p class="text-body-1 mb-2">Sections you are enrolled in</p>
        <v-sheet rounded="lg" border class="pa-4" min-height="80" aria-label="Sections you are enrolled in" />
      </v-card-text>
    </v-card>
  </v-container>
</template>