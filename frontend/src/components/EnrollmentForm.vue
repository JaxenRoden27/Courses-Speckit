<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  semesters: { type: Array, default: () => [] },
  sections: { type: Array, default: () => [] },
  faculty: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const requiredRule = [(value) => !!value?.toString().trim() || "Required"];
const semesterRules = [(value) => !!value || "Required"];
const sectionRules = [(value) => !!value || "Required"];
const facultyRules = [(value) => !!value || "Required"];

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
      :model-value="modelValue.sectionId"
      label="Section"
      :items="sections"
      item-title="name"
      item-value="id"
      density="comfortable"
      :rules="sectionRules"
      @update:model-value="updateField('sectionId', $event)"
    />
    <v-select
      :model-value="modelValue.facultyId"
      label="Faculty"
      :items="faculty"
      item-title="name"
      item-value="id"
      density="comfortable"
      :rules="facultyRules"
      @update:model-value="updateField('facultyId', $event)"
    />
  </v-form>
</template>