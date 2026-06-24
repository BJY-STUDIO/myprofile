<template>
  <div class="nav-manager">
    <div class="section-title">
      <h2>导航菜单管理</h2>
      <md-filled-tonal-button @click="onAddNav">
        <span class="material-symbols-rounded" slot="icon">add</span>
        添加一级菜单
      </md-filled-tonal-button>
    </div>

    <!-- 一级菜单列表 -->
    <div class="nav-list">
      <div
        v-for="(item, i) in navItems"
        :key="item.id"
        class="nav-card"
      >
        <div class="nav-card__header">
          <div class="nav-card__drag" title="拖拽排序">⠿</div>
          <span class="material-symbols-rounded nav-card__icon">{{ item.icon }}</span>
          <div class="nav-card__info">
            <span class="nav-card__label">{{ item.label }}</span>
            <span class="nav-card__route">{{ item.route }}</span>
          </div>
          <div class="nav-card__actions">
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

    <!-- 一级菜单编辑对话框 -->
    <md-dialog :open="showNavDialog" @close="showNavDialog = false">
      <div slot="headline">{{ editNav >= 0 ? '编辑菜单' : '添加菜单' }}</div>
      <form slot="content" class="dialog-form" id="nav-form">
        <md-outlined-text-field label="名称" :value="editNav >= 0 ? navItems[editNav]?.label : ''" id="nav-label"></md-outlined-text-field>
        <md-outlined-text-field label="路由" :value="editNav >= 0 ? navItems[editNav]?.route : ''" id="nav-route"></md-outlined-text-field>
        <div class="icon-field">
          <label class="icon-field__label">图标</label>
          <div class="icon-field__preview">
            <span class="material-symbols-rounded">{{ pickedIcon || (editNav >= 0 ? navItems[editNav]?.icon : 'article') }}</span>
            <md-outlined-button @click="showIconPicker = !showIconPicker" type="button">选择图标</md-outlined-button>
          </div>
          <IconPicker v-if="showIconPicker" :modelValue="pickedIcon || (editNav >= 0 ? navItems[editNav]?.icon : 'article')" @update:modelValue="onPickIcon" />
        </div>
      </form>
      <div slot="actions">
        <md-text-button form="nav-form" @click="showNavDialog = false">取消</md-text-button>
        <md-filled-button form="nav-form" @click="onSaveNav">保存</md-filled-button>
      </div>
    </md-dialog>

    <!-- 二级菜单编辑对话框 -->
    <md-dialog :open="showSubDialog" @close="showSubDialog = false">
      <div slot="headline">{{ editSub ? '编辑' : '添加' }}子菜单</div>
      <form slot="content" class="dialog-form" id="sub-form">
        <md-outlined-text-field label="名称" :value="editSub ? navItems[editSub.p]?.children?.[editSub.s]?.label : ''" id="sub-label"></md-outlined-text-field>
        <md-outlined-text-field label="路由" :value="editSub ? navItems[editSub.p]?.children?.[editSub.s]?.route : ''" id="sub-route"></md-outlined-text-field>
      </form>
      <div slot="actions">
        <md-text-button @click="showSubDialog = false">取消</md-text-button>
        <md-filled-button @click="onSaveSub">保存</md-filled-button>
      </div>
    </md-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useNavItems } from '@/stores/blogStore'
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
  addNavItem,
  updateNavItem,
  removeNavItem,
  addSubItem,
  updateSubItem,
  removeSubItem,
} = useNavItems()

const navItems = computed(() => getNavItems())

const showNavDialog = ref(false)
const showSubDialog = ref(false)
const showIconPicker = ref(false)
const editNav = ref(-1)
const editSub = ref(null)
const parentForSub = ref(-1)
const pickedIcon = ref('')

function onAddNav() {
  editNav.value = -1
  pickedIcon.value = 'article'
  showIconPicker.value = false
  showNavDialog.value = true
}

function onPickIcon(icon) {
  pickedIcon.value = icon
}

function onSaveNav() {
  const label = document.getElementById('nav-label')?.value?.trim() || '新菜单'
  const route = document.getElementById('nav-route')?.value?.trim() || '/'
  const icon = pickedIcon.value || (editNav.value >= 0 ? navItems.value[editNav.value]?.icon : 'article')

  if (editNav.value >= 0) {
    updateNavItem(editNav.value, { label, route, icon })
  } else {
    addNavItem({ label, route, icon })
  }
  showNavDialog.value = false
}

function removeNav(i) {
  if (confirm(`确认删除「${navItems.value[i]?.label}」？`)) {
    removeNavItem(i)
  }
}

function onSaveSub() {
  const label = document.getElementById('sub-label')?.value?.trim() || '子菜单'
  const route = document.getElementById('sub-route')?.value?.trim() || '/'
  const pIdx = editSub.value ? editSub.value.p : parentForSub.value

  if (editSub.value) {
    updateSubItem(pIdx, editSub.value.s, { label, route })
  } else {
    addSubItem(pIdx, { label, route })
  }
  showSubDialog.value = false
  editSub.value = null
}

function removeSub(p, s) {
  if (confirm(`确认删除子菜单？`)) {
    removeSubItem(p, s)
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

.nav-card__drag {
  cursor: grab;
  color: var(--md-sys-color-outline, #79747e);
  font-size: 18px;
  user-select: none;
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

.icon-field__label {
  font-size: 13px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  margin-bottom: 4px;
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
</style>
