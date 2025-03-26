<template>
  <edits :micro-parts="microParts" v-if="edit"></edits>
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
