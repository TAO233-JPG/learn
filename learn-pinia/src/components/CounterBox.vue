<template>
  <div>
    <h3>optionStore | count:{{ optionStore.count }}</h3>
    <h3>optionStore | doubleCount:{{ optionStore.doubleCount }}</h3>
    <button @click="optionStore.increment">+ 1</button>
    <button @click="optionStore.$reset">reset</button>
  </div>

  <div>
    <h3>setupStore | count:{{ setupStore.count }}</h3>
    <h3>setupStore | doubleCount:{{ setupStore.doubleCount }}</h3>
    <button @click="setupStore.increment">+ 1</button>
    <button @click="setupStore.$patch({ count: 0 })">reset</button>
  </div>
</template>

<script setup>
import { useCounterOptionStore, useCounterStore } from '@/stores/counter'

const optionStore = useCounterOptionStore()
const setupStore = useCounterStore()

setupStore.$onAction(({ name, store, after, args }) => {
  console.log(name, '-', store, '-', args)
  after((...params) => {
    console.log(params)
  })
})
</script>
