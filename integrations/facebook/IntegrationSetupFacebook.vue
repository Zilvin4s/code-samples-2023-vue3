<template>
  <div class="container-fluid">
    <slot name="header">
      <integration-setup-header title="Facebook" :index-route="props.indexRoute" />
    </slot>
    <div class="row mt-4">
      <div class="col">
        <div class="container">
          <div class="card shadow-sm border-0">
            <div class="card-body">
              <div class="row mb-3">
                <div class="col">
                  <h4 class="fw-bold">{{ t('Connect Facebook Messenger') }}</h4>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-6 text-shadow">
                  <p>{{
                    t(
                      'To connect Facebook Messenger to your IKS account you will have to login to Facebook and grant our application permission to access and manage your Facebook Pages.'
                    )
                  }}</p>
                  <p>{{
                    t(
                      'Once you are logged in to Facebook, you will be able to add or edit the pages you would like to have access to. Please ensure that even if you want to configure a new page, all of your pages previously selected should be reselected. Otherwise, access to previously selected pages will be removed.'
                    )
                  }}</p>
                  <p>{{
                    t(
                      'By clicking the button below you will be redirected to Facebook. Once you complete the process you will be redirected back to this page to finish your configuration.'
                    )
                  }}</p>
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
                </div>
              </div>
              <div class="row">
                <div class="offset-6 col-6">
                  <button class="btn btn-primary btn-rounder px-4" @click="integrate">
                    {{ t('Login with Facebook') }}
                  </button>
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
const { storeIntegration } = useIntegrationDataHandler(props.isBusiness)
const {
  requestFacebookScope: requestScope,
  providers: { FACEBOOK: currentProvider }
} = useIntegration()

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
