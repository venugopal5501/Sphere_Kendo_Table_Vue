<template>
  <div
    class="k-grid"
    :style="{
      display: 'block',
      position: 'absolute',
      zIndex: 20000,
      padding: '4px 6px',
      top: top + 'px',
      left: left + 'px',
    }"
  >
    <table class="k-grid-table">
      <tbody>
        <tr>
          <td class="k-master-row k-alt">
            <span :class="hintIcon"></span>
          </td>
          <td
            v-for="(field, index) in filteredFields"
            :key="index"
            class="k-master-row k-alt"
          >
            {{ formatdata(dataItem, field) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script>
import { formatDate } from '@progress/kendo-intl';

export default {
  props: {
    left: Number,
    top: Number,
    showContent: Boolean,
    dataItem: {
      type: Object,
      default() {
        return {};
      },
    },
    columns: {
      type: Array,
      default() {
        return [];
      },
    },
  },
  computed: {
    hintIcon: function () {
      return this.showContent
        ? 'k-icon k-i-insert-middle'
        : 'k-icon k-i-cancel';
    },
    filteredFields: function () {
      return this.columns
        .filter((c) => c.invisible === undefined || c.invisible === false)
        .map((c) => c.field);
    },
  },
  methods: {
    // Formats the data based on the column's field and format, specifically for date fields
    formatdata(dataItem, field) {
      let column = this.columns.filter((c) => c.field == field)[0];
      if (column && column.filter === 'date' && dataItem[field]) {
        return formatDate(
          dataItem[field],
          column.format.replace('{0:', '').replace('}', '')
        );
      }
      return dataItem[field] || '';
    },
  },
};
</script>
<style scoped>
.k-grid {
  border-radius: 5px;
  border: 1px solid #0094fb;
  backdrop-filter: blur(10px);
  transition: box-shadow 0.3s ease-in-out, backdrop-filter 0.3s ease-in-out;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.5);
}
</style>
