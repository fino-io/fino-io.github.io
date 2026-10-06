import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import './custom.css'
import './site-nav.css'
import LibraryHome from './LibraryHome.vue'

function syncDocumentLayout(pathname: string) {
  const root = document.documentElement
  const isDocumentLayout = /^\/(?:aip|grpc)(?:\/|$)/.test(pathname)

  root.classList.toggle('fino-document-layout', isDocumentLayout)
}

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router }) {
    if (typeof window !== 'undefined') {
      syncDocumentLayout(window.location.pathname)
      router.onBeforeRouteChange = (to) => {
        syncDocumentLayout(new URL(to, window.location.href).pathname)
      }
    }

    app.component('LibraryHome', LibraryHome)
  },
}
