<script setup>
/**
 * 线性图标（线性风格 / stroke 1.5 / 24 网格）
 * 全部为内置 path，不依赖第三方图标库，便于离线与统一线宽。
 */
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
  stroke: { type: [Number, String], default: 1.5 },
})

const icons = {
  /* 导航与栏目 */
  factory:
    '<path d="M3 21h18M4 21V9l5.6 3.6V9L15.2 12.6V6l4.8 3.8V21"/><path d="M8 17.6h1.2M12 17.6h1.2M16 17.6h1.2"/>',
  flag: '<path d="M5.5 21V4"/><path d="M5.5 5h10.8l-1.7 3.6 1.7 3.6H5.5"/>',
  flask:
    '<path d="M9.5 3h5M10.5 3v6.2L6 17.4A2 2 0 0 0 7.7 20.5h8.6A2 2 0 0 0 18 17.4l-4.5-8.2V3"/><path d="M8 14.2h8"/>',
  briefcase:
    '<path d="M3.5 8.6h17v10.9h-17z"/><path d="M9 8.6V6.9a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 6.9v1.7"/><path d="M3.5 13.2h17"/>',
  building:
    '<path d="M4 21V4h9v17"/><path d="M13 9.4h7V21"/><path d="M7 8h3M7 11.6h3M7 15.2h3M16 13h1.4M16 17h1.4"/><path d="M3 21h18"/>',
  newspaper:
    '<path d="M4 5.4h12.6V19H5.5A1.5 1.5 0 0 1 4 17.5z"/><path d="M16.6 8.6h3.4v9A1.4 1.4 0 0 1 18.6 19"/><path d="M7 8.6h6.6M7 11.6h6.6M7 14.6h4"/>',

  /* 通用界面 */
  search: '<circle cx="11" cy="11" r="7.2"/><path d="M16.4 16.4 21 21"/>',
  globe:
    '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 9.2h17.2M3.4 14.8h17.2"/><path d="M12 3.4c2.4 2.4 3.7 5.3 3.7 8.6S14.4 18.2 12 20.6c-2.4-2.4-3.7-5.3-3.7-8.6S9.6 5.8 12 3.4z"/>',
  arrowRight: '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  arrowDown: '<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>',
  arrowUp: '<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
  chevronRight: '<path d="M9.5 6l6 6-6 6"/>',
  chevronLeft: '<path d="M14.5 6l-6 6 6 6"/>',
  users:
    '<circle cx="9.4" cy="8.4" r="3.2"/><path d="M3.6 20.4c0-3.1 2.5-5.4 5.8-5.4s5.8 2.3 5.8 5.4"/><path d="M16.2 5.9a3.1 3.1 0 0 1 0 5.9"/><path d="M17.6 15.2c2.3.6 3.9 2.5 3.9 4.8"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.6 9.8 17.4 19 6.8"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.2 2"/>',
  pin: '<path d="M12 21c0 0 6.4-5.6 6.4-10.2A6.4 6.4 0 0 0 5.6 10.8C5.6 15.4 12 21 12 21z"/><circle cx="12" cy="10.6" r="2.4"/>',
  mail: '<path d="M3.5 6.4h17v11.2h-17z"/><path d="M3.5 7 12 13l8.5-6"/>',
  send: '<path d="M4.4 11.9 20 4.2l-4.1 15.6-4.4-5.9z"/><path d="M11.5 13.9 20 4.2"/>',
  sparkle:
    '<path d="M11.4 4.2l1.5 4.2 4.2 1.5-4.2 1.5-1.5 4.2-1.5-4.2L5.7 9.9l4.2-1.5z"/><path d="M18 15.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  lock: '<path d="M6.6 10.6h10.8v8.8H6.6z"/><path d="M8.8 10.6V8.2a3.2 3.2 0 0 1 6.4 0v2.4"/>',
  grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  download: '<path d="M12 4v11"/><path d="M7.2 10.8 12 15.6l4.8-4.8"/><path d="M5 19.6h14"/>',
  print:
    '<path d="M7.4 9V4.4h9.2V9"/><path d="M7.4 17H5V11h14v6h-2.4"/><path d="M8 14.4h8v5.2H8z"/>',
  external: '<path d="M14 4.4h5.6V10"/><path d="M19.6 4.4 12 12"/><path d="M18 14v5.6H5V6.6h5"/>',
  plus: '<path d="M12 5.6v12.8M5.6 12h12.8"/>',
  minus: '<path d="M5.6 12h12.8"/>',
  gear:
    '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.6v2.6M12 18.8v2.6M5 5l1.8 1.8M17.2 17.2 19 19M2.6 12h2.6M18.8 12h2.6M5 19l1.8-1.8M17.2 6.8 19 5"/>',

  /* 图纸浏览器 */
  zoomIn: '<circle cx="11" cy="11" r="7.2"/><path d="M16.4 16.4 21 21"/><path d="M8.2 11h5.6M11 8.2v5.6"/>',
  zoomOut: '<circle cx="11" cy="11" r="7.2"/><path d="M16.4 16.4 21 21"/><path d="M8.2 11h5.6"/>',
  fit: '<path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/>',
  hand: '<path d="M8.2 12.4V6.6a1.5 1.5 0 0 1 3 0v5.4"/><path d="M11.2 11.6V5.4a1.5 1.5 0 0 1 3 0v6.2"/><path d="M14.2 12a1.5 1.5 0 0 1 3 0v4.2a5 5 0 0 1-5 5h-1.6a5 5 0 0 1-3.6-1.5l-3.2-3.4a1.7 1.7 0 0 1 2.4-2.4l1.8 1.7"/>',
  layers: '<path d="M12 3.6 3.6 8 12 12.4 20.4 8z"/><path d="M4 12.6 12 17l8-4.4"/><path d="M4 16.6 12 21l8-4.4"/>',
  ruler:
    '<path d="M4.6 14.6 14.6 4.6l4.8 4.8-10 10z"/><path d="M8.4 10.8l1.8 1.8M11.2 8l1.8 1.8M14 5.2l1.8 1.8"/>',
  expand: '<path d="M4 9V4h5"/><path d="M15 4h5v5"/><path d="M20 15v5h-5"/><path d="M9 20H4v-5"/>',
  crosshair: '<circle cx="12" cy="12" r="7.6"/><path d="M12 2.6v5M12 16.4v5M2.6 12h5M16.4 12h5"/>',
  file:
    '<path d="M6.4 3.6h7.2l4 4v12.8H6.4z"/><path d="M13.6 3.6v4h4"/><path d="M9 13h6M9 16.4h4"/>',
  refresh:
    '<path d="M19.6 12a7.6 7.6 0 1 1-2.4-5.5"/><path d="M19.8 4.4v4.2h-4.2"/>',
  info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.4M12 7.9h.01"/>',
}

const inner = computed(() => icons[props.name] || '')
</script>

<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke-width="stroke"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="inner"
  />
</template>

<style scoped>
.icon {
  flex: none;
  overflow: visible;
}
</style>
