<template>
  <div class="row">
    <div class="col mb-3">
      <label class="form-label">{{ t('Leads per slot') }}</label>
      <number-input
        name="leads"
        class="form-control duration-group__input"
        :class="{ 'is-invalid': errors.leads }"
        type="number"
        min="1"
        step="1"
        :value="leadsValue"
        @change="onLeadsChange"
      />
      <div class="invalid-feedback">{{ errors?.leads }}</div>
      <div class="form-text">
        {{ t('If more than 1, event on the calendar will show up as "Free"') }}
      </div>
    </div>
  </div>
  <div v-if="values.hasOwnProperty('frequency')" class="row">
    <div class="col mb-3">
      <label class="form-label">{{ t('Slot size') }}</label>
      <duration-input-dropdown
        group="frequency"
        :class="{ 'is-invalid': errors['frequency.value'] }"
      />
      <div class="invalid-feedback">{{ errors['frequency.value'] }}</div>
    </div>
  </div>
  <div v-if="values.hasOwnProperty('buffer_before')" class="row">
    <div class="col mb-3">
      <label class="form-label">{{ t('Buffer Before') }}</label>
      <duration-input-dropdown
        group="buffer_before"
        :can-block="true"
        :class="{ 'is-invalid': errors['buffer_before.value'] }"
      />
      <div class="invalid-feedback">{{ errors['buffer_before.value'] }}</div>
    </div>
  </div>
  <div v-if="values.hasOwnProperty('buffer_after')" class="row">
    <div class="col mb-3">
      <label class="form-label">{{ t('Buffer After') }}</label>
      <duration-input-dropdown
        group="buffer_after"
        :can-block="true"
        :class="{ 'is-invalid': !!errors['buffer_after.value'] }"
      />
      <div class="invalid-feedback">{{ errors['buffer_after.value'] }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useField } from 'vee-validate'
import { asyncComponentWrapper } from '@/composables/useReloadModal'

const DurationInputDropdown = asyncComponentWrapper(
  () => import('@/components/Scheduler/SchedulerInterviewForm/common/DurationInputDropdown.vue')
)
const NumberInput = asyncComponentWrapper(() => import('@/components/Misc/NumberInput.vue'))

const props = defineProps({
  values: {
    required: true,
    type: Object
  },
  errors: {
    required: true,
    type: Object
  }
})
const { t } = useI18n()

const errors = toRef(props, 'errors') // TIP: without toRef it update getter for errors[your-key]

const { value: leadsValue } = useField('leads')

function onLeadsChange(value: number) {
  leadsValue.value = value
}
</script>
