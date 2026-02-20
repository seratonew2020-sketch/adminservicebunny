/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'dark', // Set default to dark as per design
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#F8FAFC',
          surface: '#FFFFFF',
          primary: '#6366F1',
          'primary-darken-1': '#4F46E5',
          secondary: '#EC4899',
          'secondary-darken-1': '#DB2777',
          error: '#EF4444',
          info: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
          'on-background': '#1E293B',
          'on-surface': '#1E293B',
        },
      },
      dark: {
        dark: true,
        colors: {
          background: '#0B0F1A', // Deep Navy
          surface: '#111827',     // Dark Card
          'surface-light': '#1F2937', // Lighter Card used for inputs/borders
          primary: '#6366F1',     // Indigo
          'primary-darken-1': '#4F46E5',
          secondary: '#8B5CF6',   // Purple
          accent: '#06B6D4',      // Cyan
          error: '#EF4444',       // Red
          info: '#3B82F6',
          success: '#10B981',     // Emerald
          warning: '#F59E0B',     // Amber
          'on-background': '#F9FAFB', // Text Primary
          'on-surface': '#F9FAFB',
          'text-secondary': '#9CA3AF',
        },
        variables: {
          'border-color': '#1F2937',
          'border-opacity': 1,
        }
      }
    }
  },
  defaults: {
    global: {
      ripple: false,
    },
    VCard: {
      elevation: 0,
      rounded: 'lg',
      border: true, // Vuetify uses border-color variable
    },
    VBtn: {
      rounded: 'lg',
      height: 44,
      elevation: 0,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto',
      rounded: 'lg',
      bgColor: 'surface-light', // Use our custom surface-light color
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto',
      rounded: 'lg',
      bgColor: 'surface-light',
    },
    VNavigationDrawer: {
      elevation: 0,
      border: 'e',
      color: 'background', // Match background
    },
    VAppBar: {
      elevation: 0,
      border: 'b',
      color: 'background', // Transparent/Background
    },
    VList: {
      bgColor: 'transparent',
    }
  }
})
