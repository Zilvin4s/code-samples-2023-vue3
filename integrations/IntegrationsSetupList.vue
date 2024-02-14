<template>
    <div class="pt-3 mt-4">
        <integration-preview-block 
            v-for="(integration, idx) in integrations" 
            :key="idx"
            :data="integration" 
            class="mb-5 col-12"
        />
    </div>
</template>
    
<script setup lang='ts'>
import { defineProps, computed, ComputedRef } from 'vue'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { IIntegrationsItem } from '@/dto/Integration/index'
import { useIntegrationsProviderList } from '@/composables/integrations/useIntegrationsProviderList'

const IntegrationPreviewBlock = asyncComponentWrapper(
  () => import('@/components/BackOffice/Configuration/integrations/IntegrationProviders/IntegrationPreviewBlock.vue')
)

const props = defineProps({
    isBusiness:{
        required: false,
        type: Boolean,
        default: false,
    },
    isAdmin:{
        required: false,
        type: Boolean,
        default: false,
    },
})

const { businessProviderList, userProviderList } = useIntegrationsProviderList(props.isBusiness, props.isAdmin)

const integrations: ComputedRef<IIntegrationsItem[]> = computed(()=>{
    if(props.isBusiness){
        return businessProviderList
    }
    return userProviderList
})

</script>
