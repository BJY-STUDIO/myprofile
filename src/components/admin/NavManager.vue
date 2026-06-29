<template>
  <div class="nav-manager">
    <div class="section-title">
      <h2>导航菜单管理</h2>
      <div class="section-title__actions">
        <md-filled-tonal-button v-if="isLoggedIn" @click="onAddNav">
          <span class="material-symbols-rounded" slot="icon">add</span>
          添加一级菜单
        </md-filled-tonal-button>
        <md-outlined-button v-if="!isLoggedIn" @click="showLoginDialog = true">
          <span class="material-symbols-rounded" slot="icon">login</span>
          登录 Strapi
        </md-outlined-button>
        <md-text-button v-else @click="onLogout">
          <span class="material-symbols-rounded" slot="icon">logout</span>
          退出登录
        </md-text-button>
      </div>
    </div>

    <!-- 连接状态提示 -->
    <div v-if="!isLoggedIn" class="admin-notice">
      <span class="material-symbols-rounded admin-notice__icon">info</span>
      <span class="admin-notice__text">需要登录 Strapi 才能编辑导航菜单。当前为只读模式。</span>
    </div>

    <!-- 操作提示 -->
    <div v-if="operationMessage" class="operation-notice" :class="{ 'operation-notice--error': operationError }">
      <span class="material-symbols-rounded operation-notice__icon">{{ operationError ? 'error' : 'check_circle' }}</span>
      <span class="operation-notice__text">{{ operationMessage }}</span>
    </div>

    <!-- 一级菜单列表 -->
    <div class="nav-list">
      <div
        v-for="(item, i) in navItems"
        :key="item.id"
        class="nav-card"
      >
        <div class="nav-card__header">
          <span class="material-symbols-rounded nav-card__icon">{{ item.icon }}</span>
          <div class="nav-card__info">
            <span class="nav-card__label">{{ item.label }}</span>
            <span class="nav-card__route">{{ item.route }}</span>
          </div>
          <div v-if="isLoggedIn" class="nav-card__actions">
            <md-icon-button @click="editNav = i; pickedIcon = navItems[i]?.icon || 'article'; showNavDialog = true">
              <span class="material-symbols-rounded">edit</span>
            </md-icon-button>
            <md-icon-button @click="removeNav(i)">
              <span class="material-symbols-rounded">delete</span>
            </md-icon-button>
          </div>
        </div>

        <!-- 二级菜单 -->
        <div v-if="item.children?.length" class="sub-list">
          <div
            v-for="(sub, j) in item.children"
            :key="sub.id"
            class="sub-item"
          >
            <span class="sub-item__label">{{ sub.label }}</span>
            <span class="sub-item__route">{{ sub.route }}</span>
            <div v-if="isLoggedIn" class="sub-item__actions">
              <md-icon-button @click="editSub = { p: i, s: j }; showSubDialog = true">
                <span class="material-symbols-rounded">edit</span>
              </md-icon-button>
              <md-icon-button @click="removeSub(i, j)">
                <span class="material-symbols-rounded">delete</span>
              </md-icon-button>
            </div>
          </div>
        </div>
        <md-text-button v-if="isLoggedIn" class="add-sub-btn" @click="parentForSub = i; showSubDialog = true">
          <span class="material-symbols-rounded" slot="icon">add</span>
          添加子菜单
        </md-text-button>
      </div>
    </div>

    <!-- Strapi 登录对话框 -->
    <md-dialog :open="showLoginDialog" @close="showLoginDialog = false">
      <div slot="headline">登录 Strapi</div>
      <form slot="content" class="dialog-form" id="login-form" @submit.prevent>
        <md-outlined-text-field
          label="邮箱"
          type="email"
          id="login-email"
          :value="loginEmail"
          @input="loginEmail = $event.target.value"
        ></md-outlined-text-field>
        <md-outlined-text-field
          label="密码"
          type="password"
          id="login-password"
          :value="loginPassword"
          @input="loginPassword = $event.target.value"
        ></md-outlined-text-field>
        <div v-if="loginError" class="login-error">{{ loginError }}</div>
      </form>
      <div slot="actions">
        <md-text-button @click="showLoginDialog = false">取消</md-text-button>
        <md-filled-button form="login-form" @click="onLogin" :disabled="loginLoading">
          {{ loginLoading ? '登录中...' : '登录' }}
        </md-filled-button>
      </div>
    </md-dialog>

    <!-- 一级菜单编辑对话框 -->
    <md-dialog :open="showNavDialog" @close="showNavDialog = false">
      <div slot="headline">{{ editNav >= 0 ? '编辑菜单' : '添加菜单' }}</div>
      <form slot="content" class="dialog-form" id="nav-form" @submit.prevent>
        <md-outlined-text-field label="名称" :value="editNav >= 0 ? navItems[editNav]?.label : ''" id="nav-label"></md-outlined-text-field>
        <md-outlined-text-field label="路由" :value="editNav >= 0 ? navItems[editNav]?.route : ''" id="nav-route"></md-outlined-text-field>
        <md-outlined-text-field label="导航 ID（英文标识）" :value="editNav >= 0 ? navItems[editNav]?.id : ''" id="nav-id"></md-outlined-text-field>
        <div class="icon-field">
          <label class="icon-field__label">图标</label>
          <div class="icon-field__preview">
            <span class="material-symbols-rounded">{{ pickedIcon || (editNav >= 0 ? navItems[editNav]?.icon : 'article') }}</span>
            <md-outlined-button @click="toggleIconPicker" type="button">选择图标</md-outlined-button>
          </div>
          <IconPicker v-if="showIconPicker" :modelValue="pickedIcon || (editNav >= 0 ? navItems[editNav]?.icon : 'article')" @update:modelValue="onPickIcon" class="icon-field__picker" />
        </div>
      </form>
      <div slot="actions">
        <md-text-button form="nav-form" @click="showNavDialog = false">取消</md-text-button>
        <md-filled-button form="nav-form" @click="onSaveNav" :disabled="saving">保存</md-filled-button>
      </div>
    </md-dialog>

    <!-- 二级菜单编辑对话框 -->
    <md-dialog :open="showSubDialog" @close="showSubDialog = false">
      <div slot="headline">{{ editSub ? '编辑' : '添加' }}子菜单</div>
      <form slot="content" class="dialog-form" id="sub-form" @submit.prevent>
        <md-outlined-text-field label="名称" :value="editSub ? navItems[editSub.p]?.children?.[editSub.s]?.label : ''" id="sub-label"></md-outlined-text-field>
        <md-outlined-text-field label="路由" :value="editSub ? navItems[editSub.p]?.children?.[editSub.s]?.route : ''" id="sub-route"></md-outlined-text-field>
        <md-outlined-text-field label="导航 ID" :value="editSub ? navItems[editSub.p]?.children?.[editSub.s]?.id : ''" id="sub-id"></md-outlined-text-field>
      </form>
      <div slot="actions">
        <md-text-button @click="showSubDialog = false">取消</md-text-button>
        <md-filled-button @click="onSaveSub" :disabled="saving">保存</md-filled-button>
      </div>
    </md-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useNavItems, refreshNavItems } from '@/stores/blogStore'
import {
  strapiAdminLogin,
  createNavItem,
  updateNavItemApi,
  deleteNavItemApi,
} from '@/services/articleService'
import IconPicker from './IconPicker.vue'
import '@material/web/button/filled-button'
import '@material/web/button/filled-tonal-button'
import '@material/web/button/outlined-button'
import '@material/web/button/text-button'
import '@material/web/iconbutton/icon-button'
import '@material/web/dialog/dialog'
import '@material/web/textfield/outlined-text-field'

const {
  navItems: getNavItems,
  optimisticAdd,
  optimisticUpdate,
  optimisticRemove,
  optimisticAddSub,
  optimisticUpdateSub,
  optimisticRemoveSub,
} = useNavItems()

const navItems = computed(() => getNavItems())

// ===== Strapi 登录状态 =====
const ADMIN_TOKEN_KEY = 'strapi-admin-token'
const isLoggedIn = ref(false)
const showLoginDialog = ref(false)
const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref('')
const loginLoading = ref(false)

// 操作状态
const saving = ref(false)
const operationMessage = ref('')
const operationError = ref(false)

function getToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

function setToken(token) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
  isLoggedIn.value = true
}

function clearToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
  isLoggedIn.value = false
}

onMounted(() => {
  // 恢复登录状态
  if (getToken()) {
    isLoggedIn.value = true
  }
})

async function onLogin() {
  loginLoading.value = true
  loginError.value = ''
  try {
    const token = await strapiAdminLogin(loginEmail.value, loginPassword.value)
    if (token) {
      setToken(token)
      showLoginDialog.value = false
      loginEmail.value = ''
      loginPassword.value = ''
      showNotice('登录成功')
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
  clearToken()
  showNotice('已退出登录')
}

// ===== 操作提示 =====
let noticeTimer = null
function showNotice(msg, isError = false) {
  operationMessage.value = msg
  operationError.value = isError
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    operationMessage.value = ''
  }, 4000)
}

// ===== 图标选择 =====
const showIconPicker = ref(false)
const pickedIcon = ref('')

function onPickIcon(icon) {
  pickedIcon.value = icon
}

function toggleIconPicker() {
  showIconPicker.value = !showIconPicker.value
  if (showIconPicker.value) {
    nextTick(() => {
      requestAnimationFrame(() => {
        const dialog = document.querySelector('md-dialog[open]')
        if (!dialog) return
        const scroller = dialog.shadowRoot?.querySelector('.scroller')
        if (scroller) {
          scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
        }
      })
    })
  }
}

// ===== 导航菜单 CRUD =====

// 添加一级菜单
const showNavDialog = ref(false)
const editNav = ref(-1)

function onAddNav() {
  editNav.value = -1
  pickedIcon.value = 'article'
  showIconPicker.value = false
  showNavDialog.value = true
}

async function onSaveNav() {
  const label = document.getElementById('nav-label')?.value?.trim() || '新菜单'
  const route = document.getElementById('nav-route')?.value?.trim() || '/'
  const navId = document.getElementById('nav-id')?.value?.trim() || `nav-${Date.now()}`
  const icon = pickedIcon.value || (editNav.value >= 0 ? navItems.value[editNav.value]?.icon : 'article')

  const token = getToken()
  if (!token) {
    showNotice('请先登录 Strapi', true)
    return
  }

  saving.value = true
  try {
    if (editNav.value >= 0) {
      // 编辑现有菜单
      const item = navItems.value[editNav.value]
      const docId = item._documentId

      if (docId) {
        // 通过 Strapi API 更新
        await updateNavItemApi(token, docId, {
          title: label,
          icon,
          route,
          navId,
        })
        optimisticUpdate(editNav.value, { label, icon, route, id: navId })
        await refreshNavItems()
        showNotice('菜单已更新')
      } else {
        // 没 _documentId（来自默认数据），先创建
        const sortOrder = editNav.value
        const result = await createNavItem(token, {
          title: label,
          icon,
          route,
          navId,
          sortOrder,
        })
        optimisticUpdate(editNav.value, { label, icon, route, id: navId, _documentId: result.documentId })
        await refreshNavItems()
        showNotice('菜单已同步到 Strapi')
      }
    } else {
      // 添加新菜单
      const sortOrder = navItems.value.length
      const result = await createNavItem(token, {
        title: label,
        icon,
        route,
        navId,
        sortOrder,
      })
      optimisticAdd({
        id: navId,
        label,
        icon,
        route,
        _documentId: result.documentId,
      })
      await refreshNavItems()
      showNotice('菜单已创建')
    }
    showNavDialog.value = false
  } catch (e) {
    showNotice('操作失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

async function removeNav(i) {
  const item = navItems.value[i]
  if (!confirm(`确认删除「${item?.label}」？`)) return

  const token = getToken()
  if (!token) {
    showNotice('请先登录 Strapi', true)
    return
  }

  try {
    const docId = item._documentId
    if (docId) {
      // 先删除子菜单
      if (item.children?.length) {
        for (const child of item.children) {
          if (child._documentId) {
            await deleteNavItemApi(token, child._documentId)
          }
        }
      }
      // 再删除父菜单
      await deleteNavItemApi(token, docId)
    }
    optimisticRemove(i)
    await refreshNavItems()
    showNotice('菜单已删除')
  } catch (e) {
    showNotice('删除失败：' + (e.message || '未知错误'), true)
  }
}

// ===== 二级菜单 CRUD =====

const showSubDialog = ref(false)
const editSub = ref(null)
const parentForSub = ref(-1)

async function onSaveSub() {
  const label = document.getElementById('sub-label')?.value?.trim() || '子菜单'
  const route = document.getElementById('sub-route')?.value?.trim() || '/'
  const subNavId = document.getElementById('sub-id')?.value?.trim() || `sub-${Date.now()}`
  const pIdx = editSub.value ? editSub.value.p : parentForSub.value

  const token = getToken()
  if (!token) {
    showNotice('请先登录 Strapi', true)
    return
  }

  const parentItem = navItems.value[pIdx]
  if (!parentItem) return

  saving.value = true
  try {
    if (editSub.value) {
      // 编辑子菜单
      const subItem = parentItem.children[editSub.value.s]
      const docId = subItem._documentId

      if (docId) {
        await updateNavItemApi(token, docId, {
          title: label,
          route,
          navId: subNavId,
        })
        optimisticUpdateSub(pIdx, editSub.value.s, { label, route, id: subNavId })
        await refreshNavItems()
        showNotice('子菜单已更新')
      } else {
        // 子菜单没有 _documentId，可能来自默认数据
        // 需要先创建并关联到父级
        const parentDocId = parentItem._documentId
        if (parentDocId) {
          const sortOrder = editSub.value.s
          const result = await createNavItem(token, {
            title: label,
            icon: 'article',
            route,
            navId: subNavId,
            sortOrder,
            parent: { connect: [parentDocId] },
          })
          optimisticUpdateSub(pIdx, editSub.value.s, { label, route, id: subNavId, _documentId: result.documentId })
          await refreshNavItems()
          showNotice('子菜单已同步到 Strapi')
        } else {
          showNotice('父菜单未关联 Strapi，请先编辑父菜单', true)
        }
      }
    } else {
      // 添加子菜单
      const parentDocId = parentItem._documentId
      if (!parentDocId) {
        showNotice('父菜单未关联 Strapi，请先编辑父菜单', true)
        saving.value = false
        return
      }
      const sortOrder = parentItem.children?.length || 0
      const result = await createNavItem(token, {
        title: label,
        icon: 'article',
        route,
        navId: subNavId,
        sortOrder,
        parent: { connect: [parentDocId] },
      })
      optimisticAddSub(pIdx, {
        id: subNavId,
        label,
        route,
        _documentId: result.documentId,
      })
      await refreshNavItems()
      showNotice('子菜单已创建')
    }
    showSubDialog.value = false
    editSub.value = null
  } catch (e) {
    showNotice('操作失败：' + (e.message || '未知错误'), true)
  } finally {
    saving.value = false
  }
}

async function removeSub(p, s) {
  if (!confirm('确认删除子菜单？')) return

  const token = getToken()
  if (!token) {
    showNotice('请先登录 Strapi', true)
    return
  }

  try {
    const subItem = navItems.value[p]?.children?.[s]
    const docId = subItem?._documentId
    if (docId) {
      await deleteNavItemApi(token, docId)
    }
    optimisticRemoveSub(p, s)
    await refreshNavItems()
    showNotice('子菜单已删除')
  } catch (e) {
    showNotice('删除失败：' + (e.message || '未知错误'), true)
  }
}
</script>

<style scoped>
.nav-manager {
  padding: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title h2 {
  font-size: 28px;
  font-weight: 475;
  line-height: 36px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
}

.section-title__actions {
  display: flex;
  gap: 8px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-card {
  border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  border-radius: 16px;
  padding: 16px;
  background: var(--md-sys-color-surface-container-low, #f8f1f6);
}

.nav-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-card__icon {
  font-size: 24px;
  color: var(--md-sys-color-primary, #6750a4);
}

.nav-card__info {
  flex: 1;
  min-width: 0;
}

.nav-card__label {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.nav-card__route {
  display: block;
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.nav-card__actions {
  display: flex;
  gap: 4px;
}

.sub-list {
  margin: 12px 0 8px 36px;
  padding-left: 12px;
  border-left: 2px solid var(--md-sys-color-outline-variant, #cac4d0);
}

.sub-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.sub-item__label {
  font-size: 14px;
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.sub-item__route {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  flex: 1;
}

.sub-item__actions {
  display: flex;
  gap: 2px;
}

.add-sub-btn {
  margin-left: 36px;
  margin-top: 4px;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 320px;
}

.icon-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-field__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  display: block;
}

.icon-field__preview {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-field__preview .material-symbols-rounded {
  font-size: 24px;
  color: var(--md-sys-color-primary, #6750a4);
}

/* 登录/状态提示 */
.admin-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--md-sys-color-secondary-container, #e8def8);
  margin-bottom: 16px;
}

.admin-notice__icon {
  font-size: 20px;
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.admin-notice__text {
  font-size: 14px;
  color: var(--md-sys-color-on-secondary-container, #1d192b);
}

.operation-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--md-sys-color-tertiary-container, #ffd8e4);
  margin-bottom: 12px;
  animation: fadeIn 200ms ease;
}

.operation-notice--error {
  background: var(--md-sys-color-error-container, #f9dedc);
}

.operation-notice__icon {
  font-size: 18px;
  color: var(--md-sys-color-on-tertiary-container, #31111d);
}

.operation-notice--error .operation-notice__icon {
  color: var(--md-sys-color-on-error-container, #410e0b);
}

.operation-notice__text {
  font-size: 14px;
  color: var(--md-sys-color-on-tertiary-container, #31111d);
}

.operation-notice--error .operation-notice__text {
  color: var(--md-sys-color-on-error-container, #410e0b);
}

.login-error {
  font-size: 13px;
  color: var(--md-sys-color-error, #b3261e);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
