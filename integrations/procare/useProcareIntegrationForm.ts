import { useForm } from 'vee-validate'
import { nextTick } from 'vue'
import {
  IntegrationProcareRelationsMappingDto,
  ProcareItemResponseDto,
  ProcateIntegrationIksData
} from '@/dto/Integration/Response'
import { ProcareRequestDto } from '@/dto/Integration/Request'

interface FormDto {
  ikn: string
  consent: boolean
  phone_type_id: null | string
  sync_time: string
  marketing_automation_enabled: boolean
  sync_immediately_enabled: boolean
  marketing_automation_during_instant_sync_enabled: boolean
  future_enrollments_enabled: boolean
  statuses: Record<string, string>
  relationships: Record<string, string>
  locations: Record<string, string>
  genders: Record<string, string>
  allowed_relationships: string[]
  child_enrollment_statuses: string[]
}

function baseFormValues(): FormDto {
  return {
    ikn: '',
    consent: false,
    phone_type_id: null,
    sync_time: '',
    marketing_automation_enabled: false,
    sync_immediately_enabled: false,
    marketing_automation_during_instant_sync_enabled: false,
    future_enrollments_enabled: false,
    statuses: {},
    relationships: {},
    locations: {},
    genders: {},
    allowed_relationships: [],
    child_enrollment_statuses: []
  }
}

export function useProcareIntegrationForm() {
  const { values, errors, setFieldValue, setValues, validate, resetForm } = useForm({
    initialValues: baseFormValues()
  })

  interface ImportDataDto {
    edit: ProcareItemResponseDto
    iksData: ProcateIntegrationIksData
  }

  function importData(data: ImportDataDto): FormDto {
    const initialValues = baseFormValues()

    const values: FormDto = {
      ...initialValues,
      ikn: data.edit?.settings?.ikn || '',
      consent: !!data.edit.settings ? true : false, // only true on edit, backend doesnt return this value
      phone_type_id: data.edit?.settings?.phone_type_id || null,
      sync_time: data.edit?.settings?.sync_time || '',
      marketing_automation_enabled: data.edit?.settings?.marketing_automation_enabled || false,
      sync_immediately_enabled: data.edit?.settings?.sync_immediately_enabled || false,
      marketing_automation_during_instant_sync_enabled:
        data.edit?.settings?.marketing_automation_during_instant_sync_enabled || false,
      future_enrollments_enabled: data.edit?.settings?.future_enrollments_enabled || false,
      allowed_relationships: data.edit?.settings?.allowed_relationships || [],
      child_enrollment_statuses: data.edit?.settings?.child_enrollment_statuses || []
    }

    if (data.iksData.childStatuses) {
      values.statuses = mapSavedRelationsToFormValues(data.edit.mapping?.child_statuses)
    }

    if (data.iksData.relationships) {
      values.relationships = mapSavedRelationsToFormValues(data.edit.mapping?.relationships)
    }

    if (data.iksData.locations) {
      values.locations = mapSavedRelationsToFormValues(data.edit.mapping?.locations)
    }

    // GENDERS - hardcoded for now
    if (data.iksData.genders) {
      values.genders = data.iksData.genders.reduce(
        (acc: Record<string, string | null>, item: any) => {
          // HINT: currently hardcoded in values for these
          const hardcoded: Record<string, string> = {
            'Boy': 'Male',
            'Girl': 'Female',
            'Not specified': 'Unknown'
          }
          if (hardcoded[item.text]) {
            acc[item.id] = hardcoded[item.text]
          } else {
            acc[item.id] = null
          }
          return acc
        },
        {}
      )
    }

    return values

    function mapSavedRelationsToFormValues(
      oldMapping?: IntegrationProcareRelationsMappingDto[]
    ): Record<string, string> {
      return (
        (!!oldMapping &&
          oldMapping?.reduce(
            (acc: Record<string, string>, item: IntegrationProcareRelationsMappingDto) => {
              acc[item.local] = item.procare
              return acc
            },
            {}
          )) ||
        {}
      )
    }
  }

  function exportData() {
    const data = {
      ...values,
      statuses: handleRelationsExport(values.statuses) || [],
      relationships: handleRelationsExport(values.relationships) || [],
      locations: handleRelationsExport(values.locations) || []
    } as unknown as ProcareRequestDto

    return data

    function handleRelationsExport(data: Record<string, string>) {
      return Object.entries(data)
        .filter(([local, procare]) => {
          return (!!local && !!procare) || (local === null && !!procare)
        })
        .map(([local, procare]) => {
          return {
            local,
            procare
          }
        })
    }
  }

  // HINT: additional method to validate just one field when it changes
  // otherwise it will validate all fields
  function setValueAndValidate(key: string | any, value: any) {
    setFieldValue(key, value)
    nextTick(() => {
      validate({
        [key]: value
      })
    })
  }

  return {
    values,
    errors,
    setFieldValue: setValueAndValidate,
    setValues,
    resetForm,
    importData,
    exportData
  }
}
