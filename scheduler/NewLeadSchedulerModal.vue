<template>
  <modal-component
    :position="2"
    dialog-class="modal-lg"
    body-class="pt-0"
    header-class="border-bottom-0"
    :visible="props.visible"
    modal-class="lead-scheduler-timeslots-modal"
    @hidden="emit('hidden')"
  >
    <template #modal-title>
      <div class="d-flex align-items-center">
        <div class="badge bg-primary bg-opacity-10 text-primary me-2 fs-6 px-1">
          {{ eventData?.scheduler?.data_field?.system_name }}
        </div>
        <span class="fs-3">
          {{ eventData?.scheduler?.data_field?.name }}
        </span>
      </div>
    </template>
    <template #modal-body>
      <scheduler-timeslots-form
        v-if="!!eventData && initialized"
        :event-data="eventData"
        :timeslots="currentDaySlots"
        :is-slots-loading="isSlotsLoading"
        :is-submitting="isBusy"
        :server-errors="serverErrors"
        :timezones="timezones"
        @timeslots="getSlots"
        @change="onChange"
        @submit="onSubmit"
      >
        <template #override>
          <div class="d-flex justify-items-center mb-2">
            <span class="text-muted fs-6 me-3">{{
              t('Custom Slot (Override Scheduler Settings)')
            }}</span>
            <a-switch :checked="formData.force" @change="toggleOverride" />
          </div>
        </template>
        <template #buttons>
          <button
            :disabled="isSlotsLoading"
            class="btn btn-sm px-5 ms-2 btn-primary btn-rounder confirm-button"
            @click="onSubmit"
          >
            {{ t('Confirm') }}
          </button>
        </template>
      </scheduler-timeslots-form>
    </template>
  </modal-component>
</template>

<script setup lang="ts">
import { reactive, Ref, ref, computed, nextTick, watch, ComputedRef, PropType } from 'vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { SchedulerFormEventDataDto } from '@/dto/Scheduler/SchedulerEventDto'
import { getScheduleTimeslots } from '@/api/Business/Scheduler/index'
import { SchedulerTimeslotsDto, SchedulerTimezonesDto } from '@/dto/Scheduler/Response/index'
import { getScheduleTimezones } from '@/api/Business/Scheduler/index'
import useErrorHandler from '@/api/useErrorHandler'
import { notifyError } from '@/helpers/notification.helper'
import { SchedulerEventData } from '@/dto/Scheduler/SchedulerEventDto'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { generateTimeslotsSlots } from '@/helpers/scheduler/scheduler.helper'
import { TIMESLOT_FORCED_SLOT } from '@/helpers/scheduler/scheduler.helper'
import { ExtendedNewLeadSchedulerValue } from '@/dto/Business/LmsLeadDto'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { BaseDataFieldValueRequest } from '@/dto/Business/DataFieldDto'
import { SchedulerTimeSlotFrequency } from '@/shared'

const ModalComponent = asyncComponentWrapper(() => import('@/components/Misc/ModalComponent.vue'))
const SchedulerTimeslotsForm = asyncComponentWrapper(
  () => import('@/components/Scheduler/common/SchedulerTimeslotsForm.vue')
)
const ASwitch = asyncComponentWrapper(() => import('ant-design-vue/es/switch'))

const props = defineProps({
  visible: {
    required: true,
    type: Boolean,
    default: false
  },
  scheduler: {
    required: false,
    type: Object as PropType<SchedulerEventData>,
    default: undefined
  },
  dataFieldId: {
    required: true,
    type: String
  },
  businessId: {
    required: true,
    type: String
  },
  locationId: {
    required: false,
    type: String,
    default: undefined
  },
  data: {
    required: false,
    type: Object as PropType<ExtendedNewLeadSchedulerValue>,
    default: undefined
  },
  timezone: {
    type: String,
    required: false,
    default: undefined
  }
})

const emit = defineEmits<{
  (e: 'hidden'): void
  (e: 'confirm', data: BaseDataFieldValueRequest): void
}>()

dayjs.extend(utc)
dayjs.extend(timezone)

const FULL_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'
const DATE_FORMAT = 'YYYY-MM-DD'
const FUTURE_DATE = dayjs().add(2, 'day').format(FULL_DATE_FORMAT)

const { t } = useI18n()
const { errors: serverErrors } = useErrorHandler()

const isBusy = ref(false)
const timezones: Ref<SchedulerTimezonesDto[]> = ref([])
const currentDaySlots = ref<SchedulerTimeslotsDto[]>([] as SchedulerTimeslotsDto[])
const isSlotsLoading = ref(false)
const initialized = ref(false)

const formData: {
  date: string,
  starting_at: string | undefined,
  timezone: string,
  force: boolean
} = reactive({
  date: dayjs().format(DATE_FORMAT),
  starting_at: undefined,
  timezone: props.timezone || 'UTC',
  force: false
})

const eventData: ComputedRef<SchedulerFormEventDataDto> = computed(() => {
  const start = dayjs(formData.starting_at).tz(formData.timezone)
  const starting_at_zulu = formData.timezone === 'UTC' ? start.format() : start.utc().format()

  return {
    starting_at: formData.starting_at
      ? dayjs(formData.starting_at).format(FULL_DATE_FORMAT)
      : FUTURE_DATE,
    timezone: formData.timezone,
    starting_at_zulu,
    scheduler: props.scheduler,
    force: formData.force
  }
})

function loadTimezones() {
  getScheduleTimezones(props.businessId, props.locationId).then((response) => {
    timezones.value = response.data.data
  })
}

function getSlots(date: string, timezone: string) {
  formData.force ? getForcedSlots(date) : getTimeslots(date, timezone)
}

function getTimeslots(date: string, timezone: string) {
  isSlotsLoading.value = true

  const params = {
    date: date,
    timezone: timezone,
    location_id: props.locationId
  }

  getScheduleTimeslots(props.dataFieldId, params)
    .then((response) => {
      currentDaySlots.value = response.data.data
    })
    .catch(() => {
      notifyError(t('Failed getting time slots for the day'))
    })
    .finally(() => {
      nextTick(() => {
        isSlotsLoading.value = false
      })
    })
}

function getForcedSlots(date: string) {
  isSlotsLoading.value = true

  const startOfDay = dayjs(date).startOf('day').format(FULL_DATE_FORMAT)
  const endOfDay = dayjs(date).endOf('day').format(FULL_DATE_FORMAT)
  const slots = generateTimeslotsSlots(startOfDay, endOfDay, SchedulerTimeSlotFrequency.Default)

  currentDaySlots.value = slots.map((slot) => {
    return {
      date: dayjs.utc(slot).format(FULL_DATE_FORMAT),
      date_zulu: dayjs(slot).utc().format(),
      leads: TIMESLOT_FORCED_SLOT
    }
  })

  nextTick(() => {
    isSlotsLoading.value = false
  })
}

async function init() {
  if (!initialized.value) {
    Promise.all([loadTimezones(), getSlots(formData.date, formData.timezone)])
      .catch()
      .finally(() => {
        initialized.value = true
      })
  }
}

function onSubmit() {
  const data: BaseDataFieldValueRequest = {
    data_field_id: props.dataFieldId,
    value: {
      starting_at: formData.force
        ? dayjs.tz(String(formData.starting_at), formData.timezone).utc().format(FULL_DATE_FORMAT)
        : dayjs(String(formData.starting_at)).utc().format(FULL_DATE_FORMAT),
      starting_at_zulu: formData.force
        ? dayjs.tz(String(formData.starting_at), formData.timezone).utc().format()
        : dayjs(String(formData.starting_at)).utc().format(),
      timezone: formData.timezone,
      force: formData.force,
      location_id: props.locationId
    }
  }

  emit('confirm', data)
}

function toggleOverride() {
  formData.force = !formData.force

  getSlots(formData.date, formData.timezone)
}

function onChange(values: { date: string; starting_at: string; timezone: string }) {
  formData.date = values.date
  formData.starting_at = values.starting_at
  formData.timezone = values.timezone
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.data) {
        formData.date = props.data?.starting_at ? dayjs(props.data?.starting_at).format(DATE_FORMAT) : ''
        formData.starting_at = props.data?.starting_at_zulu || undefined
        formData.timezone = props.data?.timezone || 'UTC'
        formData.force = props.data?.force || false
      } else {
        formData.timezone = props.timezone ?? 'UTC'
      }

      init()
    } else {
      initialized.value = false

      formData.date = dayjs().format(DATE_FORMAT)
      formData.starting_at = undefined
      formData.timezone = props.timezone || 'UTC'
      formData.force = false
    }
  }
)
</script>

<style lang="scss">
.lead-scheduler-timeslots-modal {
  .modal-lg {
    max-width: 921px !important;
  }
}
</style>
