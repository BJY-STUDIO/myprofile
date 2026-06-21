import '@/styles/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 注册 Material Web 组件
import '@/plugins/material-web'

import { applyThemeFromHCT, applyThemeFromHex, hctToHex } from '@/utils/theme'

const app = createApp(App)
app.use(router)
app.mount('#app')

// ====== 主题面板交互逻辑 ======
// 等待 Vue 挂载完成后绑定事件
setTimeout(initThemePanel, 100)

function initThemePanel() {
  const themeBtn = document.getElementById('theme-btn')
  const themeBtnMobile = document.getElementById('theme-btn-mobile')
  const themeMenu = document.getElementById('theme-menu')
  if (!themeMenu || (!themeBtn && !themeBtnMobile)) {
    // 移动端可能还没有渲染，等路由完成再试
    setTimeout(initThemePanel, 500)
    return
  }

  // 滑块和输入框
  const hueSlider = document.getElementById('hue-slider')
  const chromaSlider = document.getElementById('chroma-slider')
  const toneSlider = document.getElementById('tone-slider')
  const sourceColorPicker = document.getElementById('source-color-picker')
  const sourceColorText = document.getElementById('source-color-text')
  const hueValue = document.getElementById('hue-value')
  const chromaValue = document.getElementById('chroma-value')
  const toneValue = document.getElementById('tone-value')
  const modeButtons = document.querySelectorAll('.theme-mode-btn')

  // 加载保存的偏好
  let hue = parseFloat(localStorage.getItem('m3-hue') || '270')
  let chroma = parseFloat(localStorage.getItem('m3-chroma') || '55')
  let tone = parseFloat(localStorage.getItem('m3-tone') || '50')
  let darkMode = localStorage.getItem('m3-dark-mode') || 'system'

  // 初始化 UI
  if (hueSlider) hueSlider.value = hue
  if (chromaSlider) chromaSlider.value = chroma
  if (toneSlider) toneSlider.value = tone
  if (hueValue) hueValue.textContent = Math.round(hue)
  if (chromaValue) chromaValue.textContent = Math.round(chroma)
  if (toneValue) toneValue.textContent = Math.round(tone)

  // 更新预览色
  function updatePreview() {
    const previewHex = hctToHex(hue, chroma)
    if (sourceColorPicker) sourceColorPicker.value = previewHex
    if (sourceColorText && sourceColorText.shadowRoot) {
      const input = sourceColorText.shadowRoot.querySelector('input')
      if (input) input.value = previewHex
    }
  }
  updatePreview()

  // 绑定打开菜单——桌面端
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      themeMenu.setAttribute('anchor', 'theme-btn')
      themeMenu.open = !themeMenu.open
      if (themeMenu.open) patchMenuZIndex(themeMenu)
    })
  }

  // 绑定打开菜单——移动端
  if (themeBtnMobile) {
    themeBtnMobile.addEventListener('click', () => {
      themeMenu.setAttribute('anchor', 'theme-btn-mobile')
      themeMenu.open = !themeMenu.open
      if (themeMenu.open) patchMenuZIndex(themeMenu)
    })
  }

  // 覆盖 md-menu shadow DOM 内部 .menu 的 z-index，
  // 使其高于 Navigation Rail (z-index:100) 和 Drawer (z-index:201)
  function patchMenuZIndex(menuEl) {
    requestAnimationFrame(() => {
      const innerMenu = menuEl.shadowRoot?.querySelector('.menu')
      if (innerMenu) {
        innerMenu.style.zIndex = '300'
        // 限制最大高度，避免菜单超出视口
        const items = innerMenu.querySelector('.items')
        if (items) {
          items.style.maxHeight = 'calc(100vh - 96px)'
        }
      }
    })
  }

  // 应用主题
  function apply() {
    applyThemeFromHCT(hue, chroma, darkMode)
    localStorage.setItem('m3-hue', hue)
    localStorage.setItem('m3-chroma', chroma)
    localStorage.setItem('m3-tone', tone)
    localStorage.setItem('m3-dark-mode', darkMode)
    updatePreview()
    // 更新 Navigation Rail 的分隔线颜色（它用 CSS 变量，会自动更新）
  }

  // 滑块事件
  if (hueSlider) {
    hueSlider.addEventListener('input', (e) => {
      hue = parseFloat(e.target.value)
      if (hueValue) hueValue.textContent = Math.round(hue)
      apply()
    })
  }

  if (chromaSlider) {
    chromaSlider.addEventListener('input', (e) => {
      chroma = parseFloat(e.target.value)
      if (chromaValue) chromaValue.textContent = Math.round(chroma)
      apply()
    })
  }

  if (toneSlider) {
    toneSlider.addEventListener('input', (e) => {
      tone = parseFloat(e.target.value)
      if (toneValue) toneValue.textContent = Math.round(tone)
      apply()
    })
  }

  // 颜色选择器事件
  if (sourceColorPicker) {
    sourceColorPicker.addEventListener('input', (e) => {
      const hex = e.target.value
      const hsl = applyThemeFromHex(hex, darkMode)
      hue = hsl.h
      chroma = hsl.s
      if (hueSlider) hueSlider.value = hue
      if (chromaSlider) chromaSlider.value = chroma
      if (hueValue) hueValue.textContent = Math.round(hue)
      if (chromaValue) chromaValue.textContent = Math.round(chroma)
      localStorage.setItem('m3-hue', hue)
      localStorage.setItem('m3-chroma', chroma)
    })
  }

  // 文本输入事件
  if (sourceColorText) {
    sourceColorText.addEventListener('input', (e) => {
      const hex = e.target.value
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        const hsl = applyThemeFromHex(hex, darkMode)
        hue = hsl.h
        chroma = hsl.s
        if (hueSlider) hueSlider.value = hue
        if (chromaSlider) chromaSlider.value = chroma
        if (hueValue) hueValue.textContent = Math.round(hue)
        if (chromaValue) chromaValue.textContent = Math.round(chroma)
        if (sourceColorPicker) sourceColorPicker.value = hex
        localStorage.setItem('m3-hue', hue)
        localStorage.setItem('m3-chroma', chroma)
      }
    })
  }

  // 明暗模式按钮
  modeButtons.forEach((btn) => {
    // 初始选中态
    if (btn.dataset.mode === darkMode) {
      btn.classList.add('selected')
    }

    btn.addEventListener('click', () => {
      darkMode = btn.dataset.mode
      modeButtons.forEach((b) => b.classList.remove('selected'))
      btn.classList.add('selected')
      apply()
    })
  })

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (darkMode === 'system') apply()
  })

  // 初始应用
  apply()
}
