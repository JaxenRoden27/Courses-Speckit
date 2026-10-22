<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import studentServices from "../services/studentServices.js";

const router = useRouter();

const students = ref([]);
const loading = ref(false);
const error = ref("");

const retrieveStudents = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await studentServices.getStudents();
    students.value = response.data || [];
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to fetch students.";
  } finally {
    loading.value = false;
  }
};

const viewCourses = (studentId) => {
  router.push(`/students/${studentId}/courses`);
};

onMounted(retrieveStudents);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Students</v-card-title>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="error" type="error" density="compact" class="mb-4">
          {{ error }}
        </v-alert>

        <p v-if="!loading && students.length === 0" class="text-body-1">
          No students found.
        </p>

        <v-table v-if="!loading && students.length > 0">
          <thead>
            <tr>
              <th class="text-left">Student ID</th>
              <th class="text-left">First Name</th>
              <th class="text-left">Last Name</th>
              <th class="text-left">Email</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.id">
              <td>{{ student.universityId || student.id }}</td>
              <td>{{ student.fName || student.firstName || "" }}</td>
              <td>{{ student.lName || student.lastName || "" }}</td>
              <td>{{ student.email || "" }}</td>
              <td>
                <v-icon
                  size="small"
                  aria-label="View courses"
                  title="View courses"
                  @click="viewCourses(student.id)"
                >
                  mdi-book-open-page-variant
                </v-icon>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
