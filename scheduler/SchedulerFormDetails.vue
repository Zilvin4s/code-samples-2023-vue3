<template>
  <div v-if="props.values.event_detail.hasOwnProperty('title')" class="row">
    <div class="col mb-3">
      <placeholder-input
        v-model="titleValue"
        input="input"
        :feature-id="featureId"
        :class="{ 'is-invalid': errors['event_detail.title'] }"
        :label="t('Event Title')"
      />
      <div class="invalid-feedback d-flex">{{ errors['event_detail.title'] }}</div>
      <div class="form-text">
        {{ t('Public. Displayed on event page, email and on invitees calendar') }}
      </div>
    </div>
  </div>
  <div v-if="props.values?.event_channel?.hasOwnProperty('value')" class="row">
    <div class="col mb-3">
      <label for="eventTitle" class="form-label">{{ t('Event Location') }}</label>
      <Field name="event_channel">
        <a-select
          id="event_channel"
          :disabled="locationDropdown.length === 0"
          name="event_channel"
          :value="props.values?.event_channel?.value"
          :options="locationDropdown"
          option-label-prop="label"
          class="w-100"
          :class="{ 'is-invalid': errors['event_channel'] || errors['event_channel.value'] }"
          size="large"
          @change="($event: any) => onChange(`event_channel`, $event)"
        />
      </Field>
      <div class="invalid-feedback d-flex">
        {{ errors['event_channel'] || errors['event_channel.value'] }}
      </div>
      <div class="form-text">
        {{ t('Public. Displayed on event page, email and on invitees calendar') }}
      </div>
    </div>
  </div>
  <div v-if="props.values.event_detail.hasOwnProperty('description')" class="row">
    <div class="col mb-3">
      <placeholder-input
        v-model="descriptionValue"
        input="textarea"
        :feature-id="featureId"
        :rows="6"
        :class="{ 'is-invalid': errors['event_detail.description'] }"
        :label="t('Event Description')"
      />
      <div class="invalid-feedback d-flex">{{ errors['event_detail.description'] }}</div>
      <div class="form-text">
        {{ t('Public. Displayed on event page, email and on invitees calendar') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { Field, useField } from 'vee-validate'
import { SchedulerEventChannelDto } from '@/dto/Scheduler/SchedulerApiData'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { SelectOption, GroupedSelectOption } from '@/dto/common'

const ASelect = asyncComponentWrapper(() => import('ant-design-vue/es/select'))
const PlaceholderInput = asyncComponentWrapper(
  () => import('@/components/Misc/PlaceholderInput.vue')
)

const props = defineProps({
  values: {
    required: true,
    type: Object
  },
  errors: {
    required: true,
    type: Object
  },
  eventChannels: {
    required: true,
    type: Array as PropType<SchedulerEventChannelDto[]>
  },
  featureId: {
    default: undefined,
    type: String
  }
})
const emit = defineEmits(['change'])

const { t } = useI18n()

const { value: titleValue } = useField('event_detail.title')
const { value: descriptionValue } = useField('event_detail.description')

const errors = toRef(props, 'errors') // TIP: without toRef it update getter for errors[your-key]

const locationDropdown = computed(() => {

  const groups: Record<string, SelectOption[]> = {
    generic: [],
    google_meet: [],
    zoom_business: [],
    zoom_user: [],
  }

  props.eventChannels.forEach((channel: SchedulerEventChannelDto) => {
    let groupKey = groups.hasOwnProperty(channel.type) ? channel.type : 'generic'
    groups[groupKey].push({
      label: channel.label,
      value: channel.value
    })
  })

  const groupedOptions: (SelectOption|GroupedSelectOption)[] = [
    ...groups.generic,
    ...groups.google_meet,
  ]
  // if(groups.google_meet.length){ // TIP: keeping just in case we need google meet grouping
  //   groupedOptions.push({
  //     label: `Google Meet: ${t('Connected Calendar')}`,
  //     options: groups.google_meet,
  //   })
  // }
  if(groups.zoom_business.length){
    groupedOptions.push({
      label: `Zoom: ${t('Business Users')}`,
      options: groups.zoom_business,
    })
  }
  if(groups.zoom_user.length){
    groupedOptions.push({
      label: `Zoom: ${t('Integrations')}`,
      options: groups.zoom_user,
    })
  }

  return groupedOptions
})

function onChange(key: string, value: string) {
  const eventChannel = props.eventChannels.find((channel) => channel.value === value)
  emit('change', key, eventChannel)
}

</script>
