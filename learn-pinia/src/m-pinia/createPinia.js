import { ref } from 'vue'

export const piniaSymbol = Symbol('pinia') //使用symbol定义了唯一的key

export let activePinia
export const setActivePinia = (pinia) => (activePinia = pinia) //设置当前的pinia

export function createPinia() {
  const _p = []
  const pinia = {
    install(app) {
      app.provide(piniaSymbol, pinia)
      app.config.globalProperties.$pinia = pinia
      activePinia = pinia
    },

    _s: new Map(), // 会收集所有的store,一方面做缓存用，同时也为了方便管理，例如:可能会卸载全部的store
    state: ref({}), // 存储所有的状态
    _p,
    use(plugin) {
      _p.push(plugin)
      return this
    }
  }

  return pinia
}
