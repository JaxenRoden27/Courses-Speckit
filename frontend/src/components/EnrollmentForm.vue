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
      @update:model-value="updateField('semesterId', $event)"
    />
    <v-select
      :model-value="modelValue.courseId"
      label="Course"
      :items="courses"
      item-title="name"
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