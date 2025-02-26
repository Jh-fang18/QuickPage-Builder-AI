<script setup lang="ts">
import { ref } from 'vue'
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
  microParts: {}
})

const gridColumn = ref(24)
const gridRow = ref(36)
const activatedComponents = ref([])
const terminalType = ref(0)
</script>

<template>
  <div>
    <edits :micro-parts="microParts" v-if="edit"></edits>
    <!-- <views :micro-parts="microParts" :dnd-id="dndId" :dnd-id-url="dndIdUrl" v-else></views> -->
  </div>
</template>


