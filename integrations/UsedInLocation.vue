<template>
    <base-portal-icon icon="arrow" class="me-2"></base-portal-icon>
    <span class="text-primary">
        {{ t('Used in:') }} {{ props.locations }}
    </span>
</template>
    
<script setup lang='ts'>
import { useI18n } from 'vue-i18n'

const props = defineProps({
    locations:{
        type: String,
        required: true
    }
})

const { t } = useI18n()  

</script>