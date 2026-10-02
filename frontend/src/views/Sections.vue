<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import sectionServices from "../services/sectionServices.js";
import courseServices from "../services/courseServices.js";
import facultyServices from "../services/facultyServices.js";
import SectionForm from "../components/SectionForm.vue";

const router = useRouter();

const emptyForm = () => ({
  sectionNumber: "",
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
const courseGroups = computed(() =>
  [...courses.value]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((course) => ({
      ...course,
      sections: sections.value
        .filter((section) => section.courseId === course.id)
        .sort((a, b) => a.sectionNumber.localeCompare(b.sectionNumber)),
    }))
);

const retrieveSections = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const [sectionsResponse, courseResponse, facultyResponse] = await Promise.all([
      sectionServices.getSections(),
      courseServices.getCourses(),
      facultyServices.getFaculty(),
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

const openAddDialog = (course) => {
  form.value = { ...emptyForm(), courseId: course.id };
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
  router.push({ name: "section", params: { sectionId: section.id } });
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
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <p v-if="!loading && courses.length === 0" class="text-body-1">
          No courses yet.
        </p>

        <div v-for="course in courseGroups" :key="course.id" class="mb-8">
          <div class="d-flex align-center justify-space-between mb-2">
            <h2 class="text-h6">{{ course.name }}</h2>
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              @click="openAddDialog(course)"
            >
              + New section
            </v-btn>
          </div>

          <p v-if="course.sections.length === 0" class="text-body-1">
            No sections for this course.
          </p>

          <v-table v-else>
            <thead>
              <tr>
                <th class="text-left">Section number</th>
                <th class="text-left">Days of week</th>
                <th class="text-left">Start time</th>
                <th class="text-left">End time</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="section in course.sections" :key="section.id">
                <td>{{ section.sectionNumber }}</td>
                <td>{{ section.daysOfWeek }}</td>
                <td>{{ section.startTime }}</td>
                <td>{{ section.endTime }}</td>
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
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>Add Section</v-card-title>
        <v-card-text>
          <SectionForm
            ref="formRef"
            v-model="form"
            :courses="courses"
            :faculty="faculty"
            lock-course
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