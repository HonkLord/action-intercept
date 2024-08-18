import { registerSettings, setSetting, getSetting } from "./settings.js";

console.log("Action Intercept | Module file loaded");

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
      addActionInterceptIndicators(api, data.actor, element);
    });
  });
});

function addActionInterceptIndicators(api, actor, html) {
  console.log("Action Intercept | Adding indicators for", actor.name);

  // Get configurations for this actor
  const configurations = game.settings.get(
    "action-intercept",
    "itemConfigurations"
  );
  const actorConfigs = Object.keys(configurations).filter((key) =>
    key.startsWith(actor.id)
  );

  console.log("Action Intercept | Actor configurations:", actorConfigs);

  if (actorConfigs.length === 0) {
    console.log("Action Intercept | No configurations found for this actor");
    return;
  }

  // Query item rows using standard DOM queries
  const itemRows = html.querySelectorAll(".item-table-row-container");

  console.log(`Found ${itemRows.length} item rows`);

  itemRows.forEach((row) => {
    const itemId = row.getAttribute("data-item-id");
    const configKey = `${actor.id}-${itemId}`;

    if (actorConfigs.includes(configKey)) {
      console.log(`Action Intercept | Adding indicator to item: ${itemId}`);

      // Add lightning bolt icon to the item name
      const itemName = row.querySelector(".item-name");
      if (itemName) {
        const lightningBoltIcon = document.createElement("i");
        lightningBoltIcon.className = "fas fa-bolt";
        lightningBoltIcon.style.color = "#ffcc00";
        lightningBoltIcon.style.marginRight = "5px";
        lightningBoltIcon.title = "Action Intercept Configured";
        itemName.insertBefore(lightningBoltIcon, itemName.firstChild);
      } else {
        console.log(`Item name element not found for item: ${itemId}`);
      }
    }
  });
}

function openItemConfig(actor, itemId) {
  const item = actor.items.get(itemId);
  if (!item) {
    console.warn(`No item found for itemId: ${itemId}`);
    return;
  }

  console.log("Action Intercept | Opening config for item:", item.name);

  const content = `
        <h2>Configure ${item.name}</h2>
        <p>Select quick access items:</p>
        <div id="quickAccessItems"></div>
        <button id="addQuickAccess">Add Quick Access Item</button>
    `;

  new Dialog({
    title: `Configure ${item.name}`,
    content: content,
    buttons: {
      save: {
        icon: '<i class="fas fa-save"></i>',
        label: "Save",
        callback: (html) => saveItemConfig(actor, itemId, html),
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
      },
    },
    render: (html) => renderItemConfig(html, actor, itemId),
    default: "save",
  }).render(true);
}

function renderItemConfig(html, actor, itemId) {
  const quickAccessDiv = html.find("#quickAccessItems");
  const addButton = html.find("#addQuickAccess");

  const configurations = game.settings.get(
    "action-intercept",
    "itemConfigurations"
  );
  const itemConfig = configurations[`${actor.id}-${itemId}`] || [];

  console.log(`Rendering item config for itemId: ${itemId}`, itemConfig);

  itemConfig.forEach((quickItemId) =>
    addQuickAccessItem(quickAccessDiv, actor, quickItemId)
  );

  addButton.click(() => addQuickAccessItem(quickAccessDiv, actor));
}

function addQuickAccessItem(container, actor, selectedItemId = null) {
  const select = $("<select></select>");
  actor.items.forEach((item) => {
    const option = $(`<option value="${item.id}">${item.name}</option>`);
    if (item.id === selectedItemId) option.prop("selected", true);
    select.append(option);
  });

  const removeButton = $('<button type="button">Remove</button>');
  removeButton.click(() => removeButton.parent().remove());

  const itemDiv = $("<div></div>").append(select).append(removeButton);
  container.append(itemDiv);

  console.log(`Added quick access item selector for itemId: ${selectedItemId}`);
}

function saveItemConfig(actor, itemId, html) {
  const quickAccessItems = html
    .find("#quickAccessItems select")
    .map((i, el) => el.value)
    .get();

  const configurations = game.settings.get(
    "action-intercept",
    "itemConfigurations"
  );
  configurations[`${actor.id}-${itemId}`] = quickAccessItems;
  game.settings.set("action-intercept", "itemConfigurations", configurations);

  console.log("Action Intercept | Configuration saved for item:", itemId);
}

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
        <div id="quickAccessButtons">
            ${quickAccessItems
              .map(
                (item) => `
                <button type="button" data-item-id="${item.id}">${item.name}</button>
            `
              )
              .join("")}
        </div>
        <button type="button" id="proceedRoll">Proceed with Roll</button>
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
          html.find("#quickAccessButtons button").prop("disabled", false);
        };

        html.find("#quickAccessButtons button").click(async (ev) => {
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
