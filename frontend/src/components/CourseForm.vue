<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const termOptions = ref([
  { id: 1, name: "Spring" },
  { id: 2, name: "Summer" },
  { id: 3, name: "Fall" },
  { id: 4, name: "Winter" },
]);
const courseNumberOptions = ref([
  { id: 1, name: "CS 101" },
  { id: 2, name: "CS 201" },
  { id: 3, name: "SCI 101" },
  { id: 4, name: "SCI 102" },
  { id: 5, name: "ENG 101" },
  { id: 6, name: "HIST 101" },
  { id: 7, name: "HIST 102" },
  { id: 8, name: "ART 101" },
  { id: 9, name: "ART 102" },
]);

function onCourseNumberUpdated(value) {
  emit("update:modelValue", {
    ...props.modelValue,
    courseNumber: value,
  });
}

function onCourseNameUpdated(value) {
  emit("update:modelValue", {
    ...props.modelValue,
    courseName: value,
  });
}
function onTermUpdated(value) {
  emit("update:modelValue", {
    ...props.modelValue,
    courseTerm: value,
  });
}
function onDescriptionUpdated(value) {
  emit("update:modelValue", {
    ...props.modelValue,
    courseDescription: value,
  });
}
const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <v-select
      :model-value="modelValue.courseNumber"
      label="Course Number"
      :items="courseNumberOptions"
      item-title="name"
      item-value="name"
      density="comfortable"
      @update:model-value="onCourseNumberUpdated"
    />
    <v-textarea
      :model-value="modelValue.courseName"
      label="Course Name"
      density="compact"
      @update:model-value="onCourseNameUpdated"
    />
    <v-select
      :model-value="modelValue.courseTerm"
      label="Term"
      :items="termOptions"
      item-title="name"
      item-value="name"
      density="comfortable"
      @update:model-value="onTermUpdated"
    />
    <v-textarea
      :model-value="modelValue.courseDescription"
      label="Description"
      density="comfortable"
      @update:model-value="onDescriptionUpdated"
    />
  </v-form>
</template>
