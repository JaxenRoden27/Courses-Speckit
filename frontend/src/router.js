import { createRouter, createWebHistory } from "vue-router";
import Utils from "./config/utils.js";
import Login from "./views/Login.vue";
import Home from "./views/Home.vue";
import Register from "./views/Register.vue";
import Semesters from "./views/Semesters.vue";
import SemesterDetail from "./views/SemesterDetail.vue";
import Enrollments from "./views/Enrollments.vue";

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
      path: "/enrollments",
      name: "enrollments",
      component: Enrollments,
    },
    {
      path: "/",
      name: "home",
      component: Home,
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

  next();
});

export default router;
