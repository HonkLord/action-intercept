// settings.js

// Register module settings
export function registerSettings() {
  game.settings.register("action-intercept", "triggerConfigurations", {
    name: "Trigger Configurations",
    hint: "Stores the trigger configurations for each actor",
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });
}

// Get triggers for a specific actor
export function getConfiguredTriggers(actorId) {
  const allConfigs = game.settings.get(
    "action-intercept",
    "triggerConfigurations"
  );
  return allConfigs[actorId] || [];
}

// Save triggers for a specific actor
export function saveConfiguredTriggers(actorId, triggers) {
  const allConfigs = game.settings.get(
    "action-intercept",
    "triggerConfigurations"
  );
  allConfigs[actorId] = triggers;
  return game.settings.set(
    "action-intercept",
    "triggerConfigurations",
    allConfigs
  );
}

// Get a specific setting
export function getSetting(key) {
  const parts = key.split(".");
  if (parts[0] === "triggers") {
    return getConfiguredTriggers(parts[1]);
  }
  return game.settings.get("action-intercept", key);
}

// Set a specific setting
export function setSetting(key, value) {
  const parts = key.split(".");
  if (parts[0] === "triggers") {
    return saveConfiguredTriggers(parts[1], value);
  }
  return game.settings.set("action-intercept", key, value);
}
