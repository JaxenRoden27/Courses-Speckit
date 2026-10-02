<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  courses: { type: Array, default: () => [] },
  faculty: { type: Array, default: () => [] },
  lockCourse: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

const courseName = computed(() => {
  const course = props.courses.find((row) => row.id === props.modelValue.courseId);
  return course?.name ?? "";
});

const facultyItems = computed(() =>
  props.faculty.map((faculty) => ({
    ...faculty,
    name: `${faculty.lastName}, ${faculty.firstName}`,
  }))
);

const sectionNumberRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 10 ||
    "Section name must be 10 characters or fewer.",
];
const courseRules = [(value) => !!value || "Required"];
const facultyRules = [(value) => !!value || "Required"];
const daysOfWeekRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 10 ||
    "Section days of week must be 10 characters or fewer.",
];
const timeRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    !value?.trim() ||
    TIME_PATTERN.test(value.trim()) ||
    "Section time must be a valid date.",
];
const endTimeRules = [
  ...timeRules,
  (value) => {
    const start = props.modelValue.startTime?.trim() ?? "";
    const end = value?.trim() ?? "";
    if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
      return true;
    }
    return start < end || "Section start time must be before end time.";
  },
];

const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <v-text-field
      :model-value="modelValue.sectionNumber"
      label="Section Number"
      density="comfortable"
      :rules="sectionNumberRules"
      @update:model-value="updateField('sectionNumber', $event)"
    />
    <v-text-field
      v-if="lockCourse"
      :model-value="courseName"
      label="Course"
      density="comfortable"
      readonly
    />
    <v-select
      v-else
      :model-value="modelValue.courseId"
      label="Course"
      :items="courses"
      item-title="name"
      item-value="id"
      density="comfortable"
      :rules="courseRules"
      @update:model-value="updateField('courseId', $event)"
    />
    <v-select
      :model-value="modelValue.facultyId"
      label="Faculty"
      :items="facultyItems"
      item-title="name"
      item-value="id"
      density="comfortable"
      :rules="facultyRules"
      @update:model-value="updateField('facultyId', $event)"
    />
    <v-text-field
      :model-value="modelValue.daysOfWeek"
      label="Days of Week"
      density="comfortable"
      :rules="daysOfWeekRules"
      @update:model-value="updateField('daysOfWeek', $event)"
    />
    <v-text-field
      :model-value="modelValue.startTime"
      label="Start Time"
      density="comfortable"
      :rules="timeRules"
      @update:model-value="updateField('startTime', $event)"
    />
    <v-text-field
      :model-value="modelValue.endTime"
      label="End Time"
      density="comfortable"
      :rules="endTimeRules"
      @update:model-value="updateField('endTime', $event)"
    />
  </v-form>
</template>