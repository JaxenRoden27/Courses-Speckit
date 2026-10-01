<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import semesterServices from "../services/semesterServices.js";

const props = defineProps({
  semesterId: { type: [String, Number], required: true },
});

const router = useRouter();
const semester = ref(null);
const loading = ref(false);
const error = ref("");

const classCountLabel = (count) => {
  const numeric = Number(count ?? 0);
  const safeCount = Number.isFinite(numeric) ? numeric : 0;
  return `${safeCount} ${safeCount === 1 ? "class" : "classes"}`;
};

const title = computed(
  () => semester.value?.name || semester.value?.semester || "",
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

onMounted(loadSemester);
</script>

<template>
  <v-container class="py-8">
    <v-btn
      variant="text"
      class="mb-4"
      @click="router.push({ name: 'semesters' })"
    >
      Back to semesters
    </v-btn>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-alert v-if="error" type="error" density="compact">
      {{ error }}
    </v-alert>

    <v-card v-if="semester" rounded="lg">
      <v-card-item>
        <v-card-title>{{ title }}</v-card-title>
      </v-card-item>
      <v-card-text>
        <p class="text-body-1 mb-2">Semester {{ title }}</p>
        <p class="text-body-1 mb-2">Date range {{ dateRange }}</p>
        <p class="text-body-1 mb-6">
          Classes {{ classCountLabel(semester.classCount) }}
        </p>

        <p class="text-body-1 mb-2">Sections you are enrolled in</p>
        <v-sheet
          rounded="lg"
          border
          class="pa-4"
          min-height="80"
          aria-label="Sections you are enrolled in"
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>
