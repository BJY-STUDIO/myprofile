<template>
  <div class="admin-view">
    <!-- 未登录：全屏登录表单 -->
    <div v-if="!authToken" class="admin-login">
      <div class="admin-login__card">
        <span class="material-symbols-rounded admin-login__icon">admin_panel_settings</span>
        <h1 class="admin-login__title">博客管理后台</h1>
        <p class="admin-login__desc">使用 Strapi CMS 管理员账号登录后即可管理内容</p>

        <form class="admin-login__form" @submit.prevent="onLogin">
          <md-outlined-text-field
            label="邮箱"
            type="email"
            id="admin-email"
            :value="loginEmail"
            @input="loginEmail = $event.target.value"
          ></md-outlined-text-field>
          <md-outlined-text-field
            label="密码"
            type="password"
            id="admin-password"
            :value="loginPassword"
            @input="loginPassword = $event.target.value"
          ></md-outlined-text-field>
          <div v-if="loginError" class="login-error">{{ loginError }}</div>
          <md-filled-button class="admin-login__submit" :disabled="loginLoading">
            {{ loginLoading ? '登录中...' : '登录' }}
          </md-filled-button>
        </form>

        <div class="admin-login__hint">
          <span class="material-symbols-rounded">open_in_new</span>
          <span>或前往 <a :href="strapiAdminUrl" target="_blank" rel="noopener noreferrer">Strapi 后台</a></span>
        </div>
      </div>
    </div>

    <!-- 已登录：模块内容（导航由 App.vue NavigationRail 处理） -->
    <template v-else>
      <ArticleManager v-if="activeModule === 'articles'" :token="authToken" />
      <CardStyleManager v-else-if="activeModule === 'cards'" :token="authToken" />
      <NavManager v-else-if="activeModule === 'navigation'" :token="authToken" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { strapiAdminLogin } from '@/services/articleService'
import ArticleManager from '@/components/admin/ArticleManager.vue'
import CardStyleManager from '@/components/admin/CardStyleManager.vue'
import NavManager from '@/components/admin/NavManager.vue'
import '@material/web/button/filled-button'
import '@material/web/textfield/outlined-text-field'

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

onMounted(() => {
  const cached = sessionStorage.getItem(ADMIN_TOKEN_KEY)
  if (cached) authToken.value = cached
})

async function onLogin() {
  loginLoading.value = true
  loginError.value = ''
  try {
    const token = await strapiAdminLogin(loginEmail.value, loginPassword.value)
    if (token) {
      authToken.value = token
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
      loginEmail.value = ''
      loginPassword.value = ''
    } else {
      loginError.value = '登录失败：未获取到令牌'
    }
  } catch (e) {
    loginError.value = '登录失败：' + (e.message || '未知错误')
  } finally {
    loginLoading.value = false
  }
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
/* ===== 登录页 ===== */
.admin-login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 24px;
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

/* ===== 暗色主题 ===== */
:global([data-theme="dark"]) .admin-login__card {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}
</style>
