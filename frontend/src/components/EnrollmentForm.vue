<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  seasons: { type: Array, default: () => [] },
  teams: { type: Array, default: () => [] },
  showLocation: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const requiredRule = [(value) => !!value?.toString().trim() || "Required"];
const locationRules = [
  (value) =>
    !value?.trim() ||
    value.trim().length <= 50 ||
    "Location must be 50 characters or fewer.",
];
const selectRules = [(value) => !!value || "Required"];
const scoreRules = [
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return true;
    }

    const parsed = Number(value);
    return (
      (Number.isInteger(parsed) && parsed >= 0 && parsed <= 999) ||
      "Score must be between 0 and 999."
    );
  },
];

const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <v-select
      :model-value="modelValue.seasonId"
      label="Season"
      :items="seasons"
      item-title="name"
      item-value="id"
      density="comfortable"
      :rules="selectRules"
      @update:model-value="updateField('seasonId', $event)"
    />
    <v-text-field
      :model-value="modelValue.gameDate"
      label="Date"
      type="date"
      density="comfortable"
      :rules="requiredRule"
      @update:model-value="updateField('gameDate', $event)"
    />
    <v-text-field
      :model-value="modelValue.startTime"
      label="Start Time"
      type="time"
      density="comfortable"
      :rules="requiredRule"
      @update:model-value="updateField('startTime', $event)"
    />
    <v-text-field
      v-if="showLocation"
      :model-value="modelValue.location"
      label="Location"
      density="comfortable"
      :rules="locationRules"
      @update:model-value="updateField('location', $event)"
    />
    <v-select
      :model-value="modelValue.homeTeamId"
      label="Home Team"
      :items="teams"
      item-title="name"
      item-value="id"
      density="comfortable"
      :rules="selectRules"
      @update:model-value="updateField('homeTeamId', $event)"
    />
    <v-select
      :model-value="modelValue.visitingTeamId"
      label="Visiting Team"
      :items="teams"
      item-title="name"
      item-value="id"
      density="comfortable"
      :rules="selectRules"
      @update:model-value="updateField('visitingTeamId', $event)"
    />
    <v-text-field
      :model-value="modelValue.homeTeamScore"
      label="Home Team Score"
      type="number"
      density="comfortable"
      :rules="scoreRules"
      @update:model-value="updateField('homeTeamScore', $event)"
    />
    <v-text-field
      :model-value="modelValue.visitingTeamScore"
      label="Visiting Team Score"
      type="number"
      density="comfortable"
      :rules="scoreRules"
      @update:model-value="updateField('visitingTeamScore', $event)"
    />
  </v-form>
</template>