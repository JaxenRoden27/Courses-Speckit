import apiClient from "./services.js";

const gameServices = {
  getGames() {
    return apiClient.get("games");
  },

  createGame(game) {
    return apiClient.post("games", game);
  },

  updateGame(gameId, game) {
    return apiClient.put(`games/${gameId}`, game);
  },

  deleteGame(gameId) {
    return apiClient.delete(`games/${gameId}`);
  },
};

export default gameServices;