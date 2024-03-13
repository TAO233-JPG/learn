import {
  getCurrentInstance,
  inject,
  reactive,
  watch,
  toRefs,
  computed,
  isRef,
  isReactive
} from 'vue'
import { activePinia, piniaSymbol } from './createPinia'
import { setActivePinia } from 'pinia'

export function defineStore(idOrOptions, setup) {
  let id
  let options

  const isSetupStore = typeof setup === 'function'

  if (typeof idOrOptions === 'string') {
    id = idOrOptions
    options = setup
  } else {
    id = idOrOptions.id
    options = idOrOptions
  }

  function useStore() {
    let pinia = getCurrentInstance() && inject(piniaSymbol)

    if (pinia) setActivePinia(pinia)

    pinia = activePinia

    if (!pinia._s.has(id)) {
      if (!isSetupStore) {
        createOptionStore(id, options, pinia)
      } else {
        createSetupStore(id, setup, pinia)
      }
    }

    const store = pinia._s.get(id)
    return store
  }

  return useStore
}

function createOptionStore(id, options, pinia) {
  const { state, getters, actions } = options

  function setup() {
    pinia.state.value[id] = state?.() || {}
    const localState = toRefs(pinia.state.value[id])
    return Object.assign(
      localState,
      actions,
      Object.keys(getters || {}).reduce((computedObj, name) => {
        computedObj[name] = computed(() => {
          const store = pinia._s.get(id)
          return getters[name].call(store, store)
        })
        return computedObj
      }, {})
    )
  }

  const store = createSetupStore(id, setup, pinia, true)

  store.$reset = function () {
    const newState = state ? state() : {}
    store.$patch((state) => Object.assign(state, newState))
  }

  return store
}

const isComputed = (v) => !!(isRef(v) && v.effect)
function createSetupStore(id, setup, pinia, isOption = false) {
  function $patch(partialStateOrMutation) {
    if (typeof partialStateOrMutation === 'object') {
      mergeReactiveObject(pinia.state.value[id], partialStateOrMutation)
    } else {
      partialStateOrMutation(pinia.state.value[id])
    }
  }
  function $subscribe(callback) {
    //监听pinia中当前id下状态的变化，调用callback
    return watch(pinia.state.value[id], (state) => {
      callback({ storeId: id }, state)
    })
  }
  const subscriptions = []
  const store = reactive({
    $patch,
    $subscribe,
    $onAction: addSubscription.bind(null, subscriptions)
  })
  const initialState = pinia.state.value[id] //对于setup而言是没有初始化过状态，这里的值是undefined
  //如果没有先默认给个空状态
  if (!initialState && !isOption) {
    pinia.state.value[id] = {}
  }
  const setupStore = setup()

  function wrapAction(name, action) {
    return function () {
      const afterCallBack = []
      const onErrorCallBack = []
      function after(callback) {
        afterCallBack.push(callback)
      }
      function onError(callback) {
        onErrorCallBack.push(callback)
      }
      // 钩子
      triggerSubscribe(subscriptions, {
        args: Array.from(arguments),
        name,
        store,
        after,
        onError
      })
      let res

      try {
        res = action.apply(store, arguments)
      } catch (e) {
        triggerSubscribe(onErrorCallBack, e)
      }

      if (res instanceof Promise) {
        return res
          .then((value) => {
            triggerSubscribe(afterCallBack, value)
          })
          .catch((e) => {
            triggerSubscribe(onErrorCallBack, e)
            return Promise.reject(e)
          })
      }
      triggerSubscribe(afterCallBack, res)
      return res
    }
  }

  for (let key in setupStore) {
    const prop = setupStore[key]
    if (typeof prop === 'function') {
      setupStore[key] = wrapAction(key, prop)
    }
    if ((isRef(prop) && !isComputed(prop)) || isReactive(prop)) {
      if (!isOption) {
        pinia.state.value[id][key] = prop
      }
    }
  }

  //这里合并用户传入的setupStore(处理后的options)和store本身自带的一些方法($patch,$reset...)
  Object.assign(store, setupStore)
  pinia._s.set(id, store) //将store和id映射起来
  pinia._p.forEach((p) => p(store)) // 注册插件
  return store
}

const isObject = (v) => typeof v === 'object' && v !== null

function mergeReactiveObject(target, state) {
  for (let key in state) {
    let oldValue = target[key] //pinia中的state
    let newValue = state[key] //要修改的state
    //如果两个都是对象需要递归合并
    if (isObject(oldValue) && isObject(newValue)) {
      target[key] = mergeReactiveObject(oldValue, newValue)
    } else {
      target[key] = newValue
    }
  }
  return target
}

//把回调存到数组中
function addSubscription(subscriptions, callback) {
  subscriptions.push(callback)
}
//循环回调函数列表并执行
function triggerSubscribe(subscriptions, ...args) {
  subscriptions.slice().forEach((callback) => {
    callback(...args)
  })
}
