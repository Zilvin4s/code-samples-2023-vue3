<template>
  <div class="py-2 d-flex align-items-center justify-content-between border-bottom">
    <div class="text-muted fs-4">
      <template v-if="data.type === 'range'">
        <div class="text-muted fs-4">
          {{ formattedDate }}
        </div>
        <div class="text-muted fs-4">
          {{ formattedHours }}
        </div>
        <div v-if="formattedDays.length" class="text-muted fs-4">
          {{ t('Only') }}: {{ formattedDays }}
        </div>
      </template>
      <template v-else-if="data.type === 'public'">
        <div class="text-muted fs-4">
          {{ t('Public Holidays') }}:
          {{ data.value && props.holidays[data.value] }}
        </div>
      </template>
      <template v-else-if="data.type === 'inherit'">
        <div class="text-muted fs-4">
          {{ t('Inherit from Business Settings') }}
        </div>
      </template>
    </div>
    <div class="d-flex">
      <base-user-can 
        :permission="props.isLocation 
        ? AbilityEnum.SETTING_LOCATION_SCHEDULERS_UPDATE 
        : AbilityEnum.SETTING_BUSINESS_SCHEDULERS_UPDATE 
        ">
      <button class="btn btn-transparent-primary btn-sm me-2" @click.prevent="onEdit">
        <base-portal-icon icon="edit" />
      </button>
      </base-user-can>

      <base-user-can 
        :permission="props.isLocation 
        ? AbilityEnum.SETTING_LOCATION_SCHEDULERS_DELETE 
        : AbilityEnum.SETTING_BUSINESS_SCHEDULERS_DELETE 
        ">
      <a-popconfirm
        :title="t('Delete this exception？')"
        :ok-text="t('Yes')"
        :cancel-text="t('No')"
        @confirm="onDelete"
      >
        <template #icon>
          <question-circle-outlined class="text-danger" />
        </template>
        <button class="btn btn-transparent-danger btn-sm">
          <base-portal-icon icon="trash" />
        </button>
      </a-popconfirm>
      </base-user-can>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { toLocalDateFormat, toLocalTime } from '@/helpers/date.helper'
import { computed, PropType, defineEmits } from 'vue'
// import {AbilityEnum} from "@/enums/AbilityEnum"
import { SchedulerExceptionDataDto } from '@/dto/Scheduler/SchedulerExceptionsData'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { AbilityEnum } from '@/enums/AbilityEnum'

const APopconfirm = asyncComponentWrapper(() => import('ant-design-vue/es/popconfirm'))
const QuestionCircleOutlined = asyncComponentWrapper(
  () => import('@ant-design/icons-vue/QuestionCircleOutlined')
)

interface HolidayProp {
  [holidayValue: string]: string /* holiday text */
}

const props = defineProps({
  data: {
    required: true,
    type: Object as PropType<SchedulerExceptionDataDto>
  },
  holidays: {
    required: true,
    type: Object as PropType<HolidayProp>
  },
  isLocation:{
    required: false,
    type: Boolean,
    default: false,
  }
})

const emit = defineEmits(['edit', 'delete'])

const { t } = useI18n()

const formattedDate = computed<string>(() => {
  if (props.data.dates === null) {
    return t('Every day')
  }
  const middleOfDay = '12:00:00'
  return `${toLocalDateFormat(props.data.dates.from + ' ' + middleOfDay)} - ${toLocalDateFormat(
    props.data.dates.to + ' ' + middleOfDay
  )}`
})

const formattedHours = computed<string>(() => {
  if (props.data.times === null) {
    return ''
  }

  return `${toLocalTime(props.data.times.from)} - ${toLocalTime(props.data.times.to)}`
})

const formattedDays = computed<string>(() => {
  if (props.data.days !== null)
    return props.data.days
      .map((day: string) => t(day.charAt(0).toUpperCase() + day.slice(1, 2)))
      .join(', ')
  return ''
})

function onEdit() {
  emit('edit', props.data.id)
}

function onDelete() {
  emit('delete', props.data.id)
}
</script>
<style lang="scss" module>
.hours {
  text-align: center;
  min-width: 110px;
}
</style>
