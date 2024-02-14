<template>
  <form @submit.prevent="onSubmit">
    <div class="row">
      <div class="col col-info">
        <div class="row mb-2">
          <div class="col">
            <scheduler-event-duration :frequency="props.eventData.scheduler.frequency" />
          </div>
        </div>
        <div class="row mb-2">
          <div class="col">
            <scheduler-event-location :event-data="props.eventData" />
          </div>
        </div>
        <div class="row mb-2 mt-4">
          <div class="col">
            <span class="text-muted">
              {{ eventData.scheduler.event_detail?.description }}
            </span>
          </div>
        </div>
      </div>
      <div class="col col-dates">
        <scheduler-availability-calendar
          v-model="calendarDate"
          :availability="props.eventData.scheduler.availability"
          :class-names="{ 'is-invalid': !!errors.date }"
        />
        <div class="invalid-feedback">{{ errors.date }}</div>
        <div class="timezone-container mt-3">
          <label for="timezone" class="form-label">{{ t('Timezone') }}</label>
          <a-select
            id="timezone"
            :value="values.timezone"
            :options="timezoneOptions"
            :show-search="true"
            class="w-100"
            :class="{ 'is-invalid': !!errors.timezone }"
            option-filter-prop="label"
            size="large"
            @change="onTimezoneChange"
          />
          <div class="invalid-feedback d-flex">{{ errors.timezone }}</div>
        </div>
      </div>
      <div class="col col-times">
        <base-loader :loading="isSlotsLoading">
          <slot name="override"></slot>
          <scheduler-event-times
            v-model="values.starting_at"
            :slots="props.timeslots"
            :event-data="props.eventData"
            :class-names="`${errors.starting_at ? 'is-invalid' : ''}`"
          />
          <div class="invalid-feedback d-flex">{{ errors.starting_at }}</div>
        </base-loader>
        <div class="mt-3 d-flex justify-content-between align-items-center preview-block">
          <div class="w-100">{{ selectedFull }}</div>
          <slot name="buttons">
            <base-submit-button
              :disabled="isSlotsLoading"
              :is-submitting="props.isSubmitting || isSlotsLoading"
              class="btn btn-sm px-5 ms-2 btn-primary btn-rounder confirm-button"
            >
              {{ t('Confirm') }}
            </base-submit-button>
          </slot>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, Ref, computed, PropType, watch, ComputedRef, nextTick } from 'vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { useI18n } from 'vue-i18n'
import { useField, useForm } from 'vee-validate'
import { string } from 'yup'
import { PublicSchedulerEventDataDto } from '@/dto/Scheduler/SchedulerEventDto'
import { SchedulerTimeslotsDto } from '@/dto/Scheduler/Response/index'
import { SchedulerTimezonesDto } from '@/dto/Scheduler/Response/index'
import useErrorHandler from '@/api/useErrorHandler'
import { asyncComponentWrapper } from '@/composables/useReloadModal'

const ASelect = asyncComponentWrapper(() => import('ant-design-vue/es/select'))
const SchedulerEventDuration = asyncComponentWrapper(
  () => import('@/components/Scheduler/PublicScheduler/common/SchedulerEventDuration.vue')
)
const SchedulerEventLocation = asyncComponentWrapper(
  () => import('@/components/Scheduler/PublicScheduler/common/SchedulerEventLocation.vue')
)
const SchedulerEventTimes = asyncComponentWrapper(
  () => import('@/components/Scheduler/PublicScheduler/common/SchedulerEventTimes.vue')
)

const SchedulerAvailabilityCalendar = asyncComponentWrapper(
  () => import('@/components/Scheduler/common/SchedulerAvailabilityCalendar.vue')
)

const props = defineProps({
  eventData: {
    required: true,
    type: Object as PropType<PublicSchedulerEventDataDto>
  },
  timeslots: {
    required: true,
    type: Array as PropType<SchedulerTimeslotsDto[]>
  },
  timezones: {
    required: true,
    type: Array as PropType<SchedulerTimezonesDto[]>
  },
  isSlotsLoading: {
    required: false,
    default: false,
    type: Boolean
  },
  isSubmitting: {
    required: false,
    default: false,
    type: Boolean
  },
  serverErrors: {
    required: false,
    default: null,
    type: Object
  },
  isPublic: {
    type: Boolean,
    default: false,
    required: false
  }
})

const emit = defineEmits(['submit', 'timeslots', 'change'])

dayjs.extend(utc)
dayjs.extend(timezone)

const { t } = useI18n()
const { scrollToErrors } = useErrorHandler()

const calendarDate = ref(props.eventData.starting_at_zulu)

const { values, errors, setFieldValue, setErrors } = useForm({
  initialValues: {
    date: dayjs(calendarDate.value).format('YYYY-MM-DD'),
    starting_at:
      props.eventData.force && !props.isPublic
        ? dayjs(props.eventData.starting_at_zulu).tz(props.eventData.timezone).utc(true).format() // I think this change created a bug
        : props.eventData.starting_at_zulu, // always UTC
    timezone: props.eventData.timezone
  },
  validationSchema: {
    date: string().required().label(t('Date')),
    starting_at: string().required(t('Select a time slot')).label(t('Time')),
    timezone: string().required().label(t('Timezone'))
  }
})

const timezoneOptions = computed(() => {
  return [...props.timezones].sort(timezonesSort).map((tz) => {
    return {
      value: tz.identifier,
      label: tz.gmt
    }
  })
})

const selectedFull: ComputedRef<string> = computed(() => {
  try {
    if (values.starting_at !== '') {
      return props.eventData.force && !props.isPublic
        ? dayjs.tz(String(values.starting_at)).format('dddd, MMMM D h:mm A')
        : dayjs(String(values.starting_at)).tz(values.timezone).format('dddd, MMMM D h:mm A')
    }
    return dayjs(String(values.date)).format('dddd, MMMM D')
  } catch (e) {
    return ''
  }
})

watch(
  () => props.timeslots,
  () => {
    const slot = slotAvailable(props.eventData.starting_at_zulu, props.timeslots)
    if (slot) {
      // if event start at zulu is available on new data with slots
      setFieldValue('starting_at', slot.date_zulu)
    } else if (!slotAvailable(values.starting_at, props.timeslots)) {
      setFieldValue('starting_at', '') // only reset if slot not available anymore, because of timezone changes
    }
  }
)

watch(calendarDate, () => {
  // sync date with calendarDate, but format date as string for comparison
  setFieldValue('date', dayjs(calendarDate.value).format('YYYY-MM-DD'))
  updateTimeslots()
})

watch(
  () => props.serverErrors,
  () => {
    if (props.serverErrors) {
      setErrors(props.serverErrors)
      scrollToErrors({ errors: props.serverErrors })
    }
  }
)

watch(
  () => [values.date, values.starting_at, values.timezone],
  () => {
    emit('change', values)
  }
)

function slotAvailable(dateZulu: string, slots: SchedulerTimeslotsDto[]) {
  return slots.find((slot: SchedulerTimeslotsDto) => {
    // Convert everything to dayjs format, because when we do date conversions in upstream
    // components (NewLeadSchedulerModal, LeadSchedulerTimeslotsModal and PublicSchedulerModal)
    // the data is converted to `2023-11-27T04:00:00Z`, while the server returns
    // `2023-11-27T04:00:00.000000Z` (with milliseconds) and they do not match when compared
    const dateS = dayjs(slot.date_zulu).format()
    const dateZ = dayjs(dateZulu).isValid() ? dayjs(dateZulu).format() : dateZulu
    return dateS == dateZ
  })
}

function timezonesSort(a: SchedulerTimezonesDto, b: SchedulerTimezonesDto) {
  if (a.identifier == props.eventData.timezone) return -1
  if (b.identifier == props.eventData.timezone) return 1
  if (a.business || a.location) return b.business || b.location ? 0 : -1
  return b.business || b.location ? 1 : 0
}

function onTimezoneChange(timezoneValue: string) {
  setFieldValue('timezone', timezoneValue)
  updateTimeslots()
}

function updateTimeslots() {
  emit('timeslots', values.date, values.timezone)
}

function onSubmit() {
  emit('submit', values)
}
</script>

<style lang="scss" scoped>
.col-info,
.col-dates,
.col-times {
  flex: 0 0 auto;
}
.col-info {
  width: 23%;
}
.col-dates {
  width: 32%;
}
.col-times {
  width: 45%;
}

@media screen and (max-width: 992px) {
  .col-dates {
    display: flex;
    justify-content: center;
    flex-direction: column;
    margin-bottom: 20px;
    width: 100%;
    .vc-container {
      margin-left: auto;
      margin-right: auto;
    }
  }

  .timezone-container {
    width: 100%;
    margin: 20px auto 10px;
    max-width: 250px;
  }
  .col-info {
    display: flex;
    justify-content: center;
    flex-direction: column;
    margin: 10px auto 20px;
    width: 100%;
  }

  .col-times {
    display: flex;
    justify-content: center;
    flex-direction: column;
    width: 100%;
    .availability {
      margin-left: auto;
      margin-right: auto;
      display: flex;
      justify-content: center;
    }
  }
  .preview-block {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-top: 30px !important;

    & > div {
      text-align: center;
      margin-bottom: 10px;
    }
  }

  .confirm-button {
    width: 100%;
    max-width: 280px;
    padding: 10px 20px;
    margin: 0 auto 20px;
  }
}
</style>
