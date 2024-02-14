<template>
  <modal-component
    :visible="props.scheduleId !== undefined"
    @show="onModalShow"
    @hidden="onModalHide"
  >
    <template #modal-title>
      {{ t(exceptionId ? 'Edit Unavailable Time' : 'Add Unavailable Time') }}
    </template>
    <template #modal-body="{ isModalReady }">
      <div v-if="isModalReady">
        <base-loader :loading="isLoading">
          <unavailable-time-form
            v-if="props.scheduleId !== undefined && needsUpdate"
            :exception-id="props.exceptionId"
            :exception-data="exceptionData"
            :server-errors="errors"
            :is-location="props.isLocation"
            @submit="onSubmit"
          />
        </base-loader>
      </div>
    </template>
  </modal-component>
</template>
<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { createSchedulerException } from '@/api/Business/Scheduler/SchedulerExceptions'
import { notifySuccess, notifyError } from '@/helpers/notification.helper'
import useErrorHandler from '@/api/useErrorHandler'
import { ScheduleExceptionRequestDto } from '@/dto/Scheduler/SchedulerExceptionsData'
import { updateSchedulerException } from '@/api/Business/Scheduler/SchedulerExceptions'
import { AxiosError } from 'axios'
import { ErrorsResponse } from '@/api/useErrorHandler'
import { getSchedulerException } from '@/api/Business/Scheduler/SchedulerExceptions'
import { SchedulerExceptionDataDto } from '@/dto/Scheduler/SchedulerExceptionsData'
import { asyncComponentWrapper } from '@/composables/useReloadModal'

const ModalComponent = asyncComponentWrapper(() => import('@/components/Misc/ModalComponent.vue'))
const UnavailableTimeForm = asyncComponentWrapper(
  () => import('@/components/Misc/UnavailableTimeForm.vue')
)

const props = defineProps({
  scheduleId: {
    type: String,
    required: false,
    default: undefined
  },
  exceptionId: {
    required: false,
    type: String,
    default: undefined
  },
  isLocation: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

interface ICallback {
  (): void
}

const { t } = useI18n()
const { errors: serverErrors, handleErrors, formatArrayErrors } = useErrorHandler() // server errors
const errors = computed(() => {
  return formatArrayErrors(serverErrors.value)
})
const isLoading = ref(false)
const exceptionData = ref<SchedulerExceptionDataDto | undefined>()
const needsUpdate = ref(1)

function onSubmit(data: ScheduleExceptionRequestDto, callback: ICallback) {
  if (props.exceptionId !== undefined) {
    // UPDATE
    updateSchedulerException(props.exceptionId, data)
      .then(() => {
        notifySuccess(t('Exception updated successfully'))
        emit('close', { needsUpdate: true, scheduleId: props.scheduleId })
      })
      .catch(onError)
      .finally(() => {
        if (callback) callback()
      })
  } else if (props.scheduleId !== undefined) {
    // CREATE
    createSchedulerException(props.scheduleId, data)
      .then(() => {
        notifySuccess(t('Exception create successfully'))
        emit('close', { needsUpdate: true, scheduleId: props.scheduleId })
      })
      .catch(onError)
      .finally(() => {
        if (callback) callback()
      })
  } else {
    console.error('ScheduleId or ExceptionId must be set up to update form')
  }
}

function onError(err: AxiosError<ErrorsResponse>) {
  handleErrors(err) // sets errors.value
  notifyError(t('Check form for errors'))
}

function onModalHide() {
  exceptionData.value = undefined
  emit('close')
}

function onModalShow() {
  if (props.exceptionId !== undefined) {
    getExceptionsData()
  }
}

function getExceptionsData() {
  isLoading.value = true
  getSchedulerException(String(props.exceptionId))
    .then((response) => {
      exceptionData.value = response.data.data
      needsUpdate.value += 1
    })
    .catch((err) => {
      notifyError(t('Failed getting Schedule Exception info'))
      emit('close')
    })
    .finally(() => {
      isLoading.value = false
    })
}
</script>
