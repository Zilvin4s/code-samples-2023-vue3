<template>
  <div class="row mb-4">
    <div class="col">
      <div class="row">
        <div class="col d-flex flex-nowrap">
          <a-tooltip :destroy-tooltip-on-hide="false" :mouse-enter-delay="0" :mouse-leave-delay="0">
            <template #title>
              {{ props.schedule.data_field.system_name }}
            </template>
            <div class="badge bg-primary bg-opacity-10 text-primary me-2 fs-6 px-1">
              {{ props.schedule.data_field.system_name.substring(0, 2) }}
            </div>
          </a-tooltip>
          <strong class="me-2">{{ props.schedule.data_field.name }}</strong>
          <span class="text-muted text-overflow text-truncate">
            {{ props.schedule.event_detail.description }}
          </span>
        </div>
      </div>
      <div class="row mt-2">
        <div class="col d-flex justify-content-start align-items-center">
          <scheduler-location-icon
            :event-channel-type="props.schedule.event_channel?.type ?? 'none'"
            class="me-2"
          />
          <scheduler-event-duration :frequency="props.schedule.frequency" />
          <scheduler-event-start-at
            v-if="!!eventInfo"
            class="ms-2"
            :event-data="eventInfo"
            :timezone="props.timezone"
          />
          <span class="ms-3 d-flex">
            <slot name="buttons">
              <button
                class="btn btn-sm btn-primary rounded-pill px-3"
                type="button"
                @click="onEdit"
              >
                {{ t(!!eventInfo ? 'Reschedule' : 'Schedule') }}
              </button>
              <button
                v-if="!!props.dataFieldValue"
                type="button"
                class="btn bg-danger bg-opacity-10 btn-sm ms-2 px-2 d-flex align-items-center justify-content-center"
                @click="onDelete"
              >
                <base-portal-icon
                  icon="trash"
                  width="8px"
                  height="12px"
                  class="text-danger"
                ></base-portal-icon>
              </button>
            </slot>
          </span>
        </div>
      </div>
      <slot name="errors"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, computed, ComputedRef, watch, nextTick } from 'vue'
import { SchedulerDataResponseDto } from '@/dto/Scheduler/Response'
import { ExtendedNewLeadSchedulerValue } from '@/dto/Business/LmsLeadDto'
import { useI18n } from 'vue-i18n'
import { asyncComponentWrapper } from '@/composables/useReloadModal'

const SchedulerEventDuration = asyncComponentWrapper(
  () => import('@/components/Scheduler/PublicScheduler/common/SchedulerEventDuration.vue')
)
const SchedulerLocationIcon = asyncComponentWrapper(
  () => import('@/components/Scheduler/common/SchedulerLocationIcon.vue')
)
const SchedulerEventStartAt = asyncComponentWrapper(
  () => import('@/components/Scheduler/PublicScheduler/common/SchedulerEventStartAt.vue')
)
const ATooltip = asyncComponentWrapper(() => import('ant-design-vue/es/tooltip'))

const props = defineProps({
  schedule: {
    type: Object as PropType<SchedulerDataResponseDto>,
    required: true
  },
  dataFieldId: {
    type: String as PropType<string>,
    required: true
  },
  dataFieldValue: {
    type: Object as PropType<ExtendedNewLeadSchedulerValue>,
    required: false,
    default: undefined
  },
  timezone: {
    type: String,
    required: true
  }
})

const emit = defineEmits<{
  (e: 'openModal', schedule: SchedulerDataResponseDto): void
  (e: 'delete', dataFieldId: string): void
}>()

const { t } = useI18n()

const eventInfo: ComputedRef<ExtendedNewLeadSchedulerValue | undefined> = computed(() => {
  return props.dataFieldValue
})

function onEdit() {
  emit('openModal', props.schedule)
}

function onDelete() {
  emit('delete', props.dataFieldId)
}
</script>
