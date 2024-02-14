<template>
  <div>
    <collapse-wrapper :collapsed="props.active">
      <template #default="{ collapseId }">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <div ref="el" class="row">
              <div class="col-4">
                <div class="d-flex align-items-center">
                  <base-icon-badge :color="LeadStatusColor.Primary" icon="procare-v2" class="me-3" />
                  <div class="d-flex flex-column">
                    <span class="text-primary">{{ t('Procare') }}</span>
                    <span class="text-muted">{{ t('IKN') }}: {{ props.integration.ikn }}</span>
                  </div>
                </div>
              </div>

              <div class="col-2">
                <div class="d-flex align-items-center">
                  <span v-show="hasErrors" class="badge bg-opacity-10 bg-danger text-danger me-3">
                    <base-portal-icon icon="warning" :color="LeadStatusColor.Red" class="me-2" />
                    {{ t('Error') }}
                  </span>
                </div>
              </div>

              <div class="col-2">
                <audit-block-card
                  v-if="!!props.integration.audit"
                  :audit="props.integration.audit"
                  :updated-at="props.integration.audit?.profile?.updated_at"
                />
              </div>

              <div class="col-4">
                <div class="d-flex align-items-center justify-content-end">
                  <div class="button-group">
                    <button class="btn btn-outline-primary btn-rounder me-3 px-4" @click="onEdit">
                      <span class="px-2">{{ t('Edit') }}</span>
                    </button>
                    <confirm-modal
                      :title="t('Delete this integration?')"
                      :item="t('this integration')"
                      @confirm="onDelete"
                    >
                      <template #modal-button="{ modalId }">
                        <button
                          type="button"
                          data-bs-toggle="modal"
                          :data-bs-target="`#${modalId}`"
                          class="btn btn-outline-danger btn-rounder me-3"
                        >
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
            <div class="border-top px-3" :class="{ invisible: busy.loading }">
              <div class="row bg-white bg-opacity-50 pt-4 pb-3 px-3">
                <div v-if="props.active" class="col">
                  <div class="border-bottom pb-3 mb-3">
                    <div class="font-bold fs-7 text-uppercase">{{ t('IKN') }}</div>
                    <div class="text-muted">{{ integrationData?.settings.ikn }}</div>
                  </div>
                  <div class="border-bottom pb-3 mb-3">
                    <div class="font-bold fs-7 text-uppercase mb-3">{{ t('Locations') }}</div>
                    <div>
                      <div
                        v-for="location in locations"
                        :key="`location-${location.id}`"
                        class="row mb-2"
                      >
                        <div class="col">
                          <div class="row">
                            <div class="col-6 d-flex align-items-centers">
                              <label class="d-flex align-items-center">
                                <span class="badge bg-primary">{{ location?.local?.label }}</span>
                                <div class="ms-2 text-muted font-weight-bold">{{
                                  location?.local?.name
                                }}</div>
                              </label>
                            </div>
                            <div class="col-6">
                              {{ location?.procare?.schoolName }} ({{ location.procare?.schoolId }})
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="border-bottom pb-3 mb-3">
                    <div class="font-bold fs-7 text-uppercase mb-3">{{ t('Child Statuses') }}</div>
                    <div class="text-muted">
                      <div
                        v-for="childStatus in childStatuses"
                        :key="`child-status-${childStatus.id}`"
                        class="row mb-2"
                      >
                        <div class="col-6 d-flex align-items-center">
                          <lead-status-badge
                            v-if="childStatus.local"
                            :color="childStatus.local.color"
                            :label="childStatus.local.label"
                            :tooltip-text="childStatus.local.title"
                          />
                          <div class="ms-2">{{ childStatus?.local?.title }}</div>
                        </div>
                        <div class="col-6 d-flex align-items-center">
                          {{ childStatus?.procare?.description }} ({{
                            childStatus?.procare?.typeId
                          }})
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="pb-3 mb-3">
                    <div class="font-bold fs-7 text-uppercase mb-3">{{
                      t('Enrollment Statuses for Lookup')
                    }}</div>
                    <div class="d-flex">
                      <div
                        v-for="childEnrollmentStatus in childEnrollmentStatuses"
                        :key="`enrollment-status-${childEnrollmentStatus?.typeId}`"
                        class="row mb-2"
                      >
                        <div class="col-6 d-flex align-items-center">
                          <div class="badge text-white bg-primary me-2">{{
                            childEnrollmentStatus?.description
                          }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="props.active" class="col">
                  <div class="border-bottom pb-3 mb-3">
                    <div class="font-bold fs-7 text-uppercase">{{
                      t('Default phone number type')
                    }}</div>
                    <div class="text-muted">
                      {{ t(phoneNumberType) }} ({{ integrationData?.settings.phone_type_id }})
                    </div>
                  </div>
                  <div class="border-bottom pb-3 mb-3">
                    <div class="font-bold fs-7 text-uppercase">{{ t('Daily sync time') }}</div>
                    <div class="text-muted">{{ syncTime }}</div>
                  </div>
                  <div class="border-bottom pb-3 mb-3">
                    <div class="font-bold fs-7 text-uppercase">{{
                      t('Use marketing automation during daily sync')
                    }}</div>
                    <base-yes-no-label
                      :value="!!integrationData?.settings.marketing_automation_enabled"
                    />
                  </div>
                  <div class="border-bottom pb-3 mb-3">
                    <div class="font-bold fs-7 text-uppercase">{{ t('Future Enrollments') }}</div>
                    <base-yes-no-label
                      :value="!!integrationData?.settings.future_enrollments_enabled"
                    />
                  </div>
                  <div class="border-bottom pb-3 mb-3">
                    <div class="font-bold fs-7 text-uppercase mb-3">{{ t('Relationships') }}</div>
                    <div class="text-muted">
                      <div
                        v-for="relationship in relationships"
                        :key="`child-status-${relationship.id}`"
                        class="row mb-2"
                      >
                        <div class="col-6 d-flex align-items-center">
                          <div class="ms-2">{{ relationship?.local?.text }}</div>
                        </div>
                        <div class="col-6 d-flex align-items-center">
                          {{ relationship?.procare?.description }} ({{
                            relationship.procare?.typeId
                          }})
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="pb-3 mb-3">
                    <div class="font-bold fs-7 text-uppercase mb-3">{{
                      t('Accepted Relationships')
                    }}</div>
                    <div class="d-flex">
                      <div
                        v-for="allowedRelationship in allowedRelationships"
                        :key="`allowed-relationship-${allowedRelationship?.typeId}`"
                        class="row mb-2"
                      >
                        <div class="col-6 d-flex align-items-center">
                          <div class="badge text-white bg-primary me-2">{{
                            allowedRelationship?.description
                          }}</div>
                        </div>
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
import { computed, ref, PropType, watch, nextTick } from 'vue'
import router from '@/routes'
import useFeatures from '@/composables/useFeatures'
import useCurrentBusiness from '@/composables/useCurrentBusiness'
import { useI18n } from 'vue-i18n'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { RouteList } from '@/routes/RouteList'
import {
  ProcareItemResponseDto,
  IntegrationTypeProcareResponseDto,
  IntegrationProcareRelationsMappingDto,
  ProcareConfigItem,
  ProcareSchoolItem
} from '@/dto/Integration/Response/index'
import { useProcareIntegrationSetup } from '@/composables/integrations/useProcareIntegrationSetup'
import { notifyError } from '@/helpers/notification.helper'
import { getProcareIntegration } from '@/api/Business/integrations/integrationsProcare'
import { LeadStatusColor } from '@/shared'
import { toLocalTime } from '@/helpers/date.helper'
import { deleteProcareIntegration } from '@/api/Business/integrations/integrationsProcare'
import { ChildStatusItem } from '@/api/Business/childStatus'
import { LocationResponseDto } from '@/dto/Business/Location/Response'

const CollapseWrapper = asyncComponentWrapper(() => import('@/components/Misc/CollapseWrapper.vue'))
const ConfirmModal = asyncComponentWrapper(() => import('@/components/Misc/ConfirmModal.vue'))
const LeadStatusBadge = asyncComponentWrapper(() => import('@/components/Misc/LeadStatusBadge.vue'))
const AuditBlockCard = asyncComponentWrapper(() => import('@/components/Misc/AuditBlockCard.vue'))

const props = defineProps({
  integration: {
    type: Object as PropType<IntegrationTypeProcareResponseDto>,
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
const { businessId } = useCurrentBusiness()
const { lmsFeatureId } = useFeatures()
const procare = useProcareIntegrationSetup(businessId.value, String(lmsFeatureId.value))

const busy = ref<Record<string, boolean>>({})
const serverErrors = ref<Record<string, string>>({})
const integrationData = ref<ProcareItemResponseDto>()

const hasErrors = computed(() => {
  return Object.keys(serverErrors.value).length > 0
})

const unknownRelation = {
  id: null,
  text: '-Unknown-'
}

const locations = computed(() => {
  const _locations: { id: string; local?: LocationResponseDto; procare?: ProcareSchoolItem }[] = []
  integrationData.value?.mapping?.locations.forEach((location) => {
    _locations.push({
      id: location.id,
      local: procare.iksData.locations.find((l) => l.id === location.local),
      procare: procare.procareData.schools.find((s) => String(s.schoolId) === location.procare)
    })
  })
  return _locations
})

const relationships = computed(() => {
  const _relationships: {
    id: string
    local?: { id: string | null; text: string }
    procare?: ProcareConfigItem
  }[] = []
  integrationData.value?.mapping?.relationships.forEach((relationship) => {
    _relationships.push({
      id: relationship.id,
      local:
        relationship.local === null
          ? unknownRelation
          : procare.iksData.relationships.find((r) => r.id === relationship.local),
      procare: procare.procareData.config.relationshipTypes.find(
        (s) => String(s.typeId) === relationship.procare
      )
    })
  })
  return _relationships
})

const allowedRelationships = computed(() => {
  return (
    integrationData.value?.settings?.allowed_relationships?.map((id: string) => {
      return procare.procareData?.config.relationshipTypes?.find(
        (s: ProcareConfigItem) => String(s.typeId) === id
      )
    }) || []
  )
})

const childStatuses = computed(() => {
  const _childStatuses: { id: string; local?: ChildStatusItem; procare?: ProcareConfigItem }[] = []
  integrationData.value?.mapping?.child_statuses.forEach(
    (status: IntegrationProcareRelationsMappingDto) => {
      _childStatuses.push({
        id: status.id,
        local: procare.iksData.childStatuses.find((c) => c.id === status.local),
        procare: procare.procareData?.config.enrollmentStatusTypes?.find(
          (s: ProcareConfigItem) => String(s.typeId) === status.procare
        )
      })
    }
  )
  return _childStatuses
})

const childEnrollmentStatuses = computed(() => {
  return (
    integrationData.value?.settings?.child_enrollment_statuses?.map((id: string) => {
      return procare.procareData?.config.enrollmentStatusTypes?.find(
        (s: ProcareConfigItem) => String(s.typeId) === id
      )
    }) || []
  )
})

const phoneNumberType = computed(() => {
  if (integrationData.value?.settings.phone_type_id) {
    const type = procare.procareData?.config.phoneNumberTypes?.find(
      (p: ProcareConfigItem) => String(p.typeId) === integrationData.value?.settings.phone_type_id
    )?.description
    if (type) return type
  }
  return ''
})

const syncTime = computed(() => {
  return toLocalTime(integrationData.value?.settings.sync_time)
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

function onDelete() {
  busy.value.delete = true
  deleteProcareIntegration(props.integration.id)
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

function getIntegrationInfo() {
  return new Promise((resolve, reject) => {
    getProcareIntegration(props.integration.id)
      .then((response) => {
        integrationData.value = response.data.data
        resolve(true)
      })
      .catch(reject)
  })
}
async function init() {
  try {
    busy.value.loading = true
    resetErrors()
    await getIntegrationInfo().catch(handleIntegrationError)
    nextTick(async () => {
      await Promise.all([
        procare.getChildStatus(),
        procare.getDataFields(),
        procare.getLocations(),
        procare.getProcareData(String(integrationData.value?.settings.ikn))
      ]).finally(() => {
        busy.value.loading = false
      })
    })
  } catch {
    busy.value.loading = false
  }
}

function handleIntegrationError(e: any) {
  serverErrors.value.critical =
    e?.response?.data?.message || e?.message || 'Failed retrieving integration info'
}

function resetErrors() {
  serverErrors.value = {}
}

function onEdit() {
  router.push({
    name: RouteList.SETTINGS.BUSINESS.INTEGRATIONS.PROCARE.NAME,
    params: {
      integrationId: props.integration.id
    }
  })
}

watch(
  () => props.active,
  (value) => {
    if (value) init()
  },
  { immediate: true }
)
</script>
