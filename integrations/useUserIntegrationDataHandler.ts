import { getUserIntegrations, storeUserIntegration } from '@/api/Business/integrations/integrations'

export function useUserIntegrationDataHandler() {
  function getIntegrations() {
    return getUserIntegrations()
  }

  function storeIntegration(provider: string, code: string) {
    return storeUserIntegration(provider, code)
  }

  return {
    getIntegrations,
    storeIntegration
  }
}
