<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  courses: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);
const termOptions = ref([
  { id: 1, name: "Spring" },
  { id: 2, name: "Summer" },
  { id: 3, name: "Fall" },
  { id: 4, name: "Winter" },
]);
function courseOptionsList() {   
  const courseOptions = [
    "Math 101",
    "Math 102",
    "Science 101",
    "Science 102",
    "History 101",
    "History 102",
    "English 101",
    "English 102",
    "Art 101",
    "Art 102",
  ];

  return courseOptions;
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
    term: value,
  });
}
function onDescriptionUpdated(value) {
  emit("update:modelValue", {
    ...props.modelValue,
    description: value,
  });
}
const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">  
    <v-select
      :model-value="modelValue.courseName"
      label="Course"
      :items="courseOptionsList()"
      item-title="name"
      item-value="name"
      density="comfortable"
      @update:model-value="onCourseNameUpdated"
    />
    <v-select
      :model-value="modelValue.term"
      label="Term"
      :items="termOptions"
      item-title="name"
      item-value="name"
      density="comfortable"
      @update:model-value="onTermUpdated"
    />
    <v-textarea
      :model-value="modelValue.description"
      label="Description"
      density="comfortable"
      @update:model-value="onDescriptionUpdated"
    />
  </v-form>
</template>