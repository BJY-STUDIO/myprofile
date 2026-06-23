/**
 * M3 主题管理系统
 * 参照 material-web.dev 的 Theme Controls 实现
 * 
 * 支持：
 * - Source Color (hex 输入 + 颜色选择器)
 * - Hue / Chroma / Tone 滑块实时调节
 * - 明暗模式切换（dark / system / light）
 * - localStorage 持久化
 * 
 * 默认源色 #6750A4 的 token 精确匹配 M3 规范（Material Theme Builder 输出）
 */

// ====== M3 规范源色 #6750A4 精确 token ======
// 从 Material Theme Builder (m3.material.io/theme-builder) 提取

const M3_BASELINE_LIGHT = {
  '--md-sys-color-primary': '#6750a4',
  '--md-sys-color-on-primary': '#ffffff',
  '--md-sys-color-primary-container': '#eaddff',
  '--md-sys-color-on-primary-container': '#21005d',
  '--md-sys-color-secondary': '#625b71',
  '--md-sys-color-on-secondary': '#ffffff',
  '--md-sys-color-secondary-container': '#e8def8',
  '--md-sys-color-on-secondary-container': '#1d192b',
  '--md-sys-color-tertiary': '#7d5260',
  '--md-sys-color-on-tertiary': '#ffffff',
  '--md-sys-color-tertiary-container': '#ffd8e4',
  '--md-sys-color-on-tertiary-container': '#31111d',
  '--md-sys-color-error': '#b3261e',
  '--md-sys-color-on-error': '#ffffff',
  '--md-sys-color-error-container': '#f9dedc',
  '--md-sys-color-on-error-container': '#410e0b',
  '--md-sys-color-surface': '#fffbfe',
  '--md-sys-color-on-surface': '#1c1b1f',
  '--md-sys-color-surface-variant': '#e7e0ec',
  '--md-sys-color-on-surface-variant': '#49454f',
  '--md-sys-color-surface-container-lowest': '#ffffff',
  '--md-sys-color-surface-container-low': '#f7f2fa',
  '--md-sys-color-surface-container': '#f3edf7',
  '--md-sys-color-surface-container-high': '#ece6f0',
  '--md-sys-color-surface-container-highest': '#e6e0e9',
  '--md-sys-color-surface-2': '#f3edf7',
  '--md-sys-color-surface-dim': '#ded8e1',
  '--md-sys-color-surface-bright': '#fef7ff',
  '--md-sys-color-inverse-surface': '#313033',
  '--md-sys-color-inverse-on-surface': '#f4eff4',
  '--md-sys-color-outline': '#79747e',
  '--md-sys-color-outline-variant': '#cac4d0',
}

const M3_BASELINE_DARK = {
  '--md-sys-color-primary': '#d0bcff',
  '--md-sys-color-on-primary': '#381e72',
  '--md-sys-color-primary-container': '#4f378b',
  '--md-sys-color-on-primary-container': '#eaddff',
  '--md-sys-color-secondary': '#ccc2dc',
  '--md-sys-color-on-secondary': '#332d41',
  '--md-sys-color-secondary-container': '#4a4458',
  '--md-sys-color-on-secondary-container': '#e8def8',
  '--md-sys-color-tertiary': '#efb8c8',
  '--md-sys-color-on-tertiary': '#492532',
  '--md-sys-color-tertiary-container': '#633b48',
  '--md-sys-color-on-tertiary-container': '#ffd8e4',
  '--md-sys-color-error': '#f2b8b5',
  '--md-sys-color-on-error': '#601410',
  '--md-sys-color-error-container': '#8c1d18',
  '--md-sys-color-on-error-container': '#f9dedc',
  '--md-sys-color-surface': '#1c1b1f',
  '--md-sys-color-on-surface': '#e6e1e5',
  '--md-sys-color-surface-variant': '#49454f',
  '--md-sys-color-on-surface-variant': '#cac4d0',
  '--md-sys-color-surface-container-lowest': '#0f0d13',
  '--md-sys-color-surface-container-low': '#1c1b1f',
  '--md-sys-color-surface-container': '#211f26',
  '--md-sys-color-surface-container-high': '#2b2930',
  '--md-sys-color-surface-container-highest': '#36343b',
  '--md-sys-color-surface-2': '#211f26',
  '--md-sys-color-surface-dim': '#141314',
  '--md-sys-color-surface-bright': '#36343b',
  '--md-sys-color-inverse-surface': '#e6e1e5',
  '--md-sys-color-inverse-on-surface': '#313033',
  '--md-sys-color-outline': '#938f99',
  '--md-sys-color-outline-variant': '#49454f',
}

// ====== 色彩工具 ======

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(1, s / 100))
  l = Math.max(0, Math.min(1, l / 100))

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r, g, b
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

function hexToHsl(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let hue = 0
  const l = (max + min) / 2
  let sat = 0

  if (max !== min) {
    const d = max - min
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60
    else if (max === g) hue = ((b - r) / d + 2) * 60
    else hue = ((r - g) / d + 4) * 60
  }

  return { h: hue, s: sat * 100, l: l * 100 }
}

// ====== M3 色板生成 ======

function generateLightTokens(hue, chroma) {
  const c = chroma / 100
  return {
    '--md-sys-color-primary': rgbToHex(...hslToRgb(hue, c * 100, 48)),
    '--md-sys-color-on-primary': '#ffffff',
    '--md-sys-color-primary-container': rgbToHex(...hslToRgb(hue, c * 72, 90)),
    '--md-sys-color-on-primary-container': rgbToHex(...hslToRgb(hue, c * 100, 16)),

    '--md-sys-color-secondary': rgbToHex(...hslToRgb((hue + 30) % 360, c * 36, 42)),
    '--md-sys-color-on-secondary': '#ffffff',
    '--md-sys-color-secondary-container': rgbToHex(...hslToRgb((hue + 30) % 360, c * 32, 89)),
    '--md-sys-color-on-secondary-container': rgbToHex(...hslToRgb((hue + 30) % 360, c * 36, 12)),

    '--md-sys-color-tertiary': rgbToHex(...hslToRgb((hue + 60) % 360, c * 58, 42)),
    '--md-sys-color-on-tertiary': '#ffffff',
    '--md-sys-color-tertiary-container': rgbToHex(...hslToRgb((hue + 60) % 360, c * 54, 89)),
    '--md-sys-color-on-tertiary-container': rgbToHex(...hslToRgb((hue + 60) % 360, c * 58, 12)),

    '--md-sys-color-error': rgbToHex(...hslToRgb(25, 72, 42)),
    '--md-sys-color-on-error': '#ffffff',
    '--md-sys-color-error-container': rgbToHex(...hslToRgb(25, 60, 91)),
    '--md-sys-color-on-error-container': rgbToHex(...hslToRgb(25, 72, 16)),

    '--md-sys-color-surface': rgbToHex(...hslToRgb(hue, c * 22, 98)),
    '--md-sys-color-on-surface': rgbToHex(...hslToRgb(hue, c * 18, 11)),
    '--md-sys-color-surface-variant': rgbToHex(...hslToRgb((hue + 30) % 360, c * 22, 89)),
    '--md-sys-color-on-surface-variant': rgbToHex(...hslToRgb((hue + 30) % 360, c * 22, 35)),

    '--md-sys-color-surface-container-lowest': '#ffffff',
    '--md-sys-color-surface-container-low': rgbToHex(...hslToRgb(hue, c * 14, 96)),
    '--md-sys-color-surface-container': rgbToHex(...hslToRgb(hue, c * 16, 94)),
    '--md-sys-color-surface-container-high': rgbToHex(...hslToRgb(hue, c * 18, 91)),
    '--md-sys-color-surface-container-highest': rgbToHex(...hslToRgb(hue, c * 20, 88)),

    '--md-sys-color-surface-2': rgbToHex(...hslToRgb(hue, c * 16, 94)),
    '--md-sys-color-surface-dim': rgbToHex(...hslToRgb(hue, c * 18, 86)),
    '--md-sys-color-bright': rgbToHex(...hslToRgb(hue, c * 22, 99)),

    '--md-sys-color-inverse-surface': rgbToHex(...hslToRgb(hue, c * 18, 19)),
    '--md-sys-color-inverse-on-surface': rgbToHex(...hslToRgb(hue, c * 14, 95)),

    '--md-sys-color-outline': rgbToHex(...hslToRgb((hue + 30) % 360, c * 18, 47)),
    '--md-sys-color-outline-variant': rgbToHex(...hslToRgb((hue + 30) % 360, c * 14, 77)),
  }
}

function generateDarkTokens(hue, chroma) {
  const c = chroma / 100
  return {
    '--md-sys-color-primary': rgbToHex(...hslToRgb(hue, c * 100, 82)),
    '--md-sys-color-on-primary': rgbToHex(...hslToRgb(hue, c * 100, 23)),
    '--md-sys-color-primary-container': rgbToHex(...hslToRgb(hue, c * 72, 36)),
    '--md-sys-color-on-primary-container': rgbToHex(...hslToRgb(hue, c * 72, 90)),

    '--md-sys-color-secondary': rgbToHex(...hslToRgb((hue + 30) % 360, c * 32, 78)),
    '--md-sys-color-on-secondary': rgbToHex(...hslToRgb((hue + 30) % 360, c * 36, 20)),
    '--md-sys-color-secondary-container': rgbToHex(...hslToRgb((hue + 30) % 360, c * 36, 29)),
    '--md-sys-color-on-secondary-container': rgbToHex(...hslToRgb((hue + 30) % 360, c * 32, 89)),

    '--md-sys-color-tertiary': rgbToHex(...hslToRgb((hue + 60) % 360, c * 54, 78)),
    '--md-sys-color-on-tertiary': rgbToHex(...hslToRgb((hue + 60) % 360, c * 58, 20)),
    '--md-sys-color-tertiary-container': rgbToHex(...hslToRgb((hue + 60) % 360, c * 58, 34)),
    '--md-sys-color-on-tertiary-container': rgbToHex(...hslToRgb((hue + 60) % 360, c * 54, 89)),

    '--md-sys-color-error': rgbToHex(...hslToRgb(25, 60, 82)),
    '--md-sys-color-on-error': rgbToHex(...hslToRgb(25, 72, 24)),
    '--md-sys-color-error-container': rgbToHex(...hslToRgb(25, 55, 36)),
    '--md-sys-color-on-error-container': rgbToHex(...hslToRgb(25, 60, 91)),

    '--md-sys-color-surface': rgbToHex(...hslToRgb(hue, c * 14, 11)),
    '--md-sys-color-on-surface': rgbToHex(...hslToRgb(hue, c * 10, 88)),
    '--md-sys-color-surface-variant': rgbToHex(...hslToRgb((hue + 30) % 360, c * 14, 30)),
    '--md-sys-color-on-surface-variant': rgbToHex(...hslToRgb((hue + 30) % 360, c * 14, 77)),

    '--md-sys-color-surface-container-lowest': rgbToHex(...hslToRgb(hue, c * 10, 6)),
    '--md-sys-color-surface-container-low': rgbToHex(...hslToRgb(hue, c * 12, 11)),
    '--md-sys-color-surface-container': rgbToHex(...hslToRgb(hue, c * 14, 13)),
    '--md-sys-color-surface-container-high': rgbToHex(...hslToRgb(hue, c * 16, 17)),
    '--md-sys-color-surface-container-highest': rgbToHex(...hslToRgb(hue, c * 18, 21)),

    '--md-sys-color-surface-2': rgbToHex(...hslToRgb(hue, c * 14, 13)),
    '--md-sys-color-surface-dim': rgbToHex(...hslToRgb(hue, c * 14, 8)),
    '--md-sys-color-bright': rgbToHex(...hslToRgb(hue, c * 14, 23)),

    '--md-sys-color-inverse-surface': rgbToHex(...hslToRgb(hue, c * 10, 88)),
    '--md-sys-color-inverse-on-surface': rgbToHex(...hslToRgb(hue, c * 10, 17)),

    '--md-sys-color-outline': rgbToHex(...hslToRgb((hue + 30) % 360, c * 14, 58)),
    '--md-sys-color-outline-variant': rgbToHex(...hslToRgb((hue + 30) % 360, c * 14, 30)),
  }
}

// ====== 主题应用 ======

/**
 * 从 HCT 参数应用主题
 * 当 hue/chroma 对应默认源色 #6750A4 时，使用 M3 规范精确 token
 */
export function applyThemeFromHCT(hue, chroma, darkMode) {
  const isDark =
    darkMode === 'dark' ||
    (darkMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  // 默认源色 #6750A4 的 HSL ≈ (270, 55, 44)，允许小范围偏差
  const isDefaultSource = Math.abs(hue - 270) < 5 && Math.abs(chroma - 55) < 5

  const tokens = isDefaultSource
    ? (isDark ? M3_BASELINE_DARK : M3_BASELINE_LIGHT)
    : (isDark ? generateDarkTokens(hue, chroma) : generateLightTokens(hue, chroma))

  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')

  for (const [key, value] of Object.entries(tokens)) {
    document.documentElement.style.setProperty(key, value)
  }

  // 页面背景：亮色用 surface，暗色用 surface-dim（对照 m3.material.io）
  const bgToken = isDark ? '--md-sys-color-surface-dim' : '--md-sys-color-surface'
  const bgFallback = isDark ? '#141314' : '#fffbfe'
  document.documentElement.style.setProperty('--mio-bg',
    tokens[bgToken] || getComputedStyle(document.documentElement).getPropertyValue(bgToken).trim() || bgFallback
  )
}

/**
 * 从 hex source color 反推 HCT 并应用
 */
export function applyThemeFromHex(hex, darkMode) {
  const hsl = hexToHsl(hex)
  applyThemeFromHCT(hsl.h, hsl.s, darkMode)
  return hsl
}

/**
 * 从 HCT 生成 hex 颜色（用于预览色块）
 */
export function hctToHex(hue, chroma) {
  return rgbToHex(...hslToRgb(hue, chroma, 50))
}

/**
 * 判断系统是否深色
 */
export function isSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
