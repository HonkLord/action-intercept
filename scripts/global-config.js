import { getSetting, setSetting } from "./settings.js";

export class GlobalItemConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "action-intercept-global-config",
      title: "Global Action Intercept Configuration",
      template: "modules/action-intercept/templates/global-config.html",
      width: 800,
      height: "auto",
      closeOnSubmit: true,
      dragDrop: [
        { dragSelector: ".item", dropSelector: ".item-prompts" },
        { dragSelector: ".item", dropSelector: "#new-item-area" },
      ],
    });
  }

  getData(options) {
    const actor = this.object;
    const configurations = getSetting("itemConfigurations") || {};
    const actorConfigs = Object.entries(configurations)
      .filter(([key]) => key.startsWith(actor.id))
      .map(([key, config]) => {
        const [actorId, itemId] = key.split("-");
        const item = actor.items.get(itemId);
        return {
          id: itemId,
          name: item ? item.name : "Unknown Item",
          img: item ? item.img : "icons/svg/mystery-man.svg",
          prompts: Array.isArray(config)
            ? config
                .map((id) => {
                  const promptItem = actor.items.get(id);
                  return promptItem
                    ? {
                        id: promptItem.id,
                        name: promptItem.name,
                        img: promptItem.img,
                      }
                    : null;
                })
                .filter((p) => p)
            : config.prompts || [],
        };
      });

    return {
      configuredItems: actorConfigs,
      allItems: this.getAllItems(actor),
    };
  }

  getAllItems(actor) {
    if (!actor) {
      console.warn("No actor found for item configuration.");
      return [];
    }
    return actor.items.map((item) => ({
      id: item.id,
      name: item.name,
      img: item.img,
      type: item.type,
    }));
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('button[type="submit"]').click((event) => {
      console.log("Save button clicked", event);
    });
    html.find(".copy-config").click(this._onCopyConfig.bind(this));
    html
      .find("#item-search")
      .on("input", this._onSearchConfiguredItems.bind(this));
    html
      .find(".prompt-search-input")
      .on("input", this._onSearchPrompts.bind(this));
    html.find(".prompt-icon").click(this._onRemovePrompt.bind(this));
    html
      .find("#new-item-search")
      .on("input", this._onSearchNewItems.bind(this));
    html.find(".remove-item").click(this._onRemoveItem.bind(this));

    this._initializeDragDrop(html);

    html
      .find("#new-item-area")
      .on("dragenter dragover", (event) => {
        event.preventDefault();
        event.currentTarget.classList.add("drag-hover");
      })
      .on("dragleave drop", (event) => {
        event.preventDefault();
        event.currentTarget.classList.remove("drag-hover");
      });
  }

  _initializeDragDrop(html) {
    if (this._dragDrop) {
      this._dragDrop.forEach((dd) => {
        if (dd.destroy && typeof dd.destroy === "function") {
          dd.destroy();
        }
      });
    }

    this._dragDrop = [];
    this._dragDrop.push(
      new DragDrop({
        dragSelector: ".item",
        dropSelector: ".item-prompts",
        callbacks: {
          dragstart: this._onDragStart.bind(this),
          drop: this._onDropPrompt.bind(this),
        },
      })
    );
    this._dragDrop.push(
      new DragDrop({
        dragSelector: ".item",
        dropSelector: "#new-item-area",
        callbacks: {
          dragstart: this._onDragStart.bind(this),
          drop: this._onDropNewItem.bind(this),
        },
      })
    );
  }

  _onDragStart(event) {
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        type: "Item",
        uuid: event.currentTarget.dataset.uuid,
      })
    );
  }

  _onSearchConfiguredItems(event) {
    const searchTerm = event.target.value.toLowerCase();
    const items = this.element.find(".configured-item");
    items.each((i, item) => {
      const itemName = $(item).find(".item-name").text().toLowerCase();
      $(item).toggle(itemName.includes(searchTerm));
    });
  }

  _onSearchPrompts(event) {
    const searchTerm = event.target.value.toLowerCase();
    const $input = $(event.target);
    const $results = $input.siblings(".prompt-search-results");
    const $configuredItem = $input.closest(".configured-item");
    const configuredItemId = $configuredItem.data("item-id");

    if (searchTerm.length < 2) {
      $results.hide();
      return;
    }

    const matchingItems = this.getData().allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) &&
        item.id !== configuredItemId
    );

    $results.empty();
    matchingItems.forEach((item) => {
      const $item = $(
        `<div class="prompt-search-result" data-item-id="${item.id}">${item.name}</div>`
      );
      $item.on("click", () => this._onAddPrompt(configuredItemId, item));
      $results.append($item);
    });

    $results.show();
  }

  _onAddPrompt(configuredItemId, promptItem) {
    const actor = this.object;
    const configurations = getSetting("itemConfigurations") || {};
    const configKey = `${actor.id}-${configuredItemId}`;

    if (!configurations[configKey]) {
      configurations[configKey] = [];
    }

    if (Array.isArray(configurations[configKey])) {
      if (!configurations[configKey].includes(promptItem.id)) {
        configurations[configKey].push(promptItem.id);
      }
    } else {
      if (!configurations[configKey].prompts)
        configurations[configKey].prompts = [];
      if (
        !configurations[configKey].prompts.some((p) => p.id === promptItem.id)
      ) {
        configurations[configKey].prompts.push({
          id: promptItem.id,
          name: promptItem.name,
          img: promptItem.img,
        });
      }
    }

    setSetting("itemConfigurations", configurations);
    this.render();
  }

  _onRemovePrompt(event) {
    const $promptIcon = $(event.currentTarget);
    const $configuredItem = $promptIcon.closest(".configured-item");
    const configuredItemId = $configuredItem.data("item-id");
    const promptId = $promptIcon.data("prompt-id");

    const actor = this.object;
    const configurations = getSetting("itemConfigurations") || {};
    const configKey = `${actor.id}-${configuredItemId}`;

    if (Array.isArray(configurations[configKey])) {
      configurations[configKey] = configurations[configKey].filter(
        (id) => id !== promptId
      );
    } else {
      configurations[configKey].prompts = configurations[
        configKey
      ].prompts.filter((p) => p.id !== promptId);
    }

    setSetting("itemConfigurations", configurations);
    this.render();
  }

  _onRemoveItem(event) {
    const $item = $(event.currentTarget).closest(".configured-item");
    const itemId = $item.data("item-id");

    const actor = this.object;
    const configurations = getSetting("itemConfigurations") || {};
    const configKey = `${actor.id}-${itemId}`;

    delete configurations[configKey];
    setSetting("itemConfigurations", configurations);
    this.render();
  }

  _onSearchNewItems(event) {
    const searchTerm = event.target.value.toLowerCase();
    const $results = $("#new-item-search-results");

    if (searchTerm.length < 2) {
      $results.hide();
      return;
    }

    const matchingItems = this.getData().allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) &&
        !this.getData().configuredItems.some(
          (configItem) => configItem.id === item.id
        )
    );

    $results.empty();
    matchingItems.forEach((item) => {
      const $item = $(
        `<div class="new-item-search-result" data-item-id="${item.id}">${item.name}</div>`
      );
      $item.on("click", () => {
        this._onAddNewConfiguredItem(item);
        $("#new-item-search").val("");
        $results.hide();
      });
      $results.append($item);
    });

    $results.show();
  }

  _onAddNewConfiguredItem(item) {
    const actor = this.object;
    const configurations = getSetting("itemConfigurations") || {};
    const configKey = `${actor.id}-${item.id}`;

    if (!configurations[configKey]) {
      configurations[configKey] = { prompts: [] };
      setSetting("itemConfigurations", configurations);
      this.render();
    }
  }

  _onDropPrompt(event) {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData("text/plain"));

    if (data.type !== "Item") return;

    const item = fromUuidSync(data.uuid);
    if (!item) return;

    const $dropTarget = $(event.target).closest(".item-prompts");
    const $configuredItem = $dropTarget.closest(".configured-item");
    const configuredItemId = $configuredItem.data("item-id");

    this._onAddPrompt(configuredItemId, item);
  }

  _onDropNewItem(event) {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData("text/plain"));

    if (data.type !== "Item") return;

    const item = fromUuidSync(data.uuid);
    if (!item) return;

    this._onAddNewConfiguredItem(item);
  }

  async _updateObject(event, formData) {
    try {
      // Process the form data and update the configurations
      const actor = this.object;
      const configurations = getSetting("itemConfigurations") || {};

      // Update configurations based on formData
      // (You may need to adjust this part based on your form structure)
      Object.entries(formData).forEach(([key, value]) => {
        if (key.startsWith("config-")) {
          const [_, itemId] = key.split("-");
          const configKey = `${actor.id}-${itemId}`;
          configurations[configKey] = value;
        }
      });

      // Save the updated configurations
      await setSetting("itemConfigurations", configurations);

      // Refresh the actor sheet to update the icons
      this.refreshActorSheet();

      // Close the form
      this.close();

      ui.notifications.info("Configuration saved successfully.");
    } catch (error) {
      console.error("Error in _updateObject:", error);
      ui.notifications.error(
        "An error occurred while saving. Check the console for details."
      );
    }
  }

  refreshActorSheet() {
    const actor = this.object;
    if (actor && actor.sheet) {
      actor.sheet.render(false);
    }
  }

  // Add this new method for copying configurations
  _onCopyConfig(event) {
    const sourceItemId = $(event.currentTarget)
      .closest(".configured-item")
      .data("item-id");
    const configurations = getSetting("itemConfigurations") || {};
    const sourceConfig = configurations[`${this.object.id}-${sourceItemId}`];

    if (!sourceConfig) return;

    const dialog = new Dialog({
      title: "Copy Configuration",
      content: `
      <div style="margin-bottom: 10px;">
        <input type="text" id="copy-config-search" placeholder="Search items..." style="width: 100%;">
      </div>
      <div id="copy-config-items" style="max-height: 300px; overflow-y: auto;"></div>
    `,
      buttons: {
        copy: {
          icon: '<i class="fas fa-copy"></i>',
          label: "Copy",
          callback: (html) => this._applyCopyConfig(html, sourceItemId),
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
        },
      },
      render: (html) => this._renderCopyConfigDialog(html, sourceItemId),
      default: "copy",
    });
    dialog.render(true);
  }

  _renderCopyConfigDialog(html, sourceItemId) {
    const $container = html.find("#copy-config-items");
    const $search = html.find("#copy-config-search");

    const items = this.object.items
      .filter((item) => item.id !== sourceItemId)
      .sort((a, b) => a.name.localeCompare(b.name));

    const renderItems = (filterText = "") => {
      $container.empty();
      items.forEach((item) => {
        if (item.name.toLowerCase().includes(filterText.toLowerCase())) {
          $container.append(`
          <div>
            <input type="checkbox" id="copy-${item.id}" name="copy-${item.id}">
            <label for="copy-${item.id}">${item.name}</label>
          </div>
        `);
        }
      });
    };

    renderItems();

    $search.on("input", (e) => {
      renderItems(e.target.value);
    });
  }

  _applyCopyConfig(html, sourceItemId) {
    const configurations = getSetting("itemConfigurations") || {};
    const sourceConfig = configurations[`${this.object.id}-${sourceItemId}`];

    html.find("input:checked").each((i, el) => {
      const targetItemId = el.id.split("-")[1];
      configurations[`${this.object.id}-${targetItemId}`] = JSON.parse(
        JSON.stringify(sourceConfig)
      );
    });

    setSetting("itemConfigurations", configurations);
    this.render();
  }

  async render(force = false, options = {}) {
    await super.render(force, options);
    this._initializeDragDrop(this.element);
    return this;
  }
}

export function openGlobalConfigForActor(actor) {
  new GlobalItemConfig(actor, {}).render(true);
}
