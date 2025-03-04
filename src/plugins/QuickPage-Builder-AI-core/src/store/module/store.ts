import { PUSH_CHECKEDKEYS, DELETE_CHECKEDKEYS } from './mutation-types.ts'

// 声明自己的 store state
interface State {
    checkedKeys: number[],
}

const state = () => ({
    checkedKeys: [],
})

// getters
const getters = {
}

// actions
const actions = {
}

// mutations
const mutations = {
    [PUSH_CHECKEDKEYS](state: State, arr: string | any[]) {
        for (let i = 0; i < arr.length; i++) {
            let ele = arr[i];
            if (state.checkedKeys.indexOf(ele) == -1) {
                state.checkedKeys.push(arr[i]);
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