<template>
  <div>
    <collapse-wrapper :collapsed="props.active">
      <template #default="{ collapseId }">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <div ref="el" class="row d-flex align-items-center justify-content-between">
              <div class="col-6 d-flex align-items-center">
                <base-icon-badge
                  :color="LeadStatusColor.Primary"
                  :icon="providerIcon"
                  class="me-3"
                />
                <div class="d-flex flex-column">
                  <span class="text-primary">{{ providerName }}</span>
                  <span class="text-muted">{{ facebookIntegration.email }}</span>
                </div>
              </div>

              <div class="col-2 d-flex align-items-center">
                <audit-block-card
                  v-if="!!facebookIntegration.audit"
                  :audit="facebookIntegration.audit"
                  :updated-at="facebookIntegration.audit?.profile?.updated_at"
                />
              </div>

              <div class="col-4">
                <div class="d-flex align-items-center justify-content-end">
                  <div>
                    <span v-show="hasErrors" class="badge bg-opacity-10 bg-danger text-danger me-2">
                      <base-portal-icon icon="warning" :color="LeadStatusColor.Red" class="me-2" />
                      {{ t('Error') }}
                    </span>
                    <confirm-modal
                      :title="t('Delete this integration?')"
                      :visible="confirmDeleteModal"
                      @hidden="confirmDeleteModal = false"
                      @confirm="onDelete"
                    >
                      <template #modal-button="{ modalId }">
                        <button
                          type="button"
                          data-bs-toggle="modal"
                          :data-bs-target="`#${modalId}`"
                          class="btn btn-outline-danger rounded-pill d-flex align-items-center justify-content-center me-3"
                          @click="confirmDeleteModal = true"
                        >
                          <base-portal-icon icon="trash" class="me-2" />
                          {{ t('Delete') }}
                        </button>
                      </template>
                    </confirm-modal>
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
                            "Can't sync your email. Please check if password did not change. Recommended to reestablish connection."
                          )
                        }}
                      </div>
                    </div>
                  </div>

                  <div class="row">
                    <div class="col text-muted">
                      <div class="mb-2 d-flex justify-content-between">
                        {{ t('Allow to use my pages for business settings') }}
                        <a-switch
                          :disabled="busy.settings"
                          :loading="busy.settings"
                          :checked="integrationType.enabled"
                          @change="(value: boolean) => toggleIntegration(value)"
                        />
                      </div>
                      <div v-show="integrationType.enabled" class="row ms-5">
                        <div v-for="page in pages" :key="page.page_id" class="col-12 mb-2">
                          <div class="d-flex justify-content-between">
                            <div>{{ page.name }}</div>
                            <div>
                              <pages-status-badge :status="page.status" />
                              <a-switch
                                :checked="page.enabled"
                                :disabled="busy[page.page_id]"
                                :loading="busy[page.page_id]"
                                @change="(value: boolean) => onToggleChange(page.page_id, value)"
                              />
                            </div>
                          </div>
                          <integration-used-in
                            :location="page.location"
                            :business="page.business"
                            class="my-1"
                          />
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
                          {{ t('List of pages was updated') }}
                        </div>
                        <div
                          v-else-if="status.connection === false"
                          class="fs-6 mt-1 invalid-feedback d-block"
                        >
                          {{ serverErrors.connection }}
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
import { computed, ref, PropType, watch } from 'vue'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { useI18n } from 'vue-i18n'
import { LeadStatusColor } from '@/shared'
import {
  checkConnection,
  getPages,
  resyncPages,
  togglePages
} from '@/api/Business/integrations/integrationsFacebook'
import useIntegration from '@/composables/useIntegration'
import { notifySuccess, notifyError } from '@/helpers/notification.helper'
import {
  deleteIntegration,
  getIntegrationType,
  toggleIntegrationType,
  getIntegration
} from '@/api/Business/integrations/integrations'
import { PageIntegrationResponseDto } from '@/dto/Integration/Response/index'
import { useIntegrationDataHandler } from '@/composables/useIntegrationDataHandler'
import { FacebookIntegrationPagesResponseDto } from '@/dto/Integration/Response'

const CollapseWrapper = asyncComponentWrapper(() => import('@/components/Misc/CollapseWrapper.vue'))
const ASwitch = asyncComponentWrapper(() => import('ant-design-vue/es/switch'))
const ConfirmModal = asyncComponentWrapper(() => import('@/components/Misc/ConfirmModal.vue'))
const PagesStatusBadge = asyncComponentWrapper(
  () => import('@/components/BackOffice/Configuration/integrations/common/PagesStatusBadge.vue')
)
const AuditBlockCard = asyncComponentWrapper(() => import('@/components/Misc/AuditBlockCard.vue'))
const IntegrationUsedIn = asyncComponentWrapper(
  () => import('@/components/BackOffice/Configuration/integrations/common/IntegrationUsedIn.vue')
)

const props = defineProps({
  integration: {
    type: Object as PropType<PageIntegrationResponseDto>,
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
  requestFacebookScope: requestScope,
  providers: { FACEBOOK: currentProvider }
} = useIntegration()

const pages = ref<Record<string, FacebookIntegrationPagesResponseDto>>({})
const busy = ref<Record<string, boolean>>({})
const status = ref<Record<string, boolean | null>>({
  connection: null // null - not tested, true - all good, false - error
})
const serverErrors = ref<Record<string, string>>({})
const integrationType = ref({
  type: '',
  enabled: false
})
const confirmDeleteModal = ref(false)
const updatedIntegration = ref<null | PageIntegrationResponseDto>(null)
let connectionTimeout: ReturnType<typeof setTimeout> | null = null

// HINT: on test connection BE requires additional actions - get integration & pages, so updated content will be stored here
const facebookIntegration = computed(() => {
  if (updatedIntegration.value !== null) return updatedIntegration.value
  return props.integration
})

const hasErrors = computed(() => {
  return (
    Object.keys(serverErrors.value).length > 0 ||
    (!!facebookIntegration.value.status && facebookIntegration.value?.status !== 'ok')
  )
})

const providerName = computed(() => {
  return (
    facebookIntegration.value.provider.charAt(0).toUpperCase() +
    facebookIntegration.value.provider.slice(1)
  )
})

const providerIcon = computed(() => {
  return facebookIntegration.value.provider
})

const expandedClass = computed(() => {
  return {
    'rotate--90': !props.active,
    'rotate--270': props.active
  }
})

function onExpand() {
  emit('expand', facebookIntegration.value.id)
}

function toggleIntegration(value: boolean) {
  busy.value.settings = true
  toggleIntegrationType(facebookIntegration.value.id, value, integrationType.value.type)
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

function onToggleChange(pageId: string, value: boolean) {
  if (busy.value[pageId]) return
  busy.value[pageId] = true

  togglePages(facebookIntegration.value.id, pageId, value)
    .then(() => {
      // only update when backend confirms it
      pages.value[pageId].enabled = value
    })
    .catch()
    .finally(() => {
      busy.value[pageId] = false
    })
}

function onDelete() {
  busy.value.delete = true
  deleteIntegration(facebookIntegration.value.id)
    .then(() => {
      emit('refresh')
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

  checkConnection(facebookIntegration.value.id)
    .then(() => {
      status.value.connection = true
      afterTestConnection()
    })
    .catch((err) => {
      status.value.connection = false
      serverErrors.value.connection = err?.message || t('Error with connection test')
    })
    .finally(() => {
      busy.value.connection = false
    })
}

const handleReconnectTimeout = () => {
  busy.value.reconnect = true
  connectionTimeout && clearTimeout(connectionTimeout)
  connectionTimeout = setTimeout(() => {
    busy.value.reconnect = false
  }, 1000 * 10) // 10 seconds and button will stop loading state
}

async function reconnect() {
  handleReconnectTimeout()
  const response = await requestScope().catch(onReconnectError)

  if (response?.code) {
    storeIntegration(currentProvider, response.code)
      .then(onReconnectSuccess)
      .catch(onReconnectError)
  }
}

async function onReconnectSuccess() {
  busy.value.reconnect = false
  connectionTimeout && clearTimeout(connectionTimeout)
  notifySuccess(t('Successfully reconnected'))
  try {
    await resyncPages(facebookIntegration.value.id)
  } catch {}
  init()
}

function onReconnectError(error: Error) {
  busy.value.reconnect = false
  connectionTimeout && clearTimeout(connectionTimeout)
  notifyError(error?.message || t('Something went wrong'))
}

function importPages(
  pagesArray: FacebookIntegrationPagesResponseDto[]
): Record<string, FacebookIntegrationPagesResponseDto> {
  const obj: Record<string, FacebookIntegrationPagesResponseDto> = {}
  pagesArray.forEach((page: FacebookIntegrationPagesResponseDto) => {
    obj[page.page_id] = {
      ...page
    }
  })
  return obj
}

function getCurrentIntegrationType() {
  return new Promise((resolve, reject) => {
    getIntegrationType(facebookIntegration.value.id)
      .then((response) => {
        if (response.data.data) integrationType.value = response.data.data[0]
        resolve(true)
      })
      .catch((err) => {
        notifyError(err?.message || t('Failed getting interation types'))
        reject()
      })
  })
}

function getPagesData() {
  return new Promise((resolve, reject) => {
    getPages(facebookIntegration.value.id)
      .then((response) => {
        pages.value = importPages(response.data.data)
        resolve(true)
      })
      .catch((err) => {
        serverErrors.value.pages = err?.message || t('Unknown error with pages')
        reject()
      })
  })
}

async function afterTestConnection() {
  busy.value.loading = true
  try {
    getIntegration(facebookIntegration.value.id).then((response) => {
      updatedIntegration.value = response.data.data as unknown as PageIntegrationResponseDto
    })
    getPagesData()
  } catch {
  } finally {
    busy.value.loading = false
  }
}

async function init() {
  busy.value.loading = true

  Promise.all([
    // prettier-ignore
    getCurrentIntegrationType(),
    getPagesData(),
    resetErrors()
  ])
    .catch()
    .finally(() => {
      busy.value.loading = false
    })
}

function resetErrors() {
  serverErrors.value = {}
  status.value = {
    connection: null
  }
}

watch(
  () => props.active,
  (value) => {
    if (value) init()
  },
  { immediate: true }
)
</script>
