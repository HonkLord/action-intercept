// global-config.js
import { openGlobalConfigMenu } from "./ui.js";
export async function openGlobalConfigMenu(actor) {
  console.log("Opening Global Config Menu for actor:", actor.name);

  // Render the template for the global config menu
  const content = await renderTemplate(
    "modules/action-intercept/templates/global-config-menu.html",
    {
      actor: actor,
      // Any other data you want to pass to the template
    }
  );

  new Dialog({
    title: "Global Action Intercept Configuration",
    content: content,
    buttons: {
      save: {
        icon: '<i class="fas fa-save"></i>',
        label: "Save",
        callback: (html) => {
          // Add save logic here, e.g., process inputs, store data
          saveGlobalConfig(actor, html);
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
      },
    },
    default: "save",
    render: (html) => {
      setupGlobalConfigListeners(html, actor); // Setup listeners for dynamic content
    },
    classes: ["action-intercept-dialog"],
  }).render(true);
}

// Setup listeners for your global config menu
function setupGlobalConfigListeners(html, actor) {
  html.find(".add-row-button").click(() => {
    // Add new rows dynamically, etc.
    addNewRow(html);
  });
}

// Save the configuration data
function saveGlobalConfig(actor, html) {
  // Get input data from the form and process it
  const configData = {}; // Replace with logic to gather data from the HTML form
  console.log("Saving Global Config Data:", configData);

  // Example of storing config data (you can adjust this logic as needed)
  game.settings.set("action-intercept", `globalConfig-${actor.id}`, configData);
}

// Example of adding a new row
function addNewRow(html) {
  const newRowHtml = `
    <div class="global-config-row">
      <input type="text" name="configItem" placeholder="Config item" />
      <button class="remove-row-button">Remove</button>
    </div>
  `;
  html.find(".global-config-container").append(newRowHtml);

  // Add listener to remove row button
  html.find(".remove-row-button").click((ev) => {
    $(ev.currentTarget).closest(".global-config-row").remove();
  });
}
