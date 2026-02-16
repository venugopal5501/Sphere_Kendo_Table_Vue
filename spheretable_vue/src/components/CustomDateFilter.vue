<template>
  <div
    class="
      v-input
      k-filter-v-input k-filter-v-date
      v-text-field v-text-field--box v-text-field--enclosed
      v-input--hide-details
      theme--light
    "
  >
    <div class="v-input__control">
      <div class="v-input__slot">
        <div class="v-text-field__slot">
          <label
            aria-hidden="true"
            class="theme--light v-label v-label--active"
            >{{ filterLabel }}</label
          >
          <date-time-picker
            v-if="isDateTime"
            ref="dateInput"
            :value="value"
            :disabled="disabledInput"
            :show="showDatetimePicker"
            :required="!disabledInput ? true : false"
            @change="handleDateChange"
            @focus.stop
            @iconclick="handleDatetimeIconClick"
          />
          <date-picker
            v-else
            ref="dateInput"
            :value="value"
            :disabled="disabledInput"
            class="visible"
            :required="!disabledInput ? true : false"
            @change="handleDateChange"
            @focus.stop
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { DatePicker, DateTimePicker } from '@progress/kendo-vue-dateinputs';

const dateFilterOperatorText = {
  eq: 'Date is exactly',
  lt: 'Date is before',
  gt: 'Date is after',
  week: 'Last 7 days',
  month: 'Last 30 days',
  quarter: 'Last 3 months',
  year: 'Last year',
};
const disableInputOperators = ['week', 'month', 'quarter', 'year'];
export default {
  name: 'CustomDateFilter',
  components: {
    DatePicker,
    DateTimePicker,
  },
  props: {
    filterObj: {
      type: Object,
      default() {
        return {};
      },
    },
    dateFormat: {
      type: String,
      default() {
        return '';
      },
    },
  },
  data() {
    return {
      value: null,
      filterLabel: 'Search',
      disabledInput: false,
      showDatetimePicker: false,
      validDate: true,
    };
  },
  watch: {
    filterObj: {
      handler(newVal) {
        this.filterLabel =
          dateFilterOperatorText[newVal.operator] || newVal.operator;
        if (disableInputOperators.includes(newVal.operator)) {
          this.value = null;
          this.disabledInput = true;
        } else {
          this.disabledInput = false;
          if (this.$refs.dateInput) this.$refs.dateInput.focus();
        }
        this.validateDate();
      },
      immediate: true,
    },
  },
  created() {
    this.isDateTime = /H|m|s|S|X/.test(this.dateFormat);
  },
  mounted() {
    this.value = this.filterObj.value ? new Date(this.filterObj.value) : null;
  },
  methods: {
    handleDateChange(e) {
      this.value = e.value;
      let filterObj = this.filterObj;
      filterObj.value = e.value;
      this.$emit('filter-change', filterObj);
      this.validateDate();
    },
    setValue() {
      this.value =
        this.filterObj.originalOperator &&
        disableInputOperators.includes(this.filterObj.originalOperator)
          ? null
          : this.filterObj.value
          ? new Date(this.filterObj.value)
          : null;
    },
    handleDatetimeIconClick() {
      if (this.showDatetimePicker) {
        this.hideDateTimePicker();
      } else {
        this.showDatetimePicker = true;
        document.body.addEventListener(
          'click',
          this.lookForDatetimeContainer,
          true
        );
      }
    },
    lookForDatetimeContainer(event, element) {
      const elem = element || event.target;
      // if the user clicks inside the container of the datetime picker
      if (
        elem.className.includes('k-datetime-container') ||
        elem.className.includes('sb-table-datetimepicker')
      ) {
        // do nothing
        return false;
      }
      // if the user clicked outside of the datetime container
      if (elem.tagName == 'BODY' || elem.className.includes('k-time-cancel')) {
        // hide the datetime picker
        this.hideDateTimePicker();
        return false;
      }
      // recurse until we find the container of the body tag
      return this.lookForDatetimeContainer(event, elem.parentElement);
    },
    hideDateTimePicker() {
      setTimeout(() => {
        this.$el
          .querySelector('.sb-table-datetimepicker .k-input-inner')
          .blur();
      }, 0);
      this.showDatetimePicker = false;
      // remove the event listener
      document.body.removeEventListener(
        'click',
        this.lookForDatetimeContainer,
        true
      );
    },

    validateDate() {
      let date = new Date(this.value),
        year = date.getFullYear();
      this.validDate = this.disabledInput
        ? true
        : this.value != null && year.toString().length == 4;
      this.$emit('valid-date', this.validDate);
    },
  },
};
</script>
