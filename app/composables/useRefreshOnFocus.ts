// No realtime: a page refetches when the tab comes back to the front (Implementation details#Feed). Plain listener:
// @vueuse/core isn't a direct dependency.
export function useRefreshOnFocus(refresh: () => unknown) {
  function onVisibilityChange() {
    if (document.visibilityState === 'visible') refresh()
  }
  onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
  onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisibilityChange))
}
