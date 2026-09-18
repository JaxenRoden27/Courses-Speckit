import { load } from "webfontloader";

/** OC Academic Edition — Inter (see ui-style-system.mdc) */
export async function loadFonts() {
  load({
    google: { families: ["Inter:400,700&display=swap"] },
  });
}
