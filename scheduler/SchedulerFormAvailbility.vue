<template>
  <template v-for="avail in availability" :key="`day_${avail.dayName}`">
    <div class="row">
      <div class="col col-4">
        <div class="d-flex justify-items-between align-items-center pt-2 pb-3">
          <input
            :name="`availability.${avail.dayName}.enabled`"
            :checked="avail.enabled"
            type="checkbox"
            class="form-check-input mt-0 day-checkbox text-primary"
            @change="($event) => toggleDay(avail.dayName, $event)"
          />
          <label :for="`avail_day_${avail.dayName}`" class="text-capitalize">
            {{ t(avail.dayName) }}
          </label>
        </div>
      </div>
      <div v-show="avail.enabled" class="col col-8">
        <div
          v-for="(field, idx) in times[avail.dayName].fields"
          :key="`${avail.dayName}_${field.key}`"
          class="row flex-nowrap"
        >
          <div class="col gx-0 mb-1 pe-3">
            <div class="d-flex justify-content-end align-items-center flex-nowrap">
              <Field :name="`availability.${avail.dayName}.times.${idx}.from`">
                <a-select
                  :id="`availability.${avail.dayName}.times.${idx}.from`"
                  :name="`availability.${avail.dayName}.times.${idx}.from`"
                  :value="props.values.availability[avail.dayName].times[idx].from"
                  :options="dropdownOptions[avail.dayName]"
                  class="w-100"
                  :class="{
                    'is-invalid':
                      errors[`availability.${avail.dayName}.times[${idx}]`] ||
                      errors[`availability.${avail.dayName}.times[${idx}].from`]
                  }"
                  size="large"
                  @change="
                    ($event: any) =>
                      onSlotChange(`availability.${avail.dayName}.times.${idx}.from`, $event)
                  "
                />
              </Field>
              <div class="mx-2 d-flex align-items-center h-100">
                <base-portal-icon icon="minus" width="13px" height="2px" />
              </div>
              <Field :name="`availability.${avail.dayName}.times.${idx}.to`">
                <a-select
                  :id="`availability.${avail.dayName}.times.${idx}.to`"
                  :name="`availability.${avail.dayName}.times.${idx}.to`"
                  :value="props.values.availability[avail.dayName].times[idx].to"
                  :options="dropdownOptions[avail.dayName]"
                  class="w-100"
                  :class="{
                    'is-invalid':
                      errors[`availability.${avail.dayName}.times[${idx}]`] ||
                      errors[`availability.${avail.dayName}.times[${idx}].to`]
                  }"
                  size="large"
                  @change="
                    ($event: any) =>
                      onSlotChange(`availability.${avail.dayName}.times.${idx}.to`, $event)
                  "
                />
              </Field>
            </div>
            <div class="invalid-feedback d-flex">{{
              errors[`availability.${avail.dayName}.times[${idx}]`]
            }}</div>
          </div>
          <div class="col col-2 gx-0 d-flex justify-items-between pt-2">
            <button
              v-if="idx == 0"
              type="button"
              class="btn btn-outline-light btn-sm add-slot"
              @click="addSlot(avail.dayName)"
            >
              <base-portal-icon icon="plus"></base-portal-icon>
            </button>
            <button
              v-else
              type="button"
              class="btn btn-outline-light btn-sm remove-slot"
              @click="times[avail.dayName].remove(idx)"
            >
              <base-portal-icon icon="trash" width="8px" height="12px" :color="LeadStatusColor.Red"></base-portal-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="row border-bottom pb-1 mb-2">
      <div class="col col-4"></div>
      <div v-if="errors[`availability.${avail.dayName}.times`]" class="col col-8 gx-0">
        <div class="invalid-feedback mt-2 mb-2 d-flex">
          {{ errors[`availability.${avail.dayName}.times`] }}
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { reactive, computed, toRef, PropType, ComputedRef } from 'vue'
import { Days } from '@/api/Business/workingHours'
import { useI18n } from 'vue-i18n'
import { useFieldArray, Field } from 'vee-validate'
import {
  sortTimeSlotsForDay,
  validateSortedTimeSlots
} from '@/helpers/scheduler/schedulerInterviewForm.helper'
import { toLocalTime } from '@/helpers/date.helper'
import { SelectOption } from '@/dto/common/index'
import { ScheduleInterviewFormData } from '@/dto/Scheduler/SchedulerApiData'
import { IAvailabilitySorted } from '@/dto/Scheduler/SchedulerEventDto'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { LeadStatusColor, SchedulerTimeSlotFrequency } from '@/shared'

const ASelect = asyncComponentWrapper(() => import('ant-design-vue/es/select'))

const props = defineProps({
  values: {
    required: true,
    type: Object as PropType<ScheduleInterviewFormData>
  },
  errors: {
    required: true,
    type: Object
  }
})

const emit = defineEmits(['change', 'validate'])

const { t } = useI18n()
type DayString = keyof typeof Days
const errors = toRef(props, 'errors') // TIP: without toRef it update getter for errors[your-key]

const times = {
  [Days.monday]: reactive(useFieldArray(`availability.${Days.monday}.times`)), // <- fields, push, remove
  [Days.tuesday]: reactive(useFieldArray(`availability.${Days.tuesday}.times`)),
  [Days.wednesday]: reactive(useFieldArray(`availability.${Days.wednesday}.times`)),
  [Days.thursday]: reactive(useFieldArray(`availability.${Days.thursday}.times`)),
  [Days.friday]: reactive(useFieldArray(`availability.${Days.friday}.times`)),
  [Days.saturday]: reactive(useFieldArray(`availability.${Days.saturday}.times`)),
  [Days.sunday]: reactive(useFieldArray(`availability.${Days.sunday}.times`))
}

const availTimes = getAvailableTimes() // TODO - in case each day has diffferent availablity - then call getAvailableTimes(dayName) on each day

const dailyAvailability = reactive({
  [Days.monday]: availTimes,
  [Days.tuesday]: availTimes,
  [Days.wednesday]: availTimes,
  [Days.thursday]: availTimes,
  [Days.friday]: availTimes,
  [Days.saturday]: availTimes,
  [Days.sunday]: availTimes
})

const availability: ComputedRef<IAvailabilitySorted[]> = computed(() => {
  const sorted: IAvailabilitySorted[] = []
  for (let dayName in Days) {
    sorted.push({
      ...props.values.availability[dayName as DayString],
      dayName: Days[dayName as DayString]
    })
  }
  return sorted
})

const dropdownOptions = computed(() => {
  interface IOptions {
    [key: string]: SelectOption[]
  }
  let options: IOptions = {}
  for (let dayName in dailyAvailability) {
    options[dayName] = dailyAvailability[dayName as DayString].map((time: string) => {
      return {
        value: time,
        label: toLocalTime(time)
      }
    })
  }
  return options
})

function getAvailableTimes() {
  const availableTimes = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += SchedulerTimeSlotFrequency.Default) {
      let time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      availableTimes.push(time)
    }
  }
  return availableTimes
}

function toggleDay(dayName: DayString, event: Event) {
  const eventTarget = event.target as HTMLInputElement
  emit('change', `availability.${dayName}.enabled`, eventTarget.checked)
}

function onSlotChange(key: string, value: unknown) {
  emit('change', key, value)
}

function addSlot(dayName: DayString) {
  const sorted = sortTimeSlotsForDay(props.values.availability[dayName as keyof typeof Days].times)
  const { length: countErrors } = validateSortedTimeSlots(sorted)
  if (countErrors === 0) {
    const lastSlot = sorted[sorted.length - 1]
    const nextSlot = getNextSlot(dayName, lastSlot.to, 2)
    times[dayName].push({
      from: nextSlot ? nextSlot : '',
      to: ''
    })
  } else {
    // run a validation to show error (in case its not yet visible after slot was added)
    emit('validate')
  }
}

function getNextSlot(dayName: DayString, slotHour: string, increment: number) {
  const idx = dailyAvailability[dayName].findIndex((s: string) => s == slotHour)
  if (idx > -1 && dailyAvailability[dayName][idx + increment]) {
    return dailyAvailability[dayName][idx + increment]
  }
  return ''
}
</script>

<style lang="scss" scoped>
.times-dropdown {
  width: calc(50% - 10px);
}

button.add-slot,
button.remove-slot {
  width: 22px;
  height: 22px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(var(--bs-danger-rgb), 0.1) !important;
}
button.add-slot {
  background: rgba(var(--bs-primary-rgb), 0.1) !important;
  svg {
    fill: var(--bs-primary);
    width: 10px;
  }
}

.day-checkbox {
  border-color: #d8dae3;
  min-width: 14px;
  margin-right: 10px;
}
</style>
