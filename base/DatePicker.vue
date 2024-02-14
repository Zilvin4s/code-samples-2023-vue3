<template>
  <div class="card border shadow-sm p-3 base-datetime-picker" :class="{ 'with-time': time }">
    <div class="d-flex flex-row">
      <div>
        <a-calendar v-model:value="dateValue" v-bind="calendarOptions" @change="onDateChange">
          <template #headerRender="{ value, onChange }">
            <div class="mb-2">
              <datepicker-custom-header
                :value="value"
                :date-options="dateOptions"
                @change="onChange"
              />
            </div>
          </template>
        </a-calendar>
        <div v-if="dateOptions.showCustomDates" class="d-flex justify-content-start flex-wrap">
          <div v-for="(customDate, label) in customDates" :key="label" class="me-1 mb-1">
            <button
              class="btn btn-sm btn-outline-primary border-0"
              @click="setCustomDate(customDate)"
            >
              {{ label }}</button
            >
          </div>
        </div>
      </div>
      <div v-if="timeSlotsPickerNeeded">
        <datepicker-timeslots v-model="timeValue" :time-slots="timeSlots">
          <template #header>
            <div class="d-flex justify-content-between mb-2 w-100">
              <div class="text-muted fs-6 me-3">{{ t('Outside working hours') }}</div>
              <div class="pe-3">
                <a-switch
                  :checked="isOutsideWorkingHours"
                  @change="isOutsideWorkingHours = !isOutsideWorkingHours"
                />
              </div>
            </div>
          </template>
        </datepicker-timeslots>
      </div>
      <div v-else-if="time" class="d-flex align-items-center mx-5">
        <datepicker-time v-model="timeValue" />
      </div>
    </div>
    <div class="d-flex justify-content-center mt-2">
      <slot name="controls"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { useTimeSlots } from '@/composables/useTimeSlots'
import { useI18n } from 'vue-i18n'
import { useDate } from '@/composables/useDate'
import { Dayjs } from 'dayjs'
import { isNumeric } from '@/helpers/validation.helper'

const ACalendar = asyncComponentWrapper(() => import('ant-design-vue/es/calendar/dayjs'))
const ASwitch = asyncComponentWrapper(() => import('ant-design-vue/es/switch'))
const DatepickerCustomHeader = asyncComponentWrapper(
  () => import('@/components/Misc/Datepicker/DatepickerCustomHeader.vue')
)
const DatepickerTimeslots = asyncComponentWrapper(
  () => import('@/components/Misc/Datepicker/DatepickerTimeslots.vue')
)
const DatepickerTime = asyncComponentWrapper(
  () => import('@/components/Misc/Datepicker/DatepickerTime.vue')
)

const props = defineProps({
  modelValue: {
    type: [String, Number], // HINT: numeric string for timestamp
    default: undefined
  },
  defaultValue: { // in case we wanna default to something on empty form
    type: [String, Number],
    default: undefined
  },
  time: {
    type: Boolean,
    default: false
  },
  dateOptions: {
    type: Object,
    default: () => ({})
  },
  timeOptions: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | undefined): void
}>()

const { t } = useI18n()
const { slots: timeSlots, createSlots } = useTimeSlots()
const { dayjs, timeFormat, dateFormat, serverFormat } = useDate()

const dateValue = ref<Dayjs | undefined>() // stores date coming from calendar, its always start of day
const timeValue = ref<Dayjs | undefined>() // stores time coming from time picker
const dateTimeValue = ref<Dayjs | undefined>() // combines both date and time into one and sends updates to modelValue
const isOutsideWorkingHours = ref(false)

const isTimestamp = computed(() => {
  return String(Number(props.modelValue)) === props.modelValue
})

const defaultValue = computed(() => {
  return dayjs().startOf('day')
})

const calendarOptions = computed(() => {
  return {
    ...{
      defaultValue: defaultValue.value,
      fullscreen: false,
      format: dateFormat(),
      showTime: props.time,
      showCustomDates: true,
      disabledDate: (current: Dayjs) => {
        if (props.dateOptions.disabledDate) {
          return props.dateOptions.disabledDate(current)
        }
        return false
      }
    },
    ...props.dateOptions
  }
})

const dateWithTimezone = computed(() => {
  return String(props.modelValue).toLowerCase().endsWith('z')
})

const computedTimeOptions = computed(() => {
  return {
    use12Hours: true,
    format: timeFormat(),
    showSecond: false,
    useSlots: true,
    ...props.timeOptions
  }
})

const customDates: Record<string, Dayjs> = {
  'Last Year': dayjs().subtract(1, 'year').startOf('year').startOf('day'),
  'Last Month': dayjs().subtract(1, 'month').startOf('month').startOf('day'),
  'Last Week': dayjs().subtract(1, 'week').startOf('week').startOf('day'),
  'Now': dayjs().startOf('day'),
  'Next Week': dayjs().add(1, 'week').startOf('week').startOf('day'),
  'Next Month': dayjs().add(1, 'month').startOf('month').startOf('day')
}

function setCustomDate(range: Dayjs) {
  dateValue.value = dayjs(range).clone()

  if (props.time && !!timeValue.value && timeValue.value.isValid()) {
    dateTimeValue.value = range
      .clone()
      .hour(timeValue.value.hour())
      .minute(timeValue.value.minute())
      .second(timeValue.value.second())
  } else {
    dateTimeValue.value = range.clone()
  }
}

const timeSlotsPickerNeeded = computed(() => {
  return props.time && computedTimeOptions.value.useSlots
})

const onDateChange = (value: Dayjs) => {
  // HINT: 'value' returns a date on user's timezone - so it should not be converted - otherwise there will be visual missmatch on calendar

  if (props.time) {
    // with time - update modelValue in relation to timeValue
    if (!!timeValue.value && timeValue.value.isValid()) {
      dateValue.value = value.clone()
      const newDateTime = value
        .clone()
        .hour(timeValue.value.hour())
        .minute(timeValue.value.minute())
        .second(timeValue.value.second())
      dateTimeValue.value = newDateTime
    } else {
      // no timeValue, just update dateValue
      dateValue.value = value.clone().startOf('day')
      dateTimeValue.value = value.clone().startOf('day')
    }
  } else {
    dateValue.value = value.clone()
    dateTimeValue.value = value.clone()
    timeValue.value = undefined
  }
}

watch(
  () => dateTimeValue.value,
  (nv?: Dayjs, ov?: Dayjs) => {
    if (nv !== ov) {
      try {
        if (nv && nv?.isValid()) {
          const nvFormatted = dayjs(nv).format(serverFormat())
          const modelFormatted = dayjs(props.modelValue, serverFormat()).format(serverFormat())
          if (dayjs(ov).isSame(nv) || dayjs(nvFormatted).isSame(modelFormatted)) {
            return
          }
          const emitValue = isTimestamp.value
            ? dayjs.utc(nv).unix()
            : dayjs(nv).format(serverFormat()) // returns server format
          emit('update:modelValue', emitValue)
        } else {
          emit('update:modelValue', undefined)
        }
      } catch (e) {
        // dont let invalid dates go thru
        emit('update:modelValue', undefined)
      }
    }
  }
)

watch(
  () => props.modelValue,
  (nv?: string, ov?: string) => {
    // HINT: use == comparison instead of === to allow string-number to be equal to number
    if (nv == ov && !!nv && !!ov) return

    if (!!nv) {
      if (isNumeric(nv)) {
        // is it timestamp?
        const date = dayjs.unix(Number(nv))
        dateValue.value = dayjs.utc(date).startOf('day')
        timeValue.value = dayjs.utc(date)
        dateTimeValue.value = dayjs(date)
      } else if (dateWithTimezone.value) {
        // handle dates with timezone (as Z at the end)
        dateValue.value = dayjs.utc(nv).startOf('day')
        timeValue.value = props.time ? dayjs.utc(nv) : undefined
        dateTimeValue.value = dayjs(nv)
      } else {
        // handle everything else
        dateValue.value = dayjs.utc(nv).startOf('day')
        timeValue.value = props.time ? dayjs.utc(nv) : undefined
        dateTimeValue.value = dayjs.utc(nv)
      }
    } else {
      dateValue.value = undefined
      timeValue.value = undefined
      dateTimeValue.value = undefined
    }
  },
  { immediate: true }
)

watch(
  () => timeValue.value,
  (nv, ov) => {
    if (!!nv && nv !== ov && nv?.isValid()) {
      // when time selection happens first, make sure we set dateValue as today if non existant
      if(dateValue.value === undefined){
        dateValue.value = dayjs.utc()
      }
      const newDateTime = dateValue.value
        .clone()
        .hour(nv.hour())
        .minute(nv.minute())
        .second(nv.second())
      dateTimeValue.value = newDateTime
    }
  }
)

watch(
  () => isOutsideWorkingHours.value,
  (nv) => {
    if (!props.time) return

    const workStart = 6
    const workEnd = 18
    const step = 15
    if (nv) {
      createSlots([
        {
          start: 0,
          end: workStart - 1,
          step
        },
        {
          start: workEnd + 1,
          end: 23,
          step
        }
      ])
    } else {
      createSlots({
        start: workStart,
        end: workEnd,
        step
      })
    }
  }
)
</script>

<style lang="scss" scoped>
.base-datetime-picker {
  width: 280px;
  .time-slots-container {
    width: 300px;
  }
  &.with-time {
    width: 620px;
  }
}
</style>
