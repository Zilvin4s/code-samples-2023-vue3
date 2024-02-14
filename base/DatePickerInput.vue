<template>
  <div v-on-click-outside="outsideClick" class="position-relative">
    <slot
      name="input"
      :formatted-value="inputValue"
      :visible="pickerVisible"
      :click="(value: boolean) => onVisibilityChange(value)"
    >
      <div class="input-group position-relative">
        <input
          v-model="inputValue"
          type="text"
          class="form-control"
          :disabled="isInputDisabled"
          :placeholder="placeholder"
          @click="onVisibilityChange(true)"
        />
        <div class="input-group-append d-flex align-items-center me-1 cursor-pointer">
          <div
            class="input-group py-2"
            @mouseover="hovering = true"
            @mouseleave="hovering = false"
            @click="
              () => {
                if (hovering && !pickerVisible && inputValue) deleteValue()
              }
            "
          >
            <base-portal-icon
              v-show="hovering && !pickerVisible && inputValue"
              icon="close"
              class="input-icon"
            />
            <base-portal-icon
              v-show="!hovering || pickerVisible"
              color="grey"
              icon="calendar-empty"
              class="input-icon"
            />
          </div>
        </div>
      </div>
    </slot>
    <base-date-picker
      v-if="pickerVisible"
      v-model="calendarValue"
      :default-value="calendarValue"
      :time="props.time"
      :date-options="props.dateOptions"
      :time-options="props.timeOptions"
      class="date-picker-over-input"
      :class="`picker-popup__${position ?? 'right'}`"
    >
      <template #controls>
        <slot
          v-if="manualConfirm"
          name="controls"
          :visible="pickerVisible"
          :confirm="() => onConfirm()"
          :clear="() => onClear()"
        >
          <button class="btn btn-sm btn-primary px-3" type="button" @click="onConfirm()">
            {{ t('Confirm') }}
          </button>
          <button class="btn border-0 ms-2" type="button" @click="onClear()">
            {{ t('Clear') }}
          </button>
        </slot>
      </template>
    </base-date-picker>
  </div>
</template>

<script setup lang="ts">
import { useDate } from '@/composables/useDate'
import { isNumeric } from '@/helpers/validation.helper'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { vOnClickOutside } from '@vueuse/components'

const props = defineProps({
  modelValue: {
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
  },
  manualConfirm: {
    // HINT: if true, confirm button must be used for updating values
    type: Boolean,
    default: true
  },
  position: {
    type: String,
    default: undefined
  },
  placeholder: {
    type: String,
    default: ''
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value?: string | number): void
}>()

const { t } = useI18n()
const { dayjs, dateFormat, dateTimeFormat } = useDate()

const pickerVisible = ref(false)
const needsUpdate = ref(1)
const calendarValue = ref(props.modelValue)
const hovering = ref(false)

const inputValue = computed({
  get() {
    if (props.modelValue) {
      const date = isNumeric(props.modelValue)
        ? dayjs.unix(Number(props.modelValue))
        : dayjs(props.modelValue).utc(true)
      if (date.isValid()) {
        return date.format(usedFormat.value)
      }
    }
    return ''
  },
  set(value: string | number | undefined) {
    // HINT: when input not disabled, allows changing date directly (in case its needed)
    try {
      if (dayjs(value).isValid()) {
        const checkFormattedDate = dayjs.utc(value, usedFormat.value).format(usedFormat.value)
        if (value === checkFormattedDate) {
          // validate date first, then allow update
          emit('update:modelValue', dayjs.utc(value).format(usedFormat.value))
          needsUpdate.value++
        }
      } // let user type more stuff
    } catch (e) {
      return
    }
  }
})

const usedFormat = computed(() => {
  return props.time ? dateTimeFormat() : dateFormat()
})

const isInputDisabled = computed(() => {
  return pickerVisible.value
})

function onVisibilityChange(value = true) {
  pickerVisible.value = value
}

function onConfirm() {
  // HINT: opening calendar and pressing confirm without interacting with calendar doesnt set correct value
  // so need to make sure it sends current date
  // issue with Antd lib where it displays current date by default and might mislead users
  if (calendarValue.value === undefined || !dayjs(calendarValue.value).isValid()) {
    const fallbackValue = props.time
      ? dayjs.utc().add(1, 'hour').minute(0).second(0).format(usedFormat.value)
      : dayjs.utc().startOf('day').format(usedFormat.value)
    calendarValue.value = fallbackValue
    emit('update:modelValue', fallbackValue)
  } else {
    // checking what kind of type is expected to return
    const emitValue = isNumeric(props.modelValue)
      ? isNumeric(calendarValue.value)
        ? calendarValue.value
        : dayjs.utc(calendarValue.value).unix()
      : calendarValue.value
    emit('update:modelValue', emitValue)
  }
  onVisibilityChange(false)
}

function onClear() {
  onVisibilityChange(false)
  calendarValue.value = undefined
  emit('update:modelValue', undefined)
}

function deleteValue() {
  onVisibilityChange(false)
  calendarValue.value = undefined
  emit('update:modelValue', undefined)
}

function outsideClick() {
  calendarValue.value = props.modelValue // restore original value
  onVisibilityChange(false)
}

// without confirm button there should be auto update on every change
watch(
  () => calendarValue.value,
  (nv, ov) => {
    if (!props.manualConfirm && nv !== ov) {
      onConfirm()
    }
  }
)
</script>

<style lang="scss" scoped>
.date-picker-over-input {
  position: absolute;
  z-index: 1000;
}
.input-icon {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
}
.input-group {
  .input-group-append {
    z-index: 10;
  }
}
.picker-popup {
  &__left {
    right: 0; // moves to the left
  }
}
</style>
