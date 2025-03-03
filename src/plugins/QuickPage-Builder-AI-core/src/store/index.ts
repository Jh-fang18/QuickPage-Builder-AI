import { createStore } from 'vuex'
import dnd from './module/store.ts'

export const store = createStore({
  modules: {
    dnd,
  },
})