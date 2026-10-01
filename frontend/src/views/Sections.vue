<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import sectionServices from "../services/sectionServices.js";
//import courseServices from "../services/courseServices.js";
//import facultyServices from "../services/facultyServices.js";
import SectionForm from "../components/SectionForm.vue";
import Utils from "../config/utils.js";

const router = useRouter();

const emptyForm = () => ({
  sectionNumber: "",
  semesterId: null,
  courseId: null,
  facultyId: null,
  daysOfWeek: "",
  startTime: "",
  endTime: "",
});

const sections = ref([]);
const courses = ref([]);
const faculty = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const form = ref(emptyForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const deleteDialogOpen = ref(false);
const sectionToDelete = ref(null);
const deleting = ref(false);
const isFaculty = computed(() => Utils.getStore("user")?.role === "faculty");

const retrieveSections = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const [sectionsResponse, courseResponse, facultyResponse] = await Promise.all([
      sectionServices.getSections(),
      courseServices.getcourses(),
      facultyServices.getfaculty(),
    ]);
    sections.value = sectionsResponse.data;
    courses.value = courseResponse.data;
    faculty.value = facultyResponse.data;
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch sections.";
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  form.value = emptyForm();
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
};

const saveSection = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid) {
    return;
  }

  saving.value = true;

  try {
    await sectionServices.createSection({
      sectionNumber: form.value.sectionNumber.trim(),
      semesterId: form.value.semesterId,
      courseId: form.value.courseId,
      facultyId: form.value.facultyId,
      daysOfWeek: form.value.daysOfWeek.trim(),
      startTime: form.value.startTime.trim(),
      endTime: form.value.endTime.trim(),
    });
    closeFormDialog();
    await retrieveSections();
  } catch (error) {
    formError.value =
      error.response?.data?.message || "Failed to create section.";
  } finally {
    saving.value = false;
  }
};

const openSection = (section) => {
  router.push({ sectionNumber: section.sectionNumber, params: { sectionId: section.id } });
};

const openDeleteDialog = (section) => {
  sectionToDelete.value = section;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  sectionToDelete.value = null;
};

const confirmDeleteSection = async () => {
  if (!sectionToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  listError.value = "";

  try {
    await sectionServices.deleteSection(sectionToDelete.value.id);
    closeDeleteDialog();
    await retrieveSections();
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to delete section.";
  } finally {
    deleting.value = false;
  }
};

onMounted(retrieveSections);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Sections</v-card-title>
        <template #append>
          <v-btn
            v-if="isAdmin"
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New section
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <p v-if="!loading && sections.length === 0" class="text-body-1">
          {{
            isAdmin
              ? "No sections yet. Create your first section."
              : "No sections assigned."
          }}
        </p>

        <v-table v-if="!loading && sections.length > 0">
          <thead>
            <tr>
              <th class="text-left">Section name</th>
              <th class="text-left">League</th>
              <th class="text-left">Manager</th>
              <th class="text-left">Players</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="section in sections" :key="section.id">
              <td>{{ section.name }}</td>
              <td>{{ section.league?.name }}</td>
              <td>
                <template v-if="section.manager">
                  {{ section.manager.lastName }}, {{ section.manager.firstName }}
                </template>
              </td>
              <td>{{ section.players?.length ?? 0 }}</td>
              <td>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Open section"
                  @click="openSection(section)"
                >
                  mdi-account-group
                </v-icon>
                <v-icon
                  v-if="isAdmin"
                  size="small"
                  class="mx-4"
                  aria-label="Delete section"
                  @click="openDeleteDialog(section)"
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
        <v-card-title>Add Section</v-card-title>
        <v-card-text>
          <SectionForm
            ref="formRef"
            v-model="form"
            :leagues="leagues"
            :people="people"
            @submit="saveSection"
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
            @click="saveSection"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete Section</v-card-title>
        <v-card-text>Delete this section?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleting"
            @click="confirmDeleteSection"
          >
            Delete Section
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>