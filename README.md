# Action Intercept

## Overview

**Action Intercept** is a Foundry VTT module designed to intercept actions within the system and provide custom macro responses. This allows for greater control and customization of actions based on player interactions, game states, and specific triggers.

## Features

- Intercept player and NPC actions in real-time.
- Customize macro responses based on intercepted actions.
- Easily configure the module through the settings panel.
- Supports multiple languages (currently English).

## Installation

To install the **Action Intercept** module:

1. Go to the "Add-on Modules" tab in the Foundry VTT setup menu.
2. Click "Install Module."
3. Paste the following URL into the "Manifest URL" field:
   https://raw.githubusercontent.com/HonkLord/action-intercept/main/module.json
4. Click "Install" and wait for the installation to complete.

Alternatively, you can manually download the module from GitHub:

- [Download Action Intercept](https://github.com/HonkLord/action-intercept/archive/v1.0.1.zip)

After downloading, extract the zip file into the `modules` directory of your Foundry VTT installation.

## Compatibility

- **Minimum Foundry VTT Version:** 10
- **Verified Compatibility with Foundry VTT Version:** 12.331

## Usage

Once installed, you can access the module's settings through the **Module Settings** menu. From there, you can configure global configurations, customize UI elements, and set up the desired macro responses for intercepted actions.

### Scripts and Styles

This module includes several scripts and styles to enhance your experience:

- **Scripts:**
- `action-intercept.js`
- `global-config.js`
- `settings.js`
- `ui.js`

- **Styles:**
- `action-intercept.css`

### Templates

- `global-config.html`

## Authors

- **HonkLord**

## Support

If you encounter any issues or have questions about the module, feel free to submit an issue on the [GitHub repository](https://github.com/HonkLord/action-intercept/issues).

## Changelog

### v1.0.1

- Initial release with action interception and custom macro responses.
