<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  leagues: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

function semesterOptionsList() {    //somehow need to display the student name on each semester if person is a faculty
  const seasonOptions = [
    "Fall",
    "Winter",
    "Spring",
    "Summer",
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear; year <= currentYear + 4; year++) {
    yearOptions.push(String(year));
  }
  const semesterOptions = [];
  for (let i = 0; i < yearOptions.length; i++) {
    for (let j = 0; j < seasonOptions.length; j++) {
      semesterOptions.push({
        name: String(seasonOptions[j] + " " + yearOptions[i]),
        id: seasonOptions[j] + " " + yearOptions[i],
      });
    }
  }
  return semesterOptions;
}

const MONDAY = 1;
const THURSDAY = 4;
const FRIDAY = 5;

function toISODate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nthWeekday(year, monthIndex, weekday, n) {
  const firstDow = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const day = 1 + ((weekday - firstDow + 7) % 7) + (n-1) * 7;
  return new Date(Date.UTC(year, monthIndex, day));
}

function lastWeekday(year, monthIndex, weekday) {
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  const day = last.getUTCDate() - ((last.getUTCDay() - weekday + 7) % 7);
  return new Date(Date.UTC(year, monthIndex, day));
}

function weekdayOfWeek(year, monthIndex, weekNumber, weekday) {
  const firstDow = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const week1Monday = 1 -((firstDow + 6) % 7);
  const offsetFromMonday = (weekday + 6) % 7;
  const day = week1Monday + (weekNumber -1) * 7 + offsetFromMonday;
  return new Date(Date.UTC(year,monthIndex,day));
}

function semesterDates(term, year) {
  const numericYear = Number(year);
  const ranges = {
    Fall: [
      lastWeekday(numericYear, 7, THURSDAY),
      nthWeekday(numericYear, 11, FRIDAY, 3),
    ],
    Spring: [
      weekdayOfWeek(numericYear, 0, 2, MONDAY),
      nthWeekday(numericYear, 4, THURSDAY, 1),
    ],
    Summer: [
      weekdayOfWeek(numericYear, 4, 3, MONDAY),
      weekdayOfWeek(numericYear, 7, 2, THURSDAY),
    ],
    Winter: [
      nthWeekday(numericYear, 11, MONDAY, 4),
      nthWeekday(numericYear + 1, 0, THURSDAY, 1),
    ],
  };
  const range = ranges[term];
  if (!range || !Number.isFinite(numericYear)) {
    return null;
  }
  const [start, end] = range;
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

const selectedSemester = computed(() => {
  const { semester, term, year } = props.modelValue;
  if (semester) return semester;
  if (term && year) return `${term} ${year}`;
  return null;
});

const dateRange = computed(() => {
  const dates = semesterDates(props.modelValue.term, props.modelValue.year);
  if (!dates) return "";
  return `${dates.startDate} - ${dates.endDate}`;
});

function onSemesterSelected(value) {
  const [term = "", year = ""] = String(value ?? "").split(" ");
  emit("update:modelValue", {
    ...props.modelValue,
    semester: value,
    term,
    year: year ? Number(year) : "",
  });
}


const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">  
    <v-select
      :model-value="selectedSemester"
      label="Semester"
      :items="semesterOptionsList()"
      item-title="name"
      item-value="id"
      density="comfortable"
      @update:model-value="onSemesterSelected"
    />
    <v-text-field
      v-if="dateRange"
      :model-value="dateRange"
      label="Date Range"
      type="text"
      density="comfortable"
      readonly
    />
  </v-form>
</template>