<template>
  <div 
    v-if="!!props.location || !!props.business" 
    class="text-primary d-flex align-items-center"
    >
    <base-portal-icon icon="arrow" class="text-muted me-2" />
    {{ t('Used in') }}: 
    <slot>
      <router-link 
        :to="routeTo" 
        target="_blank" 
        class="text-decoration-none ps-1"
        >
        {{ usedIn }}
      </router-link>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouteList } from '@/routes/RouteList'
import { PagesUsedInBusinessDto, PagesUsedInLocationDto } from '@/dto/Integration/Response'

const props = defineProps({
  location: {
    required: false,
    default: null,
    type: Object as PropType<PagesUsedInLocationDto>
  },
  business: {
    required: false,
    default: null,
    type: Object as PropType<PagesUsedInBusinessDto>
  }
})

const { t } = useI18n()

const usedIn = computed(() => {
  if (!!props.location) {
    return props.location.name
  } else if (!!props.business) {
    return props.business.name
  }
  return ''
})

const routeTo = computed(() => {
  if (!!props.location) {
    return {
      name: RouteList.SETTINGS.BUSINESS.LOCATIONS.LOCATION.INDEX.NAME,
      params: {
        businessSlug: props.location.business.slug,
        locationId: props.location.id
      }
    }
  } else if (!!props.business) {
    return {
      name: RouteList.SETTINGS.BUSINESS.BUSINESS.NAME,
      params: {
        businessSlug: props.business.slug
      }
    }
  }
  return ''
})
</script>
