<template>
  <div class="icon-picker">
    <md-outlined-text-field
      class="icon-picker__search"
      label="搜索图标"
      type="text"
      :value="search"
      @input="search = $event.target.value"
    >
      <span class="material-symbols-rounded" slot="leading-icon">search</span>
    </md-outlined-text-field>
    <div class="icon-picker__grid">
      <button
        v-for="icon in filteredIcons"
        :key="icon"
        class="icon-picker__item"
        :class="{ 'icon-picker__item--selected': modelValue === icon }"
        :title="icon"
        @click="$emit('update:modelValue', icon)"
      >
        <span class="material-symbols-rounded">{{ icon }}</span>
      </button>
    </div>
    <div v-if="filteredIcons.length === 0" class="icon-picker__empty">
      未找到匹配图标
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import '@material/web/textfield/outlined-text-field'

const props = defineProps({
  modelValue: { type: String, default: '' },
})
defineEmits(['update:modelValue'])

const search = ref('')

// 常用 Material Symbols 图标子集
const icons = [
  'home', 'person', 'person_outline', 'description', 'article', 'code',
  'mail', 'mail_outline', 'search', 'settings', 'dashboard', 'favorite',
  'favorite_border', 'star', 'star_border', 'bookmark', 'bookmark_border',
  'folder', 'folder_open', 'cloud', 'download', 'upload', 'share',
  'link', 'public', 'language', 'web', 'wifi', 'bluetooth',
  'phone', 'camera', 'photo', 'image', 'videocam', 'mic',
  'volume_up', 'headphones', 'music_note', 'movie', 'play_arrow',
  'pause', 'stop', 'skip_next', 'skip_previous', 'fast_forward',
  'undo', 'redo', 'refresh', 'sync', 'cached', 'schedule',
  'access_time', 'event', 'today', 'calendar_month', 'notifications',
  'notifications_none', 'chat', 'forum', 'comment', 'feedback',
  'info', 'help', 'help_outline', 'error', 'warning', 'check_circle',
  'cancel', 'close', 'done', 'add', 'remove', 'edit', 'delete',
  'visibility', 'visibility_off', 'lock', 'lock_open', 'security',
  'admin_panel_settings', 'verified_user', 'key', 'login', 'logout',
  'menu', 'more_vert', 'more_horiz', 'arrow_back', 'arrow_forward',
  'arrow_upward', 'arrow_downward', 'expand_more', 'expand_less',
  'chevron_right', 'chevron_left', 'first_page', 'last_page',
  'list', 'grid_view', 'view_list', 'view_module', 'apps',
  'palette', 'brush', 'format_paint', 'color_lens', 'style',
  'school', 'science', 'biotech', 'psychology', 'lightbulb',
  'analytics', 'bar_chart', 'pie_chart', 'trending_up', 'assessment',
  'storage', 'database', 'dns', 'memory', 'developer_board',
  'terminal', 'data_object', 'integration_instructions', 'source',
  'smart_toy', 'extension', 'api', 'hub',
  'flag', 'outlined_flag', 'label', 'label_outline', 'category',
  'tag', 'local_offer', 'sell', 'shopping_cart', 'store',
  'inventory', 'work', 'business', 'apartment', 'domain',
  'groups', 'group', 'person_add', 'contact_page', 'contacts',
  'location_on', 'map', 'explore', 'navigation', 'near_me',
  'flight', 'directions_car', 'train', 'directions_bus', 'sailing',
  'sports_esports', 'sports_soccer', 'sports_basketball', 'fitness_center',
  'restaurant', 'coffee', 'local_pizza', 'local_bar',
  'medical_services', 'health_and_safety', 'vaccines',
  'eco', 'nature', 'forest', 'water_drop', 'thermostat',
  'sunny', 'dark_mode', 'bedtime', 'wb_twilight',
]

const filteredIcons = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return icons
  return icons.filter(i => i.includes(q))
})
</script>

<style scoped>
.icon-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-picker__search {
  width: 100%;
}

.icon-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 40px);
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
  /* M3 shape: extra-small */
  border-radius: 8px;
}

.icon-picker__item {
  /* 40px touch target per M3 spec */
  inline-size: 40px;
  block-size: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 12px;
  background: none;
  cursor: pointer;
  color: var(--md-sys-color-on-surface-variant, #49454f);
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  padding: 0;
  appearance: none;
  -webkit-tap-highlight-color: transparent;
}

.icon-picker__item .material-symbols-rounded {
  font-size: 24px;
  line-height: 24px;
}

/* Hover */
.icon-picker__item:hover {
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-on-surface, #1c1b1f) 8%,
    transparent
  );
}

/* Pressed */
.icon-picker__item:active {
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-on-surface, #1c1b1f) 12%,
    transparent
  );
}

/* Selected */
.icon-picker__item--selected {
  background-color: var(--md-sys-color-secondary-container, #e8def8);
  color: var(--md-sys-color-on-secondary-container, #1d192b);
  border-color: transparent;
}

.icon-picker__item--selected:hover {
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-on-secondary-container, #1d192b) 8%,
    var(--md-sys-color-secondary-container, #e8def8)
  );
}

.icon-picker__empty {
  padding: 16px;
  text-align: center;
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant, #49454f);
}
</style>
