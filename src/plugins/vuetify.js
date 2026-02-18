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
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#F8FAFC', // Slate 50
          surface: '#FFFFFF',
          primary: '#6366F1', // Indigo 500
          'primary-darken-1': '#4F46E5',
          secondary: '#EC4899', // Pink 500
          'secondary-darken-1': '#DB2777',
          error: '#EF4444',
          info: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
          'on-background': '#1E293B',
          'on-surface': '#1E293B',
        },
        variables: {
          'border-color': '#E2E8F0',
          'border-opacity': 1,
        }
      },
      dark: {
        dark: true,
        colors: {
          background: '#0F172A', // Slate 900
          surface: '#1E293B', // Slate 800
          primary: '#818CF8', // Indigo 400
          'primary-darken-1': '#6366F1',
          secondary: '#F472B6', // Pink 400
          'secondary-darken-1': '#EC4899',
          error: '#F87171',
          info: '#60A5FA',
          success: '#34D399',
          warning: '#FBBF24',
          'on-background': '#F1F5F9',
          'on-surface': '#F1F5F9',
        },
        variables: {
          'border-color': '#334155',
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
      border: true,
      class: 'v-card--modern',
    },
    VBtn: {
      rounded: 'lg',
      height: 44,
      elevation: 0,
      variant: 'flat',
      class: 'text-capitalize font-weight-bold letter-spacing-0',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto',
      rounded: 'lg',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto',
      rounded: 'lg',
    },
    VNavigationDrawer: {
      elevation: 0,
      border: 'e',
    },
    VAppBar: {
      elevation: 0,
      border: 'b',
    },
    VDataTable: {
      hover: true,
      density: 'comfortable',
    }
  }
})
