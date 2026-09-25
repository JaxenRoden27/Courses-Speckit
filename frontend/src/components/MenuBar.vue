<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";
import authServices from "../services/authServices.js";
import userServices from "../services/userServices.js";

const user = ref(Utils.getStore("user"));
const profileMenuOpen = ref(false);
const editDialogOpen = ref(false);
const editForm = ref(null);
const loggingOut = ref(false);
const savingProfile = ref(false);
const profileError = ref("");

const fName = ref("");
const lName = ref("");
const email = ref("");
const universityId = ref("");
const password = ref("");
const confirmPassword = ref("");
const role = ref("student");
const fNameRules = [(value) => !!value?.trim() || "First name is required."];
const lNameRules = [(value) => !!value?.trim() || "Last name is required."];
const universityIdRules = [(value) => !!value?.trim() || "University ID is required."];
const passwordRules = [
  (value) =>
    !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) =>
    !password.value || value === password.value || "Passwords do not match.",
];

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  const parts = [user.value.fName, user.value.lName].filter(Boolean);
  return parts.length ? parts.join(" ") : (user.value.universityId ?? "");
});

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
  window.addEventListener("user-logged-out", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
  window.removeEventListener("user-logged-out", refreshUser);
});

const resetPasswordFields = () => {
  password.value = "";
  confirmPassword.value = "";
};

const populateEditForm = (profile) => {
  fName.value = profile.fName ?? "";
  lName.value = profile.lName ?? "";
  email.value = profile.email ?? "";
  universityId.value = profile.universityId ?? "";
  role.value = profile.role ?? "student";
  resetPasswordFields();
};

const openEditDialog = async () => {
  profileMenuOpen.value = false;
  profileError.value = "";

  if (!user.value?.userId) {
    return;
  }

  try {
    const response = await userServices.getUser(user.value.userId);
    populateEditForm(response.data);
    editDialogOpen.value = true;
  } catch (error) {
    populateEditForm(user.value);
    profileError.value =
      error.response?.data?.message || "Failed to load profile.";
    editDialogOpen.value = true;
  }
};

const closeEditDialog = () => {
  editDialogOpen.value = false;
  profileError.value = "";
  resetPasswordFields();
};

const handleSaveProfile = async () => {
  profileError.value = "";
  const { valid } = await editForm.value.validate();

  if (!valid || !user.value?.userId) {
    return;
  }

  savingProfile.value = true;

  try {
    const payload = {
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      universityId: universityId.value.trim(),
      role: role.value.trim(),
    };

    if (password.value) {
      payload.password = password.value;
    }

    const response = await userServices.updateUser(user.value.userId, payload);
    const currentUser = Utils.getStore("user");

    Utils.setStore("user", {
      ...currentUser,
      ...response.data,
      userId: response.data.id,
      fName: response.data.fName,
      lName: response.data.lName,
      email: response.data.email,
      universityId: response.data.universityId,
      role: response.data.role,
      token: currentUser.token,
    });
    refreshUser();
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    closeEditDialog();
  } catch (error) {
    profileError.value =
      error.response?.data?.message || "Failed to update profile.";
  } finally {
    savingProfile.value = false;
  }
};

const handleLogout = async () => {
  profileMenuOpen.value = false;
  loggingOut.value = true;

  try {
    await authServices.logoutUser();
  } finally {
    loggingOut.value = false;
  }
};
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Courses Management System</v-app-bar-title>

    <v-btn
      v-if="user?.role === 'student'"
      variant="text"
      color="white"
      to="/semesters"
    >
      Semesters
    </v-btn>
    <v-btn
      v-if="user?.role === 'student'"
      variant="text"
      color="white"
      to="/courses"
    >
      Courses
    </v-btn>
    <v-btn
      v-if="user?.role === 'faculty'"
      variant="text"
      color="white"
      to="/sections"
    >
      Sections
    </v-btn>
    <v-btn
      v-if="user?.role === 'faculty'"
      variant="text"
      color="white"
      to="/enrollments"
    >
      Enrollments
    </v-btn>
    <v-btn
      v-if="user?.role === 'faculty'"
      variant="text"
      color="white"
      to="/studentCourses"
    >
      Student Courses
    </v-btn>
    <v-btn
      v-if="user?.role === 'faculty'"
      variant="text"
      color="white"
      to="/sectionCourses"
    >
      Section Student Courses
    </v-btn>

    <v-spacer />

    <v-menu
      v-if="user"
      v-model="profileMenuOpen"
      :close-on-content-click="false"
    >
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          icon="mdi-account-circle"
          variant="text"
          color="white"
          aria-label="Open profile menu"
        />
      </template>

      <v-card min-width="300">
        <v-list density="comfortable">
          <v-list-item :title="displayName">
            <template #subtitle>
              <div>{{ user.universityId }}</div>
              <div>{{ user.email }}</div>
            </template>
          </v-list-item>
        </v-list>

        <v-divider />

        <v-card-actions class="px-4 py-2">
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            block
            @click="openEditDialog"
          >
            Edit Profile
          </v-btn>
        </v-card-actions>

        <v-divider />

        <v-list density="compact">
          <v-list-item
            title="Sign out"
            prepend-icon="mdi-logout"
            :disabled="loggingOut"
            @click="handleLogout"
          />
        </v-list>
      </v-card>
    </v-menu>

    <v-dialog v-model="editDialogOpen" max-width="560">
      <v-card>
        <v-card-title>Edit Profile</v-card-title>
        <v-card-text>
          <v-form ref="editForm" @submit.prevent="handleSaveProfile">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="fName"
                  label="First name"
                  density="comfortable"
                  autocomplete="given-name"
                  :rules="fNameRules"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="lName"
                  label="Last name"
                  density="comfortable"
                  autocomplete="family-name"
                  :rules="lNameRules"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="email"
                  label="Email"
                  type="email"
                  density="comfortable"
                  autocomplete="email"
                  :rules="emailRules"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="universityId"
                  label="University ID"
                  density="comfortable"
                  autocomplete="universityId"
                  :rules="universityIdRules"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="password"
                  label="New password"
                  type="password"
                  density="comfortable"
                  autocomplete="new-password"
                  :rules="passwordRules"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="confirmPassword"
                  label="Confirm password"
                  type="password"
                  density="comfortable"
                  autocomplete="new-password"
                  :rules="confirmPasswordRules"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="role"
                  label="Role"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <v-alert
              v-if="profileError"
              type="error"
              density="compact"
              class="mt-2"
            >
              {{ profileError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeEditDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="savingProfile"
            @click="handleSaveProfile"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app-bar>
</template>
