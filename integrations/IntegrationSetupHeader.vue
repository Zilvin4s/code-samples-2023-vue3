<template>
    <integration-header-title :index-route="props.indexRoute">
        {{ t(props.title) }}
    </integration-header-title>
</template>
    
<script setup lang='ts'>
import { defineProps } from 'vue'
import { useI18n } from 'vue-i18n'
import { asyncComponentWrapper } from '@/composables/useReloadModal'

const IntegrationHeaderTitle = asyncComponentWrapper(() => import('@/components/BackOffice/Configuration/integrations/common/IntegrationHeaderTitle.vue'))

const props = defineProps({
    title: {
        required: true,
        type: String
    },
    indexRoute:{
        required: true,
        type: Object,
    },
})

const { t } = useI18n()

</script>
