<template>
  <div>
    <collapse-wrapper :collapsed="props.active">
      <template #default="{ collapseId }">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <div ref="el" class="row">
              <div class="col-5 d-flex align-items-center">
                <base-icon-badge
                  :color="LeadStatusColor.Primary"
                  :icon="providerIcon"
                  class="me-3"
                />
                <div class="d-flex flex-column">
                  <span class="text-primary">{{ providerName }}</span>
                  <span class="text-muted">{{ props.integration.email }}</span>
                </div>
              </div>

              <div class="col-1 d-flex align-items-center">
                <span v-if="hasLocations" class="badge bg-primary fs-5">
                  {{ t('N/A') }}
                </span>
              </div>

              <div class="col-2">
                <audit-block-card
                  v-if="props.integration.audit"
                  :audit="props.integration.audit"
                  :updated-at="props.integration.audit.created_at"
                />
              </div>

              <div class="col-4">
                <div class="d-flex align-items-center justify-content-end">
                  <div class="button-group">
                    <span v-show="hasErrors" class="badge bg-opacity-10 bg-danger text-danger me-3">
                      <base-portal-icon icon="warning" :color="LeadStatusColor.Red" class="me-2" />
                      {{ t('Error') }}
                    </span>
                    <a-popconfirm
                      :title="t('Delete this integration?')"
                      :ok-text="t('Yes')"
                      :cancel-text="t('No')"
                      @confirm="onDelete"
                    >
                      <template #icon>
                        <question-circle-outlined class="text-danger" />
                      </template>
                      <button class="btn btn-outline-danger btn-rounder me-3">
                        <span
                          v-show="busy.delete"
                          class="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        <span v-show="!busy.delete">
                          <base-portal-icon icon="trash" />
                          {{ t('Delete') }}
                        </span>
                      </button>
                    </a-popconfirm>
                  </div>
                  <a
                    :aria-controls="`${collapseId}`"
                    :href="`#${collapseId}`"
                    aria-expanded="false"
                    class="text-primary text-decoration-none fs-4 pe-2"
                    data-bs-toggle="collapse"
                    role="button"
                    @click.prevent="onExpand"
                  >
                    <base-portal-icon :class="expandedClass" class="rotate" icon="caret" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div :id="collapseId" class="collapse shadow-sm">
          <base-loader :loading="busy.loading">
            <div class="border-top bg-gray-100 px-3">
              <div class="row bg-white pt-4 pb-3 px-3">
                <div class="col">
                  <div v-if="hasErrors" class="row">
                    <div class="col">
                      <div class="alert alert-danger d-flex align-items-center" role="alert">
                        <base-portal-icon icon="warning-solid" class="me-2" />
                        {{
                          t(
                            `Can't sync your email. Please check if password did not changed. Recomended to reestablish connection.`
                          )
                        }}
                      </div>
                    </div>
                  </div>

                  <div class="row">
                    <div class="col text-muted">
                      <div class="mb-2 d-flex justify-content-between">
                        {{ t('Allow to use my calendars for business settings') }}
                        <a-switch
                          :disabled="busy.settings"
                          :loading="busy.settings"
                          :checked="integrationType.enabled"
                          @change="(value: boolean) => toggleIntegration(value)"
                        />
                      </div>
                      <div v-show="integrationType.enabled" class="row ms-5">
                        <div
                          v-for="calendar in calendars"
                          :key="calendar.id"
                          class="col-12 mb-2 d-flex justify-content-between"
                        >
                          <div>{{ calendar.title }}</div>
                          <div>
                            <calendar-status-badge :status="calendar.status" />
                            <a-switch
                              :checked="calendar.enabled"
                              :disabled="busy[calendar.id]"
                              :loading="busy[calendar.id]"
                              @change="(value: boolean) => onToggleChange(calendar.id, value)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col">
                      <div>
                        <button
                          class="btn btn-sm btn-outline-primary btn-rounder px-3"
                          @click="testConnection"
                        >
                          <span v-if="!busy.connection">{{ t('Test Connection') }}</span>
                          <div v-else class="spinner-border spinner-border-sm" role="status">
                            <span class="sr-only"></span>
                          </div>
                        </button>
                        <div v-if="status.connection === true" class="fs-6 text-muted mt-1">
                          {{ t('All your active calendars syncs without issues.') }}
                        </div>
                        <div
                          v-else-if="status.connection === false"
                          class="fs-6 text-muted mt-1 invalid-feedback d-block"
                        >
                          {{ serverErrors.connection }}
                        </div>
                      </div>
                      <div class="mt-2">
                        <button
                          class="btn btn-sm btn-outline-primary btn-rounder px-3"
                          @click="testCalendar"
                        >
                          <span v-if="!busy.calendar">{{ t('Test Calendar') }}</span>
                          <div v-else class="spinner-border spinner-border-sm" role="status">
                            <span class="sr-only"></span>
                          </div>
                        </button>
                        <div v-if="status.calendar === true" class="fs-6 text-muted mt-1">
                          {{
                            t('Calendar events were created successfully in all active calendars.')
                          }}
                        </div>
                        <div
                          v-else-if="status.calendar === false"
                          class="fs-6 text-muted mt-1 invalid-feedback d-block"
                        >
                          {{ serverErrors.calendar }}
                        </div>
                      </div>
                      <div class="mt-3">
                        <button
                          class="btn btn-primary btn-rounder"
                          :disabled="busy.reconnect"
                          @click="reconnect"
                        >
                          <span
                            v-show="busy.reconnect"
                            class="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          <span v-show="!busy.reconnect">
                            {{ t('Reconnect with') }} {{ providerName }}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </base-loader>
        </div>
      </template>
    </collapse-wrapper>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, PropType, watch } from 'vue'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { useI18n } from 'vue-i18n'
import { LeadStatusColor } from '@/shared'
import {
  checkConnection,
  getCalendars,
  checkCalendars,
  toogleCalendar
} from '@/api/Business/integrations/integrationsMicrosoft'
import { CalendarIntegrationResponseDto } from '@/dto/Integration/Response/index'
import { deleteIntegration } from '@/api/Business/integrations/integrations'
import { notifyError } from '@/helpers/notification.helper'
import useIntegration from '@/composables/useIntegration'
import { notifySuccess } from '@/helpers/notification.helper'
import { toggleIntegrationType, getIntegrationType } from '@/api/Business/integrations/integrations'
import { useIntegrationDataHandler } from '@/composables/useIntegrationDataHandler'

const QuestionCircleOutlined = asyncComponentWrapper(
  () => import('@ant-design/icons-vue/QuestionCircleOutlined')
)
const CollapseWrapper = asyncComponentWrapper(() => import('@/components/Misc/CollapseWrapper.vue'))
const ASwitch = asyncComponentWrapper(() => import('ant-design-vue/es/switch'))
const APopconfirm = asyncComponentWrapper(() => import('ant-design-vue/es/popconfirm'))
const CalendarStatusBadge = asyncComponentWrapper(
  () => import('@/components/BackOffice/Configuration/integrations/common/CalendarStatusBadge.vue')
)
const AuditBlockCard = asyncComponentWrapper(() => import('@/components/Misc/AuditBlockCard.vue'))
const UsedInLocation = asyncComponentWrapper(
  () => import('@/components/BackOffice/Configuration/integrations/common/UsedInLocation.vue')
) // TODO with backend

const props = defineProps({
  integration: {
    type: Object as PropType<CalendarIntegrationResponseDto>,
    required: true
  },
  active: {
    required: false,
    type: Boolean,
    default: false
  },
  isBusiness: {
    required: false,
    default: false,
    type: Boolean
  }
})

const emit = defineEmits(['expand', 'edit', 'refresh'])

const { t } = useI18n()
const { storeIntegration } = useIntegrationDataHandler(props.isBusiness)

const {
  requestMicrosoftScope: requestScope,
  providers: { MICROSOFT: currentProvider }
} = useIntegration()

const calendars = ref<Record<string, CalendarIntegrationResponseDto>>({})
const busy = ref<Record<string, boolean>>({})
const status = ref<Record<string, boolean | null>>({
  connection: null, // null - not tested, true - all good, false - error
  calendar: null
})
const serverErrors = ref<Record<string, string>>({})
const integrationType = ref({
  type: '',
  enabled: false
})

const hasErrors = computed(() => {
  return Object.keys(serverErrors.value).length > 0
})

const providerName = computed(() => {
  return props.integration.provider.charAt(0).toUpperCase() + props.integration.provider.slice(1)
})

const providerIcon = computed(() => {
  return props.integration.provider
})

const expandedClass = computed(() => {
  return {
    'rotate--90': !props.active,
    'rotate--270': props.active
  }
})

const hasLocations = computed(() => {
  return false // TODO when backend ready
})

function onExpand() {
  emit('expand', props.integration.id)
}

function toggleIntegration(value: boolean) {
  busy.value.settings = true
  toggleIntegrationType(props.integration.id, value, integrationType.value.type)
    .then(() => {
      integrationType.value.enabled = value
    })
    .catch((err) => {
      notifyError(err?.message || t('Failed toggling integration'))
    })
    .finally(() => {
      busy.value.settings = false
    })
}

function onToggleChange(calendarId: string, value: boolean) {
  if (busy.value[calendarId]) return
  busy.value[calendarId] = true

  toogleCalendar(props.integration.id, calendarId, value)
    .then(() => {
      calendars.value[calendarId].enabled = value
    })
    .catch()
    .finally(() => {
      busy.value[calendarId] = false
    })
}

function onDelete() {
  busy.value.delete = true
  deleteIntegration(props.integration.id)
    .then(() => {
      emit('refresh', props.integration.id)
    })
    .catch((err) => {
      notifyError(err?.message || t('Failed removing integration'))
    })
    .finally(() => {
      busy.value.delete = false
    })
}

function testConnection() {
  if (busy.value.connection) return
  busy.value.connection = true

  checkConnection(props.integration.id)
    .then(() => {
      status.value.connection = true
    })
    .catch((err) => {
      status.value.connection = false
      serverErrors.value.connection = err?.message || t('Error with connection test')
    })
    .finally(() => {
      busy.value.connection = false
    })
}

function testCalendar() {
  if (busy.value.calendar) return
  busy.value.calendar = true

  checkCalendars(props.integration.id)
    .then(() => {
      status.value.calendar = true
    })
    .catch((err) => {
      status.value.calendar = false
      serverErrors.value.calendar = err?.message || t('Error with calendar test')
    })
    .finally(() => {
      busy.value.calendar = false
    })
}

function importCalendars(
  calendarArray: CalendarIntegrationResponseDto[]
): Record<string, CalendarIntegrationResponseDto> {
  const obj: Record<string, CalendarIntegrationResponseDto> = {}
  calendarArray.forEach((calendar: CalendarIntegrationResponseDto) => {
    obj[calendar.id] = {
      ...calendar
    }
  })
  return obj
}

function getIntegrationInfo() {
  return new Promise((resolve, reject) => {
    getIntegrationType(props.integration.id)
      .then((response) => {
        integrationType.value = response.data.data[0]
        resolve(true)
      })
      .catch((err) => {
        notifyError(err?.message || t('Failed getting interation types'))
        reject()
      })
  })
}

function getCalendarsData() {
  return new Promise((resolve, reject) => {
    getCalendars(props.integration.id)
      .then((response) => {
        calendars.value = importCalendars(response.data)
        resolve(true)
      })
      .catch((err) => {
        serverErrors.value.calendars = err?.message || t('Unknown error with calendars')
        reject()
      })
  })
}

async function init() {
  busy.value.loading = true

  Promise.all([resetErrors(), getIntegrationInfo(), getCalendarsData()]).then(() => {
    busy.value.loading = false
  })
}

function resetErrors() {
  serverErrors.value = {}
  status.value = {
    connection: null,
    calendar: null
  }
}

async function reconnect() {
  busy.value.reconnect = true
  const response = await requestScope().catch(onReconnectError)

  if (response?.code) {
    storeIntegration(currentProvider, response.code)
      .then(onReconnectSuccess)
      .catch(onReconnectError)
  }
}

function onReconnectSuccess() {
  notifySuccess(t('Successfully reconnected'))
  init()
}

function onReconnectError(error: Error) {
  notifyError(error?.message || t('Something went wrong'))
  busy.value.reconnect = false
}

watch(
  () => props.active,
  (value) => {
    if (value) init()
  },
  { immediate: true }
)
</script>
