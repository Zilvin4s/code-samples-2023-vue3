<template>
  <div class="availability btn-group btn-group-sm" role="group" :class="props.classNames">
    <template v-if="daySlots.length === 0">
      <div class="invalid-feedback d-flex">{{ t('No slots available for selected day') }}</div>
    </template>
    <template v-for="time in daySlots" :key="`availbtn_${time.value}`">
      <input
        :id="`avail_${time.value}`"
        v-model="selectedTime"
        :checked="selectedTime == time.value"
        :value="time.value"
        type="radio"
        class="btn-check"
      />
      <label
        class="btn m-1 time-slot"
        :class="`${selectedTime == time.value ? 'btn-outline-primary' : 'btn-outline-secondary'}`"
        :for="`avail_${time.value}`"
        type="button"
      >
        {{ time.label }}
      </label>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, PropType } from 'vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { SchedulerTimeslotsDto } from '@/dto/Scheduler/Response/index'
import { useI18n } from 'vue-i18n'
import { PublicSchedulerEventDataDto } from '@/dto/Scheduler/SchedulerEventDto'
import { TIMESLOT_FORCED_SLOT } from '@/helpers/scheduler/scheduler.helper'

const props = defineProps({
  modelValue: {
    required: true,
    type: String
  },
  slots: {
    required: true,
    type: Array as PropType<SchedulerTimeslotsDto[]>
  },
  eventData: {
    required: true,
    type: Object as PropType<PublicSchedulerEventDataDto>
  },
  classNames: {
    required: false,
    type: String,
    default: ''
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

dayjs.extend(utc)
const { t } = useI18n()

const selectedTime = computed({
  get: () => {
    return props.modelValue
  },
  set: (value) => {
    emit('update:modelValue', value)
  }
})

const daySlots = computed(() => {
  if (props.slots.length === 0) return []

  return slotsLocalized(
    props.slots.filter((slot) => {
      return slot.leads > 0 || isSelectedOrEventTime(slot)
    })
  )
})

function slotsLocalized(slots: SchedulerTimeslotsDto[]) {
  const localFormat = 'h:mm A'

  return slots.map((slot) => {
    return {
      value: slot.date_zulu,
      label:
        slot.leads === TIMESLOT_FORCED_SLOT
          ? dayjs.utc(slot.date).format(localFormat)
          : dayjs(slot.date).format(localFormat)
    }
  })
}

// to keep slot available in list (might have leads === 0) when it is not selected anymore
// but we need to display it if user wants to select it again (original event time)
function isSelectedOrEventTime(slot: SchedulerTimeslotsDto) {
  return (
    slot.date_zulu === selectedTime.value || slot.date_zulu === props.eventData.starting_at_zulu
  )
}
</script>

<style lang="scss" scoped>
.availability {
  max-width: 400px !important;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  .time-slot {
    width: 76px;
    max-width: 76px;
    min-width: 76px;
    white-space: nowrap;
    padding: 5px 2px;
    font-size: 12px;
    width: 65px;
    max-width: 65px;
    border-radius: 4px !important;
  }
}

@media screen and (max-width: 768px) {
  .availability {
    .time-slot {
      width: 70px;
      max-width: 70px;
      min-width: 70px;
    }
  }
}
</style>
