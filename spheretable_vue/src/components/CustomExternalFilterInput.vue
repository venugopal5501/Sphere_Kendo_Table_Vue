<template>
  <span>
    <span v-if="filterInputType == 'boolean'" class="input-boolean">
      <v-select
        :label="filterLabel"
        :items="[true, false]"
        class="
          v-input
          k-filter-v-input
          v-text-field v-text-field--box v-text-field--enclosed
          v-input--hide-details
          k-input k-picker-solid
        "
        :rules="requiredRules"
        @change="handleBooleanChange"
      />
    </span>
    <span v-else>
      <v-text-field
        ref="filterSearchInput"
        :label="filterLabel"
        :value="inputValue"
        :type="filterInputType"
        :disabled="disabledInput"
        :rules="!disabledInput ? requiredRules : []"
        hide-details
        dense
        box
        background-color="#fff"
        class="k-filter-v-input k-input k-picker-solid k-rounded-md"
        @input="handleFilterInput"
      />
    </span>
  </span>
</template>
<script>

import { required } from '../mixins/formRules.js';
const filterOperatorText = {
  contains: 'Contains',
  doesnotcontain: 'Does not contain',
  eq: 'Equal to',
  neq: 'Not equal to',
  startswith: 'Starts with',
  endswith: 'Ends with',
  lt: 'Less than',
  gt: 'Greater than',
  gte: 'Greater than or equal to',
  lte: 'Less than or equal to',
  isnull: 'Null',
  isnotnull: 'Not null',
  isempty: 'Empty',
  isnotempty: 'Not empty',
};
const disableInputOperators = ['isnull', 'isnotnull', 'isempty', 'isnotempty'];
export default {
  props: {
    filterObj: {
      type: Object,
      default() {
        return {};
      },
    },
    filterInputType: {
      type: String,
      default() {
        return 'text';
      },
    },
    columns: {
      type: Array,
      required: false,
      default() {
        return [];
      },
    },
  },
  data() {
    return {
      inputValue: null,
      filterLabel: 'Search',
      disabledInput: false,
      requiredRules: [required],
    };
  },
  watch: {
    filterObj: {
      handler(newVal) {
        this.filterLabel =
          filterOperatorText[newVal.operator] || newVal.operator;
        this.inputValue = newVal.value;
        if (this.$refs.filterSearchInput)
          this.$refs.filterSearchInput.value = newVal.value;
        if (disableInputOperators.includes(newVal.operator)) {
          this.disabledInput = true;
        } else {
          this.disabledInput = false;
          if (this.$refs.filterSearchInput)
            this.$refs.filterSearchInput.focus();
        }
      },
      immediate: true,
    },
  },
  methods: {
    handleFilterInput(inputVal) {
      this.inputValue = inputVal;
      let filterObj = this.filterObj;
      filterObj.value =
        this.filterInputType == 'number' ? Number(inputVal) : inputVal;
      this.$emit('filter-change');
    },
    handleBooleanChange(newValue) {
      let filterObj = this.filterObj;
      filterObj.value = newValue;
      this.$emit('filter-change');
    },
  },
};
</script>
<style scoped></style>
