<template>
  <div
    :class="{
      'skeleton-loader': true,
      loading: loading,
      chart: type == 'chart',
    }"
  >
    <div
      :class="{
        'loader-content-wrapper': true,
        'skeleton-loader__bone': type == 'chart',
        'min-height-220': type == 'table' && loading,
        bordered: bordered,
      }"
    >
      <span v-show="!loading" class="loader-content">
        <slot />
      </span>
      <div v-if="type == 'text' && loading" class="text-skeleton">
        <p class="skeleton-loader__bone"></p>
        <p class="skeleton-loader__bone"></p>
      </div>
      <div v-if="type == 'table' && loading" class="table-skeleton">
        <table>
          <thead>
            <tr>
              <th><div></div></th>
              <th style="width: 50%"><div></div></th>
              <th style="width: 30%"><div></div></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><div></div></td>
              <td><div></div></td>
              <td><div></div></td>
            </tr>
            <tr>
              <td><div></div></td>
              <td><div></div></td>
              <td><div></div></td>
            </tr>
            <tr>
              <td><div></div></td>
              <td><div></div></td>
              <td><div></div></td>
            </tr>
            <tr>
              <td><div></div></td>
              <td><div></div></td>
              <td><div></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SkeletonLoader',
  props: {
    loading: {
      type: Boolean,
    },
    bordered: {
      type: Boolean,
    },
    type: {
      type: String,
      default: 'chart',
    },
  },
};
</script>

<style>
.skeleton-loader.loading .loader-content {
  visibility: hidden;
}

.skeleton-loader .skeleton-loader__bone {
  border-radius: 5px;
  vertical-align: top;
}

.skeleton-loader.loading .skeleton-loader__bone {
  position: relative;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.06);
}
.skeleton-loader.chart.loading {
  height: 100%;
}
.skeleton-loader.chart.loading .loader-content-wrapper {
  margin: 8px 16px;
  height: calc(100% - 16px);
}
.skeleton-loader.loading .skeleton-loader__bone:after,
.table-skeleton table th div:after,
.table-skeleton table td div:after {
  animation: loading-skelly 1.5s infinite;
  content: '';
  height: 100%;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  transform: translateX(-100%);
  z-index: 1;
  background: linear-gradient(
    90deg,
    hsla(0, 0%, 100%, 0),
    hsla(0, 0%, 100%, 0.8),
    hsla(0, 0%, 100%, 0)
  );
}

.skeleton-loader.loading .skeleton-loader__bone.bordered {
  box-sizing: border-box;
  border: 1px solid lightgrey;
}

.skeleton-loader.loading .loader-content-wrapper {
  position: relative;
  overflow: hidden;
}

.table-skeleton,
.text-skeleton {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 3;
  background-color: var(--color-white);
}

.table-skeleton table {
  width: 100%;
}

.table-skeleton table th {
  text-align: left;
  background-color: #4a687e;
  color: #fff;
  font-weight: normal;
  padding: 12px;
}

.table-skeleton table td {
  padding: 12px;
}

.table-skeleton table tr:nth-child(even) td {
  background-color: #f4f5f6;
}

.table-skeleton table th div,
.table-skeleton table td div {
  position: relative;
  height: 18px;
  overflow: hidden;
}

.table-skeleton table td div:after {
  background: linear-gradient(
    90deg,
    hsla(0, 0%, 100%, 0),
    hsla(0, 0%, 100%, 0.8),
    hsla(0, 0%, 100%, 0)
  );
}

.table-skeleton table th div:after {
  background: linear-gradient(
    90deg,
    hsla(0, 0%, 100%, 0.1),
    hsla(0, 0%, 100%, 0.3),
    hsla(0, 0%, 100%, 0.1)
  );
}

.text-skeleton p {
  height: 18px;
  margin-top: 0;
}

.text-skeleton p:last-child {
  width: 70%;
}
.min-height-220 {
  min-height: 220px;
}

@keyframes loading-skelly {
  to {
    transform: translateX(100%);
  }
}
</style>
