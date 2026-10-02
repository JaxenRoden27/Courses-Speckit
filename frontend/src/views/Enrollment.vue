<script setup>
import { computed, onMounted, ref } from "vue";
import gameServices from "../services/gameServices.js";
import seasonServices from "../services/seasonServices.js";
import teamServices from "../services/teamServices.js";
import GameForm from "../components/GameForm.vue";
import { toDateInputValue, formatDate } from "../config/validation.js";

const emptyForm = () => ({
  seasonId: null,
  gameDate: "",
  startTime: "",
  location: "",
  homeTeamId: null,
  visitingTeamId: null,
  homeTeamScore: "",
  visitingTeamScore: "",
});

const games = ref([]);
const seasons = ref([]);
const teams = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const isAddMode = ref(true);
const form = ref(emptyForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);
const deleteDialogOpen = ref(false);
const gameToDelete = ref(null);
const deleting = ref(false);

const formTitle = computed(() => (isAddMode.value ? "Add Game" : "Edit Game"));
const saveLabel = computed(() => (isAddMode.value ? "Create" : "Save Game"));

const toTimeInputValue = (value) => {
  if (!value) {
    return "";
  }

  const match = String(value).match(/(\d{2}:\d{2})/);
  return match ? match[1] : String(value);
};

const formatScore = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return value;
};

const optionalScore = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

const retrieveGames = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const [gamesResponse, seasonsResponse, teamsResponse] = await Promise.all([
      gameServices.getGames(),
      seasonServices.getSeasons(),
      teamServices.getTeams(),
    ]);
    games.value = gamesResponse.data;
    seasons.value = seasonsResponse.data;
    teams.value = teamsResponse.data;
  } catch (error) {
    listError.value = error.response?.data?.message || "Failed to fetch games.";
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  isAddMode.value = true;
  editingId.value = null;
  form.value = emptyForm();
  formError.value = "";
  formDialogOpen.value = true;
};

const openEditDialog = (game) => {
  isAddMode.value = false;
  editingId.value = game.id;
  form.value = {
    seasonId: game.seasonId ?? null,
    gameDate: toDateInputValue(game.gameDate),
    startTime: toTimeInputValue(game.startTime),
    location: game.location ?? "",
    homeTeamId: game.homeTeamId ?? null,
    visitingTeamId: game.visitingTeamId ?? null,
    homeTeamScore: game.homeTeamScore ?? "",
    visitingTeamScore: game.visitingTeamScore ?? "",
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
};

const saveGame = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid) {
    return;
  }

  saving.value = true;

  const payload = {
    seasonId: form.value.seasonId,
    gameDate: form.value.gameDate,
    startTime: form.value.startTime,
    location: isAddMode.value ? null : form.value.location.trim() || null,
    homeTeamId: form.value.homeTeamId,
    visitingTeamId: form.value.visitingTeamId,
    homeTeamScore: optionalScore(form.value.homeTeamScore),
    visitingTeamScore: optionalScore(form.value.visitingTeamScore),
  };

  try {
    if (isAddMode.value) {
      await gameServices.createGame(payload);
    } else {
      await gameServices.updateGame(editingId.value, {
        ...payload,
        gameId: editingId.value,
      });
    }

    closeFormDialog();
    await retrieveGames();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value ? "Failed to create game." : "Failed to update game.");
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (game) => {
  gameToDelete.value = game;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  gameToDelete.value = null;
};

const confirmDeleteGame = async () => {
  if (!gameToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  listError.value = "";

  try {
    await gameServices.deleteGame(gameToDelete.value.id);
    closeDeleteDialog();
    await retrieveGames();
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to delete game.";
  } finally {
    deleting.value = false;
  }
};

onMounted(retrieveGames);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Games</v-card-title>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New game
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <p v-if="!loading && games.length === 0" class="text-body-1">
          No games yet. Create your first game.
        </p>

        <v-table v-if="!loading && games.length > 0">
          <thead>
            <tr>
              <th class="text-left">Date</th>
              <th class="text-left">Start time</th>
              <th class="text-left">Location</th>
              <th class="text-left">Home team</th>
              <th class="text-left">Visiting team</th>
              <th class="text-left">Home score</th>
              <th class="text-left">Visiting score</th>
              <th class="text-left">Season</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="game in games" :key="game.id">
              <td>{{ formatDate(game.gameDate) }}</td>
              <td>{{ toTimeInputValue(game.startTime) }}</td>
              <td>{{ game.location }}</td>
              <td>{{ game.homeTeam?.name }}</td>
              <td>{{ game.visitingTeam?.name }}</td>
              <td>{{ formatScore(game.homeTeamScore) }}</td>
              <td>{{ formatScore(game.visitingTeamScore) }}</td>
              <td>{{ game.season?.name }}</td>
              <td>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Edit game"
                  @click="openEditDialog(game)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Delete game"
                  @click="openDeleteDialog(game)"
                >
                  mdi-trash-can
                </v-icon>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="560">
      <v-card rounded="lg">
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <GameForm
            ref="formRef"
            v-model="form"
            :seasons="seasons"
            :teams="teams"
            :show-location="!isAddMode"
            @submit="saveGame"
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
            @click="saveGame"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete Game</v-card-title>
        <v-card-text>Delete this game?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleting"
            @click="confirmDeleteGame"
          >
            Delete Game
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>