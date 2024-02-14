<template>
  <form @submit.prevent="onSubmit">
    <procare-form-card>
      <template #title>{{ t('IKN') }}</template>
      <template #description>
        <p>{{ t('IKN is the main identifier of your business within Procare.') }}</p>
        <p>{{
          t(
            'Ask Procare support or open IntelliKid Systems extra within Procare program to find one.'
          )
        }}</p>
      </template>
      <template #inputs>
        <label for="ikn" class="mb-2">{{ t('IKN') }}</label>
        <span v-if="!!props.edit?.settings?.ikn" class="form-control ikn-on-edit">{{
          formattedIkn
        }}</span>
        <div v-else-if="!!form.values.ikn && props.validIkn">
          <div class="form-control d-flex ikn-on-valid">
            <div>{{ formattedIkn }}</div>
            <div v-if="!!form.values.ikn && props.validIkn" class="search-icon-size text-muted">
              <base-portal-icon
                icon="plus"
                class="rotate--45 text-danger cursor-pointer"
                @click="clearIkn"
              />
            </div>
          </div>
        </div>
        <div v-else class="input-group">
          <input
            id="ikn"
            ref="iknInputRef"
            name="ikn"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': errors?.ikn }"
            placeholder="000-000-0000"
            :value="form.values.ikn"
            :disabled="props.validIkn"
            @input="(e: any) => form.setFieldValue('ikn', e.target.value)"
          />
        </div>
        <div v-if="errors?.ikn" class="invalid-feedback d-block">{{ t(errors.ikn) }}</div>
      </template>
    </procare-form-card>

    <template v-if="props.validIkn">
      <hr class="mt-5 mb-4" />
      <h3 class="font-weight-bolder mb-3">{{ t('Configuration') }}</h3>

      <!-- PHONE TYPE -->

      <procare-form-card>
        <template #title>{{ t('Phone number type') }}</template>
        <template #description>
          <p>{{
            t(
              'Within IKS phone type is optional and never mandated while Procare requires such data to be set.'
            )
          }}</p>
          <p>{{
            t('Please choose which phone type you would like to assign it to during data sync.')
          }}</p>
        </template>
        <template #inputs>
          <label for="phone_type_id" class="mb-2">{{ t('Default Phone Number Type') }}</label>
          <a-select
            id="phone_type_id"
            name="phone_type_id"
            class="form-select"
            :class="{ 'is-invalid': errors?.phone_type_id }"
            size="large"
            :value="form.values.phone_type_id"
            :options="phoneNumberTypes"
            :disabled="Object.keys(phoneNumberTypes).length === 0"
            @change="(value: number) => form.setFieldValue('phone_type_id', value)"
          />
          <div v-if="errors?.phone_type_id" class="invalid-feedback d-block">{{
            t(errors.phone_type_id)
          }}</div>
        </template>
      </procare-form-card>

      <!-- RELATIONSHIPS -->

      <procare-form-card>
        <template #title>{{ t('Relationships') }}</template>
        <template #description>
          <p>{{ t('Within IKS we have a predefined list of relationship types.') }}</p>
          <p>{{
            t('Please map them with your current set up within IKS for data to sync successfully.')
          }}</p>
        </template>
        <template #inputs>
          <div class="mb-4">
            <div class="mb-2">{{ t('Accepted Relationships') }}</div>
            <div>
              <a-select
                :value="form.values.allowed_relationships"
                :get-popup-container="
                    (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement
                  "
                :options="relationshipTypes"
                class="w-100"
                mode="multiple"
                option-filter-prop="label"
                show-search
                size="large"
                @change="(values: string[]) => form.setFieldValue('allowed_relationships', values)"
              />
              <div v-if="errors?.allowed_relationships" class="invalid-feedback d-block mt-2">
                {{ t(errors.allowed_relationships) }}
                <span class="is-invalid"></span>
              </div>
            </div>
          </div>
          <hr class="mt-1 mb-4" />
          <div v-if="errors?.relationships" class="invalid-feedback d-block mb-2">
            {{ t(errors.relationships) }}
            <span class="is-invalid"></span>
          </div>
          <div
            v-for="relationship in relationships"
            :key="`relationship-${relationship.id}`"
            class="row mb-2"
            :class="{ 'border-top mt-3 pt-3': relationship.id === relationshipFallbackId }"
          >
            <div v-if="relationship.id === relationshipFallbackId" class="col-12">
              <div class="bg-warning bg-opacity-10 text-warning p-2 mb-2">
                {{
                  t(
                    'Procare Sync requires all contacts to have a defined relationship. If a contact in IKS does not, we will use the mapping below when sending data to Procare.'
                  )
                }}
              </div>
            </div>
            <div class="col-4 col-md-5 col-sm-6 d-flex aling-items-center">
              <label :for="`relationship-${relationship.id}`" class="d-flex align-items-center">
                <div class="ms-2">{{ relationship.text }}</div>
              </label>
            </div>
            <div class="col-8 col-md-7 col-sm-6">
              <a-select
                :id="`relationship-${relationship.id}`"
                :name="`relationship-${relationship.id}`"
                :value="form.values?.relationships?.[relationship.id as string]"
                :show-search="true"
                option-filter-prop="label"
                size="large"
                class="w-100"
                :allow-clear="true"
                :allow-clear-search-value="true"
                :options="relationshipTypes"
                @change="(value: string) => onDropdownChange(`relationships.${relationship.id}`, value)"
              />
            </div>
            <div v-if="relationship.id === relationshipFallbackId" class="col-12 mt-1">
              <span class="text-muted fs-7">
                {{ t('Fallback when none of the above matches') }}
              </span>
            </div>
          </div>
        </template>
      </procare-form-card>

      <!-- CHILD STATUSES -->

      <procare-form-card>
        <template #title>{{ t('Child statuses') }}</template>
        <template #description>
          <p>{{
            t('Map child states from your IKS settings to Enrollment statuses you have at Procare.')
          }}</p>
          <p>{{
            t(
              'If we find a new Account at Procare we will apply Lead Status based on the follow rules.'
            )
          }}</p>
          <p>{{
            t(
              'Lead Status will match child state based on their types accordingly. Status will be changed if at least one child is found with a state in this priority: Enrolled, Waitlist. States of other children will be ignored.'
            )
          }}</p>
        </template>
        <template #inputs>
          <div v-if="errors?.statuses" class="invalid-feedback d-block mb-2">
            {{ t(errors.statuses) }}
            <span class="is-invalid"></span>
          </div>
          <div
            v-for="childStatus in props.iksData.childStatuses"
            :key="childStatus.id"
            class="row mb-2"
          >
            <div class="col-4 col-md-5 col-sm-6">
              <label :for="`child-status-${childStatus.id}`" class="d-flex align-items-center">
                <lead-status-badge
                  :color="childStatus.color"
                  :label="childStatus.label"
                  :tooltip-text="childStatus.title"
                />
                <div class="ms-2">{{ childStatus.title }}</div>
              </label>
            </div>
            <div class="col-8 col-md-7 col-sm-6">
              <a-select
                :id="`child-status-${childStatus.id}`"
                :name="`child-status-${childStatus.id}`"
                :value="form.values?.statuses?.[childStatus.id]"
                :show-search="true"
                option-filter-prop="label"
                :allow-clear="true"
                :allow-clear-search-value="true"
                size="large"
                class="w-100"
                :options="statusTypes"
                @change="(value: string) => onDropdownChange(`statuses.${childStatus.id}`, value)"
              />
            </div>
          </div>
        </template>
      </procare-form-card>

      <!-- GENDERS -->

      <procare-form-card>
        <template #title>{{ t('Genders') }}</template>
        <template #description>
          <p>{{ t('Within IKS we have a predefined list of gender types.') }}</p>
        </template>
        <template #inputs>
          <div v-if="errors?.genders" class="invalid-feedback d-block mb-2">
            {{ t(errors.genders) }}
            <span class="is-invalid"></span>
          </div>
          <div v-for="gender in props.iksData.genders" :key="gender.id" class="row mb-2">
            <div class="col-4 col-md-5 col-sm-6">
              <label :for="`genders-${gender.id}`" class="d-flex align-items-center">
                <div class="ms-2">{{ gender.text }}</div>
              </label>
            </div>
            <div class="col-8 col-md-7 col-sm-6">
              <a-select
                :id="`genders-${gender.id}`"
                :name="`genders-${gender.id}`"
                :value="form.values?.genders?.[gender.id]"
                :show-search="true"
                option-filter-prop="label"
                :allow-clear="true"
                :allow-clear-search-value="true"
                size="large"
                class="w-100"
                disabled
              />
            </div>
          </div>
        </template>
      </procare-form-card>

      <!-- SCHOOLS & LOCATIONS -->

      <procare-form-card>
        <template #title>{{ t('Locations vs. Schools') }}</template>
        <template #description>
          <p>{{ t('Match which location in IKS represents which school within Procare.') }}</p>
        </template>
        <template #inputs>
          <div v-if="errors?.locations" class="invalid-feedback d-block mb-2">
            {{ t(errors.locations) }}
            <span class="is-invalid"></span>
          </div>
          <div v-for="location in props.iksData.locations" :key="location.id" class="row mb-2">
            <div class="col-4 col-md-5 col-sm-6">
              <label :for="`location-${location.id}`" class="d-flex align-items-center">
                <span class="badge bg-primary">{{ location.label }}</span>
                <div class="ms-2">{{ location.name }}</div>
              </label>
            </div>
            <div class="col-8 col-md-7 col-sm-6">
              <a-select
                :id="`location-${location.id}`"
                :name="`location-${location.id}`"
                :value="form.values?.locations?.[location.id]"
                :show-search="true"
                option-filter-prop="label"
                :allow-clear="true"
                :allow-clear-search-value="true"
                size="large"
                class="w-100"
                :options="locationOptions"
                @change="(schoolId: string) => handleLocationChange(location.id, schoolId)"
              />
            </div>
          </div>
        </template>
      </procare-form-card>

      <!-- CLASSROOMS -->

      <procare-form-card>
        <template #title>{{ t('Classrooms') }}</template>
        <template #description>
          <p>{{ t('This is the list of all classrooms that we will add into the system') }}</p>
        </template>
        <template #inputs>
          <div class="bg-opacity-10 bg-warning text-warning p-2 fw-normal fs-6 mb-2">
            {{ t('We will add classrooms only from mapped schools.') }}
          </div>
          <div class="overflow-auto" style="max-height: 300px">
            <div
              v-for="(classrooms, schoolId) in props.procareData.classrooms"
              :key="`school-${schoolId}`"
            >
              <label>{{ schoolNames[schoolId] }}</label>
              <ul>
                <li
                  v-for="classroom in classrooms"
                  :key="`school-${schoolId}-classroom-${classroom.classroomId}`"
                >
                  {{ classroom.classroomName }}
                </li>
              </ul>
            </div>
          </div>
        </template>
      </procare-form-card>

      <!-- LEADS & ACCOUNTS -->

      <procare-form-card>
        <template #title>{{ t('Leads vs. Accounts') }}</template>
        <template #description>
          <p>{{ t('This is the example of data we will pull from Procare to sync into IKS.') }}</p>
          <p>{{
            t(
              'If we find internal lead by email or phone, all information will be merged and/or updated. Otherwise, we will create a new lead profile.'
            )
          }}</p>
          <p>{{
            t(
              'If lead is being merged, status will be updated based on your configuration for automated assignment.'
            )
          }}</p>
          <p>{{
            t(
              'Primary Payer will be mapped as Primary Contact. Other payers and other children relationships will be added as Other Contacts.'
            )
          }}</p>
          <p>{{
            t(
              'Only first phone number will be taken from payers/children relationships if they have multiple.'
            )
          }}</p>
          <p>{{
            t(
              'If something does not look right, do not save configuration and double check with your Success Engineer.'
            )
          }}</p>
        </template>
        <template #inputs>
          <div
            v-if="!!props.procareData.accounts"
            class="bg-opacity-10 bg-warning text-warning p-2 fw-normal fs-6 mb-2"
          >
            {{
              t(
                'This is just a small preview of your Accounts. All Accounts from all mapped Schools will be synced.'
              )
            }}
          </div>
          <div class="overflow-auto" style="max-height: 200px">
            <div
              v-for="(accounts, schoolId) in props.procareData.accounts"
              :key="`school-${schoolId}`"
            >
              <label>{{ schoolNames[schoolId] }}</label>
              <ul>
                <li
                  v-for="account in accounts"
                  :key="`school-${schoolId}-account-${account.accountId}`"
                >
                  {{ account.accountKey }} ({{ account.accountId }})
                </li>
              </ul>
            </div>
          </div>
        </template>
      </procare-form-card>

      <!-- OPTIONS -->

      <procare-form-card>
        <template #title>{{ t('Options') }}</template>
        <template #description>
          <p>{{
            t(
              'Sync will happen daily, at the time you choose. You can choose that initial Accounts data would be synced immediately.'
            )
          }}</p>
          <p>{{
            t('You can choose, if you would like to use Marketing Automation during sync.')
          }}</p>
        </template>
        <template #inputs>
          <div>
            <div class="mb-3">
              <label for="sync_time">{{ t('Daily Sync Time') }}</label>
              <a-select
                id="sync_time"
                name="sync_time"
                class="form-select mb-2"
                :class="{ 'is-invalid': errors?.sync_time }"
                size="large"
                :value="form.values.sync_time"
                :options="dailySyncTime"
                @change="(value: string) => form.setFieldValue('sync_time', value)"
              />
              <div v-if="errors?.sync_time" class="invalid-feedback">
                {{ t(errors.sync_time) }}
              </div>
              <span class="text-muted">{{ t('Based on your business timezone') }}</span>
            </div>
            <div class="mb-3">
              <label class="mb-1">{{ t('Use Marketing Automation during daily sync') }}</label>
              <div>
                <base-yes-no-input-group
                  v-model="form.values.marketing_automation_enabled"
                  name="marketing_automation_enabled"
                  :has-error="!!errors?.marketing_automation_enabled"
                />
                <div v-if="errors?.marketing_automation_enabled" class="invalid-feedback">
                  {{ t(errors.marketing_automation_enabled) }}
                </div>
              </div>
              <div class="text-muted">
                {{ t('If leads will be modified all related Workflows will fire at that time') }}
              </div>
            </div>
            <div class="mb-3">
              <label class="mb-1">{{
                t('Start a sync immediately (when this configuration is saved)')
              }}</label>
              <div>
                <base-yes-no-input-group
                  v-model="form.values.sync_immediately_enabled"
                  name="sync_immediately"
                  :has-error="!!errors?.sync_immediately_enabled"
                />
                <div v-if="errors?.marketing_automation_enabled" class="invalid-feedback">
                  {{ t(errors.marketing_automation_enabled) }}
                </div>
              </div>
              <div class="text-muted">
                {{ t('If not checked, the first sync will happen at the time you choose') }}
              </div>
            </div>
            <div v-show="!!form.values.sync_immediately_enabled" class="mb-3">
              <label class="mb-1">{{ t('Enable Marketing Automation during Instant Sync') }}</label>
              <div>
                <base-yes-no-input-group
                  v-model="form.values.marketing_automation_during_instant_sync_enabled"
                  name="marketing_automation_during_instant_sync_enabled"
                  :has-error="!!errors?.marketing_automation_during_instant_sync_enabled"
                />
                <div
                  v-if="errors?.marketing_automation_during_instant_sync_enabled"
                  class="invalid-feedback"
                >
                  {{ t(errors.marketing_automation_during_instant_sync_enabled) }}
                </div>
              </div>
              <div class="text-muted">
                {{ t('Applies only if "Instant Sync" is selected') }}
              </div>
            </div>
            <hr class="mt-3 mb-3" />
            <div class="mb-4">
              <div class="mb-2">{{ t('Enrollment Statuses for Lookup') }}</div>
              <div>
                <a-select
                  :value="form.values.child_enrollment_statuses"
                  :get-popup-container="
                      (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement
                    "
                  :options="statusTypes"
                  class="w-100"
                  mode="multiple"
                  option-filter-prop="label"
                  show-search
                  size="large"
                  @change="(values: string[]) => form.setFieldValue('child_enrollment_statuses', values)"
                />
                <div v-if="errors?.child_enrollment_statuses" class="invalid-feedback d-block mt-2">
                  {{ t(errors.child_enrollment_statuses) }}
                  <span class="is-invalid"></span>
                </div>
              </div>
            </div>
            <div class="mb-3">
              <label class="mb-1">{{ t('Future Enrollments') }}</label>
              <div>
                <base-yes-no-input-group
                  v-model="form.values.future_enrollments_enabled"
                  name="future_enrollments_enabled"
                  :has-error="!!errors?.future_enrollments_enabled"
                />
                <div v-if="errors?.future_enrollments_enabled" class="invalid-feedback">
                  {{ t(errors.future_enrollments_enabled) }}
                </div>
              </div>
              <div class="text-muted">
                {{ t('If you need to look past the default 30 day window') }}
              </div>
            </div>
          </div>
        </template>
      </procare-form-card>

      <!-- CONSENT -->

      <procare-form-card>
        <template #title>{{ t('Consent') }}</template>
        <template #description>
          <p>{{
            t(
              'I understand and agree that data will be synced from my Procare account into IKS business automatically.'
            )
          }}</p>
          <p>{{
            t(
              'I confirm that I have permissions and legal rights to establish a connection between Procare and IKS for leads personal data to be synchronized between two systems.'
            )
          }}</p>
        </template>
        <template #inputs>
          <div class="mb-3">
            <label class="mb-1">{{ t('I understand the consequences and want to proceed') }}</label>
            <div>
              <base-yes-no-input-group
                v-model="form.values.consent"
                name="consent"
                :has-error="!!errors?.consent"
              />
              <div v-if="errors?.consent" class="invalid-feedback d-block">
                {{ t(errors.consent) }}
              </div>
            </div>
          </div>
        </template>
      </procare-form-card>
    </template>

    <div class="d-flex justify-content-end mt-5 mb-5 pb-5">
      <button
        v-if="!props.validIkn"
        class="btn btn-primary btn-rounder me-3"
        type="button"
        @click="nextStep"
      >
        {{ t('Continue') }}
      </button>
      <base-submit-button v-else :text="t('Save')" :is-submitting="props.isBusy" />
    </div>
  </form>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { asyncComponentWrapper } from '@/composables/useReloadModal'
import { useProcareIntegrationForm } from '@/composables/integrations/useProcareIntegrationForm'
import { PropType, computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  ProcareConfigItem,
  ProcareSchoolItem,
  ProcareItemResponseDto,
  ProcareIntegrationProcareData,
  ProcateIntegrationIksData
} from '@/dto/Integration/Response/index'
import { ProcareRequestDto } from '@/dto/Integration/Request/index'

const ASelect = asyncComponentWrapper(() => import('ant-design-vue/es/select'))
const ProcareFormCard = asyncComponentWrapper(
  () => import('@/components/BackOffice/Configuration/integrations/common/ProcareFormCard.vue')
)
const LeadStatusBadge = asyncComponentWrapper(() => import('@/components/Misc/LeadStatusBadge.vue'))

const props = defineProps({
  /* procare data based on IKN number */
  procareData: {
    required: false,
    type: Object as PropType<ProcareIntegrationProcareData>,
    default: () => ({})
  },
  /* saved integration values */
  edit: {
    required: false,
    type: Object as PropType<ProcareItemResponseDto>,
    default: () => ({})
  },
  isLoading: {
    required: false,
    type: Boolean,
    default: false
  },
  isBusy: {
    required: false,
    type: Boolean,
    default: false
  },
  serverErrors: {
    required: true,
    type: Object
  },
  iksData: {
    required: true,
    type: Object as PropType<ProcateIntegrationIksData>
  },
  validIkn: {
    required: true,
    type: Boolean
  }
})

const emits = defineEmits<{
  (e: 'ikn', ikn: string): void
  (e: 'location', ikn: string, schoolId: string | string[]): void
  (e: 'submit', data: ProcareRequestDto): void
}>()

const { t } = useI18n()
const form = useProcareIntegrationForm()

const relationshipFallbackId = null
const iknInputRef = ref(null)
const customErrors = ref<Record<string, string>>({})

const errors = computed(() => ({
  ...customErrors.value,
  ...props.serverErrors,
  ...form.errors.value
}))

const formattedIkn = computed(() => {
  return form.values.ikn?.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
})

const phoneNumberTypes = computed(() => {
  return (
    props.procareData?.config?.phoneNumberTypes?.map((item: ProcareConfigItem) => ({
      label: item.description,
      value: String(item.typeId)
    })) || []
  )
})

const relationshipTypes = computed(() => {
  return (
    props.procareData?.config?.relationshipTypes?.map((item: ProcareConfigItem) => ({
      label: item.description,
      value: String(item.typeId)
    })) || []
  )
})

const statusTypes = computed(() => {
  return (
    props.procareData?.config?.enrollmentStatusTypes?.map((item: ProcareConfigItem) => ({
      label: item.description,
      value: String(item.typeId)
    })) || []
  )
})

const locationOptions = computed(() => {
  return props.procareData.schools.map((item: ProcareSchoolItem) => ({
    label: item.schoolName,
    value: String(item.schoolId)
  }))
})

const relationships = computed(() => {
  return [
    ...props.iksData.relationships,
    ...[
      {
        id: relationshipFallbackId,
        text: `-${t('Unknown')}-`
      }
    ]
  ]
})

const schoolNames = computed(() => {
  return props.procareData.schools.reduce((acc: any, item: ProcareSchoolItem) => {
    acc[String(item.schoolId)] = item.schoolName
    return acc
  }, {})
})

const dailySyncTime = computed(() => {
  // generate options with label and value object that returns time in format HH:mm in intervals of 15mins for 24 hours
  const options = []
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 15) {
      const time = dayjs().hour(i).minute(j)
      options.push({
        label: time.clone().format('h:mm A'),
        value: time.format('HH:mm')
      })
    }
  }
  return options
})

function handleLocationChange(locationId: string, schoolId: string) {
  form.values.locations[locationId] = schoolId
  emits('location', form.values.ikn, schoolId)
}

function onDropdownChange(key: string | any, value: any) {
  form.setFieldValue(key, value)
}

function onSubmit() {
  const data = form.exportData()
  emits('submit', data)
}

function loadSavedLocations(ikn: string, locations: Record<string, string>) {
  const schoolIds = Object.values(locations)
  emits('location', ikn, schoolIds)
}

function nextStep() {
  if (customErrors.value?.ikn) delete customErrors.value.ikn

  if (String(form.values.ikn).length === 3 + 3 + 4) {
    emits('ikn', form.values.ikn)
  } else {
    customErrors.value.ikn = t('Enter valid IKN number')
  }
}

function clearIkn() {
  if (customErrors.value?.ikn) delete customErrors.value.ikn
  emits('ikn', '')
  form.resetForm()
}

// HINT: watch for correctly typed IKN number
// and replace non-digit characters, when users enters in format like XXX-XXX-XXXX
watch(
  () => form.values.ikn,
  (value) => {
    const cleanIkn = String(value).replaceAll(/\D/g, '') // keep only numbers
    if (value !== cleanIkn) {
      form.setFieldValue('ikn', cleanIkn)
    }
  }
)

// shows additional option or hides it and sets to false
watch(
  () => form.values.sync_immediately_enabled,
  (value: boolean) => {
    if (value === false) {
      form.setFieldValue('marketing_automation_during_instant_sync_enabled', false)
    }
  },
  { immediate: true }
)

onMounted(() => {
  const formData = form.importData({
    edit: props.edit || {},
    iksData: props.iksData
  })
  form.setValues(formData)
  if (!!props.edit?.settings?.ikn) {
    nextTick(() => {
      emits('ikn', formData.ikn)
      loadSavedLocations(formData.ikn, formData.locations)
    })
  }
})
</script>

<style lang="scss" scoped>
.ikn-on-edit,
.ikn-on-valid {
  display: block;
  width: 100%;
  padding: 8.5px 12px;
  border: 1px solid #d1d5db;
  color: rgb(73, 80, 87);
  background: rgb(233, 236, 239);
  border-radius: 0.3rem;
  font-size: 0.9rem;
  line-height: 1.5rem;
}
.ikn-on-valid {
  .search-icon-size {
    margin-left: auto;
  }
}
</style>
