// Register module settings
export function registerSettings() {
  console.log("Action Intercept | Registering settings...");

  // Register the trigger configurations
  game.settings.register("action-intercept", "triggerConfigurations", {
    name: "Trigger Configurations",
    hint: "Stores the trigger configurations for each actor",
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });

  // Register the item configurations
  game.settings.register("action-intercept", "itemConfigurations", {
    name: "Item Configurations",
    hint: "Stores the item configurations for action intercept",
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });

  // Register global configurations
  game.settings.register("action-intercept", "globalConfigurations", {
    name: "Global Configurations",
    hint: "Stores global action intercept configurations for all actors",
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });
}

// Get triggers for a specific actor
export function getConfiguredTriggers(actorId) {
  console.log(`Action Intercept | Retrieving triggers for actor: ${actorId}`);
  const allConfigs = game.settings.get(
    "action-intercept",
    "triggerConfigurations"
  );
  return allConfigs[actorId] || [];
}

// Save triggers for a specific actor
export function saveConfiguredTriggers(actorId, triggers) {
  console.log(
    `Action Intercept | Saving triggers for actor: ${actorId}`,
    triggers
  );
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
  console.log(`Action Intercept | Getting setting for key: ${key}`);
  const parts = key.split(".");
  if (parts[0] === "triggers") {
    return getConfiguredTriggers(parts[1]);
  }
  return game.settings.get("action-intercept", key);
}

// Set a specific setting
export function setSetting(key, value) {
  console.log(`Action Intercept | Setting value for key: ${key}`, value);
  const parts = key.split(".");
  if (parts[0] === "triggers") {
    return saveConfiguredTriggers(parts[1], value);
  }
  return game.settings.set("action-intercept", key, value);
}
