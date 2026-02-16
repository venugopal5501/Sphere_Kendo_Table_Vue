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
          <label aria-hidden="true" :class="labelClass">{{ labelText }}</label>
          <date-time-picker
            v-if="isDateTime"
            ref="input"
            :value="value"
            :class="[inputClass, 'sb-table-datetimepicker']"
            :format="format"
            :disabled="disabled"
            :show="showDatetimePicker"
            :popup-settings="{ popupClass: 'table-filter-date-picker' }"
            @change="handleDateChange"
            @focus.stop="handlePickerFocus"
            @blur="handlePickerBlur"
            @iconclick="handleDatetimeIconClick"
          />
          <date-picker
            v-else
            ref="input"
            :value="value"
            :class="inputClass"
            :format="format"
            :disabled="disabled"
            :popup-settings="{ popupClass: 'table-filter-date-picker' }"
            @change="handleDateChange"
            @focus.stop="handlePickerFocus"
            @blur="handlePickerBlur"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { DatePicker, DateTimePicker } from '@progress/kendo-vue-dateinputs';
import { formatDate } from '@progress/kendo-intl';

export default {
  name: 'DateInput',
  components: {
    DatePicker,
    DateTimePicker,
  },
  props: {
    format: {
      type: String,
      required: true,
    },
    // from parent ColumnFilter.filterOperator.label
    label: {
      type: String,
      required: true,
    },
    // disable the inputs if there are no items
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      value: null,
      isFocused: false,
      labelText: 'Search',
      labelClass: 'v-label theme--light',
      inputClass: '',
      showDatetimePicker: false,
      /**
       * Non-reactive props:
       *  - isDateTime {Boolean} format requires date + time
       */
    };
  },
  created() {
    /**
     * - Determine if we should use DatePicker or DateTimePicker component
     *   based on format
     * - check if the format contains any time expression characters
     * - https://github.com/telerik/kendo-intl/blob/develop/docs/date-parsing/index.md
     */
    this.isDateTime = /H|m|s|S|X/.test(this.format);
  },
  mounted() {
    /**
     * - We need to remove the annoying title tooltip from the calendar btn
     * - Usually it's bad practice to traverse the DOM and update elements but
     *   in this case, the alternative is to create an entirely different
     *   button component and pass that into the DatePicker slot which becomes
     *   a mess.
     * - So instead, we will find the calendar button and remove the title
     *   manually
     */
    this.$refs.input.$el.children[1].removeAttribute('title');
  },
  methods: {
    /**
     * - DatePicker or DateTimePicker change event
     * @param {DatePickerChangeEvent} event
     * https://www.telerik.com/kendo-vue-ui/components/dateinputs/api/DatePickerChangeEvent/
     */
    // eslint-disable-next-line complexity
    handleDateChange(event) {
      // if we are clearing the event, do nothing
      if (!event.value) return;
      // Updating `value` prop with selected value
      this.value = event.value;
      if (this.isDateTime && !this.showDatetimePicker) {
        if (this.checkValidDateTime(event)) return true;
      } else {
        // checking for valid date with 4 digits
        if (event.value.getFullYear().toString().length != 4) return;
      }
      // emit the call to set the filter
      this.$emit(
        'set-filters',
        // apply date format
        new Date(formatDate(new Date(event.value), this.format))
      );
      if (this.isDateTime) this.hideDateTimePicker();
      // clear the input after the DOM updates
      setTimeout(() => {
        this.hideInput();
      }, 500);
    },
    checkValidDateTime(event) {
      // Check for valid minutes when format doesn't has seconds
      if (!this.format.split(' ')[1].includes('ss')) {
        if (event.value.getMinutes().toString().length != 2) return true;
      }
      // checking for valid time seconds with 2 digits
      else if (event.value.getSeconds().toString().length != 2) return true;
      return false;
    },
    handlePickerFocus() {
      this.isFocused = true;
      this.labelText = this.label;
      this.labelClass = 'v-label v-label--active theme--light';
      this.inputClass = 'visible';
    },
    handlePickerBlur() {
      this.hideInput();
    },
    hideInput() {
      this.isFocused = false;
      this.labelText = 'Search';
      this.labelClass = 'v-label theme--light';
      this.inputClass = '';
    },
    clearInput() {
      if (!this.value) this.value = new Date();
      this.$nextTick(() => {
        this.value = null;
      });
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
        this.hideInput();
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
  },
};
</script>

<style lang="scss">
.k-filter-v-date {
  .v-label {
    left: 4px;
    right: auto;
    position: absolute;
    z-index: 1;
    &.v-label--active {
      color: #053070 !important;
    }
  }
  .v-input__slot {
    background-color: #fff !important;
    border-color: #fff;
    min-width: calc(100% - 4px);
    padding: 0 !important;
  }
  .k-datepicker,
  .k-datetimepicker {
    border: none;
    box-shadow: none !important;
    .k-input-inner {
      height: 24px;
      padding: 8px 0 4px 4px !important;
      opacity: 0;
      transition: 300ms ease;
    }
    .k-input-button {
      background-color: transparent !important;
      border-left: none;
      color: rgba(0, 0, 0, 0.54);
      padding-right: 4px;
      &:hover {
        color: #0094fb;
      }
      .k-button-icon {
        font-size: 15px;
        margin-bottom: -2px;
      }
    }
    &.visible {
      .k-input-inner {
        opacity: 1;
      }
      .k-input-button {
        color: #1972d2;
      }
    }
  }
}
.k-datetime-container {
  .k-datetime-wrap {
    .k-datetime-footer.k-actions {
      margin-top: 0;
    }
  }
}
.table-filter-date-picker {
  margin-left: -17px !important;
  max-width: 100%;
  .k-datetime-wrap {
    max-width: 100%;
    .k-datetime-time-wrap,
    .k-datetime-calendar-wrap {
      max-width: 100%;
    }
  }
  &.k-calendar {
    max-width: 100%;
  }
}
</style>
