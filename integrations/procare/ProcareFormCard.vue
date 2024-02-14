<template>
  <div class="card shadow-sm boder-0 mb-4">
    <div class="card-body">
      <div class="row mb-3">
        <div class="col">
          <span class="fs-5 font-weight-bolder">
            <slot name="title"></slot>
          </span>
        </div>
      </div>
      <div class="row">
        <div class="col-6">
          <slot name="description"></slot>
        </div>
        <div class="col-6">
          <slot name="inputs"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.font-weight-bolder {
  font-weight: 700;
}
</style>
