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
    default: "course", // "course" for StudentCourses, "student" for SectionStudents
  },
  isEdit: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const getSemesterTerm = (semester) => {
  const name = semester?.semester || semester?.name || "";
  if (!name) return "";
  const parts = name.split(" ");
  return parts.find((p) => ["Fall", "Spring", "Summer", "Winter"].includes(p)) || parts[0];
};

const formatSchedule = (s) => {
  if (!s) return "";
  if (s.schedule) return s.schedule;
  const days = s.daysOfWeek || "";
  const times = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.startTime || "");
  return [days, times].filter(Boolean).join(" ");
};

const currentSemesterId = computed(() => {
  if (props.modelValue.semesterId) return props.modelValue.semesterId;
  if (!props.modelValue.term) return null;
  const term = String(props.modelValue.term).toLowerCase().trim();
  const sem = props.semesters.find((s) => {
    const name = (s.semester || s.name || "").toLowerCase().trim();
    return (
      name === term ||
      name.split(/\s+/).sort().join(" ") === term.split(/\s+/).sort().join(" ") ||
      name.includes(term) ||
      term.includes(name)
    );
  });
  return sem?.id ?? null;
});

const currentCourseId = computed(() => {
  if (props.modelValue.courseId) return props.modelValue.courseId;
  const code = (props.modelValue.courseCode || "").trim().toLowerCase();
  const title = (props.modelValue.courseTitle || "").trim().toLowerCase();
  if (!code && !title) return null;
  const c = props.courses.find(
    (item) =>
      (code && (item.courseNumber || item.code || "").trim().toLowerCase() === code) ||
      (title && (item.courseName || item.title || "").trim().toLowerCase() === title)
  );
  return c?.id ?? null;
});

const currentSectionId = computed(() => {
  if (props.modelValue.sectionId) return props.modelValue.sectionId;
  const sched = (props.modelValue.schedule || "").trim();
  if (!sched) return null;
  const s = props.sections.find((item) => formatSchedule(item) === sched);
  return s?.id ?? null;
});

const semesterChoices = computed(() =>
  props.semesters.map((s) => ({
    id: s.id,
    title: s.semester || s.name || `Semester ${s.id}`,
  }))
);

const courseChoices = computed(() => {
  const activeSemId = props.modelValue.semesterId ?? currentSemesterId.value;
  const activeSemester = props.semesters.find((s) => s.id === activeSemId);

  let list = props.courses;
  if (activeSemester) {
    const term = getSemesterTerm(activeSemester);
    const semName = (activeSemester.semester || activeSemester.name || "").toLowerCase();
    list = props.courses.filter((c) => {
      if (!c.courseTerm) return true;
      const cTerm = c.courseTerm.toLowerCase();
      return (term && cTerm === term.toLowerCase()) || (semName && semName.includes(cTerm));
    });
  } else if (props.semesters.length > 0) {
    const allowedTerms = props.semesters.map((s) => getSemesterTerm(s).toLowerCase()).filter(Boolean);
    const allowedNames = props.semesters.map((s) => (s.semester || s.name || "").toLowerCase()).filter(Boolean);
    list = props.courses.filter((c) => {
      if (!c.courseTerm) return true;
      const cTerm = c.courseTerm.toLowerCase();
      return allowedTerms.includes(cTerm) || allowedNames.some((n) => n.includes(cTerm));
    });
  }

  return list.map((c) => {
    const code = c.courseNumber || c.code || "";
    const name = c.courseName || c.title || "";
    const cr = c.courseHours ?? c.credits ?? 3;
    return {
      id: c.id,
      courseNumber: code,
      courseName: name,
      title: code && name ? `${code} — ${name} (${cr} cr)` : (code || name),
    };
  });
});

const sectionChoices = computed(() => {
  const activeCourseId = props.modelValue.courseId ?? currentCourseId.value;
  const filtered = activeCourseId
    ? props.sections.filter((s) => s.courseId === activeCourseId)
    : props.sections;

  return filtered.map((s) => {
    const sched = formatSchedule(s);
    return {
      id: s.id,
      title: s.sectionNumber ? `Section ${s.sectionNumber}${sched ? ` · ${sched}` : ""}` : (sched || `Section ${s.id}`),
    };
  });
});

const studentChoices = computed(() =>
  props.students.map((s) => ({
    id: s.id,
    title: s.name || `${s.lName || s.lastName || ""}, ${s.fName || s.firstName || ""}`.trim(),
  }))
);

const updateSemester = (semesterId) => {
  const semester = props.semesters.find((item) => item.id === semesterId);
  const termName = semester?.semester || semester?.name || "";
  const term = getSemesterTerm(semester);

  const activeCourseId = props.modelValue.courseId ?? currentCourseId.value;
  const courseStillValid = props.courses.some(
    (course) =>
      course.id === activeCourseId &&
      (!course.courseTerm ||
        (course.courseTerm || "").toLowerCase() === term.toLowerCase() ||
        termName.toLowerCase().includes((course.courseTerm || "").toLowerCase()))
  );

  const matchedCourse = courseStillValid ? props.courses.find((c) => c.id === activeCourseId) : null;
  const activeSectionId = courseStillValid ? (props.modelValue.sectionId ?? currentSectionId.value) : null;
  const matchedSection = activeSectionId ? props.sections.find((s) => s.id === activeSectionId) : null;

  emit("update:modelValue", {
    ...props.modelValue,
    semesterId,
    term: termName || props.modelValue.term,
    courseId: courseStillValid ? activeCourseId : null,
    courseCode: matchedCourse ? (matchedCourse.courseNumber || matchedCourse.code || "") : "",
    courseTitle: matchedCourse ? (matchedCourse.courseName || matchedCourse.title || "") : "",
    credits: matchedCourse ? (matchedCourse.courseHours ?? matchedCourse.credits ?? 3) : props.modelValue.credits,
    sectionId: activeSectionId,
    schedule: matchedSection ? formatSchedule(matchedSection) : "",
  });
};

const updateCourse = (courseId) => {
  const course = props.courses.find((c) => c.id === courseId);
  if (!course) {
    emit("update:modelValue", {
      ...props.modelValue,
      courseId: null,
      courseCode: "",
      courseTitle: "",
      sectionId: null,
      schedule: "",
    });
    return;
  }

  let newSemesterId = props.modelValue.semesterId ?? currentSemesterId.value;
  let newTerm = props.modelValue.term;
  if (!newSemesterId && course.courseTerm) {
    const matched = props.semesters.find((s) =>
      (s.semester || s.name || "").toLowerCase().includes(course.courseTerm.toLowerCase())
    );
    if (matched) {
      newSemesterId = matched.id;
      newTerm = matched.semester || matched.name;
    }
  }

  const matchingSections = props.sections.filter((s) => s.courseId === courseId);
  const activeSectionId = props.modelValue.sectionId ?? currentSectionId.value;
  const sectionStillValid = matchingSections.some((s) => s.id === activeSectionId);
  const newSection = sectionStillValid
    ? props.sections.find((s) => s.id === activeSectionId)
    : (matchingSections.length === 1 ? matchingSections[0] : null);

  emit("update:modelValue", {
    ...props.modelValue,
    courseId,
    courseCode: course.courseNumber || course.code || "",
    courseTitle: course.courseName || course.title || "",
    credits: course.courseHours ?? course.credits ?? 3,
    semesterId: newSemesterId,
    term: newTerm,
    sectionId: newSection?.id ?? null,
    schedule: newSection ? formatSchedule(newSection) : (sectionStillValid ? props.modelValue.schedule : ""),
  });
};

const updateSection = (sectionId) => {
  const section = props.sections.find((s) => s.id === sectionId);
  if (!section) {
    emit("update:modelValue", { ...props.modelValue, sectionId: null });
    return;
  }

  const newCourseId = section.courseId ?? props.modelValue.courseId ?? currentCourseId.value;
  const course = props.courses.find((c) => c.id === newCourseId);

  let newSemesterId = props.modelValue.semesterId ?? currentSemesterId.value;
  let newTerm = props.modelValue.term;
  if (!newSemesterId && course?.courseTerm) {
    const matched = props.semesters.find((s) =>
      (s.semester || s.name || "").toLowerCase().includes(course.courseTerm.toLowerCase())
    );
    if (matched) {
      newSemesterId = matched.id;
      newTerm = matched.semester || matched.name;
    }
  }

  emit("update:modelValue", {
    ...props.modelValue,
    sectionId,
    courseId: newCourseId,
    schedule: formatSchedule(section),
    semesterId: newSemesterId,
    term: newTerm,
    ...(course
      ? {
          courseCode: course.courseNumber || course.code || "",
          courseTitle: course.courseName || course.title || "",
          credits: course.courseHours ?? course.credits ?? 3,
        }
      : {}),
  });
};

const semesterRules = [(v) => !!v || !!props.modelValue.term || "Required"];
const courseRules = [(v) => !!v || !!props.modelValue.courseCode || "Required"];
const sectionRules = [(v) => !!v || !!props.modelValue.schedule || "Required"];
const scheduleRules = [(v) => !!v?.toString().trim() || "Required"];
const selectRules = [(v) => (v !== null && v !== undefined && v !== "") || "Required"];

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
        :items="studentChoices"
        item-title="title"
        item-value="id"
        density="comfortable"
        :rules="selectRules"
        disabled
      />

      <!-- 1. Semester -->
      <v-select
        :model-value="modelValue.semesterId ?? currentSemesterId"
        label="Semester"
        :items="semesterChoices"
        item-title="title"
        item-value="id"
        density="comfortable"
        :rules="semesterRules"
        @update:model-value="updateSemester"
      />

      <!-- 2. Course -->
      <v-select
        :model-value="modelValue.courseId ?? currentCourseId"
        label="Course"
        :items="courseChoices"
        item-title="title"
        item-value="id"
        density="comfortable"
        :rules="courseRules"
        :disabled="!(modelValue.semesterId ?? currentSemesterId) && semesterChoices.length > 0"
        @update:model-value="updateCourse"
      />

      <!-- 3. Section -->
      <v-select
        :model-value="modelValue.sectionId ?? currentSectionId"
        label="Section"
        :items="sectionChoices"
        item-title="title"
        item-value="id"
        density="comfortable"
        :rules="sectionRules"
        :disabled="!(modelValue.courseId ?? currentCourseId) && courseChoices.length > 0"
        @update:model-value="updateSection"
      />

      <!-- 4. Schedule -->
      <v-text-field
        :model-value="modelValue.schedule"
        label="Schedule"
        density="comfortable"
        :rules="scheduleRules"
        readonly
        @update:model-value="updateField('schedule', $event)"
      />

      <!-- Room (Edit mode only) -->
      <v-text-field
        v-if="isEdit"
        :model-value="modelValue.room"
        label="Room"
        density="comfortable"
        @update:model-value="updateField('room', $event)"
      />

      <!-- Credits -->
      <v-combobox
        :model-value="modelValue.credits"
        label="Credits"
        :items="[1, 2, 3, 4, 5]"
        type="number"
        density="comfortable"
        @update:model-value="updateField('credits', $event)"
      />

      <!-- Grade -->
      <v-combobox
        :model-value="modelValue.grade"
        label="Grade"
        :items="['A', 'B', 'C', 'D', 'F', 'I', 'W']"
        density="comfortable"
        @update:model-value="updateField('grade', $event)"
      />
    </template>

    <!-- Mode: Enrolling a student into a section (Feature 8) -->
    <template v-else>
      <v-select
        :model-value="modelValue.sectionId"
        label="Section"
        :items="sectionChoices"
        item-title="title"
        item-value="id"
        density="comfortable"
        :rules="selectRules"
        disabled
      />
      <v-select
        :model-value="modelValue.studentId"
        label="Student"
        :items="studentChoices"
        item-title="title"
        item-value="id"
        density="comfortable"
        :rules="selectRules"
        @update:model-value="updateField('studentId', $event)"
      />
    </template>
  </v-form>
</template>
