<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import sectionServices from "../services/sectionServices.js";
import courseServices from "../services/courseServices.js";
import facultyServices from "../services/facultyServices.js";
import SectionForm from "../components/SectionForm.vue";

const route = useRoute();

const emptySectionForm = () => ({
  sectionNumber: "",
  courseId: null,
  facultyId: null,
  daysOfWeek: "",
  startTime: "",
  endTime: "",
});

const section = ref(null);
const courses = ref([]);
const faculty = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const form = ref(emptySectionForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);

const sectionId = computed(() => parseInt(route.params.sectionId, 10));


const retrieveSection = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const [sectionsResponse, coursesResponse, facultyResponse] = await Promise.all([
      sectionServices.getSections(),
      courseServices.getCourses(),
      facultyServices.getFaculty(),
    ]);
    courses.value = coursesResponse.data;
    faculty.value = facultyResponse.data;
    section.value =
      sectionsResponse.data.find((row) => row.id === sectionId.value) ?? null;

    if (!section.value) {
      listError.value = `Section with id=${sectionId.value} not found.`;
    }
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch section.";
  } finally {
    loading.value = false;
  }
};

const openEditDialog = () => {
  if (!section.value) {
    return;
  }

  form.value = {
    sectionNumber: section.value.sectionNumber ?? "",
    courseId: section.value.courseId ?? null,
    facultyId: section.value.facultyId ?? null,
    daysOfWeek: section.value.daysOfWeek ?? "",
    startTime: section.value.startTime ?? "",
    endTime: section.value.endTime ?? "",
  };
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

  if (!result?.valid || !section.value) {
    return;
  }

  saving.value = true;

  try {
    await sectionServices.updateSection(section.value.id, {
      sectionNumber: form.value.sectionNumber.trim(),
      courseId: form.value.courseId,
      facultyId: form.value.facultyId,
      daysOfWeek: form.value.daysOfWeek.trim(),
      startTime: form.value.startTime.trim(),
      endTime: form.value.endTime.trim(),
    });
    closeFormDialog();
    await retrieveSection();
  } catch (error) {
    formError.value =
      error.response?.data?.message || "Failed to update section.";
  } finally {
    saving.value = false;
  }
};

onMounted(retrieveSection);
watch(() => route.params.sectionId, retrieveSection);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>{{ section?.sectionNumber || "Section" }}</v-card-title>
        <v-card-subtitle v-if="section">
          {{ section.course?.name }}
          · {{ section.daysOfWeek }}
          · {{ section.startTime }} – {{ section.endTime }}
        </v-card-subtitle>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta mr-2"
            :disabled="!section"
            @click="openEditDialog"
          >
            Edit section
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>Edit Section</v-card-title>
        <v-card-text>
          <SectionForm
            ref="formRef"
            v-model="form"
            :courses="courses"
            :faculty="faculty"
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
            Save Section
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>