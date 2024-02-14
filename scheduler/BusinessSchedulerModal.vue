<template>
  <modal-component
    dialog-class="modal-xl modal-fullscreen-xl-down"
    body-class="pt-0"
    :visible="!!props.scheduleId"
    @hidden="onModalHide"
  >
    <template #modal-title>
      {{ t('Configure Scheduler') }}
    </template>
    <template #modal-body="{ isModalReady }">
      <div v-if="isModalReady" class="container">
        <base-loader :loading="isLoading">
          <scheduler-interview-form
            v-if="!!props.scheduleId"
            :schedule-data="scheduleData"
            :schedule-calendars="scheduleCalendars"
            :server-errors="errors"
            :event-channels="eventChannels"
            @submit="onSubmit"
          />
        </base-loader>
      </div>
    </template>
  </modal-component>
</template>

<script setup lang="ts">
import { defineEmits, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSchedule, GetScheduleResponseDto } from '@/api/Business/Scheduler/BusinessScheduler'
import { notifySuccess, notifyError } from '@/helpers/notification.helper'
import { updateSchedule } from '@/api/Business/Scheduler/BusinessScheduler'
import { ScheduleInterviewFormData } from '@/dto/Scheduler/SchedulerApiData'
import useErrorHandler from '@/api/useErrorHandler'
import { SchedulerDataResponseDto } from '@/dto/Scheduler/Response/index'
import { getSchedulerEventChannels } from '@/api/Business/Scheduler/SchedulerEventChannels'
import { SchedulerEventChannelDto } from '@/dto/Scheduler/SchedulerApiData'
import useCurrentBusiness from '@/composables/useCurrentBusiness'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { getSchedulerEventCalendars } from '@/api/Business/Scheduler/SchedulerEventCalendars'
import { SchedulerCalendarsDto } from '@/dto/Scheduler/Response/index'
import { handleCanceledRequest } from '@/helpers/error.helper'

const ModalComponent = asyncComponentWrapper(() => import('@/components/Misc/ModalComponent.vue'))
const SchedulerInterviewForm = asyncComponentWrapper(
  () => import('@/components/Scheduler/SchedulerInterviewForm/SchedulerInterviewForm.vue')
)

interface ICallback {
  (): void
}

const props = defineProps({
  scheduleId: {
    required: false,
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'success'])

const { t } = useI18n()
const { businessId } = useCurrentBusiness()

const isLoading = ref(false)
const scheduleData = ref<SchedulerDataResponseDto>()
const scheduleCalendars = ref<SchedulerCalendarsDto[]>()
const eventChannels = ref<SchedulerEventChannelDto[]>([])
const isSubmitting = ref<boolean>(false)
const { errors, handleErrors, resetErrors, scrollToErrors } = useErrorHandler() // server errors

function onModalHide() {
  emit('close')
}

async function loadSchedule() {
  await getSchedule(props.scheduleId)
    .then((resp: GetScheduleResponseDto) => {
      scheduleData.value = resp.data.data
    })
    .catch((e: any) => {
      handleCanceledRequest(e, () => {
        notifyError(t('Something went wrong. Failed getting schedule data'))
      })
    })
}

async function loadEventChannels() {
  await getSchedulerEventChannels(businessId.value)
    .then((resp) => {
      eventChannels.value = resp.data.data
    })
    .catch((e: any) => {
      handleCanceledRequest(e, () => {
        notifyError(t('Something went wrong. Failed getting event channels'))
      })
    })
}

async function loadCalendars() {
  await getSchedulerEventCalendars(businessId.value)
    .then((resp) => {
      scheduleCalendars.value = resp.data.data
    })
    .catch((e: any) => {
      handleCanceledRequest(e)
    })
}

function getData() {
  Promise.all([loadSchedule(), loadEventChannels(), loadCalendars()])
    .catch(() => {
      onModalHide()
    })
    .finally(() => {
      isLoading.value = false
    })
}

function onSubmit(data: ScheduleInterviewFormData, callback: ICallback | undefined = undefined) {
  resetErrors()
  isSubmitting.value = true

  updateSchedule(props.scheduleId, data)
    .then(() => {
      notifySuccess(t('Schedule update succesfully'))
      emit('close', { needsUpdate: true })
    })
    .catch((err) => {
      handleErrors(err)
      nextTick(() => {
        scrollToErrors({ errors })
      })
    })
    .finally(() => {
      isSubmitting.value = false
      if (callback) callback()
    })
}

function initialize() {
  if (props.scheduleId != null) {
    isLoading.value = true
    getData()
  } else {
    isLoading.value = false
  }
}

watch(() => props.scheduleId, initialize)
</script>

<style lang="scss" scoped>
.calendar-select-main {
  width: 71%;
}
</style>
