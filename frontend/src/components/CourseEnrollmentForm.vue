<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  students: { type: Array, default: () => [] },
  courses: { type: Array, default: () => [] },
  sections: { type: Array, default: () => [] },
  mode: {
    type: String,
    default: "course", // "course" (for StudentCourses) or "student" (for SectionStudents)
  },
  isEdit: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const requiredRule = [(value) => !!value?.toString().trim() || "Required"];
const selectRule = [(value) => value !== null && value !== undefined && value !== "" || "Required"];

const studentItems = computed(() =>
  props.students.map((student) => ({
    id: student.id,
    title: student.name || `${student.lName || student.lastName || ""}, ${student.fName || student.firstName || ""}`.trim(),
  }))
);

const sectionItems = computed(() =>
  props.sections.map((section) => ({
    id: section.id,
    title: section.sectionNumber || `Section ${section.id}`,
  }))
);

const onCourseSelect = (courseCode) => {
  updateField("courseCode", courseCode);
  const matchedCourse = props.courses.find((c) => (c.code || c.courseNumber) === courseCode);
  if (matchedCourse) {
    updateField("courseTitle", matchedCourse.title || matchedCourse.courseName || "");
  }
};

const validate = () => formRef.value?.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <!-- Mode: Enrolling a course for a student (Feature 7) -->
    <template v-if="mode === 'course'">
      <v-select
        :model-value="modelValue.studentId"
        label="Student"
        :items="studentItems"
        item-title="title"
        item-value="id"
        density="comfortable"
        :rules="selectRule"
        :disabled="true"
        @update:model-value="updateField('studentId', $event)"
      />
      <v-text-field
        :model-value="modelValue.term"
        label="Term"
        density="comfortable"
        :rules="requiredRule"
        @update:model-value="updateField('term', $event)"
      />
      <v-text-field
        :model-value="modelValue.schedule"
        label="Schedule"
        density="comfortable"
        :rules="requiredRule"
        @update:model-value="updateField('schedule', $event)"
      />
      <v-text-field
        v-if="isEdit"
        :model-value="modelValue.room"
        label="Room"
        density="comfortable"
        @update:model-value="updateField('room', $event)"
      />
      <v-text-field
        :model-value="modelValue.courseCode"
        label="Course Code"
        density="comfortable"
        :rules="requiredRule"
        @update:model-value="updateField('courseCode', $event)"
      />
      <v-text-field
        :model-value="modelValue.courseTitle"
        label="Course Title"
        density="comfortable"
        :rules="requiredRule"
        @update:model-value="updateField('courseTitle', $event)"
      />
      <v-text-field
        :model-value="modelValue.credits"
        label="Credits"
        type="number"
        density="comfortable"
        @update:model-value="updateField('credits', $event)"
      />
      <v-text-field
        :model-value="modelValue.grade"
        label="Grade"
        density="comfortable"
        @update:model-value="updateField('grade', $event)"
      />
    </template>

    <!-- Mode: Enrolling a student into a section (Feature 8) -->
    <template v-else>
      <v-select
        :model-value="modelValue.sectionId"
        label="Section"
        :items="sectionItems"
        item-title="title"
        item-value="id"
        density="comfortable"
        :rules="selectRule"
        :disabled="true"
        @update:model-value="updateField('sectionId', $event)"
      />
      <v-select
        :model-value="modelValue.studentId"
        label="Student"
        :items="studentItems"
        item-title="title"
        item-value="id"
        density="comfortable"
        :rules="selectRule"
        @update:model-value="updateField('studentId', $event)"
      />
    </template>
  </v-form>
</template>
