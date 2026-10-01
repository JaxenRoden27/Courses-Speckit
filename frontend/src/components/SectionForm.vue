{ <script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  leagues: { type: Array, default: () => [] },
  people: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const personItems = computed(() =>
  props.people.map((person) => ({
    ...person,
    title: `${person.lastName}, ${person.firstName}`,
  }))
);

const nameRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 50 ||
    "Team name must be 50 characters or fewer.",
];
const leagueRules = [(value) => !!value || "Required"];
const homeFieldRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 50 ||
    "Home field must be 50 characters or fewer.",
];

const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <v-text-field
      :model-value="modelValue.name"
      label="Team Name"
      density="comfortable"
      :rules="nameRules"
      @update:model-value="updateField('name', $event)"
    />
    <v-select
      :model-value="modelValue.leagueId"
      label="League"
      :items="leagues"
      item-title="name"
      item-value="id"
      density="comfortable"
      :rules="leagueRules"
      @update:model-value="updateField('leagueId', $event)"
    />
    <v-text-field
      :model-value="modelValue.homeField"
      label="Home Field"
      density="comfortable"
      :rules="homeFieldRules"
      @update:model-value="updateField('homeField', $event)"
    />
    <v-select
      :model-value="modelValue.managerId"
      label="Manager"
      :items="personItems"
      item-title="title"
      item-value="id"
      density="comfortable"
      clearable
      @update:model-value="updateField('managerId', $event)"
    />
  </v-form>
</template> }