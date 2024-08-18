export function addActionInterceptIndicators(api, actor, html) {
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
        const existingIcon = itemName.querySelector(".fas.fa-bolt");

        if (!existingIcon) {
          const lightningBoltIcon = document.createElement("i");
          lightningBoltIcon.className = "fas fa-bolt";
          lightningBoltIcon.style.color = "#ffcc00";
          lightningBoltIcon.style.marginRight = "5px";
          lightningBoltIcon.title = "Action Intercept Configured";
          itemName.insertBefore(lightningBoltIcon, itemName.firstChild);
        } else {
          console.log(`Lightning bolt icon already exists for item: ${itemId}`);
        }
      } else {
        console.log(`Item name element not found for item: ${itemId}`);
      }
    }
  });
}

// Move `openItemConfig` outside of `addActionInterceptIndicators`
export function openItemConfig(actor, itemId) {
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
