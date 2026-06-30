<template>
  <div class="nav-manager">
    <!-- ======== 缓冲进度条 ======== -->
    <md-linear-progress
      v-if="loader.loadingActive.value"
      :class="{ 'loading-progress--fading': loader.loadingFading.value }"
      class="loading-progress"
      :value="loader.progressValue.value"
      :buffer="loader.progressBuffer.value"
    ></md-linear-progress>

    <div class="section-title">
      <h2>导航菜单管理</h2>
      <md-filled-tonal-button @click="onAddNav">
        <span class="material-symbols-rounded" slot="icon">add</span>
        添加菜单
      </md-filled-tonal-button>
    </div>

    <!-- ======== 骨架屏 ======== -->
    <div v-if="!loader.dataLoaded.value" class="nav-list">
      <!-- 骨架卡片 1：带子菜单 -->
      <div class="nav-card nav-card--skeleton">
        <div class="nav-card__header">
          <span class="skeleton" style="width:24px;height:24px;border-radius:12px;flex-shrink:0;"></span>
          <div class="nav-card__info">
            <span class="skeleton" style="height:16px;width:45%;"></span>
            <span class="skeleton" style="height:12px;width:30%;margin-top:4px;"></span>
          </div>
          <div class="nav-card__sort nav-card__sort--skeleton">
            <span class="skeleton" style="width:32px;height:32px;border-radius:16px;"></span>
            <span class="skeleton" style="width:32px;height:32px;border-radius:16px;"></span>
          </div>
          <div class="nav-card__actions nav-card__actions--skeleton">
            <span class="skeleton" style="width:32px;height:32px;border-radius:16px;"></span>
            <span class="skeleton" style="width:32px;height:32px;border-radius:16px;"></span>
          </div>
        </div>
        <!-- 子菜单骨架 -->
        <div class="sub-list sub-list--skeleton">
          <div class="sub-item sub-item--skeleton">
            <span class="skeleton" style="height:14px;width:60px;"></span>
            <span class="skeleton" style="height:12px;width:50px;"></span>
            <div class="sub-item__sort sub-item__sort--skeleton">
              <span class="skeleton" style="width:28px;height:28px;border-radius:14px;"></span>
              <span class="skeleton" style="width:28px;height:28px;border-radius:14px;"></span>
            </div>
            <div class="sub-item__actions sub-item__actions--skeleton">
              <span class="skeleton" style="width:28px;height:28px;border-radius:14px;"></span>
              <span class="skeleton" style="width:28px;height:28px;border-radius:14px;"></span>
            </div>
          </div>
          <div class="sub-item sub-item--skeleton">
            <span class="skeleton" style="height:14px;width:70px;"></span>
            <span class="skeleton" style="height:12px;width:55px;"></span>
            <div class="sub-item__sort sub-item__sort--skeleton">
              <span class="skeleton" style="width:28px;height:28px;border-radius:14px;"></span>
              <span class="skeleton" style="width:28px;height:28px;border-radius:14px;"></span>
            </div>
            <div class="sub-item__actions sub-item__actions--skeleton">
              <span class="skeleton" style="width:28px;height:28px;border-radius:14px;"></span>
              <span class="skeleton" style="width:28px;height:28px;border-radius:14px;"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 骨架卡片 2-4 -->
      <div v-for="n in 3" :key="'sk-' + n" class="nav-card nav-card--skeleton">
        <div class="nav-card__header">
          <span class="skeleton" style="width:24px;height:24px;border-radius:12px;flex-shrink:0;"></span>
          <div class="nav-card__info">
            <span class="skeleton" style="height:16px;width:40%;"></span>
            <span class="skeleton" style="height:12px;width:28%;margin-top:4px;"></span>
          </div>
          <div class="nav-card__sort nav-card__sort--skeleton">
            <span class="skeleton" style="width:32px;height:32px;border-radius:16px;"></span>
            <span class="skeleton" style="width:32px;height:32px;border-radius:16px;"></span>
          </div>
          <div class="nav-card__actions nav-card__actions--skeleton">
            <span class="skeleton" style="width:32px;height:32px;border-radius:16px;"></span>
            <span class="skeleton" style="width:32px;height:32px;border-radius:16px;"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- ======== 真实内容（fadeIn） ======== -->
    <div v-else :class="{ 'content-fadein': loader.fadeInActive.value }">
      <!-- 操作提示 -->
      <div v-if="operationMessage" class="operation-notice" :class="{ 'operation-notice--error': operationError }">
        <span class="material-symbols-rounded operation-notice__icon">{{ operationError ? 'error' : 'check_circle' }}</span>
        <span class="operation-notice__text">{{ operationMessage }}</span>
      </div>

      <!-- 一级菜单列表 -->
      <div v-if="navItems.length" class="nav-list">
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
            <!-- 排序按钮 -->
            <div class="nav-card__sort">
              <md-icon-button :disabled="i === 0" @click="onMoveNav(i, i - 1)">
                <span class="material-symbols-rounded">keyboard_arrow_up</span>
              </md-icon-button>
              <md-icon-button :disabled="i === navItems.length - 1" @click="onMoveNav(i, i + 1)">
                <span class="material-symbols-rounded">keyboard_arrow_down</span>
              </md-icon-button>
            </div>
            <!-- 操作按钮 -->
            <div class="nav-card__actions">
              <md-icon-button @click="editNav = i; pickedIcon = navItems[i]?.icon || 'article'; editPersistent = navItems[i]?.persistent || false; showNavDialog = true">
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
              <!-- 子菜单排序 -->
              <div class="sub-item__sort">
                <md-icon-button :disabled="j === 0" @click="onMoveSub(i, j, j - 1)">
                  <span class="material-symbols-rounded">expand_less</span>
                </md-icon-button>
                <md-icon-button :disabled="j === item.children.length - 1" @click="onMoveSub(i, j, j + 1)">
                  <span class="material-symbols-rounded">expand_more</span>
                </md-icon-button>
              </div>
              <div class="sub-item__actions">
                <md-icon-button @click="editSub = { p: i, s: j }; showSubDialog = true">
                  <span class="material-symbols-rounded">edit</span>
                </md-icon-button>
                <md-icon-button @click="removeSub(i, j)">
                  <span class="material-symbols-rounded">delete</span>
                </md-icon-button>
              </div>
            </div>
          </div>
          <md-text-button class="add-sub-btn" @click="parentForSub = i; showSubDialog = true">
            <span class="material-symbols-rounded" slot="icon">add</span>
            添加子菜单
          </md-text-button>
        </div>
      </div>

      <div v-else class="empty-hint">暂无导航菜单</div>
    </div>

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
        <label class="switch-field">
          <md-switch :selected="editPersistent" @change="editPersistent = $event.target.selected"></md-switch>
          <span class="switch-field__label">二级菜单常驻显示</span>
        </label>
        <span class="switch-field__hint">开启后，当页面宽度足够时，此项的二级菜单会常驻显示在侧边栏中</span>
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
        <md-outlined-text-field label="路由路径" :value="editSub ? navItems[editSub.p]?.children?.[editSub.s]?.route : ''" id="sub-route"></md-outlined-text-field>
        <md-outlined-text-field label="导航 ID" :value="editSub ? navItems[editSub.p]?.children?.[editSub.s]?.id : ''" id="sub-id"></md-outlined-text-field>
      </form>
      <div slot="actions">
        <md-text-button @click="showSubDialog = false">取消</md-text-button>
        <md-filled-button @click="onSaveSub" :disabled="saving">保存</md-filled-button>
      </div>
    </md-dialog>

    <!-- 删除确认对话框 -->
    <md-dialog :open="showDeleteConfirm" @close="showDeleteConfirm = false">
      <div slot="headline">确认删除</div>
      <div slot="content">{{ deleteConfirmMessage }}</div>
      <div slot="actions">
        <md-text-button @click="showDeleteConfirm = false">取消</md-text-button>
        <md-filled-button @click="onConfirmDelete" :disabled="saving">删除</md-filled-button>
      </div>
    </md-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useNavItems, refreshNavItems } from '@/stores/blogStore'
import {
  createNavItem,
  updateNavItemApi,
  deleteNavItemApi,
} from '@/services/articleService'
import { useAdminLoader } from '@/composables/useAdminLoader'
import IconPicker from './IconPicker.vue'
import '@material/web/button/filled-button'
import '@material/web/button/filled-tonal-button'
import '@material/web/button/text-button'
import '@material/web/button/outlined-button'
import '@material/web/iconbutton/icon-button'
import '@material/web/dialog/dialog'
import '@material/web/textfield/outlined-text-field'
import '@material/web/switch/switch'
import '@material/web/progress/linear-progress'

const props = defineProps({ token: { type: String, required: true } })

// ===== 共享加载控制器 =====
const loader = useAdminLoader()

const {
  navItems: getNavItems,
  optimisticAdd,
  optimisticUpdate,
  optimisticRemove,
  optimisticAddSub,
  optimisticUpdateSub,
  optimisticRemoveSub,
  optimisticMoveNav,
  optimisticMoveSub,
} = useNavItems()

const navItems = computed(() => getNavItems())

// 操作状态
const saving = ref(false)
const operationMessage = ref('')
const operationError = ref(false)

// ===== 数据加载（带冷启动重试） =====
// NavManager 使用 blogStore 的公共 API，而非 content-manager API
// refreshNavItems() 返回 true 表示 API 数据成功刷新，false 表示 API 不可达
function loadNavData() {
  loader.loadCustom(
    () => refreshNavItems(),
    () => { /* navItems 已通过 store computed 自动更新 */ },
    (result) => result !== true  // refreshNavItems 返回 false → 视为空，触发重试
  )
}

/** 静默刷新（CRUD 后） */
async function reloadNavData() {
  await loader.silentReloadCustom(
    () => refreshNavItems(),
    () => { /* store 已自动更新 */ }
  )
}

onMounted(loadNavData)

// ===== 操作提示 =====
let noticeTimer = null
function showNotice(msg, isError = false) {
  operationMessage.value = msg
  operationError.value = isError
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { operationMessage.value = '' }, 4000)
}

// ===== 图标选择 =====
const showIconPicker = ref(false)
const pickedIcon = ref('')

function onPickIcon(icon) { pickedIcon.value = icon }

function toggleIconPicker() {
  showIconPicker.value = !showIconPicker.value
  if (showIconPicker.value) {
    nextTick(() => {
      requestAnimationFrame(() => {
        const dialog = document.querySelector('md-dialog[open]')
        if (!dialog) return
        const scroller = dialog.shadowRoot?.querySelector('.scroller')
        if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
      })
    })
  }
}

// ===== 删除确认对话框 =====
const showDeleteConfirm = ref(false)
const deleteConfirmMessage = ref('')
const deleteAction = ref(null) // { type: 'nav', index } or { type: 'sub', p, s }

function onConfirmDelete() {
  showDeleteConfirm.value = false
  if (!deleteAction.value) return

  if (deleteAction.value.type === 'nav') {
    doRemoveNav(deleteAction.value.index)
  } else if (deleteAction.value.type === 'sub') {
    doRemoveSub(deleteAction.value.p, deleteAction.value.s)
  }
  deleteAction.value = null
}

// ===== 一级菜单 CRUD =====
const showNavDialog = ref(false)
const editNav = ref(-1)
const editPersistent = ref(false)

function onAddNav() {
  editNav.value = -1
  pickedIcon.value = 'article'
  editPersistent.value = false
  showIconPicker.value = false
  showNavDialog.value = true
}

async function onSaveNav() {
  const label = document.getElementById('nav-label')?.value?.trim() || '新菜单'
  const route = document.getElementById('nav-route')?.value?.trim() || '/'
  const navId = document.getElementById('nav-id')?.value?.trim() || `nav-${Date.now()}`
  const icon = pickedIcon.value || (editNav.value >= 0 ? navItems.value[editNav.value]?.icon : 'article')
  const persistent = editPersistent.value

  const token = props.token
  if (!token) { showNotice('未登录 Strapi', true); return }

  saving.value = true
  try {
    if (editNav.value >= 0) {
      const item = navItems.value[editNav.value]
      const docId = item._documentId
      if (docId) {
        await updateNavItemApi(token, docId, { title: label, icon, route, navId, persistent })
        optimisticUpdate(editNav.value, { label, icon, route, id: navId, persistent })
        await reloadNavData()
        showNotice('菜单已更新')
      } else {
        const sortOrder = editNav.value
        const result = await createNavItem(token, { title: label, icon, route, navId, sortOrder, persistent })
        optimisticUpdate(editNav.value, { label, icon, route, id: navId, persistent, _documentId: result.documentId })
        await reloadNavData()
        showNotice('菜单已同步到 Strapi')
      }
    } else {
      const sortOrder = navItems.value.length
      const result = await createNavItem(token, { title: label, icon, route, navId, sortOrder, persistent })
      optimisticAdd({ id: navId, label, icon, route, persistent, _documentId: result.documentId })
      await reloadNavData()
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
  deleteConfirmMessage.value = `确认删除「${item?.label}」？其下的子菜单也会一并删除。`
  deleteAction.value = { type: 'nav', index: i }
  showDeleteConfirm.value = true
}

async function doRemoveNav(i) {
  const item = navItems.value[i]
  const token = props.token
  if (!token) { showNotice('未登录 Strapi', true); return }

  try {
    const docId = item._documentId
    if (docId) {
      if (item.children?.length) {
        for (const child of item.children) {
          if (child._documentId) await deleteNavItemApi(token, child._documentId)
        }
      }
      await deleteNavItemApi(token, docId)
    }
    optimisticRemove(i)
    await reloadNavData()
    showNotice('菜单已删除')
  } catch (e) {
    showNotice('删除失败：' + (e.message || '未知错误'), true)
  }
}

// ===== 菜单排序 =====
async function onMoveNav(from, to) {
  const token = props.token
  if (!token) { showNotice('未登录 Strapi', true); return }

  optimisticMoveNav(from, to)

  try {
    const items = navItems.value
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx]
      if (item._documentId && item._documentId !== undefined) {
        await updateNavItemApi(token, item._documentId, { sortOrder: idx })
      }
    }
  } catch (e) {
    showNotice('排序同步失败：' + (e.message || '未知错误'), true)
    await reloadNavData()
  }
}

async function onMoveSub(parentIdx, from, to) {
  const token = props.token
  if (!token) { showNotice('未登录 Strapi', true); return }

  optimisticMoveSub(parentIdx, from, to)

  try {
    const children = navItems.value[parentIdx]?.children || []
    for (let idx = 0; idx < children.length; idx++) {
      const child = children[idx]
      if (child._documentId) {
        await updateNavItemApi(token, child._documentId, { sortOrder: idx })
      }
    }
  } catch (e) {
    showNotice('排序同步失败：' + (e.message || '未知错误'), true)
    await reloadNavData()
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

  const token = props.token
  if (!token) { showNotice('未登录 Strapi', true); return }

  const parentItem = navItems.value[pIdx]
  if (!parentItem) return

  saving.value = true
  try {
    if (editSub.value) {
      const subItem = parentItem.children[editSub.value.s]
      const docId = subItem._documentId
      if (docId) {
        await updateNavItemApi(token, docId, { title: label, route, navId: subNavId })
        optimisticUpdateSub(pIdx, editSub.value.s, { label, route, id: subNavId })
        await reloadNavData()
        showNotice('子菜单已更新')
      } else {
        const parentDocId = parentItem._documentId
        if (parentDocId) {
          const sortOrder = editSub.value.s
          const result = await createNavItem(token, { title: label, icon: 'article', route, navId: subNavId, sortOrder, parent: { connect: [parentDocId] } })
          optimisticUpdateSub(pIdx, editSub.value.s, { label, route, id: subNavId, _documentId: result.documentId })
          await reloadNavData()
          showNotice('子菜单已同步到 Strapi')
        } else {
          showNotice('父菜单未关联 Strapi，请先编辑父菜单', true)
        }
      }
    } else {
      const parentDocId = parentItem._documentId
      if (!parentDocId) { showNotice('父菜单未关联 Strapi，请先编辑父菜单', true); saving.value = false; return }
      const sortOrder = parentItem.children?.length || 0
      const result = await createNavItem(token, { title: label, icon: 'article', route, navId: subNavId, sortOrder, parent: { connect: [parentDocId] } })
      optimisticAddSub(pIdx, { id: subNavId, label, route, _documentId: result.documentId })
      await reloadNavData()
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
  const subItem = navItems.value[p]?.children?.[s]
  deleteConfirmMessage.value = `确认删除子菜单「${subItem?.label || ''}」？`
  deleteAction.value = { type: 'sub', p, s }
  showDeleteConfirm.value = true
}

async function doRemoveSub(p, s) {
  const token = props.token
  if (!token) { showNotice('未登录 Strapi', true); return }

  try {
    const subItem = navItems.value[p]?.children?.[s]
    const docId = subItem?._documentId
    if (docId) await deleteNavItemApi(token, docId)
    optimisticRemoveSub(p, s)
    await reloadNavData()
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

/* ======== 缓冲进度条 ======== */
.loading-progress {
  position: sticky;
  top: 0;
  z-index: 10;
  width: calc(100% + 48px);
  margin: -24px -24px 24px -24px;
  --md-linear-progress-active-indicator-color: var(--md-sys-color-primary, #6750a4);
  --md-linear-progress-track-color: var(--md-sys-color-surface-container-highest, #e6e0e9);
  transition: opacity 400ms ease-out;
}

.loading-progress--fading {
  opacity: 0;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title h2 {
  font-family: var(--md-sys-typescale-headline-m-font-family);
  font-size: var(--md-sys-typescale-headline-m-font-size);
  font-weight: var(--md-sys-typescale-headline-m-font-weight);
  letter-spacing: var(--md-sys-typescale-headline-m-letter-spacing);
  line-height: var(--md-sys-typescale-headline-m-line-height);
  font-variation-settings: "GRAD" var(--md-sys-typescale-headline-m-font-variation-GRAD), "opsz" var(--md-sys-typescale-headline-m-font-variation-opsz);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  margin: 0;
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

.nav-card--skeleton {
  border-color: transparent;
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
  font-family: var(--md-sys-typescale-title-m-font-family);
  font-size: var(--md-sys-typescale-title-m-font-size);
  font-weight: var(--md-sys-typescale-title-m-font-weight);
  letter-spacing: var(--md-sys-typescale-title-m-letter-spacing);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.nav-card__route {
  display: block;
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  letter-spacing: var(--md-sys-typescale-body-m-letter-spacing);
  color: var(--md-sys-color-on-surface-variant, #49454f);
}

.nav-card__sort {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.nav-card__sort--skeleton {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-card__actions {
  display: flex;
  gap: 4px;
}

.nav-card__actions--skeleton {
  display: flex;
  gap: 4px;
}

.sub-list {
  margin: 12px 0 8px 36px;
  padding-left: 12px;
  border-left: 2px solid var(--md-sys-color-outline-variant, #cac4d0);
}

.sub-list--skeleton {
  border-left: 2px solid var(--md-sys-color-outline-variant, #cac4d0);
}

.sub-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.sub-item--skeleton {
  gap: 8px;
}

.sub-item__label {
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  color: var(--md-sys-color-on-surface, #1c1b1f);
  min-width: 60px;
}

.sub-item__route {
  font-family: var(--md-sys-typescale-label-m-font-family);
  font-size: var(--md-sys-typescale-label-m-font-size);
  font-weight: var(--md-sys-typescale-label-m-font-weight);
  letter-spacing: var(--md-sys-typescale-label-m-letter-spacing);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  flex: 1;
}

.sub-item__sort {
  display: flex;
  gap: 0;
}

.sub-item__sort--skeleton {
  display: flex;
  gap: 2px;
}

.sub-item__actions {
  display: flex;
  gap: 2px;
}

.sub-item__actions--skeleton {
  display: flex;
  gap: 2px;
}

.add-sub-btn {
  margin-left: 36px;
  margin-top: 4px;
}

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
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

/* persistent 开关 */
.switch-field {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.switch-field__label {
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  color: var(--md-sys-color-on-surface, #1c1b1f);
}

.switch-field__hint {
  font-family: var(--md-sys-typescale-label-m-font-family);
  font-size: var(--md-sys-typescale-label-m-font-size);
  font-weight: var(--md-sys-typescale-label-m-font-weight);
  letter-spacing: var(--md-sys-typescale-label-m-letter-spacing);
  color: var(--md-sys-color-on-surface-variant, #49454f);
  line-height: 1.4;
  margin-top: -8px;
}

/* 状态提示 */
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
  font-family: var(--md-sys-typescale-body-m-font-family);
  font-size: var(--md-sys-typescale-body-m-font-size);
  font-weight: var(--md-sys-typescale-body-m-font-weight);
  color: var(--md-sys-color-on-tertiary-container, #31111d);
}

.operation-notice--error .operation-notice__text {
  color: var(--md-sys-color-on-error-container, #410e0b);
}

/* ======== fadeIn 动画 ======== */
/* 仅用纯 opacity，不用 translateY 避免布局抖动 */
.content-fadein {
  animation: admin-fadein 200ms linear 200ms both;
}

@keyframes admin-fadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
