/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
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
          background: '#f7f7f7',
          surface: '#FFFFFF',
          primary: '#1A1A1A',
          secondary: '#64748B',
          error: '#EF4444',
          info: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
        }
      },
      dark: {
        dark: true,
        colors: {
          background: '#191919',
          surface: '#1A1A1A',
          primary: '#FFFFFF',
          secondary: '#94A3B8',
          error: '#EF4444',
          info: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
        }
      }
    }
  },
})
