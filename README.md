# Universal API Tester

A lightweight, standalone, and browser-based REST API testing tool. Designed to be simple, fast, and dependency-free.

## 🚀 Key Features

- **Zero Dependencies**: Pure HTML, CSS, and Vanilla JavaScript. No `npm install` required.
- **Modern UI**: Clean, dark-mode interface with responsive split-pane layout.
- **Method Support**: Full support for `GET`, `POST`, `PUT`, `DELETE`, and `PATCH`.
- **Presets**: Quick-load templates for standard CRUD operations and health checks.
- **Request History**: Automatic tracking of your recent requests with one-click restoration.
- **JWT / Auth Support**: Easy header management with persistent authorization token field.
- **Response Insights**: Status code badges, response time (ms), and payload size calculation.
- **Syntax Highlighting**: Built-in JSON formatter and color-coding for easier reading.
- **Keyboard Shortcuts**: Send requests instantly with `Ctrl + Enter`.

## 📂 Project Structure

- `index.html`: The main interface and structure.
- `style.css`: Modern design system and layout styling.
- `app.js`: Core application logic, fetch handling, and history management.

## 🛠️ How to Use

1. **Open**: Simply open `index.html` in any web browser.
2. **Connect**: Enter your API Base URL (e.g., `https://api.example.com`).
3. **Configure**: Select an HTTP method, enter the path, and paste your Authorization token if needed.
4. **Send**: Click **Send** or press `Ctrl + Enter` to execute the request.
5. **Analyze**: View the status, timing, and formatted response body in the right pane.

## 📋 History & Persistence

The tool uses `localStorage` (via the key `api_tester_history`) to save your request history and connection settings across sessions. Your data stays entirely on your local machine.

---
*Created as a universal extension of the QuantaVault PQC Tester.*
