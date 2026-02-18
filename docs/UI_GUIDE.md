# Admin Service Bunny - UI Guide

This project has been redesigned using **Vuetify 3** with a **Material Design 3** inspired theme. This guide covers installation, running the project, and using the UI system.

## 🚀 Installation & Running

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5000` (or the port specified in your `.env`).

### Building for Production
```bash
npm run build
```

---

## 🎨 Theme System

We use a custom Vuetify theme with **Light** and **Dark** modes. The theme uses a modern pastel-inspired palette.

### Color Palette

| Color | Light Mode (Hex) | Dark Mode (Hex) | Usage |
|-------|------------------|-----------------|-------|
| **Primary** | `#6366F1` (Indigo) | `#818CF8` | Main actions, active states |
| **Secondary** | `#EC4899` (Pink) | `#F472B6` | Accents, highlights |
| **Background** | `#F8FAFC` | `#0F172A` | Page background |
| **Surface** | `#FFFFFF` | `#1E293B` | Cards, Sidebar, App Bar |
| **Error** | `#EF4444` | `#F87171` | Validation errors |

### Customizing Theme
You can modify colors in `src/plugins/vuetify.js`.

---

## 🧩 Component Defaults

Global defaults have been set in `src/plugins/vuetify.js` to ensure consistency and a modern look.

### VCard
- **Style**: Flat design with subtle border.
- **Default Props**: `elevation="0"`, `rounded="lg"`, `border="true"`
- **Usage**:
  ```vue
  <v-card>
    <v-card-title>Title</v-card-title>
    <v-card-text>Content</v-card-text>
  </v-card>
  ```

### VBtn (Buttons)
- **Style**: Rounded corners, flat, bold text.
- **Default Props**: `rounded="lg"`, `height="44"`, `elevation="0"`, `variant="flat"`
- **Usage**:
  ```vue
  <v-btn color="primary">Save Changes</v-btn>
  <v-btn variant="text">Cancel</v-btn>
  ```

### VTextField (Inputs)
- **Style**: Outlined with comfortable density.
- **Default Props**: `variant="outlined"`, `density="comfortable"`, `rounded="lg"`, `color="primary"`

---

## 📐 Layout & Responsiveness

The main layout is defined in `src/App.vue`.

- **Sidebar (VNavigationDrawer)**:
  - Automatically collapses on mobile.
  - Uses `color="surface"` to distinguish from the background.
- **App Bar (VAppBar)**:
  - Sticky at the top.
  - Contains Theme Toggle and Language Switcher.
- **Grid System**:
  - Use Vuetify's `v-row` and `v-col` for responsive layouts.
  - **Mobile**: `<v-col cols="12">`
  - **Tablet**: `<v-col cols="6">`
  - **Desktop**: `<v-col cols="3">`

---

## ♿ Accessibility (A11y)

- **Contrast**: The chosen color palette ensures readable contrast ratios for text on background.
- **Semantic HTML**: Vuetify components render semantic tags (e.g., `<nav>`, `<main>`).
- **Focus States**: Default focus rings are preserved for keyboard navigation.

### Best Practices
- Always use `label` or `aria-label` for inputs without visible labels.
- Use `alt` tags for images.
- Test with keyboard navigation (Tab key).

---

## 📂 File Structure

- `src/plugins/vuetify.js`: Theme and defaults configuration.
- `src/assets/main.css`: Global utilities and overrides.
- `src/App.vue`: Main application shell (Layout).
- `src/components/`: Reusable UI components.
