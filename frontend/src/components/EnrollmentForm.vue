<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  semesters: { type: Array, default: () => [] },
  courses: { type: Array, default: () => [] },
  sections: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const updateSemester = (semesterId) => {
  const semester = props.semesters.find((item) => item.id === semesterId);
  const term = semester?.name?.split(" ")[0];
  const courseStillValid = props.courses.some(
    (course) =>
      course.id === props.modelValue.courseId && course.courseTerm === term,
  );

  emit("update:modelValue", {
    ...props.modelValue,
    semesterId,
    courseId: courseStillValid ? props.modelValue.courseId : null,
    sectionId: courseStillValid ? props.modelValue.sectionId : null,
  });
};

const updateCourse = (courseId) => {
  const sectionStillValid = props.sections.some(
    (section) =>
      section.id === props.modelValue.sectionId &&
      section.courseId === courseId,
  );

  emit("update:modelValue", {
    ...props.modelValue,
    courseId,
    sectionId: sectionStillValid ? props.modelValue.sectionId : null,
  });
};

const courseChoices = computed(() => {
  const semester = props.semesters.find(
    (item) => item.id === props.modelValue.semesterId,
  );
  const term = semester?.name?.split(" ")[0];
  if (!term) return [];
  return props.courses.filter((course) => course.courseTerm === term);
});

const sectionChoices = computed(() =>
  props.sections.filter(
    (section) => section.courseId === props.modelValue.courseId,
  ),
);

const semesterRules = [(value) => !!value || "Required"];
const courseRules = [(value) => !!value || "Required"];
const sectionRules = [(value) => !!value || "Required"];

const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <v-select
      :model-value="modelValue.semesterId"
      label="Semester"
      :items="semesters"
      item-title="name"
      item-value="id"
      density="comfortable"
      :rules="semesterRules"
      @update:model-value="updateSemester"
    />
    <v-select
      :model-value="modelValue.courseId"
      label="Course"
      :items="courseChoices"
      item-title="courseName"
      item-value="id"
      density="comfortable"
      :rules="courseRules"
      @update:model-value="updateCourse"
    />
    <v-select
      :model-value="modelValue.sectionId"
      label="Section"
      :items="sectionChoices"
      item-title="sectionNumber"
      item-value="id"
      density="comfortable"
      :rules="sectionRules"
      @update:model-value="updateField('sectionId', $event)"
    />
  </v-form>
</template>