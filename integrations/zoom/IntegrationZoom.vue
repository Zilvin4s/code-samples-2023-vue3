<template>
  <div>
    <collapse-wrapper :collapsed="props.active">
      <template #default="{ collapseId }">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <div ref="el" class="row">
              <div class="col-6">
                <div class="d-flex align-items-center">
                  <base-icon-badge
                    :color="LeadStatusColor.Primary"
                    :icon="providerIcon"
                    class="me-3"
                  />
                  <div class="d-flex flex-column">
                    <span class="text-primary">{{ providerName }}</span>
                  </div>
                </div>
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
                    aria-expanded="true"
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
                            'Zoom has revoked your access. Please re-authenticate to reestablish connection.'
                          )
                        }}
                      </div>
                    </div>
                  </div>

                  <div class="row">
                    <div class="col text-muted">
                      <div class="mb-2 d-flex justify-content-between">
                        {{ t('Allow to use my account for business settings') }}
                        <a-switch
                          :disabled="busy.settings"
                          :loading="busy.settings"
                          :checked="integrationType.enabled"
                          @change="(value: boolean) => toggleIntegration(value)"
                        />
                      </div>
                    </div>
                    <div class="col">
                      <div>
                        <button
                          class="btn btn-sm btn-outline-primary btn-rounder px-3"
                          @click="testConnection"
                        >
                          <span v-if="!busy.connection">{{ t('Test Connection') }}</span>
                          <div v-else class="spinner-border spinner-border-sm" role="status"></div>
                        </button>
                        <div v-if="status.connection === true" class="fs-6 text-muted mt-1">
                          {{ t('Connection is established') }}
                        </div>
                        <div v-else-if="status.connection === false" class="fs-6 text-muted mt-1">
                          {{ serverErrors?.connection }}
                        </div>
                      </div>
                      <div class="mt-3">
                        <button class="btn btn-primary btn-rounder" @click="reconnect">
                          {{ t('Reconnect with') }} {{ providerName }}
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
import { computed, ref, watch, PropType } from 'vue'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { useI18n } from 'vue-i18n'
import { LeadStatusColor } from '@/shared'
import { checkConnection } from '@/api/Business/integrations/integrationsZoom'
import { deleteIntegration } from '@/api/Business/integrations/integrations'
import { CalendarIntegrationResponseDto } from '@/dto/Integration/Response/index'
import { notifySuccess, notifyError } from '@/helpers/notification.helper'
import useIntegration from '@/composables/useIntegration'
import { getIntegrationType } from '@/api/Business/integrations/integrations'
import { toggleIntegrationType } from '@/api/Business/integrations/integrations'
import { useIntegrationDataHandler } from '@/composables/useIntegrationDataHandler'

const QuestionCircleOutlined = asyncComponentWrapper(
  () => import('@ant-design/icons-vue/QuestionCircleOutlined')
)
const CollapseWrapper = asyncComponentWrapper(() => import('@/components/Misc/CollapseWrapper.vue'))
const ASwitch = asyncComponentWrapper(() => import('ant-design-vue/es/switch'))
const APopconfirm = asyncComponentWrapper(() => import('ant-design-vue/es/popconfirm'))
const AuditBlockCard = asyncComponentWrapper(() => import('@/components/Misc/AuditBlockCard.vue'))

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
  requestZoomScope: requestScope,
  providers: { ZOOM: currentProvider }
} = useIntegration()

const busy = ref<Record<string, boolean>>({})
const status = ref<Record<string, boolean | null>>({
  connection: null, // null - not tested, true - all good, false - error
  business: false
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

function getIntegrationInfo() {
  return new Promise((resolve, reject) => {
    getIntegrationType(props.integration.id)
      .then((response) => {
        integrationType.value = response.data.data[0]
        resolve(true)
      })
      .catch((err) => {
        notifyError(err?.message || t('Failed getting integration types'))
        reject()
      })
  })
}

function init() {
  busy.value.loading = true
  Promise.all([resetErrors(), getIntegrationInfo()]).then(() => {
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

// Check if the environment variable is set to true to run the Zoom OAuth via IKS v3 integration code
// This should be removed once IKS v3 will be decomissions
const shouldDoZoomOAuthViaIKSv3 = import.meta.env.VITE_ZOOM_OAUTH_VIA_IKS_V3

async function reconnect() {
  if (shouldDoZoomOAuthViaIKSv3) {
    // New code to handle Zoom OAuth for IKS cross-version functionality
    busy.value.reconnect = true
    let receivedCode = null

    // Define a function that sets up the event listener and returns a promise
    function waitForChildMessage(): Promise<void> {
      return new Promise<void>((resolve) => {
        const messageHandler = function (event: MessageEvent): void {
          // Strip path from the URLs for comparison
          const strippedZoomClientRedirect = stripPathFromUrl(
            import.meta.env.VITE_ZOOM_CLIENT_REDIRECT ?? 'http://localhost:3000/social/zoom'
          )
          const strippedEventOrigin = stripPathFromUrl(event.origin)
          // Compare Message origin
          if (strippedEventOrigin === strippedZoomClientRedirect) {
            if (event.data && event.data.code) {
              window.removeEventListener('message', messageHandler)
              receivedCode = event.data.code
              resolve()
            }
          }
        }

        window.addEventListener('message', messageHandler)
      })
    }

    try {
      const childMessagePromise = waitForChildMessage()
      const response = await requestScope().catch(onReconnectError)
      // Check for null before storing
      if (receivedCode !== null) {
        storeIntegration(currentProvider, receivedCode)
          .then(onReconnectSuccess)
          .catch(onReconnectError)
      }
    } catch (e) {}
  } else {
    // Exclusive IKSv4 Implementation: This code is intended for use only after the decommissioning of IKS v3
    // Because Zoom OAuth does not support 2 redirect origins/urls

    busy.value.reconnect = true
    const response = await requestScope().catch(onReconnectError)

    if (response?.code) {
      storeIntegration(currentProvider, response.code)
        .then(onReconnectSuccess)
        .catch(onReconnectError)
    }
  }
}

function stripPathFromUrl(url: string) {
  const urlObject = new URL(url)
  return `${urlObject.protocol}//${urlObject.host}`
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
