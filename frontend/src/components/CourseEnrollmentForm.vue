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
const selectRule = [(value) => (value !== null && value !== undefined && value !== "") || "Required"];

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

const getSemesterTerm = (semester) => {
  const name = semester?.semester || semester?.name || semester?.semesterName || "";
  if (!name) return "";
  const parts = name.split(" ");
  return parts.find((p) => ["Fall", "Spring", "Summer", "Winter"].includes(p)) || parts[0];
};

const formatSectionSchedule = (section) => {
  if (!section) return "";
  if (section.schedule) return section.schedule;
  const days = section.daysOfWeek || "";
  const start = section.startTime || "";
  const end = section.endTime || "";
  if (days && start && end) {
    return `${days} ${start} - ${end}`;
  }
  if (days && start) {
    return `${days} ${start}`;
  }
  return days || start || "";
};

const semesterChoices = computed(() => {
  return props.semesters.map((s) => ({
    id: s.id,
    name: s.semester || s.name || s.semesterName || `Semester ${s.id}`,
    title: s.semester || s.name || s.semesterName || `Semester ${s.id}`,
  }));
});

const currentSemesterId = computed(() => {
  if (props.modelValue.semesterId) return props.modelValue.semesterId;
  if (!props.modelValue.term) return null;
  const sem = props.semesters.find(
    (item) =>
      (item.semester && item.semester.toLowerCase() === props.modelValue.term.toLowerCase()) ||
      (item.name && item.name.toLowerCase() === props.modelValue.term.toLowerCase())
  );
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
  const cId = currentCourseId.value;
  if (!sched && !cId) return null;
  const s = props.sections.find((item) => {
    if (cId && item.courseId !== cId) return false;
    return sched && formatSectionSchedule(item) === sched;
  });
  return s?.id ?? null;
});

const courseChoices = computed(() => {
  const activeSemId = props.modelValue.semesterId ?? currentSemesterId.value;
  const activeSemester = props.semesters.find((s) => s.id === activeSemId);

  if (!activeSemester) {
    return props.courses.map((c) => {
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
  }

  const term = getSemesterTerm(activeSemester);
  const semName = (activeSemester.semester || activeSemester.name || "").toLowerCase();

  const filtered = props.courses.filter((course) => {
    const cTerm = (course.courseTerm || "").toLowerCase();
    return (
      (term && cTerm === term.toLowerCase()) ||
      (semName && cTerm && semName.includes(cTerm))
    );
  });

  const list = filtered.length > 0 ? filtered : props.courses;
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
    ? props.sections.filter((section) => section.courseId === activeCourseId)
    : props.sections;

  return filtered.map((s) => {
    const sched = formatSectionSchedule(s);
    return {
      id: s.id,
      title: s.sectionNumber
        ? `Section ${s.sectionNumber}${sched ? ` · ${sched}` : ""}`
        : (sched || `Section ${s.id}`),
      sectionNumber: s.sectionNumber,
      schedule: sched,
    };
  });
});

const updateSemester = (semesterId) => {
  const semester = props.semesters.find((item) => item.id === semesterId);
  const termName = semester?.semester || semester?.name || "";
  const term = getSemesterTerm(semester);

  const activeCourseId = props.modelValue.courseId ?? currentCourseId.value;
  const courseStillValid = props.courses.some(
    (course) =>
      course.id === activeCourseId &&
      ((course.courseTerm || "").toLowerCase() === term.toLowerCase() ||
        termName.toLowerCase().includes((course.courseTerm || "").toLowerCase()))
  );

  const matchedCourse = courseStillValid ? props.courses.find((c) => c.id === activeCourseId) : null;
  const activeSectionId = courseStillValid ? (props.modelValue.sectionId ?? currentSectionId.value) : null;

  emit("update:modelValue", {
    ...props.modelValue,
    semesterId,
    term: termName || props.modelValue.term,
    courseId: courseStillValid ? activeCourseId : null,
    courseCode: matchedCourse ? (matchedCourse.courseNumber || matchedCourse.code) : (courseStillValid ? props.modelValue.courseCode : ""),
    courseTitle: matchedCourse ? (matchedCourse.courseName || matchedCourse.title) : (courseStillValid ? props.modelValue.courseTitle : ""),
    credits: matchedCourse ? (matchedCourse.courseHours ?? matchedCourse.credits ?? 3) : (courseStillValid ? props.modelValue.credits : ""),
    sectionId: activeSectionId,
    schedule: courseStillValid ? props.modelValue.schedule : "",
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

  const newSchedule = newSection ? formatSectionSchedule(newSection) : "";

  emit("update:modelValue", {
    ...props.modelValue,
    courseId,
    courseCode: course.courseNumber || course.code || "",
    courseTitle: course.courseName || course.title || "",
    credits: course.courseHours ?? course.credits ?? 3,
    semesterId: newSemesterId,
    term: newTerm,
    sectionId: newSection?.id ?? null,
    schedule: newSchedule || (sectionStillValid ? props.modelValue.schedule : ""),
  });
};

const updateSection = (sectionId) => {
  const section = props.sections.find((s) => s.id === sectionId);
  if (!section) {
    emit("update:modelValue", {
      ...props.modelValue,
      sectionId: null,
    });
    return;
  }

  const newSchedule = formatSectionSchedule(section);
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
    schedule: newSchedule,
    courseId: newCourseId,
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

const semesterRule = [(value) => !!value || !!props.modelValue.term || "Required"];
const courseRule = [(value) => !!value || !!props.modelValue.courseCode || "Required"];
const sectionRule = [(value) => !!value || !!props.modelValue.schedule || "Required"];
const scheduleRule = [(value) => !!value?.toString().trim() || "Required"];

const gradeOptions = ["A", "B", "C", "D", "F", "I", "W"];
const creditOptions = [1, 2, 3, 4, 5];

const validate = () => formRef.value?.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <!-- Mode: Enrolling a course for a student (Feature 7) -->
    <template v-if="mode === 'course'">
      <!-- Student (read-only) -->
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

      <!-- 1. Semester (First selection) -->
      <v-select
        :model-value="modelValue.semesterId ?? currentSemesterId"
        label="Semester"
        :items="semesterChoices"
        item-title="title"
        item-value="id"
        density="comfortable"
        :rules="semesterRule"
        @update:model-value="updateSemester"
      />

      <!-- 2. Course (Filtered by selected semester) -->
      <v-select
        :model-value="modelValue.courseId ?? currentCourseId"
        label="Course"
        :items="courseChoices"
        item-title="title"
        item-value="id"
        density="comfortable"
        :rules="courseRule"
        :disabled="!(modelValue.semesterId ?? currentSemesterId) && semesterChoices.length > 0"
        @update:model-value="updateCourse"
      />

      <!-- 3. Section (Filtered by selected course) -->
      <v-select
        :model-value="modelValue.sectionId ?? currentSectionId"
        label="Section"
        :items="sectionChoices"
        item-title="title"
        item-value="id"
        density="comfortable"
        :rules="sectionRule"
        :disabled="!(modelValue.courseId ?? currentCourseId) && courseChoices.length > 0"
        @update:model-value="updateSection"
      />

      <!-- 4. Schedule (Tied to the selected section/course) -->
      <v-text-field
        :model-value="modelValue.schedule"
        label="Schedule"
        density="comfortable"
        :rules="scheduleRule"
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

      <!-- Credits (Autofilled from course) -->
      <v-combobox
        :model-value="modelValue.credits"
        label="Credits"
        :items="creditOptions"
        type="number"
        density="comfortable"
        @update:model-value="updateField('credits', $event)"
      />

      <!-- Grade (Optional) -->
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
