import { getChildStatuses } from '@/api/Business/childStatus'
import {
  getProcareAccounts,
  getProcareClassrooms,
  getProcareConfig,
  getProcareSchools
} from '@/api/Business/integrations/integrationsProcare'
import { HttpStatusCodes } from '@/enums/HttpStatusCodes'
import { computed, nextTick, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useErrorHandler from '@/api/useErrorHandler'
import { getBusinessCustomFields } from '@/api/Business/field'
import { DataFieldName } from '@/shared'
import { getBusinessLocations } from '@/api/Business/location'
import {
  ProcareAccountsItem,
  ProcareClassroomItem,
  ProcareIntegrationProcareData,
  ProcateIntegrationIksData
} from '@/dto/Integration/Response'
import { formatServerErrors } from '@/helpers/error.helper'
import { DataFieldResponse } from '@/dto/Business/DataFieldDto'

export function useProcareIntegrationSetup(businessId: string, featureId: string) {

  const { errors, handleErrors, scrollToErrors } = useErrorHandler()
  const { t } = useI18n()

  let classroomsCache: Record<string, ProcareClassroomItem[]> = {}
  let accountsCache: Record<string, ProcareAccountsItem[]> = {}

  const procareData = reactive<ProcareIntegrationProcareData>({
    config: {
      phoneNumberTypes: [],
      relationshipTypes: [],
      enrollmentStatusTypes: []
    },
    schools: [],
    classrooms: {},
    accounts: {}
  })

  const iksData = reactive<ProcateIntegrationIksData>({
    childStatuses: [],
    relationships: [],
    locations: [],
    genders: []
  })

  const isLoading = ref(false)
  const customErrors = ref<Record<string, string>>({}) // errors where it doesnt match laravel format

  const serverErrors = computed(() => {
    return {
      ...customErrors.value, // where server doesnt return proper format
      ...formatServerErrors(errors.value)
    }
  })

  async function getProcareData(ikn: string) {
    const { data: config } = await getProcareConfig(ikn)
    procareData.config = config.data

    const { data: schools } = await getProcareSchools(ikn)
    procareData.schools = schools.data
  }

  async function handleError(e: any) {
    if ([e?.status, e?.response?.status].includes(HttpStatusCodes.UnprocessableEntity)) {
      const hasErrors = handleErrors(e)
      if (hasErrors) {
        nextTick(() => {
          scrollToErrors({ errors: errors.value })
        })
      }
    } else if (e?.status === HttpStatusCodes.BadRequest) { // HINT: backend doesnt return proper message
      customErrors.value = {
        ikn: e?.data?.message || t('IKN is not valid')
      }
    }
  }

  async function getChildStatus() {
    const { data } = await getChildStatuses(businessId, featureId)
    iksData.childStatuses = data.data
  }

  async function getDataFields() {
    const { data } = await getBusinessCustomFields(businessId, featureId)

    iksData.relationships =
      data.data.find((item: DataFieldResponse) => item.system_name === DataFieldName.Relationship)
        ?.input_values || []

    iksData.genders =
      data.data.find((item: DataFieldResponse) => item.system_name === DataFieldName.Gender)
        ?.input_values || []
  }

  async function getLocations() {
    const { data } = await getBusinessLocations(businessId)
    iksData.locations = data.data
  }

  async function getClassroom(ikn: string, schoolId: string) {
    if (classroomsCache[schoolId]) {
      procareData.classrooms[schoolId] = classroomsCache[schoolId]
    } else {
      const { data } = await getProcareClassrooms(ikn, schoolId)
      classroomsCache[schoolId] = data.data
      procareData.classrooms[schoolId] = data.data
    }
    return Promise.resolve(procareData.classrooms[schoolId])
  }

  function removeClassroom(schoolId: string) {
    delete procareData.classrooms[schoolId]
  }

  function clearLocationsCache() {
    classroomsCache = {}
  }

  async function getAccounts(ikn: string, schoolId: string) {
    if (accountsCache[schoolId]) {
      procareData.accounts[schoolId] = accountsCache[schoolId]
    } else {
      const { data } = await getProcareAccounts(ikn, schoolId)
      accountsCache[schoolId] = data.data
      procareData.accounts[schoolId] = data.data
    }
    return Promise.resolve(procareData.classrooms[schoolId])
  }

  function removeAccount(schoolId: string) {
    delete procareData.accounts[schoolId]
  }

  function clearAccountsCache() {
    accountsCache = {}
  }

  return {
    isLoading,
    errors,
    procareData,
    iksData,
    serverErrors,
    getProcareData,
    getChildStatus,
    getDataFields,
    getLocations,
    removeClassroom,
    clearLocationsCache,
    getAccounts,
    removeAccount,
    clearAccountsCache,
    getClassroom,
    handleError
  }
}
