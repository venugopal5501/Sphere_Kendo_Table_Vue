<template>
  <v-list subheader class="k-sort-filter-menu k-number-filter-menu">
    <div v-if="sortable">
      <v-subheader>Sorting:</v-subheader>
      <v-divider />

      <!-------------------------------------------------------------------------- 
    - See comments in TextFilterOptions, NumberFilterOptions for hardcoding
      explanation. 
    ------------------------------------------------------------------------->

      <!-- sort ascending-->
      <div>
        <v-btn
                    flat

          color="info"
          :class="sort.asc"
          @mousedown="handleSortClick('asc')"
        >
          <span style="display: flex; align-items: center">
            <span class="k-sort-icon-container">
              0-9
              <v-icon>straight</v-icon>
            </span>
            Ascending
          </span>
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- sort descending -->
      <div>
        <v-btn
                    flat

          color="info"
          :class="sort.desc"
          @mousedown="handleSortClick('desc')"
        >
          <span style="display: flex; align-items: center">
            <span class="k-sort-icon-container">
              9-0
              <v-icon class="inverted">straight</v-icon>
            </span>
            Descending
          </span>
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>
    </div>

    <v-subheader>Filter:</v-subheader>
    <v-divider />

    <span data-options="filter">
      <!-- date is exactly -->
      <div>
        <v-btn
                    flat

          color="info"
          :class="operator.eq"
          @mousedown="handleOperatorClick('Date is exactly', 'eq')"
        >
          Date is exactly
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- date is before -->
      <div>
        <v-btn
                    flat

          color="info"
          :class="operator.lte"
          @mousedown="handleOperatorClick('Date is before', 'lt')"
        >
          Date is before
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- date is after -->
      <div>
        <v-btn
                    flat

          color="info"
          :class="operator.gte"
          @mousedown="handleOperatorClick('Date is after', 'gt')"
        >
          Date is after
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>
      <!-- last 7 days -->
      <div>
        <v-btn
                    flat

          color="info"
          :class="intervals.week"
          @mousedown="handleDateClick('week', 'Last 7 days', isUtcTime)"
        >
          Last 7 days
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- last 30 days -->
      <div>
        <v-btn
                    flat

          color="info"
          :class="intervals.month"
          @mousedown="handleDateClick('month', 'Last 30 days', isUtcTime)"
        >
          Last 30 days
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- last 3 months -->
      <div>
        <v-btn
                    flat

          color="info"
          :class="intervals.quarter"
          @mousedown="handleDateClick('quarter', 'Last 3 months', isUtcTime)"
        >
          Last 3 months
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- last year -->
      <div>
        <v-btn
        flat
          color="info"
          :class="intervals.year"
          @mousedown="handleDateClick('year', 'Last year', isUtcTime)"
        >
          Last year
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>
    </span>

    <!-- custom range needs upgrade in another ticket -->
    <!-- <div><v-btn text color="info"
      :class="operator.between"
      @mousedown="handleOperatorClick('Between', 'between')"
    >
      Custom range
      <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
    </v-btn></div> -->

    <v-divider style="margin-top: 4px; margin-bottom: 2px" />
    <slot>
      <!-- clear all btn goes here -->
    </slot>
  </v-list>
</template>

<script>

import filterOptionsMixin from '../mixins/filterOptions.mixin';

export default {
  name: 'NumberFilterOptions',
  mixins: [filterOptionsMixin],
  props: {
    isUtcTime: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      operator: {
        eq: 'k-filter-menu-item active', // default active
        lte: 'k-filter-menu-item',
        gte: 'k-filter-menu-item',
        between: 'k-filter-menu-item',
      },
      intervals: {
        week: 'k-filter-menu-item',
        month: 'k-filter-menu-item',
        quarter: 'k-filter-menu-item',
        year: 'k-filter-menu-item',
      },
      activeInterval: null, // {null|String} key of active this.intervals
    };
  },
  methods: {
    getNewOperatorObj() {
      return {
        eq: 'k-filter-menu-item',
        lte: 'k-filter-menu-item',
        gte: 'k-filter-menu-item',
        between: 'k-filter-menu-item',
      };
    },
    /**
     * - Create a FilterDescriptor object (+ label, interval) and pass it up to
     *   the parent component
     * @param {String} interval
     * @param {String} label
     */
    handleDateClick(interval, label, isUTC) {
      // update the interval class name first for the sake of performance
      this.$set(this.intervals, interval, 'k-filter-menu-item active');
      // if this interval is already active
      if (interval === this.activeInterval) {
        // emit callback to remove previous interval
        this.$emit('remove-date-filter', interval);
        // remove the date interval
        this.intervals = {
          week: 'k-filter-menu-item',
          month: 'k-filter-menu-item',
          quarter: 'k-filter-menu-item',
          year: 'k-filter-menu-item',
        };
        // nullify the active interval
        this.activeInterval = null;
        // if there is no active interval
      } else if (this.activeInterval === null) {
        // callback, send a freshly generated filter descriptor to the parent
        this.$emit(
          'add-date-filter',
          this.generateFilterDescriptor(interval, label, isUTC)
        );
        // update the active interval
        this.activeInterval = interval;
        // if there is already a different active interval
      } else {
        // emit callback to swap out the old for the new
        this.$emit(
          'change-date-filter',
          this.activeInterval,
          this.generateFilterDescriptor(interval, label, isUTC)
        );
        // update the old active interval class
        this.$set(this.intervals, this.activeInterval, 'k-filter-menu-item');
        // update the active interval
        this.activeInterval = interval;
      }
    },
    /**
     *
     * @param {String} interval
     * @param {Label} label
     */
    generateFilterDescriptor(interval, label, isUTC) {
      // set the value based on the interval
      let upperbound = new Date();
      let value = new Date(upperbound);
      if (isUTC) {
          let offset = new Date().getTimezoneOffset();
          upperbound = new Date(Date.now() + offset * 60 * 1000);
          value = new Date(upperbound);
      }
      switch (interval) {
        case 'week':
          value.setDate(value.getDate() - 7);
          break;
        case 'month':
          value.setDate(value.getDate() - 30);
          break;
        case 'quarter':
          value.setMonth(value.getMonth() - 3);
          break;
        case 'year':
          value.setFullYear(value.getFullYear() - 1);
          break;
      }
      // return a new filter descriptor object, add the upperbound
      return {
        label,
        value,
        operator: 'gte',
        interval,
        field: '', // field gets filled in by the parent component
        upperbound,
      };
    },
    /**
     * - Called externally when a date filter is deleted
     * - deactivate the class
     */
    deactivateInterval() {
      this.intervals = {
        week: 'k-filter-menu-item',
        month: 'k-filter-menu-item',
        quarter: 'k-filter-menu-item',
        year: 'k-filter-menu-item',
      };
      this.activeInterval = null;
    },
  },
};
</script>
