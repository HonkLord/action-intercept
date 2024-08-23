import { registerSettings } from "./settings.js";
import { addActionInterceptIndicators } from "./ui.js"; // Correct import
import { openGlobalConfigForActor } from "./global-config.js";

Hooks.once("init", () => {
  console.log("Action Intercept | Initializing and registering settings");
  registerSettings();
});

Hooks.once("ready", () => {
  console.log("Action Intercept | Ready hook triggered");

  Hooks.on("tidy5e-sheet.ready", (api) => {
    console.log("Tidy5eSheet API is ready:", api);

    Hooks.on("tidy5e-sheet.renderActorSheet", (sheet, element, data) => {
      console.log("Action Intercept | Tidy5eSheet Render Hook Fired");
      addActionInterceptIndicators(api, data.actor, element); // Call the function from ui.js
    });
  });
  // Add the Global Config button to actor sheets
  Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
    if (app.actor.isOwner) {
      buttons.unshift({
        label: "Intercept Config",
        class: "action-intercept-config",
        icon: "fas fa-cogs",
        onclick: () => openGlobalConfigForActor(app.actor),
      });
    }
  });
});

Hooks.on("midi-qol.preItemRoll", async (workflow) => {
  console.log("Action Intercept | midi-qol.preItemRoll hook fired", workflow);

  const actor = workflow.actor;
  const item = workflow.item;

  if (!actor || !item) {
    console.log("Action Intercept | No actor or item found in workflow");
    return true;
  }

  console.log("Action Intercept | Item roll detected:", item.name);

  const configurations = game.settings.get(
    "action-intercept",
    "itemConfigurations"
  );
  const itemConfig = configurations[`${actor.id}-${item.id}`];

  console.log("Action Intercept | Item configuration:", itemConfig);

  if (itemConfig && itemConfig.length > 0) {
    console.log("Action Intercept | Quick access items found, showing dialog");
    const result = await showQuickAccessDialog(actor, itemConfig);
    console.log("Action Intercept | Quick access dialog result:", result);
    if (result === "cancel" || result === "used") {
      console.log("Action Intercept | Roll cancelled or quick items used");
      return false;
    }
  } else {
    console.log(
      "Action Intercept | No quick access items configured for this item"
    );
  }

  return true;
});

async function showQuickAccessDialog(actor, quickAccessItemIds) {
  console.log(
    "Action Intercept | Showing quick access dialog",
    actor,
    quickAccessItemIds
  );
  const quickAccessItems = quickAccessItemIds
    .map((id) => actor.items.get(id))
    .filter((item) => item);

  const content = `
    <h2>Quick Access Items</h2>
    <div id="quickAccessButtons" style="display: flex; flex-wrap: wrap; gap: 10px;">
      ${quickAccessItems
        .map(
          (item) => `
          <div class="quick-access-item" data-item-id="${item.id}" style="text-align: center; cursor: pointer;">
            <img src="${item.img}" alt="${item.name}" title="${item.name}" style="width: 50px; height: 50px; object-fit: contain;">
            <div>${item.name}</div>
          </div>
        `
        )
        .join("")}
    </div>
    <button type="button" id="proceedRoll" style="margin-top: 10px;">Proceed with Roll</button>
  `;

  return new Promise((resolve) => {
    let d = new Dialog({
      title: "Quick Access Items",
      content: content,
      buttons: {
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => resolve("cancel"),
        },
      },
      default: "cancel",
      render: (html) => {
        const updateButtonState = () => {
          html.find(".quick-access-item").prop("disabled", false);
        };

        html.find(".quick-access-item").click(async (ev) => {
          const quickItemId = ev.currentTarget.dataset.itemId;
          const quickItem = actor.items.get(quickItemId);
          console.log(
            "Action Intercept | Quick access item selected:",
            quickItem.name
          );
          try {
            await MidiQOL.completeItemUse(
              quickItem,
              {},
              { showFullCard: true }
            );
            ui.notifications.info(`${quickItem.name} used successfully.`);
            updateButtonState();
          } catch (error) {
            console.error(
              "Action Intercept | Error using quick access item:",
              error
            );
            ui.notifications.error(
              `Error using ${quickItem.name}. Check the console for details.`
            );
          }
        });

        html.find("#proceedRoll").click(() => {
          resolve("proceed");
          d.close();
        });
      },
      close: () => resolve("used"),
    });
    d.render(true);
  });
}

// Update the Hooks.on("midi-qol.preItemRoll") to use the new itemConfigurations structure
Hooks.on("midi-qol.preItemRoll", async (workflow) => {
  console.log("Action Intercept | midi-qol.preItemRoll hook fired", workflow);

  const actor = workflow.actor;
  const item = workflow.item;

  if (!actor || !item) {
    console.log("Action Intercept | No actor or item found in workflow");
    return true;
  }

  console.log("Action Intercept | Item roll detected:", item.name);

  const configurations = game.settings.get(
    "action-intercept",
    "itemConfigurations"
  );
  const itemConfig = configurations[`${actor.id}-${item.id}`];

  console.log("Action Intercept | Item configuration:", itemConfig);

  if (itemConfig && itemConfig.prompts && itemConfig.prompts.length > 0) {
    console.log("Action Intercept | Quick access items found, showing dialog");
    const result = await showQuickAccessDialog(
      actor,
      itemConfig.prompts.map((prompt) => prompt.id)
    );
    console.log("Action Intercept | Quick access dialog result:", result);
    if (result === "cancel" || result === "used") {
      console.log("Action Intercept | Roll cancelled or quick items used");
      return false;
    }
  } else {
    console.log(
      "Action Intercept | No quick access items configured for this item"
    );
  }

  return true;
});
