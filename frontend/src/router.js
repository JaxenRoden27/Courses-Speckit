import { createRouter, createWebHistory } from "vue-router";
import Utils from "./config/utils.js";
import Login from "./views/Login.vue";
import Home from "./views/Home.vue";
import Register from "./views/Register.vue";
import Semesters from "./views/Semesters.vue";
import SemesterDetail from "./views/SemesterDetail.vue";
import Enrollments from "./views/Enrollments.vue";
import Sections from "./views/Sections.vue";
import Section from "./views/Section.vue";
import Faculty from "./views/Faculty.vue";
import Courses from "./views/Courses.vue";
import StudentCourses from "./views/StudentCourses.vue";
import StudentList from "./views/StudentList.vue";
import SectionStudents from "./views/SectionStudents.vue";

const publicRouteNames = new Set(["login", "register"]);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), 
  routes: [
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/register",
      name: "register",
      component: Register,
    },
    {
      path: "/semesters",
      name: "semesters",
      component: Semesters,
    },
    {
      path: "/semesters/:semesterId",
      name: "semester",
      component: SemesterDetail,
      props: true,
    },
    {
      path: "/sections",
      name: "sections",
      component: Sections,
    },
    {
      path: "/sections/:sectionId",
      name: "section",
      component: Section,
      props: true,
    },
    {
      path: "/faculty",
      name: "faculty",
      component: Faculty,
    },
    {
      path: "/course",
      name: "course",
      component: Courses,
    },
    {
      path: "/courses",
      name: "courses",
      component: Courses,
    },
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/enrollments",
      name: "enrollments",
      component: Enrollments,
    },
    {
      path: "/students",
      name: "students",
      component: StudentList,
    },
    {
      path: "/students/:studentId/courses",
      name: "student",
      component: StudentCourses,
      props: true,
      meta: { requiresAdmin: true },
    },
    {
      path: "/sections/:sectionId/students",
      name: "sectionStudents",
      component: SectionStudents,
      props: true,
      meta: { requiresAdmin: true },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "home" },
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const user = Utils.getStore("user");
  const isPublicRoute = publicRouteNames.has(to.name);

  if (!user && !isPublicRoute) {
    next({ name: "login" });
    return;
  }

  if (user && isPublicRoute) {
    next({ name: "home" });
    return;
  }

  if (
    user &&
    ["faculty", "sections", "section", "sectionStudents", "students", "student"].includes(to.name) &&
    user.role?.toLowerCase?.().trim() !== "faculty"
  ) {
    next({ name: "home" });
    return;
  }

  next();
});

export default router;
