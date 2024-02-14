<template>
  <div class="mt-2 mb-5">
    <template v-for="integration in props.integrations" :key="integration.id">
      <component
        :is="integrationComponents[integration.provider]"
        :integration="integration"
        :class="{ 'mb-4': true }"
        :active="expandedItem[integration.id]"
        :is-business="props.isBusiness"
        @expand="onExpand"
        @refresh="onRefresh"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, PropType, Component as IComponent } from 'vue'
import { ProviderT } from '@/dto/Integration/index'
import { CalendarIntegrationResponseDto } from '@/dto/Integration/Response/index'
import { asyncComponentWrapper } from '@/composables/useReloadModal'

const props = defineProps({
  integrations: {
    required: true,
    type: Array as PropType<CalendarIntegrationResponseDto[]>
  },
  isBusiness: {
    required: false,
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['expand', 'refresh'])

const expandedItem = ref<Record<string, boolean>>({})

const integrationComponents: Record<ProviderT, IComponent> = {
  google: asyncComponentWrapper(
    () =>
      import(
        '@/components/BackOffice/Configuration/integrations/IntegrationProviders/IntegrationGoogle.vue'
      )
  ),
  microsoft: asyncComponentWrapper(
    () =>
      import(
        '@/components/BackOffice/Configuration/integrations/IntegrationProviders/IntegrationMicrosoft.vue'
      )
  ),
  zoom: asyncComponentWrapper(
    () =>
      import(
        '@/components/BackOffice/Configuration/integrations/IntegrationProviders/IntegrationZoom.vue'
      )
  ),
  facebook: asyncComponentWrapper(
    () =>
      import(
        '@/components/BackOffice/Configuration/integrations/IntegrationProviders/IntegrationFacebook.vue'
      )
  ),
  procare: asyncComponentWrapper(
    () =>
      import(
        '@/components/BackOffice/Configuration/integrations/IntegrationProviders/IntegrationProcare.vue'
      )
  )
}

function onExpand(providerId: string) {
  if (!expandedItem.value.hasOwnProperty(providerId)) expandedItem.value[providerId] = false

  expandedItem.value[providerId] = !expandedItem.value[providerId]
}

function onRefresh() {
  emit('refresh')
}
</script>
