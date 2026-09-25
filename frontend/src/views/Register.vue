<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const form = ref(null);
const fName = ref("");
const lName = ref("");
const email = ref("");
const universityId = ref(""); 
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const errorMessage = ref("");

const fNameRules = [(value) => !!value?.trim() || "First name is required."];
const lNameRules = [(value) => !!value?.trim() || "Last name is required."];
const universityIdRules = [(value) => !!value?.trim() || "University ID is required."];  
const passwordRules = [
  (value) => !!value || "Password is required.",
  (value) => value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => !!value || "Password is required.",
  (value) => value === password.value || "Passwords do not match.",
];

const handleSubmit = async () => {
  errorMessage.value = "";
  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  loading.value = true;

  try {
    const response = await authServices.registerUser({
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      universityId: universityId.value.trim(), 
      password: password.value,
    });

    Utils.setStore("user", response.data);
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    await router.push({ name: "home" });
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Registration failed.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="10" md="7" lg="5">
        <v-card elevation="2">
          <v-card-title class="text-h5">Create account</v-card-title>

          <v-card-text>
            <v-form ref="form" @submit.prevent="handleSubmit">
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
                    label="Password"
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
              </v-row>

              <v-alert
                v-if="errorMessage"
                type="error"
                density="compact"
                class="mb-4"
              >
                {{ errorMessage }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                block
                :loading="loading"
              >
                Create account
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-btn variant="text" :to="{ name: 'login' }">
              Already have an account? Sign in
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
