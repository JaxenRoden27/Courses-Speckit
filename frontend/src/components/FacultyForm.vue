<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  users: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const firstNameRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 50 ||
    "First name must be 50 characters or fewer.",
];
const lastNameRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 50 ||
    "Last name must be 50 characters or fewer.",
];
const deptRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 50 ||
    "Department must be 50 characters or fewer.",
];

const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <v-text-field
      :model-value="modelValue.firstName"
      label="First Name"
      density="comfortable"
      rounded="lg"
      :rules="firstNameRules"
      @update:model-value="updateField('firstName', $event)"
    />
    <v-text-field
      :model-value="modelValue.lastName"
      label="Last Name"
      density="comfortable"
      rounded="lg"
      :rules="lastNameRules"
      @update:model-value="updateField('lastName', $event)"
    />
    <v-text-field
      :model-value="modelValue.dept"
      label="Department"
      density="comfortable"
      rounded="lg"
      :rules="deptRules"
      @update:model-value="updateField('dept', $event)"
    />
    <v-select
      :model-value="modelValue.userId"
      label="User"
      :items="users"
      item-title="universityId"
      item-value="id"
      clearable
      density="comfortable"
      rounded="lg"
      @update:model-value="updateField('userId', $event)"
    />
  </v-form>
</template>