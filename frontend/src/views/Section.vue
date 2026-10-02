<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import sectionServices from "../services/sectionServices.js";
//import leagueServices from "../services/leagueServices.js";
import SectionForm from "../components/SectionForm.vue";
import Utils from "../config/utils.js";

const route = useRoute();

const emptySectionForm = () => ({
  name: "",
  leagueId: null,
  homeField: "",
  managerId: null,
});

const emptyPlayerForm = () => ({
  personId: null,
  position: "",
  number: "",
});

const section = ref(null);
const leagues = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const form = ref(emptySectionForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const playerDialogOpen = ref(false);
const isAddPlayerMode = ref(true);
const playerForm = ref(emptyPlayerForm());
const playerFormRef = ref(null);
const playerFormError = ref("");
const savingPlayer = ref(false);
const editingPlayerId = ref(null);
const removePlayerDialogOpen = ref(false);
const playerToRemove = ref(null);
const removingPlayer = ref(false);

const sectionId = computed(() => parseInt(route.params.sectionId, 10));
const playerFormTitle = computed(() =>
  isAddPlayerMode.value ? "Add Player" : "Edit Player",
);
const playerSaveLabel = computed(() =>
  isAddPlayerMode.value ? "Add" : "Save Player",
);
const rosterPlayers = computed(() => section.value?.players ?? []);
const isAdmin = computed(() => Utils.getStore("user")?.role === "admin");
const canManagePlayers = computed(
  () => isAdmin.value || Utils.getStore("user")?.role === "manager"
);

const playerName = (player) => {
  const lastName = player.person?.lastName ?? "";
  const firstName = player.person?.firstName ?? "";
  return `${lastName}, ${firstName}`.trim();
};

const retrieveSection = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const [sectionsResponse, leaguesResponse, peopleResponse] = await Promise.all([
      sectionServices.getSections(),
      //leagueServices.getLeagues(),
    ]);
    leagues.value = leaguesResponse.data;
    people.value = peopleResponse.data;
    section.value =
      sectionsResponse.data.find((row) => row.id === sectionId.value) ?? null;

    if (!section.value) {
      listError.value = `Section with id=${sectionId.value} not found.`;
    }
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch section.";
  } finally {
    loading.value = false;
  }
};

const openEditDialog = () => {
  if (!section.value) {
    return;
  }

  form.value = {
    name: section.value.name ?? "",
    leagueId: section.value.leagueId ?? null,
    homeField: section.value.homeField ?? "",
    managerId: section.value.managerId ?? null,
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
};

const saveSection = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid || !section.value) {
    return;
  }

  saving.value = true;

  try {
    await sectionServices.updateSection(section.value.id, {
      name: form.value.name.trim(),
      leagueId: form.value.leagueId,
      homeField: form.value.homeField.trim(),
      managerId: form.value.managerId || null,
      sectionId: section.value.id,
    });
    closeFormDialog();
    await retrieveSection();
  } catch (error) {
    formError.value =
      error.response?.data?.message || "Failed to update section.";
  } finally {
    saving.value = false;
  }
};

const openAddPlayerDialog = () => {
  isAddPlayerMode.value = true;
  editingPlayerId.value = null;
  playerForm.value = emptyPlayerForm();
  playerFormError.value = "";
  playerDialogOpen.value = true;
};

const openEditPlayerDialog = (player) => {
  isAddPlayerMode.value = false;
  editingPlayerId.value = player.id;
  playerForm.value = {
    personId: player.personId ?? null,
    position: player.position ?? "",
    number: player.number,
  };
  playerFormError.value = "";
  playerDialogOpen.value = true;
};

const closePlayerDialog = () => {
  playerDialogOpen.value = false;
  playerFormError.value = "";
  editingPlayerId.value = null;
};

const savePlayer = async () => {
  playerFormError.value = "";
  const result = await playerFormRef.value?.validate();

  if (!result?.valid || !section.value) {
    return;
  }

  savingPlayer.value = true;

  const payload = {
    personId: playerForm.value.personId,
    position: String(playerForm.value.position).trim(),
    number: parseInt(playerForm.value.number, 10),
  };

  try {
    if (isAddPlayerMode.value) {
      await sectionServices.createPlayer(section.value.id, payload);
    } else {
      await sectionServices.updatePlayer(
        section.value.id,
        editingPlayerId.value,
        payload,
      );
    }

    closePlayerDialog();
    await retrieveSection();
  } catch (error) {
    playerFormError.value =
      error.response?.data?.message ||
      (isAddPlayerMode.value
        ? "Failed to add player."
        : "Failed to update player.");
  } finally {
    savingPlayer.value = false;
  }
};

const openRemovePlayerDialog = (player) => {
  playerToRemove.value = player;
  removePlayerDialogOpen.value = true;
};

const closeRemovePlayerDialog = () => {
  removePlayerDialogOpen.value = false;
  playerToRemove.value = null;
};

const confirmRemovePlayer = async () => {
  if (!playerToRemove.value?.id || !section.value) {
    return;
  }

  removingPlayer.value = true;

  try {
    await sectionServices.deletePlayer(section.value.id, playerToRemove.value.id);
    closeRemovePlayerDialog();
    await retrieveSection();
  } catch (error) {
    playerFormError.value =
      error.response?.data?.message || "Failed to remove player.";
  } finally {
    removingPlayer.value = false;
  }
};

onMounted(retrieveSection);
watch(() => route.params.sectionId, retrieveSection);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>{{ section?.name || "Section" }}</v-card-title>
        <v-card-subtitle v-if="section">
          {{ section.league?.name }}
          <template v-if="section.league?.sport">
            · {{ section.league.sport }}
          </template>
          <template v-if="section.homeField">
            · {{ section.homeField }}
          </template>
          <template v-if="section.manager">
            · {{ section.manager.lastName }}, {{ section.manager.firstName }}
          </template>
        </v-card-subtitle>
        <template #append>
          <v-btn
            v-if="isAdmin"
            color="primary"
            variant="elevated"
            class="oc-cta mr-2"
            :disabled="!section"
            @click="openEditDialog"
          >
            Edit section
          </v-btn>
          <v-btn
            v-if="canManagePlayers"
            color="primary"
            variant="elevated"
            class="oc-cta"
            :disabled="!section"
            @click="openAddPlayerDialog"
          >
            Add Players
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <template v-if="!loading && section">
          <p v-if="rosterPlayers.length === 0" class="text-body-1">
            No players yet. Add the first player.
          </p>

          <v-table v-if="rosterPlayers.length > 0">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Number</th>
                <th class="text-left">Position</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in rosterPlayers" :key="player.id">
                <td>{{ playerName(player) }}</td>
                <td>{{ player.number }}</td>
                <td>{{ player.position }}</td>
                <td>
                  <v-icon
                    v-if="canManagePlayers"
                    size="small"
                    class="mx-4"
                    aria-label="Edit player"
                    @click="openEditPlayerDialog(player)"
                  >
                    mdi-pencil
                  </v-icon>
                  <v-icon
                    v-if="canManagePlayers"
                    size="small"
                    class="mx-4"
                    aria-label="Remove player"
                    @click="openRemovePlayerDialog(player)"
                  >
                    mdi-trash-can
                  </v-icon>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>Edit Section</v-card-title>
        <v-card-text>
          <SectionForm
            ref="formRef"
            v-model="form"
            :courses="courses"
            :faculty="faculty"
            @submit="saveSection"
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
            @click="saveSection"
          >
            Save Section
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="playerDialogOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>{{ playerFormTitle }}</v-card-title>
        <v-card-text>
          <PlayerForm
            ref="playerFormRef"
            v-model="playerForm"
            :people="people"
            @submit="savePlayer"
          />
          <v-alert
            v-if="playerFormError"
            type="error"
            density="compact"
            class="mt-2"
          >
            {{ playerFormError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closePlayerDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="savingPlayer"
            @click="savePlayer"
          >
            {{ playerSaveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="removePlayerDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Remove Player</v-card-title>
        <v-card-text>Remove this player from the section?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeRemovePlayerDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="removingPlayer"
            @click="confirmRemovePlayer"
          >
            Remove Player
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>