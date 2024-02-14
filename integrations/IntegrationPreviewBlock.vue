<template>
    <div class="card shadow-sm border-0">
        <div class="card-body pt-4 pb-3 px-4">
            <div class="row ">
                <div class="col-9 images-and-icons mb-5">
                    <span :class="{'me-4' : data.icons?.length }">
                        <broken-icons v-if="data.logo?.broken === true" :icon="data.logo.icon" :width="data.logo.width" :height="data.logo.height" />
                        <base-portal-icon v-else-if="data.logo" v-bind="data.logo" />

                        <template v-if="!!data.logo2">
                            <broken-icons v-if="data.logo2?.broken === true" :icon="data.logo2.icon" :width="data.logo2.width" :height="data.logo2.height" />
                            <base-portal-icon v-else-if="data.logo2" v-bind="data.logo2" />
                        </template>
                    </span>


                    <template v-if="data.icons">
                        <div v-for="(icon, idx) in data.icons" :key="idx" class="me-3">
                            <base-portal-icon :icon="icon" />
                        </div>
                    </template>
                </div>
                <div class="col-3 d-flex justify-content-end ">
                   <div>
                    <router-link 
                        v-if="hasRoute" 
                        :to="data.route"
                        class="btn btn-primary btn-md px-4 btn-rounder" 
                        >
                        {{ t('Start') }}
                    </router-link>
                    <button 
                        v-else 
                        class="btn btn-primary btn-md px-4 btn-rounder " 
                        disabled
                        >
                        {{ t('Start') }}
                    </button>
                   </div>
                </div>
            </div>
            <div class="row">
                <div class="col-9 text-muted">
                    {{ t(data.about) }}
                </div>
                <div class="col-3 text-muted">
                    {{ t('Integrations') }}:
                    <ul>
                        <li v-for="(option, idx) in data.options" :key="idx">
                            {{ t(option) }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>
    
<script setup lang='ts'>
import { PropType, computed } from 'vue'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { useI18n } from 'vue-i18n'
import { IIntegrationsItem } from '@/dto/Integration/index'

const BrokenIcons = asyncComponentWrapper(
  () => import('@/components/BackOffice/Configuration/integrations/IntegrationSetup/BrokenIcons.vue')
)

const props = defineProps({
    data:{
        type: Object as PropType<IIntegrationsItem>,
        required: true
    },
})

const { t } = useI18n()

const hasRoute = computed(()=>{
    return props.data.route !== undefined
})

</script>
    
<style lang="scss" scoped>
.images-and-icons{
    display: flex;
    align-items: center;
    justify-content: flex-start;
    img{
        height: 40px;
        width: auto;
    }
    svg{
        height: 40px;
        width: auto;
    }
}

button:disabled {
  cursor: not-allowed;
  pointer-events: all !important;
}
</style>