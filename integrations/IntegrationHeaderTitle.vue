<template>
    <div class="row bg-pattern">
        <div class="col pt-5 pb-5">
            <div class="container fs-1 d-flex align-items-center">
                  <router-link
                    :to="props.indexRoute"
                    class="btn btn-outline-primary border-2 rounded-circle p-0 d-flex align-items-center justify-content-center me-3"
                  >
                  <base-portal-icon class="rotate rotate--180" icon="caret"/>
                </router-link>
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>

const props = defineProps({
    indexRoute:{
        required: true,
        type: Object,
    },
})

</script>