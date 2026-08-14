import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import LanguageSwitcher from './LanguageSwitcher.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: EnhanceAppContext) {
    app.component('LanguageSwitcher', LanguageSwitcher)
    app.component('ThemeSwitcher', ThemeSwitcher)
  },
}
