<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";
const router = useRouter();
const form = ref(null);
const universityId = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

const universityIdRules = [(value) => !!value?.trim() || "University ID is required."];
const passwordRules = [(value) => !!value || "Password is required."];

const handleSubmit = async () => {
  errorMessage.value = "";
  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  loading.value = true;

  try {
    const response = await authServices.loginUser({
      universityId: universityId.value.trim(), 
      password: password.value,
    });

    Utils.setStore("user", response.data);
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    await router.push({ name: "home" });
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Login failed.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card elevation="2">
          <v-card-title class="text-h5">Sign in</v-card-title>

          <v-card-text>
            <v-form ref="form" @submit.prevent="handleSubmit">  
              <v-text-field
                v-model="universityId"
                label="University ID"
                density="comfortable"
                autocomplete="universityId"
                :rules="universityIdRules"
                class="mb-2"
              />

              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                density="comfortable"
                autocomplete="current-password"
                :rules="passwordRules"
                class="mb-2"
              />

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
                Sign in
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-btn variant="text" :to="{ name: 'register' }">
              Create an account
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
