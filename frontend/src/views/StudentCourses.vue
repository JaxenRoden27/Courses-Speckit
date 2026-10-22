<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import studentServices from "../services/studentServices.js";
import courseServices from "../services/courseServices.js";
import CourseEnrollmentForm from "../components/CourseEnrollmentForm.vue";
import sectionServices from "../services/sectionServices.js";
import semesterServices from "../services/semesterServices.js";

const route = useRoute();

const emptyEnrollmentForm = (initialStudentId = null) => ({
  studentId: initialStudentId,
  semesterId: null,
  courseId: null,
  sectionId: null,
  term: "",
  schedule: "",
  room: "",
  courseCode: "",
  courseTitle: "",
  credits: "",
  grade: "",
});

const student = ref(null);
const courses = ref([]);
const students = ref([]);
const enrolledCourses = ref([]);
const sections = ref([]);
const semesters = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const isAddMode = ref(true);
const form = ref(emptyEnrollmentForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);

const formTitle = computed(() => (isAddMode.value ? "Enroll Course" : "Edit Enrollment"));
const saveLabel = computed(() => (isAddMode.value ? "Create" : "Save Enrollment"));

const studentId = computed(() => parseInt(route.params.studentId, 10));

const studentEnrolledCourses = computed(() => {
  return enrolledCourses.value
    .filter((c) => c.studentId === studentId.value)
    .sort((a, b) => {
      const termCompare = (a.term || "").localeCompare(b.term || "");
      if (termCompare !== 0) return termCompare;
      return (a.schedule || "").localeCompare(b.schedule || "");
    });
});

const retrieveStudentAndCourses = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const [studentsResponse, coursesResponse, enrolledResponse, sectionsResponse, semestersResponse] = await Promise.all([
      studentServices.getStudents().catch(() => ({ data: [] })),
      courseServices.getCourses().catch(() => ({ data: [] })),
      studentServices.getStudentCourses(studentId.value).catch(() => ({ data: [] })),
      sectionServices.getSections().catch(() => ({ data: [] })),
      semesterServices.getSemesters().catch(() => ({ data: [] })),
    ]);

    students.value = studentsResponse?.data || [];
    courses.value = coursesResponse?.data || [];
    enrolledCourses.value = enrolledResponse?.data || [];
    sections.value = sectionsResponse?.data || [];
    semesters.value = semestersResponse?.data || [];

    let foundStudent =
      students.value.find((row) => row.id === studentId.value) ?? null;

    if (!foundStudent && studentServices.getStudent) {
      try {
        const singleStudentRes = await studentServices.getStudent(studentId.value);
        if (singleStudentRes?.data) {
          foundStudent = singleStudentRes.data;
          students.value = [...students.value, foundStudent];
        }
      } catch (err) {
        // student not found
      }
    }

    student.value = foundStudent;

    if (!student.value) {
      listError.value = `Student with id=${studentId.value} not found.`;
    }
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch student.";
  } finally {
    loading.value = false;
  }
};

const normalizeTerm = (str) =>
  String(str || "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");

const semesterMatchesCourse = (semester, course) => {
  if (!semester || !course) return false;

  if (course.semesterId && Number(semester.id) === Number(course.semesterId)) {
    return true;
  }

  const semName = (semester.semester || semester.name || semester.semesterName || "").trim().toLowerCase();
  const courseTerm = (course.term || "").trim().toLowerCase();
  if (!semName || !courseTerm) return false;

  if (semName === courseTerm) return true;

  const normSem = normalizeTerm(semName);
  const normCourse = normalizeTerm(courseTerm);
  if (normSem && normCourse && normSem === normCourse) return true;

  const semWords = semName.split(/\s+/).filter(Boolean);
  const courseWords = courseTerm.split(/\s+/).filter(Boolean);
  if (semWords.length >= 2 && courseWords.length >= 2) {
    const allSemInCourse = semWords.every((w) => courseWords.includes(w));
    const allCourseInSem = courseWords.every((w) => semWords.includes(w));
    if (allSemInCourse || allCourseInSem) return true;
  }

  return false;
};

const enrolledSemesters = computed(() => {
  const enrolled = studentEnrolledCourses.value;
  if (!enrolled || enrolled.length === 0) {
    const studentOwned = semesters.value.filter((s) => Number(s.userId) === Number(studentId.value));
    return studentOwned.length > 0 ? studentOwned : semesters.value;
  }

  const matched = semesters.value.filter((s) =>
    enrolled.some((course) => semesterMatchesCourse(s, course))
  );

  if (matched.length > 0) {
    return matched;
  }

  const termsMap = new Map();
  enrolled.forEach((course) => {
    const term = course.term || (course.semesterId ? `Semester ${course.semesterId}` : "");
    if (term && !termsMap.has(term)) {
      termsMap.set(term, {
        id: course.semesterId || term,
        semester: term,
        name: term,
      });
    }
  });

  return termsMap.size > 0 ? Array.from(termsMap.values()) : semesters.value;
});

const openAddCourseDialog = () => {
  isAddMode.value = true;
  editingId.value = null;
  form.value = emptyEnrollmentForm(studentId.value);
  if (enrolledSemesters.value.length === 1) {
    const singleSem = enrolledSemesters.value[0];
    form.value.semesterId = singleSem.id;
    form.value.term = singleSem.semester || singleSem.name || "";
  }
  formError.value = "";
  formDialogOpen.value = true;
};

const openEditEnrollmentDialog = (course) => {
  isAddMode.value = false;
  editingId.value = course.id;

  const matchedCourse = courses.value.find(
    (c) => (c.courseNumber || c.code) === (course.courseCode || course.code)
  );
  const matchedSemester = semesters.value.find(
    (s) =>
      (course.semesterId && Number(s.id) === Number(course.semesterId)) ||
      semesterMatchesCourse(s, course)
  );
  const matchedSection = sections.value.find(
    (s) =>
      s.id === course.sectionId ||
      (matchedCourse && s.courseId === matchedCourse.id)
  );

  form.value = {
    studentId: course.studentId ?? studentId.value,
    semesterId: course.semesterId ?? matchedSemester?.id ?? null,
    courseId: matchedCourse?.id ?? null,
    sectionId: course.sectionId ?? matchedSection?.id ?? null,
    term: course.term ?? matchedSemester?.semester ?? matchedSemester?.name ?? "",
    schedule: course.schedule ?? "",
    room: course.room ?? "",
    courseCode: course.courseCode ?? course.code ?? "",
    courseTitle: course.courseTitle ?? course.title ?? "",
    credits: course.credits ?? "",
    grade: course.grade ?? "",
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
};

const saveEnrollment = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid || !student.value) {
    return;
  }

  saving.value = true;

  const payload = {
    studentId: studentId.value,
    ...(form.value.semesterId ? { semesterId: form.value.semesterId } : {}),
    ...(form.value.sectionId ? { sectionId: form.value.sectionId } : {}),
    term: form.value.term?.trim(),
    schedule: form.value.schedule?.trim(),
    courseCode: form.value.courseCode?.trim(),
    courseTitle: form.value.courseTitle?.trim(),
    credits: form.value.credits !== "" && form.value.credits !== null ? Number(form.value.credits) : null,
    grade: form.value.grade?.trim() || null,
  };

  if (!isAddMode.value) {
    payload.room = form.value.room?.trim() || null;
  }

  try {
    if (isAddMode.value) {
      await studentServices.enrollCourse(studentId.value, payload);
    } else {
      await studentServices.updateEnrollment(editingId.value, payload);
    }

    closeFormDialog();
    await retrieveStudentAndCourses();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value
        ? "Failed to enroll course."
        : "Failed to update enrollment.");
  } finally {
    saving.value = false;
  }
};

onMounted(retrieveStudentAndCourses);
watch(() => route.params.studentId, retrieveStudentAndCourses);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>{{ student?.name || `${student?.fName || ''} ${student?.lName || ''}`.trim() || "Student" }}</v-card-title>
        <v-card-subtitle v-if="student">
          <span>{{ student.program?.name || student.program || "General Studies" }}</span>
          <template v-if="student.admissionDate">
            · Admitted: {{ student.admissionDate }}
          </template>
          <template v-if="student.expectedGraduation">
            · Expected Graduation: {{ student.expectedGraduation }}
          </template>
        </v-card-subtitle>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :disabled="!student"
            @click="openAddCourseDialog"
          >
            Enroll Course
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <template v-if="!loading && student">
          <p v-if="studentEnrolledCourses.length === 0" class="text-body-1">
            No courses enrolled yet. Enroll your first course.
          </p>

          <v-table v-if="studentEnrolledCourses.length > 0">
            <thead>
              <tr>
                <th class="text-left">Term</th>
                <th class="text-left">Schedule</th>
                <th class="text-left">Room</th>
                <th class="text-left">Course Code</th>
                <th class="text-left">Course Title</th>
                <th class="text-left">Credits</th>
                <th class="text-left">Grade</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="course in studentEnrolledCourses" :key="course.id">
                <td>{{ course.term }}</td>
                <td>{{ course.schedule }}</td>
                <td>{{ course.room || "" }}</td>
                <td>{{ course.courseCode || course.code }}</td>
                <td>{{ course.courseTitle || course.title }}</td>
                <td>{{ course.credits }}</td>
                <td>{{ course.grade }}</td>
                <td>
                  <v-icon
                    size="small"
                    class="mx-4"
                    aria-label="Edit Enrollment"
                    @click="openEditEnrollmentDialog(course)"
                  >
                    mdi-pencil
                  </v-icon>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="560">
      <v-card rounded="lg">
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <CourseEnrollmentForm
            ref="formRef"
            v-model="form"
            :students="students"
            :courses="courses"
            :sections="sections"
            :semesters="enrolledSemesters"
            mode="course"
            :is-edit="!isAddMode"
            @submit="saveEnrollment"
          />
          <v-alert v-if="formError" type="error" density="compact" class="mt-2">
            {{ formError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeFormDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="saveEnrollment"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
