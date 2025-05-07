<template>
  <edits :micro-parts="microParts" v-if="edit"></edits>
  <div class="mobile-tips">
    <p>请使用PC访问，以获得更好的使用效果</p>
    <p>Please use a PC to access for better results</p>
    <a-skeleton />
    <a-skeleton />
  </div>

  <!-- <views :micro-parts="microParts" :dnd-id="dndId" :dnd-id-url="dndIdUrl" v-else></views> -->
</template>

<script setup lang="ts">
import Edits from '../components/Dnd/Index.vue'

defineProps({
  dndId: {
    type: Number,
    default: 0
  },
  dndIdUrl: {
    type: String,
    default: ''
  },
  edit: {
    type: Boolean,
    default: true
  },
  microParts: {
    type: Object as () => Record<string, any>,
    default: () => ({})
  }
})
</script>

<style>
/* 判断是否为移动端 */
@media only screen and (max-width: 768px) {

  /* 移动端样式 */
  body {

    .ant-layout {
      display: none;
    }

    .mobile-tips {
      display: block;
      padding: 1rem;

      .ant-skeleton {
        padding: 1rem 0
      }
    }
  }
}
</style>
