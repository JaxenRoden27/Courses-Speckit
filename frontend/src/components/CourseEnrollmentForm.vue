<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  students: { type: Array, default: () => [] },
  courses: { type: Array, default: () => [] },
  sections: { type: Array, default: () => [] },
  semesters: { type: Array, default: () => [] },
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

const courseSelectOptions = computed(() => {
  return props.courses.map((course) => {
    const code = course.courseNumber || course.code || "";
    const name = course.courseName || course.title || "";
    const hours = course.courseHours ?? course.credits ?? 3;
    return {
      id: course.id,
      code,
      name,
      hours,
      term: course.courseTerm || "",
      title: code && name ? `${code} — ${name} (${hours} cr)` : (code || name),
      value: code,
    };
  });
});

const courseCodeOptions = computed(() => {
  const codes = props.courses
    .map((c) => c.courseNumber || c.code)
    .filter(Boolean);
  return Array.from(new Set(codes));
});

const courseTitleOptions = computed(() => {
  const titles = props.courses
    .map((c) => c.courseName || c.title)
    .filter(Boolean);
  return Array.from(new Set(titles));
});

const termOptions = computed(() => {
  const fromSemesters = (props.semesters || [])
    .map((s) => s.name || s.semester || s.semesterName || "")
    .filter(Boolean);
  const defaults = ["2026 Fall", "2027 Spring", "2027 Summer", "2025 Fall", "2026 Spring"];
  return Array.from(new Set([...fromSemesters, ...defaults]));
});

const gradeOptions = ["A", "B", "C", "D", "F", "I", "W"];
const creditOptions = [1, 2, 3, 4, 5];

const onCourseSelect = (courseCode) => {
  const code = typeof courseCode === "object" ? (courseCode?.code || courseCode?.value || "") : String(courseCode || "");
  const matchedCourse = props.courses.find(
    (c) => (c.code || c.courseNumber || "").toLowerCase() === code.trim().toLowerCase()
  );
  if (matchedCourse) {
    const hours = matchedCourse.courseHours ?? matchedCourse.credits ?? 3;
    const title = matchedCourse.title || matchedCourse.courseName || "";
    const term = matchedCourse.courseTerm ? `2026 ${matchedCourse.courseTerm}` : props.modelValue.term;
    emit("update:modelValue", {
      ...props.modelValue,
      courseCode: matchedCourse.courseNumber || matchedCourse.code || code,
      courseTitle: title,
      credits: hours,
      ...(props.modelValue.term ? {} : (term ? { term } : {})),
    });
  } else {
    updateField("courseCode", code);
  }
};

const onCourseTitleSelect = (courseTitle) => {
  const title = typeof courseTitle === "object" ? (courseTitle?.title || courseTitle?.value || "") : String(courseTitle || "");
  const matchedCourse = props.courses.find(
    (c) => (c.title || c.courseName || "").toLowerCase() === title.trim().toLowerCase()
  );
  if (matchedCourse) {
    const hours = matchedCourse.courseHours ?? matchedCourse.credits ?? 3;
    const code = matchedCourse.courseNumber || matchedCourse.code || "";
    const term = matchedCourse.courseTerm ? `2026 ${matchedCourse.courseTerm}` : props.modelValue.term;
    emit("update:modelValue", {
      ...props.modelValue,
      courseCode: code,
      courseTitle: matchedCourse.courseName || matchedCourse.title || title,
      credits: hours,
      ...(props.modelValue.term ? {} : (term ? { term } : {})),
    });
  } else {
    updateField("courseTitle", title);
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

      <!-- Quick select course dropdown that autofills Code, Title, and Credits -->
      <v-select
        v-if="courseSelectOptions.length > 0 && !isEdit"
        label="Select Course (Autofill)"
        :items="courseSelectOptions"
        item-title="title"
        item-value="code"
        density="comfortable"
        clearable
        @update:model-value="onCourseSelect"
      />

      <v-combobox
        :model-value="modelValue.courseCode"
        label="Course Code"
        :items="courseCodeOptions"
        density="comfortable"
        :rules="requiredRule"
        @update:model-value="onCourseSelect"
      />

      <v-combobox
        :model-value="modelValue.courseTitle"
        label="Course Title"
        :items="courseTitleOptions"
        density="comfortable"
        :rules="requiredRule"
        @update:model-value="onCourseTitleSelect"
      />

      <v-combobox
        :model-value="modelValue.term"
        label="Term"
        :items="termOptions"
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

      <v-combobox
        :model-value="modelValue.credits"
        label="Credits"
        :items="creditOptions"
        type="number"
        density="comfortable"
        @update:model-value="updateField('credits', $event)"
      />

      <v-combobox
        :model-value="modelValue.grade"
        label="Grade"
        :items="gradeOptions"
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
