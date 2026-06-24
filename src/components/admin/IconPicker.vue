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
      <md-chip-set>
        <md-filter-chip
          v-for="icon in filteredIcons"
          :key="icon"
          :selected="modelValue === icon"
          @click="$emit('update:modelValue', icon)"
          :label="icon"
        ></md-filter-chip>
      </md-chip-set>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import '@material/web/textfield/outlined-text-field'
import '@material/web/chips/chip-set'
import '@material/web/chips/filter-chip'

const props = defineProps({
  modelValue: { type: String, default: '' },
})
defineEmits(['update:modelValue'])

const search = ref('')

// 常用 Material Symbols 图标子集
const icons = [
  'home', 'person', 'person_outline', 'description', 'article', 'code',
  'mail', 'mail_outline', 'search', 'settings', 'dashboard', 'favorite',
  'favorite_outline', 'star', 'star_outline', 'bookmark', 'bookmark_outline',
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
  'smart_toy', 'robotics', 'extension', 'api', 'hub',
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
.icon-picker__search {
  width: 100%;
  margin-bottom: 12px;
}

.icon-picker__grid {
  max-height: 280px;
  overflow-y: auto;
  padding: 4px;
}

.icon-picker__grid md-chip-set {
  flex-wrap: wrap;
}
</style>
