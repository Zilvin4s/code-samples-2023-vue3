import { useBusinessIntegrationDataHandler } from '@/composables/integrations/useBusinessIntegrationDataHandler'
import { useUserIntegrationDataHandler } from '@/composables/integrations/useUserIntegrationDataHandler'

export function useIntegrationDataHandler(isBusiness = false) {
  const { getIntegrations, storeIntegration } = isBusiness
    ? useBusinessIntegrationDataHandler()
    : useUserIntegrationDataHandler()

  return {
    getIntegrations,
    storeIntegration
  }
}
