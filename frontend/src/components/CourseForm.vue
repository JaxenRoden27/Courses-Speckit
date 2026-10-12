<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

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
    <v-text-field
      :model-value="modelValue.courseNumber"
      label="Course Number"
      density="comfortable"
      @update:model-value="onCourseNumberUpdated"
    />
    <v-textarea
      :model-value="modelValue.courseName"
      label="Course Name"
      density="compact"
      @update:model-value="onCourseNameUpdated"
    />
    <v-text-field
      :model-value="modelValue.courseTerm"
      label="courseTerm"
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
