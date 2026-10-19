<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import sectionServices from "../services/sectionServices.js";
import studentServices from "../services/studentServices.js";
import enrollmentServices from "../services/enrollmentServices.js";
import CourseEnrollmentForm from "../components/CourseEnrollmentForm.vue";
import Utils from "../config/utils.js";

const route = useRoute();

const emptyEnrollmentForm = (sectionId) => ({
  sectionId: sectionId ?? null,
  studentId: null,
});

const section = ref(null);
const sections = ref([]);
const students = ref([]);
const enrolledStudents = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const isAddMode = ref(true);
const form = ref(emptyEnrollmentForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingEnrollmentId = ref(null);

const sectionId = computed(() => parseInt(route.params.sectionId, 10));
const formTitle = computed(() =>
  isAddMode.value ? "Enroll Student" : "Edit Enrollment"
);
const saveLabel = computed(() =>
  isAddMode.value ? "Create" : "Save Enrollment"
);

const isAdmin = computed(() => Utils.getStore("user")?.role === "admin");

const studentDisplayName = (student) => {
  const lName = student.lastName || student.lName || "";
  const fName = student.firstName || student.fName || "";
  return `${lName}, ${fName}`.replace(/^,\s*|\s*,$/g, "").trim() || student.name || "";
};

const sectionRoster = computed(() => {
  return [...enrolledStudents.value]
    .filter((s) => s.sectionId === sectionId.value || s.enrollment?.sectionId === sectionId.value)
    .sort((a, b) => {
      const lNameCompare = (a.lastName || a.lName || "").localeCompare(b.lastName || b.lName || "");
      if (lNameCompare !== 0) return lNameCompare;
      return (a.firstName || a.fName || "").localeCompare(b.firstName || b.fName || "");
    });
});

const retrieveSectionAndStudents = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const [sectionsResponse, studentsResponse, rosterResponse] = await Promise.all([
      sectionServices.getSections(),
      studentServices.getStudents(),
      sectionServices.getSectionStudents(sectionId.value).catch(() => ({ data: [] })),
    ]);

    sections.value = sectionsResponse.data;
    students.value = studentsResponse.data;
    enrolledStudents.value = rosterResponse.data;

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

const openAddStudentDialog = () => {
  isAddMode.value = true;
  editingEnrollmentId.value = null;
  form.value = emptyEnrollmentForm(sectionId.value);
  formError.value = "";
  formDialogOpen.value = true;
};

const openEditEnrollmentDialog = (studentRow) => {
  isAddMode.value = false;
  editingEnrollmentId.value = studentRow.enrollmentId || studentRow.id;
  form.value = {
    sectionId: sectionId.value,
    studentId: studentRow.studentId || studentRow.id,
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingEnrollmentId.value = null;
};

const saveEnrollment = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid || !section.value) {
    return;
  }

  saving.value = true;

  const payload = {
    studentId: form.value.studentId,
    sectionId: sectionId.value,
  };

  try {
    if (isAddMode.value) {
      await sectionServices.enrollStudent(sectionId.value, payload);
    } else {
      await enrollmentServices.updateEnrollment(editingEnrollmentId.value, payload);
    }

    closeFormDialog();
    await retrieveSectionAndStudents();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value
        ? "Failed to enroll student."
        : "Failed to update enrollment.");
  } finally {
    saving.value = false;
  }
};

onMounted(retrieveSectionAndStudents);
watch(() => route.params.sectionId, retrieveSectionAndStudents);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>
          {{ section?.sectionNumber ? `Section ${section.sectionNumber}` : "Section" }}
        </v-card-title>
        <v-card-subtitle v-if="section">
          <span>{{ section.course?.courseNumber || section.courseCode }} - {{ section.course?.courseName || section.courseTitle }}</span>
          <template v-if="section.semester">
            · {{ section.semester.name || section.semester.semester || section.semester }}
          </template>
          <template v-if="section.faculty">
            · {{ section.faculty.firstName }} {{ section.faculty.lastName }}
          </template>
          <template v-if="section.daysOfWeek || section.startTime">
            · {{ section.daysOfWeek }} {{ section.startTime }}–{{ section.endTime }}
          </template>
        </v-card-subtitle>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :disabled="!section"
            @click="openAddStudentDialog"
          >
            Enroll Student
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <template v-if="!loading && section">
          <p v-if="sectionRoster.length === 0" class="text-body-1">
            No students enrolled yet. Enroll your first student.
          </p>

          <v-table v-if="sectionRoster.length > 0">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">University ID</th>
                <th class="text-left">Email</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="studentRow in sectionRoster" :key="studentRow.id">
                <td>{{ studentDisplayName(studentRow) }}</td>
                <td>{{ studentRow.universityId }}</td>
                <td>{{ studentRow.email }}</td>
                <td>
                  <v-icon
                    size="small"
                    class="mx-4"
                    aria-label="Edit Enrollment"
                    @click="openEditEnrollmentDialog(studentRow)"
                  >
                    mdi-pencil
                  </v-icon>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <CourseEnrollmentForm
            ref="formRef"
            v-model="form"
            :sections="sections"
            :students="students"
            mode="student"
            :is-edit="!isAddMode"
            @submit="saveEnrollment"
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
            @click="saveEnrollment"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
