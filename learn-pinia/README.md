# learn-pinia

## Pinia 与 Vuex 相比

1. 体积小巧，压缩后体积只有不到2KB
2. ts类型支持非常好。
3. 扁平化，没有模块嵌套，只有 store 的概念，store 之间可以自由使用，更好的代码分割
4. 去除 mutations，只有 state，getters，actions
5. 支持vue2辅助函数，devtool


## Pinia 原理

### createPinia
> 创建 pinia 实例
1. Vue 通过 `.use` 注册插件，所以我们提供的 `createPinia` 方法需要返回 `install()` 函数来注册 `pinia`
2. `pinia` 支持多个 store ，且模块间是平铺的，所以需要一个内部变量 `_s: new Map()`维护 store
3. `pinia` 最核心的是对状态的管理，所以还需要定义一个响应式的变量 `state` 来存储所有 store 的状态
4. `pinia` 内部通过 `provide` 和 `inject` 实现数据的共享


## defineStore
> 创建 store
1. `defineStore` 接收参数的方式有3种 id+options、options、id+function

    -  `defineStore` 内部会将参数形式转为 id+function 的形式
    
2. `defineStore` 内部会生成一个 `useStore` 函数，并返回

    > useStore 主要是检查当前 id 下有没有对应的 store ,有就返回，没有就设置再返回
    - 根据参数的类型创建 OptionStore 或 setUpStore

3. `createOptionStore`
    > 内部会 option 变成 setup 语法 
    - 运行 `state()` 函数生成状态，并保留到 `pinia.state.value[id]`中
    - `const localState = toRefs(pinia.state.value[id]);` 生成 store 状态
    - 对于 getters 需要转为 `computed` 类型，同时设置 this 为当前 store
    - 将由 `localState` `computedMap` `action` 生成的 `setupStore` 传入 `createSetupStore` 生成最后的 store

4. `createSetupStore`
    - 调用 `setup` 函数 生成 store
    - 修正 `actions` 中的 this 指向
    - 将 `id` 与 `store` 映射

### 方法

1. $patch
    > `$patch` 的作用是批量更新多个属性

    - 参数是对象，把修改的部分属性和原属性做合并
    - 参数是函数，运行函数，传入当前的 store

2. $reset
    > 只在 optionStore 生效，将状态重置
    - 调用 `$patch`, 将当前状态与 `state` 函数新生成的状态进行合并

3. $subscribe
    > 监听状态变化，只要状态变化就执行回调函数
    - 利用了vue3提供的 watch，监听当前的 store，然后执行回调函数
  
4. $onAction
    > 监听用户调用 action 的方法 该回调函数内部的代码会先于actions函数调用前执行
    - 在创建 store 时会初始有一个订阅列表，`$onAction` 执行会把回调函数放进订阅列表中
    - 当 action 执行时
        1. 创建 after 订阅列表和 onError订阅列表
        2. 取出初始订阅列表中的函数执行
        3. 执行 action
        4. 执行 after 订阅列表或 onError订阅列表


### 插件
  1. `createPinia` 时初始化 `_p=[]` 和 `use` 方法添加插件
  2. 创建 store 后，获取 `_p` 依次注册插件
