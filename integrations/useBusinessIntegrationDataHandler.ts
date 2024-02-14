
import { getBusinessIntegrations, storeBusinessIntegration } from "@/api/Business/integrations/integrations"
import useCurrentBusiness from '@/composables/useCurrentBusiness'

export function useBusinessIntegrationDataHandler(){

    const { businessId } = useCurrentBusiness()

    function getIntegrations(){
        return getBusinessIntegrations(businessId.value)
    }

    function storeIntegration(provider: string, code: string){
        return storeBusinessIntegration(businessId.value, provider, code)
    }

    return {
        getIntegrations,
        storeIntegration,
    }
}