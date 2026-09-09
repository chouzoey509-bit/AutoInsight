<template>
  <div class="app-shell">
    <IntroAnimationV2 v-if="showIntro" @complete="showIntro = false" />
    <router-view v-slot="{ Component, route }">
      <Transition name="fade" mode="out-in">
        <KeepAlive :include="keepAliveViews">
          <component :is="Component" :key="route.fullPath" />
        </KeepAlive>
      </Transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import IntroAnimationV2 from './components/intro/IntroAnimationV2.vue'

const route = useRoute()
const showIntro = ref(true)
const keepAliveViews = computed(() => route.name ? [String(route.name)] : [])
</script>

<style scoped>
.app-shell{min-height:100vh;background:var(--bg-page,#0b0d12);color:var(--text-primary,#f5f7fa)}
.fade-enter-active,.fade-leave-active{transition:opacity .2s ease}.fade-enter-from,.fade-leave-to{opacity:0}
</style>
