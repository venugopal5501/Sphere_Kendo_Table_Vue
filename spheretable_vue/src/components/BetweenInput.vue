<template>
  <div class="k-between-input-container">
    <!-- minimum -->
    <v-text-field
      ref="min-input"
      label="Min"
      :value="minValue"
      :type="inputType"
      hide-details
      dense
      box
      background-color="#fff"
      class="k-filter-v-input"
      @input="handleMinInput"
      @keydown="handleMinKeydown"
    />

    <!-- maximum -->
    <v-text-field
      ref="max-input"
      label="max"
      :value="maxValue"
      :type="inputType"
      :error="hasError"
      hide-details
      dense
      box
      background-color="#fff"
      class="k-filter-v-input"
      @input="handleMaxInput"
      @keydown="handleMaxKeydown"
    />
  </div>
</template>

<script>
export default {
  name: 'BetweenInput',
  props: {
    textFieldType: {
      // 'number' | 'date'
      type: String,
      required: true,
    },
  },
  data() {
    return {
      minValue: '', // {String}
      maxValue: '', // {String}
      // the below could be computed props
      hasError: false,
      /**
       * Non-reactive data props:
       * - inputType {String} derived from textfield type: 'number' | 'date'
       */
    };
  },
  created() {
    this.inputType = this.textFieldType;
  },
  methods: {
    handleMinInput(value) {
      // update the input value
      this.minValue = value;
    },
    handleMinKeydown(event) {
      // if the user hit the enter key and there is a min value
      if (event.key === 'Enter' && this.minValue.trim().length > 0) {
        // switch focus to the max input
        this.$refs['max-input'].focus();
      }
    },
    handleMaxInput(value) {
      // update the input value
      this.maxValue = value;
    },
    handleMaxKeydown(event) {
      console.log(this.maxValue);
      // remove error
      this.hasError = false;
      // if the user did not hit the enter key or there is no value, do nothing
      if (event.key !== 'Enter' || this.maxValue.trim().length === 0) {
        return false;
      }
      // if there is a min value
      if (this.minValue.trim().length > 0) {
        // if the max value is less than the min
        if (Number(this.maxValue) < Number(this.minValue)) {
          // wait for the next tick so we can change the current input value
          this.$nextTick(() => {
            // display error state and show the error tooltip
            this.hasError = true;
            // update the max value to the min
            this.maxValue = this.minValue;
          });
          // else if min is less than or equal to max
        } else {
          // emit the callback
          this.$emit(
            'add-between-filter',
            Number(this.minValue),
            Number(this.maxValue)
          );
          // clear the inputs
          this.minValue = '';
          this.maxValue = '';
          this.$refs['max-input'].blur();
        }
        // if there is no min value
      } else {
        // focus on the min input
        this.$refs['min-input'].focus();
      }
    },
    /**
     * called externally when user selects 'between' option
     */
    focusOnMin() {
      this.$refs['min-input'].focus();
    },
  },
};
</script>

<style lang="scss">
.k-between-input-container {
  display: flex;
  .k-filter-input {
    .v-input__slot {
      max-width: calc(50% - 12.5px);
    }
  }
}
</style>
