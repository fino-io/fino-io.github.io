import DefaultTheme from 'vitepress/theme'
import ContentLanguageLink from './ContentLanguageLink.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ContentLanguageLink', ContentLanguageLink)
  },
}
