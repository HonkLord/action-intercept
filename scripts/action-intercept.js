action - intercept.js;

import { registerSettings } from "./settings.js";
import { registerHooks } from "./hooks.js";
import { initializeUI } from "./ui.js";
import { initializeMacroHandling } from "./macros.js";

Hooks.once("init", async function () {
  console.log("Action Intercept | Initializing action-intercept");
  registerSettings();
  registerHooks();
  initializeUI();
  initializeMacroHandling();
});

Hooks.once("ready", async function () {
  console.log("Action Intercept | Ready");
});
