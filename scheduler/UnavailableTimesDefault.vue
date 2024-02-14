<template>
  <div>
    <div class="py-2 border-bottom">
      <span class="text-muted fs-4">
        {{ t('Outside Availability') }}
      </span>
    </div>
    <div v-if="!hasUnavailableTimes && props.isLocation" class="py-2 border-bottom">
      <span class="text-muted fs-4">
        {{ t('Inherit all from Business Settings') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { SchedulerExceptionDataDto } from '@/dto/Scheduler/SchedulerExceptionsData'

const props = defineProps({
  isLocation: {
    required: false,
    type: Boolean,
    default: false
  },
  exceptions: {
    required: true,
    type: Array as PropType<SchedulerExceptionDataDto[]>
  }
})

const { t } = useI18n()

const hasUnavailableTimes = computed(() => {
  return props.exceptions.length > 0
})
</script>
