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

    <!-- 已登录：管理界面 -->
    <div v-else class="admin-shell">
      <!-- 管理 nav rail -->
      <nav class="admin-rail">
        <div class="admin-rail__top">
          <a
            v-for="item in railItems"
            :key="item.id"
            class="admin-rail__destination"
            :class="{ 'admin-rail__destination--active': activeModule === item.id }"
            @click="activeModule = item.id"
          >
            <span class="admin-rail__icon">
              <span class="admin-rail__icon-glyph material-symbols-rounded">{{ item.icon }}</span>
            </span>
            <span class="admin-rail__label">{{ item.label }}</span>
          </a>
        </div>
        <div class="admin-rail__bottom">
          <md-divider></md-divider>
          <button class="admin-rail__logout" @click="onLogout" aria-label="退出登录">
            <span class="material-symbols-rounded">logout</span>
            <span class="admin-rail__label">退出</span>
          </button>
        </div>
      </nav>

      <!-- 内容区 -->
      <div class="admin-content">
        <ArticleManager v-if="activeModule === 'articles'" :token="authToken" />
        <CardStyleManager v-else-if="activeModule === 'cards'" :token="authToken" />
        <NavManager v-else-if="activeModule === 'navigation'" :token="authToken" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { strapiAdminLogin } from '@/services/articleService'
import ArticleManager from '@/components/admin/ArticleManager.vue'
import CardStyleManager from '@/components/admin/CardStyleManager.vue'
import NavManager from '@/components/admin/NavManager.vue'
import '@material/web/button/filled-button'
import '@material/web/button/text-button'
import '@material/web/textfield/outlined-text-field'
import '@material/web/divider/divider'

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

function onLogout() {
  authToken.value = ''
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}

// ===== 管理 nav rail =====
const railItems = [
  { id: 'articles', label: '文章', icon: 'article' },
  { id: 'cards', label: '卡片', icon: 'dashboard' },
  { id: 'navigation', label: '导航', icon: 'menu' },
]
const activeModule = ref('articles')
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

/* ===== 管理界面 ===== */
.admin-shell {
  display: flex;
  width: 100%;
  min-height: 70vh;
}

/* ===== 管理 nav rail ===== */
.admin-rail {
  display: flex;
  flex-direction: column;
  width: 80px;
  flex-shrink: 0;
  background: var(--md-sys-color-surface-2, #f3edf7);
  border-radius: 16px;
  margin-right: 16px;
  overflow: hidden;
}

.admin-rail__top {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 16px;
  gap: 4px;
}

.admin-rail__destination {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  padding: 8px 0;
  cursor: pointer;
  text-decoration: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  border: none;
  background: none;
  font-family: inherit;
}

.admin-rail__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 56px;
  height: 32px;
  margin-bottom: 4px;
  border-radius: 16px;
  transition: background 0.2s linear;
}

/* Indicator pill */
.admin-rail__icon::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 100px;
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  opacity: 0;
  transform: scaleX(0.32);
  transition: transform 0.2s linear, opacity 0.2s linear;
}

.admin-rail__destination--active .admin-rail__icon::before {
  opacity: 1;
  transform: scaleX(1);
}

.admin-rail__icon-glyph {
  font-size: 24px;
  font-variation-settings: "FILL" 0, "wght" 400, "opsz" 24;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  z-index: 1;
}

.admin-rail__destination--active .admin-rail__icon-glyph {
  font-variation-settings: "FILL" 1, "wght" 400, "opsz" 24;
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.admin-rail__destination:not(.admin-rail__destination--active):hover .admin-rail__icon-glyph {
  font-variation-settings: "FILL" 0, "wght" 600, "opsz" 24;
}

.admin-rail__label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1px;
  line-height: 16px;
  text-align: center;
  font-variation-settings: "GRAD" 0;
  transition: font-variation-settings 0.2s cubic-bezier(0.2, 0, 0, 1),
              color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.admin-rail__destination--active .admin-rail__label {
  color: var(--md-sys-color-on-secondary-container, #1d192b);
  font-variation-settings: "GRAD" 125;
}

.admin-rail__destination:not(.admin-rail__destination--active):hover .admin-rail__label {
  font-variation-settings: "GRAD" 50;
}

.admin-rail__bottom {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 16px;
}

.admin-rail__bottom md-divider {
  width: 56px;
  margin-bottom: 8px;
}

.admin-rail__logout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
  cursor: pointer;
  border: none;
  background: none;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  font-family: inherit;
  font-size: inherit;
  width: 80px;
}

.admin-rail__logout .material-symbols-rounded {
  font-size: 24px;
  font-variation-settings: "FILL" 0, "wght" 400, "opsz" 24;
}

.admin-rail__logout:hover .material-symbols-rounded {
  font-variation-settings: "FILL" 0, "wght" 600, "opsz" 24;
}

.admin-rail__logout:hover {
  color: var(--md-sys-color-error, #b3261e);
}

/* ===== 内容区 ===== */
.admin-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

/* ===== 暗色主题 ===== */
:global([data-theme="dark"]) .admin-login__card {
  background: var(--md-sys-color-surface-container-low, #1d1b20);
}

:global([data-theme="dark"]) .admin-rail {
  background: var(--md-sys-color-surface-2, #1d1b20);
}

:global([data-theme="dark"]) .admin-rail__icon::before {
  background-color: var(--md-sys-color-secondary-container, #4a4458);
}

:global([data-theme="dark"]) .admin-rail__destination--active .admin-rail__icon-glyph {
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

:global([data-theme="dark"]) .admin-rail__destination--active .admin-rail__label {
  color: var(--md-sys-color-on-secondary-container, #e8def8);
}

/* ===== 移动端 ===== */
@media screen and (max-width: 600px) {
  .admin-login__card {
    padding: 32px 24px;
  }

  .admin-shell {
    flex-direction: column;
  }

  .admin-rail {
    width: 100%;
    flex-direction: row;
    margin-right: 0;
    margin-bottom: 12px;
    border-radius: 16px;
    height: auto;
  }

  .admin-rail__top {
    flex-direction: row;
    padding-top: 4px;
    padding-bottom: 4px;
    justify-content: center;
    gap: 0;
  }

  .admin-rail__destination {
    width: auto;
    padding: 8px 12px;
  }

  .admin-rail__bottom {
    display: none;
  }

  .admin-content {
    overflow-y: visible;
  }
}
</style>
