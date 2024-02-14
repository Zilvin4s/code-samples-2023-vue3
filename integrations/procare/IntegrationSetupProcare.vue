<template>
  <div class="container-fluid">
    <slot name="header">
      <integration-setup-header title="Procare" :index-route="props.indexRoute" />
    </slot>
    <div class="row mt-4">
      <div class="col">
        <div class="container">
          <base-loader :loading="isLoading || !isInitialized">
            <procare-integration-form
              v-if="isInitialized"
              :edit="integrationData"
              :procare-data="procare.procareData"
              :iks-data="procare.iksData"
              :is-busy="isSubmitting"
              :server-errors="procare.serverErrors.value"
              :valid-ikn="isValidIkn"
              @ikn="onIknChange"
              @location="onLocationChange"
              @submit="onSubmit"
            />
            <span v-else>&nbsp;</span>
          </base-loader>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { useProcareIntegrationSetup } from '@/composables/integrations/useProcareIntegrationSetup'
import { nextTick, onMounted, ref } from 'vue'
import {
  createProcareIntegration,
  getProcareIntegration
} from '@/api/Business/integrations/integrationsProcare'
import useCurrentBusiness from '@/composables/useCurrentBusiness'
import useFeatures from '@/composables/useFeatures'
import { useRoute } from 'vue-router'
import { RouteList } from '@/routes/RouteList'
import { useRouter } from 'vue-router'
import { notifySuccess } from '@/helpers/notification.helper'
import { updateProcareIntegration } from '@/api/Business/integrations/integrationsProcare'
import { ProcareItemResponseDto } from '@/dto/Integration/Response/index'
import { ProcareRequestDto } from '@/dto/Integration/Request/index'
import { useI18n } from 'vue-i18n'

const IntegrationSetupHeader = asyncComponentWrapper(
  () =>
    import(
      '@/components/BackOffice/Configuration/integrations/IntegrationSetup/IntegrationSetupHeader.vue'
    )
)
const ProcareIntegrationForm = asyncComponentWrapper(
  () =>
    import('@/components/BackOffice/Configuration/integrations/common/ProcareIntegrationForm.vue')
)

const props = defineProps({
  isBusiness: {
    required: false,
    type: Boolean,
    default: false
  },
  indexRoute: {
    required: true,
    type: Object
  }
})

const route = useRoute()
const router = useRouter()
const { lmsFeatureId } = useFeatures()
const { businessId } = useCurrentBusiness()
const procare = useProcareIntegrationSetup(businessId.value, String(lmsFeatureId.value))
const { t } = useI18n()

const integrationData = ref<undefined | ProcareItemResponseDto>()
const isInitialized = ref(false)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isValidIkn = ref(false)

async function onSubmit(data: ProcareRequestDto) {
  try {
    isSubmitting.value = true

    if (!!route.params.integrationId) {
      await updateProcareIntegration(String(route.params.integrationId), data)
      notifySuccess(t('Procare integration has been updated'))
    } else {
      await createProcareIntegration(businessId.value, data)
      notifySuccess(t('Procare integration has been created'))
    }
    router.push({ name: RouteList.SETTINGS.BUSINESS.INTEGRATIONS.INDEX.NAME })
  } catch (e: any) {
    procare.handleError(e)
  } finally {
    isSubmitting.value = false
  }
}

async function onIknChange(ikn: string) {
  if (ikn.length === 0) {
    isValidIkn.value = false
    return
  }

  procare.clearAccountsCache()
  procare.clearLocationsCache()

  isLoading.value = true
  try {
    await procare.getProcareData(ikn)
    isValidIkn.value = true
  } catch (e: any) {
    isValidIkn.value = false
    procare.handleError(e)
  } finally {
    isLoading.value = false
  }
}

async function onLocationChange(ikn: string, value: string | string[]) {
  const schoolIds = []

  if (typeof value === 'string') {
    schoolIds.push(value)
  } else if (Array.isArray(value)) {
    schoolIds.push(...value)
  }

  // async load of all schools and accounts
  for (const schoolId of schoolIds) {
    if (schoolId === '0') {
      procare.removeClassroom(schoolId)
    } else if (schoolId === undefined) {
      return
    } else {
      try {
        await procare.getClassroom(ikn, schoolId)
      } catch (e: any) {
        procare.handleError(e)
      }
      try {
        await procare.getAccounts(ikn, schoolId)
      } catch (e: any) {
        procare.handleError(e)
      }
    }
  }
}

onMounted(async () => {
  try {
    if (!!route.params.integrationId) {
      const response = await getProcareIntegration(String(route.params.integrationId))
      integrationData.value = response.data.data
    }
    await Promise.all([procare.getChildStatus(), procare.getDataFields(), procare.getLocations()])
  } catch {
  } finally {
    nextTick(() => {
      isInitialized.value = true
    })
  }
})
</script>
