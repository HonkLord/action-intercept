import { registerSettings } from "./settings.js";
import { registerHooks } from "./hooks.js";
import { initializeUI } from "./ui.js";

Hooks.once("init", async function () {
  console.log("Action Intercept | Initializing action-intercept");
  registerSettings();
  registerHooks();
});

Hooks.once("ready", async function () {
  console.log("Action Intercept | Ready");
  initializeUI(); // Make sure this line is present
});
