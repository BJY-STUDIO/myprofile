/**
 * M3 主题管理系统
 * 支持色彩方案切换 + 浅色/深色模式
 * 
 * 参照 material-web.dev 的主题切换模式：
 * - 6 种色彩来源色（Purple/Blue/Red/Orange/Green/Cyan）
 * - 每种色彩自动生成完整的 M3 色彩令牌
 * - 浅色/深色/跟随系统 三种模式
 */

// ====== HCT 色彩工具（简化版，用于从 seed color 生成 M3 色板）======
// 基于 Material Color Utilities 的核心算法，简化实现

function hexToArgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
    a: 255,
  }
}

function argbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

// 简化的 HSL 转 RGB
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(1, s))
  l = Math.max(0, Math.min(1, l))

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

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

// ====== M3 色板生成器 ======
// 从 seed color 生成一套完整的 M3 色彩令牌
// 使用简化算法，对色相 hue 做偏移，对饱和度和亮度做 M3 标准映射

function generateSchemeFromSeed(hexSeed) {
  const { r, g, b } = hexToArgb(hexSeed)

  // 简易 RGB→HSL
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
    else if (max === gn) h = ((bn - rn) / d + 2) * 60
    else h = ((rn - gn) / d + 4) * 60
  }

  // M3 标准色相偏移
  const primaryHue = h
  const secondaryHue = (h + 30) % 360
  const tertiaryHue = (h + 60) % 360
  const errorHue = 25 // M3 固定 error hue

  return {
    // 浅色方案
    light: generateLightTokens(primaryHue, secondaryHue, tertiaryHue, errorHue),
    // 深色方案
    dark: generateDarkTokens(primaryHue, secondaryHue, tertiaryHue, errorHue),
  }
}

function generateLightTokens(ph, sh, th, eh) {
  return {
    '--md-sys-color-primary': argbToHex(...Object.values(hslToRgb(ph, 0.55, 0.48))),
    '--md-sys-color-on-primary': '#ffffff',
    '--md-sys-color-primary-container': argbToHex(...Object.values(hslToRgb(ph, 0.40, 0.90))),
    '--md-sys-color-on-primary-container': argbToHex(...Object.values(hslToRgb(ph, 0.55, 0.16))),

    '--md-sys-color-secondary': argbToHex(...Object.values(hslToRgb(sh, 0.20, 0.42))),
    '--md-sys-color-on-secondary': '#ffffff',
    '--md-sys-color-secondary-container': argbToHex(...Object.values(hslToRgb(sh, 0.18, 0.89))),
    '--md-sys-color-on-secondary-container': argbToHex(...Object.values(hslToRgb(sh, 0.20, 0.12))),

    '--md-sys-color-tertiary': argbToHex(...Object.values(hslToRgb(th, 0.32, 0.42))),
    '--md-sys-color-on-tertiary': '#ffffff',
    '--md-sys-color-tertiary-container': argbToHex(...Object.values(hslToRgb(th, 0.30, 0.89))),
    '--md-sys-color-on-tertiary-container': argbToHex(...Object.values(hslToRgb(th, 0.32, 0.12))),

    '--md-sys-color-error': argbToHex(...Object.values(hslToRgb(eh, 0.72, 0.42))),
    '--md-sys-color-on-error': '#ffffff',
    '--md-sys-color-error-container': argbToHex(...Object.values(hslToRgb(eh, 0.60, 0.91))),
    '--md-sys-color-on-error-container': argbToHex(...Object.values(hslToRgb(eh, 0.72, 0.16))),

    '--md-sys-color-surface': argbToHex(...Object.values(hslToRgb(ph, 0.12, 0.98))),
    '--md-sys-color-on-surface': argbToHex(...Object.values(hslToRgb(ph, 0.10, 0.11))),
    '--md-sys-color-on-surface-variant': argbToHex(...Object.values(hslToRgb(sh, 0.12, 0.35))),

    '--md-sys-color-surface-container-lowest': '#ffffff',
    '--md-sys-color-surface-container-low': argbToHex(...Object.values(hslToRgb(ph, 0.08, 0.96))),
    '--md-sys-color-surface-container': argbToHex(...Object.values(hslToRgb(ph, 0.09, 0.94))),
    '--md-sys-color-surface-container-high': argbToHex(...Object.values(hslToRgb(ph, 0.10, 0.91))),
    '--md-sys-color-surface-container-highest': argbToHex(...Object.values(hslToRgb(ph, 0.11, 0.88))),

    '--md-sys-color-surface-dim': argbToHex(...Object.values(hslToRgb(ph, 0.10, 0.86))),
    '--md-sys-color-surface-bright': argbToHex(...Object.values(hslToRgb(ph, 0.12, 0.99))),

    '--md-sys-color-inverse-surface': argbToHex(...Object.values(hslToRgb(ph, 0.10, 0.19))),
    '--md-sys-color-inverse-on-surface': argbToHex(...Object.values(hslToRgb(ph, 0.08, 0.95))),

    '--md-sys-color-outline': argbToHex(...Object.values(hslToRgb(sh, 0.10, 0.47))),
    '--md-sys-color-outline-variant': argbToHex(...Object.values(hslToRgb(sh, 0.08, 0.77))),
  }
}

function generateDarkTokens(ph, sh, th, eh) {
  return {
    '--md-sys-color-primary': argbToHex(...Object.values(hslToRgb(ph, 0.55, 0.82))),
    '--md-sys-color-on-primary': argbToHex(...Object.values(hslToRgb(ph, 0.55, 0.23))),
    '--md-sys-color-primary-container': argbToHex(...Object.values(hslToRgb(ph, 0.40, 0.36))),
    '--md-sys-color-on-primary-container': argbToHex(...Object.values(hslToRgb(ph, 0.40, 0.90))),

    '--md-sys-color-secondary': argbToHex(...Object.values(hslToRgb(sh, 0.18, 0.78))),
    '--md-sys-color-on-secondary': argbToHex(...Object.values(hslToRgb(sh, 0.20, 0.20))),
    '--md-sys-color-secondary-container': argbToHex(...Object.values(hslToRgb(sh, 0.20, 0.29))),
    '--md-sys-color-on-secondary-container': argbToHex(...Object.values(hslToRgb(sh, 0.18, 0.89))),

    '--md-sys-color-tertiary': argbToHex(...Object.values(hslToRgb(th, 0.30, 0.78))),
    '--md-sys-color-on-tertiary': argbToHex(...Object.values(hslToRgb(th, 0.32, 0.20))),
    '--md-sys-color-tertiary-container': argbToHex(...Object.values(hslToRgb(th, 0.32, 0.34))),
    '--md-sys-color-on-tertiary-container': argbToHex(...Object.values(hslToRgb(th, 0.30, 0.89))),

    '--md-sys-color-error': argbToHex(...Object.values(hslToRgb(eh, 0.60, 0.82))),
    '--md-sys-color-on-error': argbToHex(...Object.values(hslToRgb(eh, 0.72, 0.24))),
    '--md-sys-color-error-container': argbToHex(...Object.values(hslToRgb(eh, 0.55, 0.36))),
    '--md-sys-color-on-error-container': argbToHex(...Object.values(hslToRgb(eh, 0.60, 0.91))),

    '--md-sys-color-surface': argbToHex(...Object.values(hslToRgb(ph, 0.08, 0.11))),
    '--md-sys-color-on-surface': argbToHex(...Object.values(hslToRgb(ph, 0.06, 0.88))),
    '--md-sys-color-on-surface-variant': argbToHex(...Object.values(hslToRgb(sh, 0.08, 0.77))),

    '--md-sys-color-surface-container-lowest': argbToHex(...Object.values(hslToRgb(ph, 0.06, 0.06))),
    '--md-sys-color-surface-container-low': argbToHex(...Object.values(hslToRgb(ph, 0.07, 0.11))),
    '--md-sys-color-surface-container': argbToHex(...Object.values(hslToRgb(ph, 0.08, 0.13))),
    '--md-sys-color-surface-container-high': argbToHex(...Object.values(hslToRgb(ph, 0.09, 0.17))),
    '--md-sys-color-surface-container-highest': argbToHex(...Object.values(hslToRgb(ph, 0.10, 0.21))),

    '--md-sys-color-surface-dim': argbToHex(...Object.values(hslToRgb(ph, 0.08, 0.08))),
    '--md-sys-color-surface-bright': argbToHex(...Object.values(hslToRgb(ph, 0.08, 0.23))),

    '--md-sys-color-inverse-surface': argbToHex(...Object.values(hslToRgb(ph, 0.06, 0.88))),
    '--md-sys-color-inverse-on-surface': argbToHex(...Object.values(hslToRgb(ph, 0.06, 0.17))),

    '--md-sys-color-outline': argbToHex(...Object.values(hslToRgb(sh, 0.08, 0.58))),
    '--md-sys-color-outline-variant': argbToHex(...Object.values(hslToRgb(sh, 0.08, 0.30))),
  }
}

// ====== 预设色彩方案 ======
export const COLOR_SCHEMES = [
  { id: 'purple', label: '紫韵', seed: '#6750a4', color: '#6750a4' },
  { id: 'blue', label: '碧蓝', seed: '#0061a4', color: '#0061a4' },
  { id: 'red', label: '朱砂', seed: '#b5261e', color: '#b5261e' },
  { id: 'orange', label: '暖橙', seed: '#8b5000', color: '#8b5000' },
  { id: 'green', label: '翠绿', seed: '#006d3b', color: '#006d3b' },
  { id: 'cyan', label: '青碧', seed: '#006878', color: '#006878' },
]

export const DARK_MODE_OPTIONS = [
  { id: 'system', label: '跟随系统', icon: 'brightness_medium' },
  { id: 'light', label: '浅色', icon: 'light_mode' },
  { id: 'dark', label: '深色', icon: 'dark_mode' },
]

// ====== 主题应用 ======

/**
 * 应用主题到 document.documentElement
 * @param {string} schemeId - 色彩方案 ID
 * @param {string} darkMode - 'system' | 'light' | 'dark'
 */
export function applyTheme(schemeId, darkMode = 'system') {
  const scheme = COLOR_SCHEMES.find((s) => s.id === schemeId) || COLOR_SCHEMES[0]
  const tokens = generateSchemeFromSeed(scheme.seed)

  const isDark =
    darkMode === 'dark' ||
    (darkMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const selected = isDark ? tokens.dark : tokens.light

  // 设置 data 属性用于 CSS 选择器
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  document.documentElement.setAttribute('data-color-scheme', schemeId)

  // 应用令牌到 :root
  for (const [key, value] of Object.entries(selected)) {
    document.documentElement.style.setProperty(key, value)
  }
}

/**
 * 获取当前系统是否为深色
 */
export function isSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
