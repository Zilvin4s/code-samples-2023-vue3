<template>
  <div class="duration-group" :class="{ 'with-checkbox': props.canBlock }">
    <number-input
      :id="`${props.group}.value`"
      :value="inputValue"
      :name="`${props.group}.value`"
      class="form-control duration-group__input"
      min="0"
      step="1"
      type="number"
      placeholder="Enter number"
      @change="onValueChange"
    />

    <a-select
      :id="`${props.group}.unit`"
      :value="unitValue"
      :name="`${props.group}.unit`"
      class="duration-group__select"
      :options="availableOptions"
      size="large"
      @change="onUnitChange"
    />

    <div
      v-if="props.canBlock"
      class="form-check form-switch d-flex align-items-center justify-content-center duration-group__checkbox"
    >
      <a-switch
        :id="`${props.group}.blocking`"
        :checked="blockingValue"
        :name="`${props.group}.blocking`"
        @change="onBlockingChange"
      />
      <label class="form-check-label ps-2">
        {{ t('Blocking') }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'
import { DurationTypes } from '@/enums/SchedulerEnum'
import { useI18n } from 'vue-i18n'
import { useField } from 'vee-validate'
import { SelectOption } from '@/dto/common/index'
import { asyncComponentWrapper } from '@/composables/useReloadModal'

const ASelect = asyncComponentWrapper(() => import('ant-design-vue/es/select'))
const ASwitch = asyncComponentWrapper(() => import('ant-design-vue/es/switch'))
const NumberInput = asyncComponentWrapper(() => import('@/components/Misc/NumberInput.vue'))

const props = defineProps({
  group: {
    /* for defining group name */ required: true,
    type: String
  },
  canBlock: {
    required: false,
    type: Boolean,
    default: false
  },
  disabled: {
    required: false,
    type: Array as PropType<string[]>,
    default: () => []
  }
})

const { t } = useI18n()

const { value: inputValue } = useField<number>(`${props.group}.value`)
const { value: unitValue } = useField<string>(`${props.group}.unit`)
const { value: blockingValue } = useField<boolean>(`${props.group}.blocking`)

const durationOptions: SelectOption[] = [
  {
    label: 'Minutes',
    value: DurationTypes.MINUTE
  },
  {
    label: 'Hours',
    value: DurationTypes.HOUR
  },
  {
    label: 'Days',
    value: DurationTypes.DAY
  }
]

const availableOptions = computed(() => {
  const opts = [...durationOptions]
  if (props.disabled) {
    props.disabled.forEach((dsbl) => {
      const idx = opts.findIndex((o) => o.value == dsbl)
      if (idx > -1) {
        opts.splice(idx, 1)
      }
    })
  }
  return opts
})

function onUnitChange(value: string) {
  unitValue.value = value
}
function onBlockingChange(value: boolean) {
  blockingValue.value = value
}
function onValueChange(value: number) {
  inputValue.value = value
}
</script>

<style lang="scss" scoped>
.duration-group {
  display: flex;
  flex-wrap: nowrap;
  width: 100%;

  &__input {
    width: 44% !important; /* antd tries to override */
    min-width: 44%;
  }
  &__select {
    width: 27%;
    min-width: 27%;
    height: 100%;
  }
  &__checkbox {
    width: 29%;
    max-width: 29%;
  }
}
</style>
