import { getConfiguredTriggers, saveConfiguredTriggers } from "./settings.js";

export function initializeUI() {
  Hooks.on("renderActorSheet5e", (app, html, data) => {
    console.log(
      "Action Intercept | Attempting to add button to character sheet"
    );
    const button = $(
      `<a class="action-intercept-config" title="Configure Action Intercept"><i class="fas fa-crosshairs"></i></a>`
    );
    const titleElement = html.find(".window-title");
    if (titleElement.length > 0) {
      titleElement.append(button);
      console.log("Action Intercept | Button added to character sheet");
    } else {
      console.error("Action Intercept | Could not find .window-title element");
    }
    button.click((ev) => openConfigMenu(app.actor));
  });
}

export async function showActionPrompt(options) {
  return new Promise((resolve) => {
    const content = options
      .map(
        (opt) => `
            <button class="action-option" data-option-id="${opt.id}">
                <img src="${opt.img}" alt="${opt.name}" title="${opt.name}">
                <span>${opt.name}</span>
            </button>
        `
      )
      .join("");

    new Dialog({
      title: "Choose Your Action",
      content: `<div class="action-intercept-prompt">${content}</div>`,
      buttons: {
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => resolve(null),
        },
      },
      default: "cancel",
      render: (html) => {
        html.find(".action-option").click((ev) => {
          const optionId = ev.currentTarget.dataset.optionId;
          resolve(options.find((opt) => opt.id === optionId));
        });
      },
      close: () => resolve(null),
    }).render(true);
  });
}

async function openConfigMenu(actor) {
  const triggers = getConfiguredTriggers(actor.id);
  const content = await renderTemplate(
    "modules/action-intercept/templates/config-menu.html",
    { actor, triggers }
  );

  new Dialog({
    title: "Configure Action Intercept",
    content: content,
    buttons: {
      save: {
        icon: '<i class="fas fa-save"></i>',
        label: "Save",
        callback: (html) => saveConfig(actor, html),
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
      },
    },
    default: "save",
    render: (html) => setupConfigListeners(html, actor),
  }).render(true);
}

function setupConfigListeners(html, actor) {
  html.find(".add-trigger").click(() => addTrigger(html, actor));
  html.find(".remove-trigger").click((ev) => removeTrigger(ev, html, actor));
  html.find(".add-macro").click((ev) => addMacro(ev, html, actor));
  html.find(".remove-macro").click((ev) => removeMacro(ev, html, actor));
}

function addTrigger(html, actor) {
  const triggersContainer = html.find(".triggers-container");
  const newTriggerHtml = `
        <div class="trigger">
            <select name="itemType">
                <option value="any">Any Item</option>
                <option value="weapon">Weapon</option>
                <option value="spell">Spell</option>
                <option value="feat">Feature</option>
            </select>
            <div class="macros-container"></div>
            <button type="button" class="add-macro">Add Macro</button>
            <button type="button" class="remove-trigger">Remove Trigger</button>
        </div>
    `;
  triggersContainer.append(newTriggerHtml);
}

function removeTrigger(ev, html, actor) {
  $(ev.currentTarget).closest(".trigger").remove();
}

function addMacro(ev, html, actor) {
  const macrosContainer = $(ev.currentTarget).siblings(".macros-container");
  const macros = game.macros.contents
    .map((m) => `<option value="${m.id}">${m.name}</option>`)
    .join("");
  const newMacroHtml = `
        <div class="macro">
            <select name="macroId">
                ${macros}
            </select>
            <button type="button" class="remove-macro">Remove Macro</button>
        </div>
    `;
  macrosContainer.append(newMacroHtml);
}

function removeMacro(ev, html, actor) {
  $(ev.currentTarget).closest(".macro").remove();
}

function saveConfig(actor, html) {
  const triggers = html
    .find(".trigger")
    .map((i, el) => {
      const $el = $(el);
      return {
        itemType: $el.find('select[name="itemType"]').val(),
        macros: $el
          .find('select[name="macroId"]')
          .map((i, macro) => macro.value)
          .get(),
      };
    })
    .get();
  // Change this line
  saveConfiguredTriggers(actor.id, triggers);
}
