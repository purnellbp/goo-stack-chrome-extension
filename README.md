# Goo Stack Chrome Extension

<!-- insert image for github readme  -->
![alt text](icons/icon128.png)

Goo Stack is a powerful Chrome extension designed to help users efficiently manage and organize their browser tabs and sessions.

## Features

- View all open tabs in a clean, organized interface
- Search through open tabs quickly
- Close tabs directly from the extension
- Drag and reorder tabs
- Save current tab sessions with custom names
- Restore saved sessions in the current window or a new window
- Delete saved sessions
- Drag to reorder saved sessions
- Audio indicator for tabs playing sound
- Responsive design with dark mode support
- Filter non-HTTP tabs

## Installation

1. Clone this repository or download it as a ZIP file and extract it.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

## Usage

1. Click the Goo Stack icon in your Chrome toolbar to open the extension popup.
2. Use the search bar to filter through your open tabs.
3. Click on a tab title to switch to that tab.
4. Use the close button (X) to close a tab.
5. Drag tabs to reorder them in your browser.
6. Enter a name for your current session and click "Save Session" to store it.
7. Click on a saved session name to restore it in the current window.
8. Use the new window button to open a saved session in a new window.
9. Drag saved sessions to reorder them.
10. Use the delete button to remove a saved session.
11. Toggle the switch next to "Open Tabs" to filter non-HTTP tabs.

## Development

This extension is built using vanilla JavaScript, HTML, and CSS. It uses the Chrome Extension API for tab management and IndexedDB for storing sessions.

### Key Components

- `popup.html`: The main interface of the extension.
- `popup.js`: Contains the core functionality for managing tabs and sessions.
- `styles.css`: Defines the styling for the extension, including dark mode support.
- `background.js`: Handles background tasks and icon updates.
- `manifest.json`: Defines the extension's properties and permissions.

### Libraries Used

- Sortable.js: For drag-and-drop functionality of tabs and sessions.

## Contributing

Contributions to Goo Stack are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

