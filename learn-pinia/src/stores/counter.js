import { ref, computed } from 'vue'
// import { defineStore } from 'pinia'
import { defineStore } from '../m-pinia'

export const useCounterStore = defineStore('counter-setup', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})

export const useCounterOptionStore = defineStore('counter-option', {
  state() {
    return {
      count: 0
    }
  },
  getters: {
    doubleCount(state) {
      return state.count * 2
    }
  },

  actions: {
    increment() {
      this.count++
    }
  }
})
