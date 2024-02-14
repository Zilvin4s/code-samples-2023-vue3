<template>
  <div class="container-fluid">
    <slot name="header">
      <integration-setup-header title="Zoom" :index-route="props.indexRoute" />
    </slot>
    <div class="row mt-4">
      <div class="col">
        <div class="container">
          <div class="card shadow-sm border-0">
            <div class="card-body">
              <div class="row mb-3">
                <div class="col">
                  <h4 class="fw-bold">{{ t('Connect Zoom') }}</h4>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-6 text-shadow">
                  <p>{{
                    t(
                      'To connect Zoom to your IKS account you will need to login to Zoom and grant our application permission to access your Zoom account. This allows IKS to create and delete meetings via our application.'
                    )
                  }}</p>
                  <p>{{
                    t(
                      'By clicking the button below you will be redirected to Zoom in order to login. Once you complete the process you will be redirected back to this page to finish your configuration.'
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
                  <div>
                    <button class="btn btn-primary btn-rounder px-4" @click="integrate">
                      {{ t('Authorize Zoom') }}
                    </button>
                  </div>
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
  requestZoomScope: requestScope,
  providers: { ZOOM: currentProvider }
} = useIntegration()

const isLoading: Ref<boolean> = ref(false)

const hasErrors = computed(() => {
  return false
})

// Check if the environment variable is set to true to run the Zoom OAuth via IKS v3 integration code
// This should be removed once IKS v3 will be decomissions 
const shouldDoZoomOAuthViaIKSv3 = import.meta.env.VITE_ZOOM_OAUTH_VIA_IKS_V3

async function integrate() {
  if (shouldDoZoomOAuthViaIKSv3) {
    // New code to handle Zoom OAuth for IKS cross-version functionality
    isLoading.value = true
    let receivedCode = null

    // Define a function that sets up the event listener and returns a promise
    function waitForChildMessage(): Promise<void> {
      return new Promise<void>((resolve) => { 
        const messageHandler = function(event: MessageEvent): void {
          // Strip path from the URLs for comparison
          const strippedZoomClientRedirect = stripPathFromUrl(import.meta.env.VITE_ZOOM_CLIENT_REDIRECT ?? 'http://localhost:3000/social/zoom')
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
      const response = await requestScope()
      // Check for null before storing
      if (receivedCode !== null) { 
        await storeIntegration(currentProvider, receivedCode)
      }
      router.push(props.indexRoute)
    } catch (e) {
    } finally {
      isLoading.value = false
    }
  } else {
    // Exclusive IKSv4 Implementation: This code is intended for use only after the decommissioning of IKS v3
    // Because Zoom OAuth does not support 2 redirect origins/urls
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
}

function stripPathFromUrl(url: string) {
  const urlObject = new URL(url)
  return `${urlObject.protocol}//${urlObject.host}`
}

</script>
