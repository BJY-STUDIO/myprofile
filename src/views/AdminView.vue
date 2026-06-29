<template>
  <div class="admin-view">
    <!-- 未登录：全屏登录表单 -->
    <div v-if="!authToken" class="admin-login">
      <!-- ======== 缓冲进度条 ======== -->
      <md-linear-progress
        v-if="loader.loadingActive.value"
        :class="{ 'loading-progress--fading': loader.loadingFading.value }"
        class="loading-progress"
        :value="loader.progressValue.value"
        :buffer="loader.progressBuffer.value"
      ></md-linear-progress>

      <div class="admin-login__card" :class="{ 'admin-login__card--loading': loginLoading }">
        <span class="material-symbols-rounded admin-login__icon">admin_panel_settings</span>
        <h1 class="admin-login__title">博客管理后台</h1>
        <p class="admin-login__desc">使用 Strapi CMS 管理员账号登录后即可管理内容</p>

        <form class="admin-login__form" @submit.prevent="onLogin">
          <md-outlined-text-field
            label="邮箱"
            type="email"
            id="admin-email"
            :value="loginEmail"
            :disabled="loginLoading"
            @input="loginEmail = $event.target.value"
          ></md-outlined-text-field>
          <md-outlined-text-field
            label="密码"
            type="password"
            id="admin-password"
            :value="loginPassword"
            :disabled="loginLoading"
            @input="loginPassword = $event.target.value"
          ></md-outlined-text-field>
          <div v-if="loginError" class="login-error">{{ loginError }}</div>
          <md-filled-button class="admin-login__submit" :disabled="loginLoading">
            {{ loginLoading ? '登录中...' : '登录' }}
          </md-filled-button>
        </form>

        <div v-if="retryStatus" class="login-retry-status">
          <span class="material-symbols-rounded login-retry-status__icon">hourglass_top</span>
          <span class="login-retry-status__text">{{ retryStatus }}</span>
        </div>

        <div class="admin-login__hint">
          <span class="material-symbols-rounded">open_in_new</span>
          <span>或前往 <a :href="strapiAdminUrl" target="_blank" rel="noopener noreferrer">Strapi 后台</a></span>
        </div>
      </div>
    </div>

    <!-- 已登录：模块内容（导航由 App.vue NavigationRail 处理） -->
    <div v-else class="admin-content" :class="{ 'admin-content--fadein': contentFadeIn }">
      <ArticleManager v-if="activeModule === 'articles'" :token="authToken" />
      <CardStyleManager v-else-if="activeModule === 'cards'" :token="authToken" />
      <NavManager v-else-if="activeModule === 'navigation'" :token="authToken" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { strapiAdminLogin } from '@/services/articleService'
import { useAdminLoader } from '@/composables/useAdminLoader'
import ArticleManager from '@/components/admin/ArticleManager.vue'
import CardStyleManager from '@/components/admin/CardStyleManager.vue'
import NavManager from '@/components/admin/NavManager.vue'
import '@material/web/button/filled-button'
import '@material/web/textfield/outlined-text-field'
import '@material/web/progress/linear-progress'

const route = useRoute()
const router = useRouter()

// ===== Strapi 配置 =====
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:1337/api').replace(/\/api$/, '')
const strapiAdminUrl = `${API_BASE}/admin`

// ===== 认证状态 =====
const ADMIN_TOKEN_KEY = 'strapi-admin-token'
const authToken = ref('')
const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref('')
const loginLoading = ref(false)
const retryStatus = ref('')

// ===== 登录后内容 fadeIn =====
const contentFadeIn = ref(false)

// ===== 进度条 + 冷启动重试 =====
const loader = useAdminLoader()

// 冷启动重试常量
const RETRY_BASE_DELAY = 3000
const RETRY_MAX_DELAY = 30000
const MAX_RETRY_ATTEMPTS = 5

onMounted(() => {
  const cached = sessionStorage.getItem(ADMIN_TOKEN_KEY)
  if (cached) {
    authToken.value = cached
    // 已有 token 时也需要 fadeIn
    requestAnimationFrame(() => {
      contentFadeIn.value = true
    })
  }
})

async function onLogin() {
  loginLoading.value = true
  loginError.value = ''
  retryStatus.value = ''

  // 启动进度条
  loader.startProgressAnimation(0, 0.2)

  // 首次尝试
  try {
    const token = await strapiAdminLogin(loginEmail.value, loginPassword.value)
    if (token) {
      onLoginSuccess(token)
      return
    }
    loginError.value = '登录失败：未获取到令牌'
    loader.transitionToLoaded(true)
  } catch (e) {
    console.warn('[AdminView] 首次登录失败，启动冷启动重试:', e.message)
    // 开始指数退避重试
    let attempt = 0
    while (attempt < MAX_RETRY_ATTEMPTS) {
      attempt++
      const delay = Math.min(RETRY_BASE_DELAY * Math.pow(2, attempt - 1), RETRY_MAX_DELAY)
      retryStatus.value = `服务器唤醒中，第 ${attempt}/${MAX_RETRY_ATTEMPTS} 次重试（${Math.round(delay / 1000)}秒后）...`

      // 进度条跳进
      loader.onRetryAttempt(attempt)

      await new Promise(resolve => setTimeout(resolve, delay))

      try {
        retryStatus.value = `正在尝试第 ${attempt}/${MAX_RETRY_ATTEMPTS} 次登录...`
        const token = await strapiAdminLogin(loginEmail.value, loginPassword.value)
        if (token) {
          onLoginSuccess(token)
          return
        }
      } catch {
        console.warn(`[AdminView] 重试 ${attempt}/${MAX_RETRY_ATTEMPTS} 失败`)
      }
    }

    // 所有重试耗尽
    loginError.value = '登录失败：服务器无法连接，请稍后再试'
    retryStatus.value = ''
    loader.transitionToLoaded(true)
  } finally {
    loginLoading.value = false
  }
}

function onLoginSuccess(token) {
  authToken.value = token
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
  loginEmail.value = ''
  loginPassword.value = ''
  loginError.value = ''
  retryStatus.value = ''

  // 进度条完成 + fadeOut
  loader.progressValue.value = 1
  loader.progressBuffer.value = 1
  loader.fadeOutProgress()

  // 内容 fadeIn
  nextTick(() => {
    requestAnimationFrame(() => {
      contentFadeIn.value = true
    })
  })
}

// ===== 模块切换（由 NavigationRail 通过 route.query.tab 驱动） =====
const activeModule = computed(() => route.query.tab || 'articles')

// 登录后确保 URL 有 tab 参数
watch([authToken, () => route.query.tab], ([token, tab]) => {
  if (token && route.path === '/admin' && !tab) {
    router.replace({ path: '/admin', query: { tab: 'articles' } })
  }
}, { immediate: true })
</script>

<style scoped>
/* ===== Admin View 根容器 ===== */
.admin-view {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

/* ===== 登录页 ===== */
.admin-login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 48px 24px;
  position: relative;
  flex: 1;
}

/* ======== 缓冲进度条 ======== */
.loading-progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100%;
  --md-linear-progress-active-indicator-color: var(--md-sys-color-primary, #6750a4);
  --md-linear-progress-track-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
  transition: opacity 400ms ease-out;
}

.loading-progress--fading {
  opacity: 0;
}

.admin-login__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 420px;
  width: 100%;
  padding: 48px 32px;
  border-radius: 28px;
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
  transition: opacity 0.3s ease;
  animation: login-card-enter 200ms linear 200ms both;
}

.admin-login__card--loading {
  opacity: 0.85;
}

@keyframes login-card-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.admin-login__icon {
  font-size: 48px;
  color: var(--md-sys-color-primary, #6750a4);
  margin-bottom: 16px;
}

.admin-login__title {
  font-family: var(--md-sys-typescale-headline-m-font-family);
  font-size: var(--md-sys-typescale-headline-m-font-size);
  font-weight: var(--md-sys-typescale-headline-m-font-weight);
  letter-spacing: var(--md-sys-typescale-headline-m-letter-spacing);
  line-height: var(--md-sys-typescale-headline-m-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-headline-m-font-variation-GRAD), "opsz" var(--md-sys-typescale-headline-m-font-variation-opsz);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0 0 8px;
}

.admin-login__desc {
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin: 0 0 32px;
  text-align: center;
  line-height: 1.5;
}

.admin-login__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.admin-login__submit {
  margin-top: 8px;
  width: 100%;
}

.admin-login__hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.admin-login__hint a {
  color: var(--md-sys-color-primary, #6750a4);
  text-decoration: none;
}

.admin-login__hint a:hover {
  text-decoration: underline;
}

.login-error {
  font-size: 13px;
  color: var(--md-sys-color-error, #b3261e);
}

/* ===== 重试状态提示 ===== */
.login-retry-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--md-sys-color-tertiary-container, #ffd8e4);
}

.login-retry-status__icon {
  font-size: 18px;
  color: var(--md-sys-color-on-tertiary-container, #31111d);
  animation: spin 1.5s linear infinite;
}

.login-retry-status__text {
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  color: var(--md-sys-color-on-tertiary-container, #31111d);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ===== 已登录内容 fadeIn ===== */
/* 仅用 opacity 过渡，不用 transform:translateY 避免影响布局高度 */
/* opacity:0 不影响文档流占位，元素仍占空间，滚动条不会因高度变化闪烁 */
.admin-content {
  opacity: 0;
}

.admin-content--fadein {
  animation: admin-content-fadein 200ms linear both;
}

@keyframes admin-content-fadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ===== 暗色主题 ===== */
:global([data-theme="dark"]) .admin-login__card {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .login-retry-status {
  background: var(--md-sys-color-tertiary-container, #31111d);
}

:global([data-theme="dark"]) .login-retry-status__icon,
:global([data-theme="dark"]) .login-retry-status__text {
  color: var(--md-sys-color-on-tertiary-container, #ffd8e4);
}
</style>
