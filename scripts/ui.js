import { getConfiguredTriggers, saveConfiguredTriggers } from "./settings.js";
import { getConfiguredTriggers, saveConfiguredTriggers } from "./settings.js";

export function initializeUI() {
  console.log("Action Intercept | Initializing UI");

  Hooks.on("renderActorSheet", (app, html, data) => {
    console.log(
      "Action Intercept | renderActorSheet hook fired",
      app,
      html,
      data
    );

    if (app.actor.type !== "character") {
      console.log("Action Intercept | Not a character sheet, skipping");
      return;
    }

    console.log("Action Intercept | Processing character sheet");

    // Add configuration icons to items
    const itemElements = html.find(".item-list .item-name");
    console.log("Action Intercept | Found item elements:", itemElements.length);

    itemElements.each((i, el) => {
      const itemId = el.closest(".item")?.dataset?.itemId;
      console.log("Action Intercept | Processing item:", i, itemId);

      if (!itemId) {
        console.log("Action Intercept | No itemId found for element, skipping");
        return;
      }

      const configIcon = $(
        `<a class="action-intercept-config" title="Configure Action Intercept"><i class="fas fa-cog"></i></a>`
      );
      $(el).append(configIcon);
      console.log("Action Intercept | Added config icon to item:", itemId);

      configIcon.click((ev) => {
        console.log("Action Intercept | Config icon clicked for item:", itemId);
        ev.preventDefault();
        ev.stopPropagation();
        openItemConfigMenu(app.actor, itemId);
      });
    });
  });

  // Implement preRoll hook
  Hooks.on("preRollItem", async (item, config) => {
    console.log("Action Intercept | preRollItem hook fired", item, config);

    const triggers = getConfiguredTriggers(item.actor.id);
    console.log("Action Intercept | Triggers for actor:", triggers);

    const itemTrigger = triggers.find((t) => t.itemId === item.id);
    console.log("Action Intercept | Trigger for item:", itemTrigger);

    if (itemTrigger && itemTrigger.quickAccessItems.length > 0) {
      console.log(
        "Action Intercept | Quick access items found, showing dialog"
      );
      const result = await showQuickAccessDialog(
        item.actor,
        itemTrigger.quickAccessItems
      );
      if (result === "cancel") return false;
    }
    return true;
  });
}

async function openItemConfigMenu(actor, item) {
  const triggers = getConfiguredTriggers(actor.id);
  const itemTrigger = triggers.find((t) => t.itemId === item.id) || {
    quickAccessItems: [],
  };

  const content = await renderTemplate(
    "modules/action-intercept/templates/item-config-menu.html",
    {
      item,
      itemTrigger,
      allItems: actor.items
        .filter((i) => i.id !== item.id)
        .map((i) => ({ id: i.id, name: i.name })),
    }
  );

  new Dialog({
    title: `Configure Action Intercept for ${item.name}`,
    content: content,
    buttons: {
      save: {
        icon: '<i class="fas fa-save"></i>',
        label: "Save",
        callback: (html) => saveItemConfig(actor, item.id, html),
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
      },
    },
    default: "save",
    render: (html) => setupItemConfigListeners(html),
    classes: ["action-intercept-dialog"],
  }).render(true);
}

function setupItemConfigListeners(html) {
  html.find(".add-quick-access").click(() => addQuickAccessItem(html));
  html.find(".remove-quick-access").click((ev) => removeQuickAccessItem(ev));
}

function addQuickAccessItem(html) {
  const itemTemplate = `
        <div class="quick-access-item">
            <select name="quickAccessItemId">
                ${html.find(".add-quick-access select").html()}
            </select>
            <button type="button" class="remove-quick-access">Remove</button>
        </div>
    `;
  html.find(".quick-access-container").append(itemTemplate);
}

function removeQuickAccessItem(ev) {
  $(ev.currentTarget).closest(".quick-access-item").remove();
}

function saveItemConfig(actor, itemId, html) {
  const quickAccessItemIds = html
    .find('select[name="quickAccessItemId"]')
    .map((i, el) => el.value)
    .get();
  let triggers = getConfiguredTriggers(actor.id);
  const triggerIndex = triggers.findIndex((t) => t.itemId === itemId);

  if (triggerIndex !== -1) {
    triggers[triggerIndex].quickAccessItems = quickAccessItemIds;
  } else {
    triggers.push({ itemId, quickAccessItems: quickAccessItemIds });
  }

  saveConfiguredTriggers(actor.id, triggers);
}

async function showQuickAccessDialog(actor, quickAccessItemIds) {
  const quickAccessItems = quickAccessItemIds
    .map((id) => actor.items.get(id))
    .filter((item) => item);

  const content = await renderTemplate(
    "modules/action-intercept/templates/quick-access-dialog.html",
    {
      quickAccessItems,
    }
  );

  return new Promise((resolve) => {
    new Dialog({
      title: "Quick Access Items",
      content: content,
      buttons: {
        useItem: {
          icon: '<i class="fas fa-check"></i>',
          label: "Use Item",
          callback: (html) => {
            const selectedItemId = html
              .find('input[name="selectedItem"]:checked')
              .val();
            if (selectedItemId) {
              const item = actor.items.get(selectedItemId);
              item.roll();
            }
            resolve("used");
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => resolve("cancel"),
        },
      },
      default: "useItem",
      close: () => resolve("cancel"),
    }).render(true);
  });
}
