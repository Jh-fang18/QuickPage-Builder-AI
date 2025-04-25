import { PUSH_CHECKEDKEYS } from './mutation-types.ts'
import { DELETE_CHECKEDKEYS } from './mutation-types.ts'

// 声明自己的 store state
interface State {
  checkedKeys: string[]
}

const state = () => ({
  checkedKeys: []
})

// getters
const getters = {}

// actions
const actions = {}

// mutations
const mutations = {
  [PUSH_CHECKEDKEYS](state: State, arr: string[]) {
    console.log(state.checkedKeys, arr)
    state.checkedKeys = [...arr]
  },
  [DELETE_CHECKEDKEYS](state: State, arr: string[]) {
    for (let i = 0; i < arr.length; i++) {
      const index = state.checkedKeys.indexOf(arr[i])
      if (index != -1) {
        state.checkedKeys.splice(index, 1)
      }
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
