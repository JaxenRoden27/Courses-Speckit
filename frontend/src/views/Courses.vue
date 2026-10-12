<script setup>
import { computed, onMounted, ref } from "vue";
import Utils from "../config/utils.js";
import CourseForm from "../components/CourseForm.vue";
import courseServices from "../services/courseServices.js";

const emptyForm = () => ({
  courseName: "",
  term: "",
  description: "",
});

const courses = ref([]);
const coursesLoading = ref(false);
const coursesError = ref("");
const formDialogOpen = ref(false);
const isAddMode = ref(true);
const form = ref(emptyForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);
const deleteDialogOpen = ref(false);
const courseToDelete = ref(null);
const deleting = ref(false);

const currentUser = ref(Utils.getStore("user"));
const isFaculty = computed(() => {
  const role = currentUser.value?.role?.toLowerCase?.().trim();
  const universityId = String(currentUser.value?.universityId ?? "")
    .trim()
    .toLowerCase();
  return role === "faculty" && universityId.startsWith("fa");
});
const formTitle = computed(() =>
  isAddMode.value ? "Add Course" : "Edit Course",
);

const courseTitle = (course) => course.courseName || "";
const saveLabel = computed(() =>
  isAddMode.value ? "Create" : "Save Course",
);

const retrieveCourses = async () => {
  coursesLoading.value = true;
  coursesError.value = "";

  try {
    const response = await courseServices.findAll();
    courses.value = response.data;
  } catch (error) {
    coursesError.value =
      error.response?.data?.message || "Failed to fetch courses.";
  } finally {
    coursesLoading.value = false;
  }
};

const openAddDialog = () => {
  isAddMode.value = true;
  editingId.value = null;
  form.value = emptyForm();
  formError.value = "";
  formDialogOpen.value = true;
};

const openEditDialog = (course) => {
  isAddMode.value = false;
  editingId.value = course.id;

  form.value = {
    courseName: course.courseName,
    term: course.term,
    description: course.description,
    sections: course.sections,
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
};

const saveCourse = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid) {
    return;
  }

  saving.value = true;

  const payload = {
    courseName: form.value.courseName,
    term: form.value.term,
    description: form.value.description || "" ,
    sections: form.value.sections,
  };

  try {
    if (isAddMode.value) {
      await courseServices.create(payload);
    } else {
      await courseServices.update(editingId.value, payload);
    }

    closeFormDialog();
    await retrieveCourses();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value
        ? "Failed to create course."
        : "Failed to update course.");
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (course) => {
  courseToDelete.value = course;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  courseToDelete.value = null;
};

const confirmDeleteCourse = async () => {
  if (!courseToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  coursesError.value = "";

  try {
    await courseServices.delete(courseToDelete.value.id);
    closeDeleteDialog();
    await retrieveCourses();
  } catch (error) {
    coursesError.value =
      error.response?.data?.message || "Failed to delete course.";
  } finally {
    deleting.value = false;
  }
};

onMounted(retrieveCourses);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Courses</v-card-title>
        <template v-if="isFaculty" #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New course
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="coursesLoading" indeterminate class="mb-4" />

        <v-alert v-if="coursesError" type="error" density="compact" class="mb-4">
          {{ coursesError }}
        </v-alert>

        <p v-if="!coursesLoading && courses.length === 0" class="text-body-1">
          {{
            isFaculty
              ? "No courses yet. Create your first course."
              : "No courses yet. No students have courses yet."
          }}
        </p>

        <v-table v-if="!coursesLoading && courses.length > 0">
          <thead>
            <tr>
              <th class="text-left">Course name</th>
              <th class="text-left">Term</th>
              <th class="text-left">Description</th>
              <th class="text-left">Sections</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in courses" :key="course.id">
              <td>{{ courseTitle(course) }}</td>
              <td class="text-no-wrap">{{ course.term }}</td>
              <td class="text-no-wrap">{{ course.description }}</td>
              <td class="text-no-wrap">{{ course.sections }}</td>
              <td>
                <v-icon
                  v-if="isFaculty"
                  size="small"
                  class="mx-4"
                  aria-label="Edit course"
                  @click.stop="openEditDialog(course)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  v-if="isFaculty"
                  size="small"
                  class="mx-4"
                  aria-label="Delete course"
                  @click.stop="openDeleteDialog(course)"
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
          <CourseForm ref="formRef" v-model="form" @submit="saveCourse" />
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
            @click="saveCourse"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete Course</v-card-title>
        <v-card-text>Delete this course?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleting"
            @click="confirmDeleteCourse"
          >
            Delete Course
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
