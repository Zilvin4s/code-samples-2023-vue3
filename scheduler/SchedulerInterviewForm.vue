<template>
  <form @submit.prevent="submitForm">
    <!-- AVAILABILITY -->
    <schedule-section :title="t('Availability')">
      <template #form>
        <scheduler-form-availbility
          :values="form.values"
          :errors="form.errors"
          @change="form.setFieldValue"
          @validate="form.validate"
        />
      </template>
      <template #info>
        <p>{{
          t('Define days and time blocks within a day when this type of event can be booked')
        }}</p>
      </template>
    </schedule-section>

    <!-- SLOT -->
    <schedule-section :title="t('Slot')">
      <template #form>
        <scheduler-form-slot :values="form.values" :errors="form.errors" />
      </template>
      <template #info>
        <p>{{ t('All slot parameters to define your booking needs.') }}</p>
        <p
          >{{
            t(
              'If buffer is marked as blocking, it is added in slot ' +
                'availability calculations and checks. If buffer is not blocking, ' +
                'it is used for a space calculations between slot but allows other ' +
                'events (i.e. via connected calendar) to be placed in the time period.'
            )
          }}
        </p>
      </template>
    </schedule-section>

    <!-- CONDITIONS -->
    <schedule-section :title="t('Conditions')">
      <template #form>
        <scheduler-form-conditions :values="form.values" :errors="form.errors" />
      </template>
      <template #info>
        <p>{{
          t('Extra parameters that allow you to control event details and your availability.')
        }}</p>
        <p
          >{{
            t(
              'They define minimum amount of you need to prepare or the maximum amount of time ' +
                'horizon in the future you’re willing to be booked at.'
            )
          }}
        </p>
        <p
          >{{
            t(
              'Since scheduler is a stand-alone functionality and can work outside your Marketing ' +
                'Automation rules, the “Due” status fires reminder emails and highlights the lead ' +
                'before the actual event should start.'
            )
          }}
        </p>
      </template>
    </schedule-section>

    <!-- CONNECTED CALENDAR -->
    <schedule-section :title="t('Connected Calendar')">
      <template #form>
        <scheduler-form-calendar 
          :calendars="scheduleCalendars"
          :values="form.values"
          :errors="form.errors"
          @change="form.setFieldValue"
        />
      </template>
      <template #info>
        <p
          >{{
            t(
              'If you want to sync all events into the calendar, choose one ' +
                'from your available integrations.'
            )
          }}
        </p>
        <p
          >{{ t('Event contains technical information from the profile (Names, Links, etc.).') }}
        </p>
        <p
          >{{
            t(
              'If multiple people should participate in the event, add them ' +
                'as guests and event will sync to their calendars automatically.'
            )
          }}
        </p>
      </template>
    </schedule-section>

    <!-- EVENT DETAILS -->
    <schedule-section :title="t('Event Details')">
      <template #form>
        <scheduler-form-details
          :values="form.values"
          :errors="form.errors"
          :event-channels="eventChannels"
          :feature-id="scheduleData?.feature_id"
          @change="form.setFieldValue"
        />
      </template>
      <template #info>
        <p
          >{{
            t(
              'This information will be publicly available and previewed/shared ' +
                'with everyone who books a slot.'
            )
          }}
        </p>
        <p>{{ t('This information will be added to external calendar after booking.') }}</p>
        <p
          >{{
            t(
              'If event is virtual you can select Zoom account or Google Meet ' +
                '(via connected calendar). Choose appropriate one from the list.'
            )
          }}
        </p>
        <p>{{ t('If you change details, all active events will be updated.') }}</p>
      </template>
    </schedule-section>

    <div class="row pt-4 pb-4">
      <div class="col"></div>
      <div class="col d-flex justify-content-end">
        <base-submit-button
          btn-class="btn btn-primary rounded-pill px-5"
          :is-submitting="isSubmitting"
          :disabled="isSubmitting"
        >
          {{ t(props.buttonLabel) }}
        </base-submit-button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { defineEmits, toRef, PropType, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSchedulerInterviewForm } from '@/composables/scheduler/useSchedulerInterviewForm'
import { SchedulerDataResponseDto } from '@/dto/Scheduler/Response'
import { formatServerErrors } from '@/helpers/error.helper'
import { SchedulerEventChannelDto } from '@/dto/Scheduler/SchedulerApiData'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { SchedulerCalendarsDto } from '@/dto/Scheduler/Response'

const ScheduleSection = asyncComponentWrapper(
  () => import('@/components/Scheduler/SchedulerInterviewForm/common/ScheduleSection.vue')
)
const SchedulerFormAvailbility = asyncComponentWrapper(
  () =>
    import('@/components/Scheduler/SchedulerInterviewForm/partials/SchedulerFormAvailbility.vue')
)
const SchedulerFormSlot = asyncComponentWrapper(
  () => import('@/components/Scheduler/SchedulerInterviewForm/partials/SchedulerFormSlot.vue')
)
const SchedulerFormConditions = asyncComponentWrapper(
  () => import('@/components/Scheduler/SchedulerInterviewForm/partials/SchedulerFormConditions.vue')
)
const SchedulerFormCalendar = asyncComponentWrapper(
  () => import('@/components/Scheduler/SchedulerInterviewForm/partials/SchedulerFormCalendar.vue')
)
const SchedulerFormDetails = asyncComponentWrapper(
  () => import('@/components/Scheduler/SchedulerInterviewForm/partials/SchedulerFormDetails.vue')
)

const props = defineProps({
  scheduleData: {
    required: false,
    type: Object as PropType<SchedulerDataResponseDto>,
    default: null
  },
  scheduleCalendars:{
    required: false,
    type: Array as PropType<SchedulerCalendarsDto[]>,
    default: null
  },
  serverErrors: {
    required: false,
    default: undefined,
    type: Object as PropType<Record<string, string[]>>
  },
  eventChannels: {
    required: true,
    type: Array as PropType<SchedulerEventChannelDto[]>
  },
  buttonLabel: {
    required: false,
    type: String,
    default: 'Save'
  }
})

const emit = defineEmits(['submit'])

const form = useSchedulerInterviewForm()
const isSubmitting = toRef(form, 'isSubmitting')
const { t } = useI18n()

async function submitForm() {
  const canSubmit = await form.canSubmit()
  if (canSubmit) {
    form.isSubmitting.value = true
    emit('submit', form.exportData(), () => {
      form.isSubmitting.value = false
    })
  }
}

watch(
  () => props.scheduleData,
  () => {
    form.importData(props.scheduleData)
  }
)

watch(
  () => props.serverErrors,
  () => {
    if (props.serverErrors) {
      form.setErrors(formatServerErrors(props.serverErrors))
    } else {
      form.setErrors({})
    }
  }
)
</script>
