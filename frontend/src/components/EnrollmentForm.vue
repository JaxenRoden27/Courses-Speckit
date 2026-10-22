<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  semesters: { type: Array, default: () => [] },
  courses: { type: Array, default: () => [] },
  sections: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const getSemesterTerm = (semester) => {
  if (!semester?.name) return "";
  const parts = semester.name.split(" ");
  return parts.find((p) => ["Fall", "Spring", "Summer", "Winter"].includes(p)) || parts[0];
};

const updateSemester = (semesterId) => {
  const semester = props.semesters.find((item) => item.id === semesterId);
  const term = getSemesterTerm(semester);
  const courseStillValid = props.courses.some(
    (course) =>
      course.id === props.modelValue.courseId &&
      (course.courseTerm === term || semester?.name?.toLowerCase().includes((course.courseTerm || "").toLowerCase())),
  );

  emit("update:modelValue", {
    ...props.modelValue,
    semesterId,
    courseId: courseStillValid ? props.modelValue.courseId : null,
    sectionId: courseStillValid ? props.modelValue.sectionId : null,
  });
};

const updateCourse = (courseId) => {
  const course = props.courses.find((c) => c.id === courseId);
  let newSemesterId = props.modelValue.semesterId;
  if (!newSemesterId && course?.courseTerm) {
    const matchedSemester = props.semesters.find((s) =>
      s.name?.toLowerCase().includes(course.courseTerm.toLowerCase())
    );
    if (matchedSemester) newSemesterId = matchedSemester.id;
  }

  const matchingSections = props.sections.filter(
    (section) => section.courseId === courseId
  );
  const sectionStillValid = matchingSections.some(
    (section) => section.id === props.modelValue.sectionId
  );
  const newSectionId = sectionStillValid
    ? props.modelValue.sectionId
    : (matchingSections.length === 1 ? matchingSections[0].id : null);

  emit("update:modelValue", {
    ...props.modelValue,
    courseId,
    semesterId: newSemesterId,
    sectionId: newSectionId,
  });
};

const updateSection = (sectionId) => {
  const section = props.sections.find((s) => s.id === sectionId);
  const newCourseId = section?.courseId ?? props.modelValue.courseId;
  let newSemesterId = props.modelValue.semesterId;
  if (!newSemesterId && newCourseId) {
    const course = props.courses.find((c) => c.id === newCourseId);
    if (course?.courseTerm) {
      const matched = props.semesters.find((s) =>
        s.name?.toLowerCase().includes(course.courseTerm.toLowerCase())
      );
      if (matched) newSemesterId = matched.id;
    }
  }

  emit("update:modelValue", {
    ...props.modelValue,
    sectionId,
    courseId: newCourseId,
    semesterId: newSemesterId,
  });
};

const courseChoices = computed(() => {
  if (!props.modelValue.semesterId) {
    return props.courses;
  }
  const semester = props.semesters.find(
    (item) => item.id === props.modelValue.semesterId,
  );
  if (!semester) return props.courses;
  const term = getSemesterTerm(semester);
  const filtered = props.courses.filter(
    (course) =>
      course.courseTerm === term ||
      semester.name.toLowerCase().includes((course.courseTerm || "").toLowerCase())
  );
  return filtered.length > 0 ? filtered : props.courses;
});

const sectionChoices = computed(() => {
  if (!props.modelValue.courseId) {
    return props.sections;
  }
  const filtered = props.sections.filter(
    (section) => section.courseId === props.modelValue.courseId,
  );
  return filtered.length > 0 ? filtered : props.sections;
});

const semesterRules = [(value) => !!value || "Required"];
const courseRules = [(value) => !!value || "Required"];
const sectionRules = [(value) => !!value || "Required"];

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
      @update:model-value="updateSemester"
    />
    <v-select
      :model-value="modelValue.courseId"
      label="Course"
      :items="courseChoices"
      item-title="courseName"
      item-value="id"
      density="comfortable"
      :rules="courseRules"
      @update:model-value="updateCourse"
    />
    <v-select
      :model-value="modelValue.sectionId"
      label="Section"
      :items="sectionChoices"
      item-title="sectionNumber"
      item-value="id"
      density="comfortable"
      :rules="sectionRules"
      @update:model-value="updateSection"
    />
  </v-form>
</template>