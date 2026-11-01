// No request: the /a/[apartmentId] shell fetched the list under this key.
export function useApartment() {
  const route = useRoute()
  const { data } = useNuxtData<Apartment[]>('apartments')
  const apartment = computed(() => data.value?.find(a => a.id === route.params.apartmentId))
  const isOwner = computed(() => apartment.value?.role === 'owner')
  return { apartment, isOwner }
}
