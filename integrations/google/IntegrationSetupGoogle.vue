<template>
  <div class="container-fluid">
    <slot name="header">
      <integration-setup-header title="Google" :index-route="props.indexRoute" />
    </slot>
    <div class="row mt-4">
      <div class="col">
        <div class="container">
          <div class="card shadow-sm border-0">
            <div class="card-body">
              <div class="row mb-3">
                <div class="col">
                  <h4 class="fw-bold">{{ t('Connect Google Calendars') }}</h4>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-6 text-shadow">
                  {{
                    t(
                      'Once you connect, you’ll be able to access all your calendars and configure them where you need them.'
                    )
                  }}
                </div>
                <div class="col-6">
                  <div v-show="hasErrors" class="alert alert-danger" role="alert">
                    <base-portal-icon icon="warning-solid" class="me-2" />
                    {{
                      t(
                        'You have connected this account on your personal profile. We do not allow to duplicate connections. Disconnect this from your personal account to control access via Business integrations.'
                      )
                    }}
                  </div>
                  <base-loader :loading="isLoading">
                    <div>
                      <button class="btn btn-primary btn-rounder px-4" @click="integrate">
                        {{ t('Login with Google') }}
                      </button>
                    </div>
                  </base-loader>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import useIntegration from '@/composables/useIntegration'
import { useRouter } from 'vue-router'
import { notifyError } from '@/helpers/notification.helper'
import { useIntegrationDataHandler } from '@/composables/useIntegrationDataHandler'
import { asyncComponentWrapper } from '@/composables/useReloadModal'

const IntegrationSetupHeader = asyncComponentWrapper(
  () =>
    import(
      '@/components/BackOffice/Configuration/integrations/IntegrationSetup/IntegrationSetupHeader.vue'
    )
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

const { t } = useI18n()
const router = useRouter()
const {
  requestGoogleScope: requestScope,
  providers: { GOOGLE: currentProvider }
} = useIntegration()
const { storeIntegration } = useIntegrationDataHandler(props.isBusiness)

const isLoading: Ref<boolean> = ref(false)

const hasErrors = computed(() => {
  return false
})

async function integrate() {
  isLoading.value = true
  try {
    const response = await requestScope()
    await storeIntegration(currentProvider, response.code)
    router.push(props.indexRoute)
  } catch {
  } finally {
    isLoading.value = false
  }
}
</script>
