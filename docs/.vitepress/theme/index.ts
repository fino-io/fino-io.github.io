import DefaultTheme from 'vitepress/theme'
import AipLanguageLink from './AipLanguageLink.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('AipLanguageLink', AipLanguageLink)
  },
}
