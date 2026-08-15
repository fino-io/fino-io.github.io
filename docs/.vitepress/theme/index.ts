import DefaultTheme from 'vitepress/theme'
import ContentLanguageLink from './ContentLanguageLink.vue'
import Layout from './Layout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('ContentLanguageLink', ContentLanguageLink)
  },
}
