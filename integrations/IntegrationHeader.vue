<template>
<div class="row bg-pattern mb-3">
    <div class="col pt-4">
        <div class="container">
        <div class="row mb-4 align-items-center justify-content-around">
            <div class="col">
            <h2 class="m-0 text-capitalize">
                {{ t('Integrations') }}
            </h2>
            </div>
            <div class="col">
                <div class="row">
                    <div class="col-8">
                    <div class="col-4 d-flex justify-content-end">
                        <dropdown-wrapper>
                            <template #default="{ dropdownId }">
                                <div class="dropdown">
                                    <button  
                                        :id="dropdownId" 
                                        aria-expanded="false"
                                        data-bs-toggle="dropdown"
                                        type="button" 
                                        class="btn btn-primary btn-rounder min-w-150 d-flex align-items-center flex-nowrap ps-4 pe-5" 
                                        >
                                        <base-portal-icon icon="plus" class="me-4" width="12" height="12" /> 
                                        {{ t('Add') }}
                                    </button>
                                    <ul class="dropdown-menu shadow p-0" :aria-labelledby="dropdownId">
                                        <li v-for="(item, idx) in integrationsList" :key="idx" class="dropdown-item border-bottom p-0" >
                                            <router-link :to="item.route" class="py-2 px-4 d-block text-decoration-none w-100">
                                                <base-portal-icon :icon="item.dropdown?.icon" width="12px" height="12px" class="me-2" />
                                                {{ item.dropdown?.label }}
                                            </router-link>
                                        </li>
                                    </ul>
                                </div>
                            </template>
                        </dropdown-wrapper>
                    </div>
                </div>
            </div>
        </div>
        </div>
    </div>
</div>
</template>
    
<script setup lang='ts'>
import { computed } from 'vue'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { useI18n } from 'vue-i18n'
import { useIntegrationsProviderList } from '@/composables/integrations/useIntegrationsProviderList'
import { IIntegrationsItem } from '@/dto/Integration/index'

const QuickSearch = asyncComponentWrapper(() => import('@/components/Misc/QuickSearch.vue'))
const DropdownWrapper = asyncComponentWrapper(
  () => import('@/components/Misc/DropdownWrapper.vue')
)

const props = defineProps({
    isLoading:{
        required: false,
        type: Boolean,
        default: false,
    },
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

const { t } = useI18n()
const { businessProviderList, userProviderList } = useIntegrationsProviderList(props.isBusiness, props.isAdmin)

const integrationsList = computed(()=>{
    const _list = props.isBusiness ? businessProviderList : userProviderList
    return _list.filter((item: IIntegrationsItem)=> !!item.route && !!item.dropdown) // TIP: make sure it has a route, otherwise it should not be visible
})

</script>

<style lang="scss" scoped>
.min-w-150{
    min-width: 150px;
}
.dropdown-menu{
    max-width: 200px;
    min-width: 150px;

    .dropdown-item{
        cursor: pointer;
        a:link, a:visited, a:hover, a:active{
            text-decoration: none !important; 
        }
    }
}
</style>