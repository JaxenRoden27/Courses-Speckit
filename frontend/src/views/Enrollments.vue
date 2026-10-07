<script setup>
import { computed, onMounted, ref } from "vue";
import Utils from "../config/utils.js";
import enrollmentServices from "../services/enrollmentServices.js";
import courseServices from "../services/courseServices.js";
import sectionServices from "../services/sectionServices.js";
import semesterServices from "../services/semesterServices.js";
import EnrollmentForm from "../components/EnrollmentForm.vue";

const emptyForm = () => ({
  courseId: null,
  sectionId: null,
  semesterId: null,
});

const currentUser = ref(Utils.getStore("user"));
const isFaculty = computed(() => currentUser.value?.role === "faculty");
const isStudent = computed(() => currentUser.value?.role === "student");

const enrollments = ref([]);
const courses = ref([]);
const sections = ref([]);
const semesters = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const isAddMode = ref(true);
const form = ref(emptyForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingEnrollmentId = ref(null);
const deleteDialogOpen = ref(false);
const enrollmentToDelete = ref(null);
const deleting = ref(false);

const formTitle = computed(() =>
  isAddMode.value ? "Add Enrollment" : "Edit Enrollment",
);
const saveLabel = computed(() =>
  isAddMode.value ? "Create" : "Save Enrollment",
);
const emptyMessage = computed(() =>
  isFaculty.value
    ? "No enrollments yet for students."
    : "No enrollments yet. Create your first enrollment.",
);

const sectionFor = (enrollment) =>
  sections.value.find((section) => section.id === enrollment.sectionId);

const courseName = (enrollment) => {
  const section = sectionFor(enrollment);
  return courses.value.find((course) => course.id === section?.courseId)?.name ?? "";
};

const sectionNumber = (enrollment) => sectionFor(enrollment)?.sectionNumber ?? "";

const retrieveEnrollments = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const studentId = currentUser.value?.userId;
    const enrollmentsRequest = isFaculty.value
      ? enrollmentServices.getEnrollments()
      : enrollmentServices.getStudentEnrollments(studentId);

    const [enrollmentsResponse, coursesResponse, sectionsResponse, semestersResponse] =
      await Promise.all([
        enrollmentsRequest,
        courseServices.getCourses(),
        sectionServices.getSections(),
        semesterServices.getSemesters(),
      ]);

    enrollments.value = enrollmentsResponse.data;
    courses.value = coursesResponse.data;
    sections.value = sectionsResponse.data;
    semesters.value = semestersResponse.data;
  } catch (error) {
    listError.value = error.response?.data?.message || "Failed to fetch enrollments.";
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  isAddMode.value = true;
  editingEnrollmentId.value = null;
  form.value = emptyForm();
  formError.value = "";
  formDialogOpen.value = true;
};

const openEditDialog = (enrollment) => {
  const section = sectionFor(enrollment);
  isAddMode.value = false;
  editingEnrollmentId.value = enrollment.id;
  form.value = {
    courseId: section?.courseId ?? null,
    sectionId: enrollment.sectionId ?? null,
    semesterId: enrollment.semesterId ?? null,
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

  if (!result?.valid) {
    return;
  }

  saving.value = true;

  const studentId = currentUser.value?.userId;
  const payload = {
    sectionId: form.value.sectionId,
    semesterId: form.value.semesterId,
  };

  try {
    if (isAddMode.value) {
      await enrollmentServices.createEnrollment(studentId, payload);
    } else {
      await enrollmentServices.updateEnrollment(
        studentId,
        editingEnrollmentId.value,
        payload,
      );
    }

    closeFormDialog();
    await retrieveEnrollments();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value ? "Failed to create enrollment." : "Failed to update enrollment.");
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (enrollment) => {
  enrollmentToDelete.value = enrollment;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  enrollmentToDelete.value = null;
};

const confirmDeleteEnrollment = async () => {
  if (!enrollmentToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  listError.value = "";

  try {
    await enrollmentServices.deleteEnrollment(
      currentUser.value?.userId,
      enrollmentToDelete.value.id,
    );
    closeDeleteDialog();
    await retrieveEnrollments();
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to delete enrollment.";
  } finally {
    deleting.value = false;
  }
};

onMounted(retrieveEnrollments);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Enrollments</v-card-title>
        <template v-if="isStudent" #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New enrollment
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <p v-if="!loading && enrollments.length === 0" class="text-body-1">
          {{ emptyMessage }}
        </p>

        <v-table v-if="!loading && enrollments.length > 0">
          <thead>
            <tr>
              <th class="text-left">Course name</th>
              <th class="text-left">Section number</th>
              <th v-if="isFaculty" class="text-left">studentId</th>
              <th v-if="isStudent" class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="enrollment in enrollments" :key="enrollment.id">
              <td>{{ courseName(enrollment) }}</td>
              <td>{{ sectionNumber(enrollment) }}</td>
              <td v-if="isFaculty">{{ enrollment.studentId }}</td>
              <td v-if="isStudent">
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Edit enrollment"
                  @click="openEditDialog(enrollment)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Delete enrollment"
                  @click="openDeleteDialog(enrollment)"
                >
                  mdi-trash-can
                </v-icon>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="560">
      <v-card rounded="lg">
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <EnrollmentForm
            ref="formRef"
            v-model="form"
            :courses="courses"
            :sections="sections"
            :semesters="semesters"
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

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete Enrollment</v-card-title>
        <v-card-text>Delete this enrollment?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleting"
            @click="confirmDeleteEnrollment"
          >
            Delete Enrollment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>