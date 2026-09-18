import { describe, it, expect } from "vitest";
import App from "../src/App.vue";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

describe("App.vue", () => {
  it("mounts the Vuetify application shell", async () => {
    const { wrapper } = await mountWithPlugins(App, {
      router: await createTestRouter("/"),
      global: {
        stubs: {
          "router-view": true,
        },
      },
    });

    expect(wrapper.find(".v-application").exists()).toBe(true);
  });
});
