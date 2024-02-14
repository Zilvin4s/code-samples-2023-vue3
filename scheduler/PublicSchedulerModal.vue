<template>
  <modal-component
    modal-class="public-scheduler-modal"
    dialog-class="modal-lg"
    body-class="pt-0"
    header-class="border-bottom-0"
    :visible="visible"
    @hidden="emit('hidden')"
  >
    <template #modal-title>
      <scheduler-event-title v-if="eventData !== null" :event-data="eventData" />
    </template>
    <template #modal-body>
      <scheduler-timeslots-form
        v-if="eventData !== null && initialized"
        :event-data="eventData"
        :timeslots="currentDaySlots"
        :is-slots-loading="isSlotsLoading"
        :is-submitting="isBusy"
        :server-errors="serverErrors"
        :timezones="timezones"
        is-public
        @timeslots="getTimeslots"
        @submit="onSubmit"
      />
    </template>
  </modal-component>
</template>

<script setup lang="ts">
import { ref, Ref, computed, PropType, nextTick, watch } from 'vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { useI18n } from 'vue-i18n'
import { PublicSchedulerEventDataDto } from '@/dto/Scheduler/SchedulerEventDto'
import { getScheduleTimeslots } from '@/api/Business/Scheduler/index'
import { SchedulerTimeslotsDto, SchedulerTimezonesDto } from '@/dto/Scheduler/Response/index'
import { getScheduleTimezones } from '@/api/Business/Scheduler/index'
import useErrorHandler from '@/api/useErrorHandler'
import { SchedulerHistoryTypeEnum } from '@/enums/SchedulerEnum'
import { notifyError, notifySuccess } from '@/helpers/notification.helper'
import { ScheduleEventTimeUpdateRequest } from '@/dto/Scheduler/Request/index'
import { updatePublicSchedulerEvent } from '@/api/Business/Scheduler/PublicSchedulerEvent'
import { asyncComponentWrapper } from '@/composables/useReloadModal'

const ModalComponent = asyncComponentWrapper(() => import('@/components/Misc/ModalComponent.vue'))
const SchedulerEventTitle = asyncComponentWrapper(
  () => import('@/components/Scheduler/PublicScheduler/common/SchedulerEventTitle.vue')
)
const SchedulerTimeslotsForm = asyncComponentWrapper(
  () => import('@/components/Scheduler/common/SchedulerTimeslotsForm.vue')
)

const props = defineProps({
  visible: {
    required: true,
    type: Boolean
  },
  eventData: {
    required: true,
    type: Object as PropType<PublicSchedulerEventDataDto | null>
  },
  dataFieldId: {
    required: true,
    type: String
  },
  leadId: {
    required: true,
    type: String
  }
})

const emit = defineEmits(['hidden', 'confirm'])

dayjs.extend(utc)
dayjs.extend(timezone)

const { t } = useI18n()
const { handleErrors, errors: serverErrors } = useErrorHandler()

const isBusy = ref(false)
const timezones: Ref<SchedulerTimezonesDto[]> = ref([])
const currentDaySlots = ref<SchedulerTimeslotsDto[]>([] as SchedulerTimeslotsDto[])
const isSlotsLoading = ref(false)
const initialized = ref(false)

function loadTimezones() {
  if (props.eventData)
    getScheduleTimezones(props.eventData.business.id, props.eventData.lead?.location?.id)
      .then((response) => {
        timezones.value = response.data.data
      })
      .catch((err) => {
        notifyError(err?.message || t('Failed getting timezones'))
      })
}

function getTimeslots(date: string, timezone: string) {
  isSlotsLoading.value = true

  // TODO - add 30-60s caching and use availableSlots
  const params = {
    date: date,
    timezone: timezone,
    location_id: props.eventData?.lead?.location?.id
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

function init() {
  if (!initialized.value && props.eventData) {
    const date = dayjs(props.eventData.starting_at).format('YYYY-MM-DD')

    Promise.all([loadTimezones(), getTimeslots(date, props.eventData.timezone)])
      .catch((err) => {
        notifyError(err?.message || t('Something went wrong'))
      })
      .finally(() => {
        initialized.value = true
      })
  }
}

function onSubmit(values: { starting_at: string; timezone: string }) {
  if (isBusy.value) return
  isBusy.value = true

  const data: ScheduleEventTimeUpdateRequest = {
    data_field_id: props.dataFieldId,
    lead_id: props.leadId,
    starting_at: dayjs(String(values.starting_at)).utc().format('YYYY-MM-DD HH:mm:ss'),
    timezone: values.timezone,
    location_id: props.eventData?.lead?.location?.id // optional
  }

  updatePublicSchedulerEvent(data)
    .then(() => {
      notifySuccess(t('Event time updated'))
      emit('confirm')
    })
    .catch((err) => {
      notifyError(err?.message || t('Something went wrong'))
      handleErrors(err)
    })
    .finally(() => {
      nextTick(() => {
        isBusy.value = false
      })
    })
}

watch(
  () => props.visible,
  () => {
    if (props.visible) {
      init()
    } else {
      initialized.value = false
    }
  }
)
</script>

<style lang="scss">
.public-scheduler-modal {
  .modal-lg {
    max-width: 921px !important;
  }
}
</style>
