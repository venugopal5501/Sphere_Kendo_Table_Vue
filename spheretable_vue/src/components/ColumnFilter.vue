<template>
  <div>
    <div class="k-filter-container">
      <!-- dropdown menu-->
      <v-menu v-model="showDropdown" offset-y :close-on-content-click="false">
        <template v-slot:activator="{ on }">
          <!-- TODO: optimize this component after upgrading to vuetify 2 -->
          <v-btn
            flat
            icon
            color="link"
            class="k-filter-btn"
            :disabled="disabled"
            v-on="on"
            @mousedown="handleBtnMousedown"
          >
            <v-badge v-model="hasFiltersOrSorts" class="k-filter-badge">
              <template v-slot:badge>{{ filterSortCount }}</template>
              <v-icon :class="filterIconClass">filter_alt</v-icon>
            </v-badge>
          </v-btn>
        </template>
        <!----------------------------------------------------------------------
          Why use v-if statements instead of a dynamic <component>?
            - From my testing, we seem to get *slightly* better performance with
              the v-ifs instead of <component :is="nonReactiveComponentClass" />
            - This is likely caused by the more complex rendering logic of a
              dynamic <component> vs. the simplicity of a v-if  
          --------------------------------------------------------------------->

        <!-- text options list -->
        <text-filter-options v-if="isText" ref="filter-options" :sortable="column.sortable" @set-sort-dir="setSortDir"
          @set-filter-operator="setFilterOperator" @set-empty-filter="setEmptyFilter"
          @remove-empty-filter="removeEmptyFilter">
          <!-- clear all btn -->
          <v-btn flat color="error" class="k-filter-menu-item k-error-menu-item" @mousedown="clearColumnFilters">
            Clear All
          </v-btn>
        </text-filter-options>

        <!-- numeric options list -->
        <number-filter-options v-else-if="isNumeric" ref="filter-options" :sortable="column.sortable"
          @set-sort-dir="setSortDir" @set-filter-operator="setFilterOperator" @set-empty-filter="setEmptyFilter"
          @remove-empty-filter="removeEmptyFilter" @set-between="setBetween">
          <v-btn flat color="error" class="k-filter-menu-item k-error-menu-item" @mousedown="clearColumnFilters">
            Clear All
          </v-btn>
        </number-filter-options>

        <!-- boolean filter options -->
        <boolean-filter-options v-else-if="isBoolean" ref="filter-options" @remove-boolean-filter="removeBooleanFilter"
          @set-boolean-filter="setBooleanFilter" @set-sort-dir="setSortDir">
          <v-btn flat color="error" class="k-filter-menu-item k-error-menu-item" @mousedown="clearColumnFilters">
            Clear All
          </v-btn>
        </boolean-filter-options>

        <!-- date options list -->
        <date-filter-options v-else ref="filter-options" :sortable="column.sortable" :is-utc-time="isUtcTime"
          @set-sort-dir="setSortDir" @set-filter-operator="setFilterOperator" @set-empty-filter="setEmptyFilter"
          @remove-empty-filter="removeEmptyFilter" @set-between="setBetween" @add-date-filter="addDateFilter"
          @change-date-filter="changeDateFilter" @remove-date-filter="removeDateFilter">
          <v-btn flat color="error" class="k-filter-menu-item k-error-menu-item" @mousedown="clearColumnFilters">
            Clear All
          </v-btn>
        </date-filter-options>
      </v-menu>

      <!-- double text input -->
      <between-input
        v-if="isBetween"
        ref="between-input"
        :text-field-type="textFieldType"
        @add-between-filter="addBetweenFilter"
      />

      <!-- date input -->
      <date-input
        v-else-if="isDate"
        ref="input"
        :format="format"
        :label="filterOperator.label"
        :disabled="disabled"
        @set-filters="setFilters"
      />

      <!-- text input -->
      <v-text-field
        v-else
        ref="input"
        :label="label"
        :value="inputValue"
        :type="textFieldType"
        :disabled="disabled || isBoolean"
        :mask="inputMask"
        hide-details
        dense
        filled
        background-color="#fff"
        class="k-filter-v-input"
        append-icon="search"
        @input="handleFilterInput"
        @keydown="handleFilterKeydown"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @click:append="handleSearchClick"
      />
    </div>

    <!-- active filter chips -->
    <div style="border-top: 1px solid #dadada">
      <div
        v-if="showFilters"
        ref="chipcontainer"
        style="display: flex; flex-wrap: wrap"
      >
        <v-chip
          v-for="(activeFilter, index) in activeFilters"
          :key="index"
          ref="filterchip"
          class="k-active-filter-chip"
          close
          @input="handleRemoveFilterClick(activeFilter, index)"
        >
          <pre>{{ activeFilter.label }}</pre>
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script>
import BetweenInput from './BetweenInput.vue';
import DateFilterOptions from './DateFilterOptions.vue';
import DateInput from './DateInput.vue';
import NumberFilterOptions from './NumberFilterOptions.vue';
import TextFilterOptions from './TextFilterOptions.vue';
import { formatDate } from '@progress/kendo-intl';
import BooleanFilterOptions from './BooleanFilterOptions.vue';

export default {
  name: 'ColumnFilter',
  components: {
    BetweenInput,
    DateFilterOptions,
    DateInput,
    NumberFilterOptions,
    TextFilterOptions,
    BooleanFilterOptions,
  },
  // designed to work with kendo GridColumnProps
  // https://www.telerik.com/kendo-vue-ui/components/grid/api/GridColumnProps
  props: {
    field: {
      type: String,
      required: true,
    },
    filterType: {
      type: String, // date | numeric | text | time
      required: true,
    },
    columns: {
      // it's annoying that Kendo doesn't pass all the column props
      type: Array,
      required: false,
      default: null,
    },
    // toggle active filter display
    showFilters: {
      type: Boolean,
      required: false,
      default: true,
    },
    // disable the inputs if there are no items
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    serverSide: {
      type: Boolean,
      required: false,
      default: false,
    },
    isUtcTime: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      inputValue: '', // only used for 'text' and 'numeric' types
      showDropdown: false,
      sortDirection: '', // 'asc' | 'desc' | empty string
      activeFilters: [], // filters unique to this particular column
      filterOperator: null, // default first item in OPERATORS array, set on create
      /**
       * - Under normal circumstances, the following would be computed props,
       *   but for the sake of efficiency we shall use regular data
       */
      label: 'Search', // If input in focus or has value, display operator instead
      hasFiltersOrSorts: false, // filter icon and badge display
      filterSortCount: 0,
      isBetween: false,
      /**
       * Non-reactive data props (see created method):
       * - isText {Boolean}
       * - isNumeric {Boolean}
       * - isDate {Boolean}
       * - textFieldType {String} 'text' | 'number' | 'date'
       * - format {String} kendo DateTime format string, see:
       *   https://github.com/telerik/kendo-intl/blob/develop/docs/date-parsing/index.md
       */
      column: null,
      isText: false,
      isNumeric: false,
      isDate: false,
      isTime: false,
      isBoolean: false,
      textFieldType: 'text',
      format: null,
      inputMask: null,
    };
  },
  computed: {
    /**
     * Solid filter if the dropdown is displayed or any filters/sort applied
     * @returns {String}
     */
    filterIconClass() {
      return this.showDropdown || this.hasFiltersOrSorts
        ? ''
        : 'material-icons-outlined';
    },
  },
  created() {
    // set some initial variables
    this.setInitialVariables();
  },
  methods: {
    handleSearchClick(event) {
      event.key = 'Enter';
      if (this.inputValue.trim().length === 0) return;
      this.handleFilterKeydown(event);
      let searchField = event.target.closest(
        '.v-input__append-inner'
      ).previousElementSibling;
      let inputSearchEle = searchField.querySelector('input');
      this.$nextTick(() => {
        inputSearchEle.value = '';
        inputSearchEle.blur();
      });
    },
    setInitialVariables() {
      this.isText = this.isNumeric = this.isDate = this.isTime = false;
      // get the column from the array of columns
      this.column = this.columns.find((column) => column.field === this.field);
      console.log(this.column)
      // set some initial properties based on filter type
      if (this.filterType === 'text') {
        // default contains
        this.filterOperator = { label: 'Contains', value: 'contains' };
        // set non-reactive options component data prop to show options & input
        this.isText = true;
        // non-reactive v-text-input type prop
        this.textFieldType = 'text';
        // numeric
      } else if (this.filterType === 'numeric' || this.filterType === 'time') {
        // default is equal
        this.filterOperator = { label: 'Equal To', value: 'eq' };
        // create/set non-reactive
        this.isNumeric = true;
        this.textFieldType = 'number';
        // date or dateTime
      } else if (this.filterType === 'boolean') {
        // create/set non-reactive
        this.isBoolean = true;
      } else {
        // default is equal
        this.filterOperator = { label: 'Date is exactly', value: 'eq' };
        // set non-reactive props
        this.isDate = true;
        this.format = this.column.format
          ? this.column.format.match(/:(.*)\}/)[1]
          : '';
      }
      // if filter type is time
      if (this.filterType === 'time') {
        // set the mask (should be undefined if not type time)
        this.inputMask = '##:##:##';
        this.textFieldType = 'text';
        // set the isTime
        this.isTime = true;
      }
    },
    /**
     * - Called externally when column is reordered
     * - Reordering screws up all the columns, they need to be manually reinitialized
     * @param {Object} filter null || CompoundFilterDescriptor
     * @param {Array} sorts array of SortDescriptors
     */
    reinitFilters(filter, sorts, isAdvFilter = false) {
      let activeFilters = [];
      let isOrAdvFiltersApplied = false;
      // look for any filters pertinent to this column
      if (filter !== null) {
        activeFilters = this.getActiveFilters(filter, isAdvFilter);
        isOrAdvFiltersApplied = this.getIsOrFilterApplied(filter);
      }
      // look for any sort for this field
      const sort = sorts.find((sd) => sd.field === this.field);
      // get the sorts and filters total count
      const filterSortCount = isOrAdvFiltersApplied
        ? sort
          ? 1
          : 0
        : activeFilters.length + (sort ? 1 : 0);
      // if we have any filters or sorts, set the boolean variable
      this.hasFiltersOrSorts = filterSortCount > 0;
      // set the remaining variables
      this.filterSortCount = filterSortCount;
      this.activeFilters = isOrAdvFiltersApplied ? [] : activeFilters;
      if (sort) {
        this.sortDirection = sort.dir;
        this.$refs['filter-options'].setSort(sort.dir);
      }
    },
    /**
     * Checks if an 'or' logic filter is applied within the given filter structure.
     *
     * @param {Object} filter - The filter object which may contain nested filters.
     * @returns {boolean} - Returns true if any 'or' logic is found, otherwise false.
     */
    getIsOrFilterApplied(filter) {
      if (filter.logic == 'or') return true;
      else {
        for (let i = 0; i < filter.filters.length; i++) {
          if (filter.filters[i].hasOwnProperty('logic')) {
            let found = this.getIsOrFilterApplied(filter.filters[i]);
            if (found) return found;
          }
        }
        return false;
      }
    },
    getActiveFilters(filter, isAdvFilter) {
      let activeFilters = [];
      // eslint-disable-next-line complexity
      filter.filters.forEach((f) => {
        if (f.hasOwnProperty('logic') && f.hasOwnProperty('filters')) {
          if (f.logic == 'and') {
            activeFilters = [
              ...activeFilters,
              ...this.getActiveFilters(f, isAdvFilter),
            ];
          } else if (f.logic == 'or') {
            let label = [];
            f.filters.forEach((fl) => {
              if (fl.field == this.field) {
                label.push(fl.label);
              }
            });
            if (label.length > 0) {
              let subFilter = { field: this.field };
              subFilter.label = label.join(' or ');
              subFilter.groupFilters = f.filters;
              activeFilters.push(subFilter);
            }
          }
        } else {
          if (f.field == this.field) {
            f.isAdvFilter = isAdvFilter;
            if (f.label.length > 0 && !f.label.includes('Between'))
              activeFilters.push(f);
            else if (f.label.length > 0 && f.label.includes('Between')) {
              var t = f.label.split(' ');
              activeFilters.push({
                operator: 'between',
                value: [t[1], t[3]],
                label: `Between ${t[1]} and ${t[3]}`,
              });
            }
          }
        }
      });
      activeFilters = activeFilters.filter((f) => {
        if (this.filterType == 'text')
          return f.operator != 'isnull' && f.operator != 'isnotnull';
        else if (this.filterType == 'numeric')
          return f.operator != 'isempty' && f.operator != 'isnotempty';
        else return true;
      });
      return activeFilters;
    },
    // Reinit sort count on the filter options when only sort object is passed
    reinitSort(sortArr) {
      // look for any sort for this field
      const sort = sortArr.find((sd) => sd.field === this.field);
      // get the sort count
      const sortCount = sort ? 1 : 0;
      // set the sort variables
      this.filterSortCount = sortCount; // if we have any filters or sorts, set the boolean variable
      this.hasFiltersOrSorts = sortCount > 0;
      if (sort) {
        this.sortDirection = sort.dir;
        this.$refs['filter-options'].setSort(sort.dir);
      }
    },
    handleBtnMousedown() {
      // display filters if they are hidden
      this.$emit('set-show-filters');
      // add the window resize event listener from the mixin
      window.addEventListener('resize', this.handleWindowResize, false);
    },
    /**
     * Update the input value
     * @param {String} value
     */
    handleFilterInput(value) {
      this.inputValue =
        // convert our value to a date if necessary
        this.isDate ? new Date(value) : value;
    },
    /**
     * Update the input string value or add a new filter if the user hits the
     * enter key
     * @param {Event} event
     */
    handleFilterKeydown(event) {
      // if the user did not hit the enter key or there is no value, do nothing
      if (event.key !== 'Enter' || this.inputValue.trim().length === 0) {
        return false;
      }
      // set the value based on type
      let value = this.inputValue.trim();
      // if time type, make sure we have a full 6 digits
      if (this.isTime) {
        let timeMatch = value.match(/\d{6}/);
        if (!timeMatch) {
          return;
        }
        // deconstruct the value and convert to seconds
        value =
          parseInt(value.substring(0, 2)) * 3600 +
          parseInt(value.substring(2, 4)) * 60 +
          parseInt(value.substring(4, 6));
      } else if (this.isNumeric) {
        value = Number(value);
      }
      this.setFilters(value, event.target);
    },
    /**
     * - Add a new filter bubble chip
     * - Emit call to parent to add filters
     * @param {String|Number|Date} value
     * @param {DOMElement} targetElem default null
     */
    setFilters(value, targetElem = null) {
      // get the filter descriptor object
      const filterDescriptor = this.getFilterDescriptor(value);
      // add the filter to the parent
      this.$emit('add-filters', [filterDescriptor]);
      // add our local filter
      this.activeFilters.push(filterDescriptor);
      // set has filters variable
      this.setFiltersAndSortState();
      /**
       * - Wait for the input value to update before bluring.
       * - For some reason, single nextTick was unreliable here. There are
       *   race conditions causing console errors and/or update failures.
       */
      this.$nextTick(() => {
        // if this is not a date input
        if (this.isNumeric || this.isText) {
          // clear the input
          this.inputValue = '';
        }
        // if this is a date input
        if (this.isDate) this.$refs.input.clearInput();
        // if we have a target elem (i.e. this is not a date picker)
        if (targetElem) {
          // second tick wait until input clears because blur event also attempts data assignment
          this.$nextTick(() => {
            // blur from the input
            targetElem.blur();
          });
        }
      });
    },
    /**
     * Display the filter operator as the input label
     */
    handleInputFocus() {
      this.label = this.filterOperator.label;
    },
    /**
     * - Remove any leading or trailing whitespace on blur
     * - Determine our label
     * @param {Event} event
     */
    handleInputBlur(event) {
      const trimmedInput = event.target.value.trim();
      this.inputValue = trimmedInput;
      // if there is no text value
      if (trimmedInput.length === 0) {
        this.label = 'Search';
      }
    },
    /**
     * Remove a filter
     * @param {Object} filterDescriptor kendo FilterDescriptor
     */
    // eslint-disable-next-line complexity
    handleRemoveFilterClick(filterDescriptor, index) {
      let tempIndex = index;
      for (let a = 0; a <= index; a++) {
        if (
          this.activeFilters[a].operator === 'between' ||
          (!filterDescriptor.isAdvFilter && this.activeFilters[a].interval)
        )
          tempIndex++;
      }
      index = tempIndex;
      // if this is a 'between' filter
      if (filterDescriptor.operator === 'between') {
        // get the min and max (2 numbers in the value string)
        const [min, max] = filterDescriptor.value;
        // emit callback to remove multiple filters
        this.$emit(
          'remove-filters',
          [
            { field: this.field, operator: 'gte', value: min },
            { field: this.field, operator: 'lte', value: max },
          ],
          index
        );
        // if this is a composit filter
      } else if (
        !filterDescriptor.value &&
        filterDescriptor.value != 0 &&
        !filterDescriptor.isAdvFilter
      ) {
        // call the change empty filter instead
        this.$emit('change-empty-filter', this.field);
        // if this is a date filter
      } else if (filterDescriptor.interval) {
        // remove active date from filter options
        this.$refs['filter-options'].deactivateInterval();
        // call the remove date filter function
        return this.removeDateFilter(
          filterDescriptor.interval,
          index,
          filterDescriptor.isAdvFilter
        );
      } else {
        // remove the filter
        this.$emit('remove-filters', [filterDescriptor], index);
      }
      // remove active filter from our local component
      this.activeFilters = this.activeFilters.filter(
        (af) => af !== filterDescriptor
      );
      // if this is one of the filters that checks for emptiness
      if (!filterDescriptor.value) {
        if (typeof filterDescriptor.label == 'boolean') {
          this.$refs['filter-options'].clearBoolean();
        } else {
          // clear the empty selection in the filter options menu
          this.$refs['filter-options'].clearEmpties();
        }
      }
      // set the has filters and sorts
      this.setFiltersAndSortState();
    },
    /**
     * Set the filter operation based on FilterDescriptor options
     * https://www.telerik.com/kendo-vue-ui/components/dataquery/api/FilterDescriptor/
     * @param {Object} option {label, value}
     */
    setFilterOperator(option) {
      // set the filter operator
      this.filterOperator = option;
      // close the dropdown menu
      this.closeDropdownMenu();
      // focus on the input after the dropdown closes
      setTimeout(() => {
        this.isDate
          ? this.$refs.input.$el.querySelector('input').focus()
          : this.$refs.input.focus();
        // Scrolling table body to be in sync with headers scroll position
        this.$nextTick(() => {
          const headerScrollLeft = this.$refs.input.$el.closest(
            '.k-grid-header-wrap'
          ).scrollLeft;
          this.$refs.input.$el
            .closest('.k-grid')
            .querySelector('.k-grid-container .k-grid-content').scrollLeft =
            headerScrollLeft;
        });
      }, 380);
    },
    /**
     * Emitted from the NumberFilterOptions and DateFilterOptions inputs
     * @param {Boolean} isBetween
     */
    setBetween(isBetween) {
      // update the between property
      this.isBetween = isBetween;
      // close the dropdown
      this.closeDropdownMenu();
      // if we are displaying the between input component
      if (isBetween) {
        // focus on the input after the dropdown closes
        setTimeout(() => {
          this.$refs['between-input'].focusOnMin();
        }, 380);
      }
    },
    /**
     * - Emitted from DateFilterOptions
     * @param {FilterDescriptor} filterDescriptor
     */
    addDateFilter(filterDescriptor) {
      // add the field to the filter descriptor
      filterDescriptor.field = this.field;
      // create an upperbound filter descriptor as well
      const upperboundDescriptor = {
        ...filterDescriptor,
        value: filterDescriptor.upperbound,
        operator: 'lte',
        emptyPair: true,
      };
      // emit the callback to add the filter
      this.$emit('add-filters', [filterDescriptor, upperboundDescriptor]);
      // push it to the array
      this.activeFilters.push(filterDescriptor);
      // set the has filters and sorts, pass true arg to close the dropdown
      this.setFiltersAndSortState(true);
    },
    /**
     * - User already had a date interval selected but wants to update it
     * - E.g. last week -> last 30 days
     * - Emitted from DateFilterOptions
     * @param {String} oldInterval 'week' | 'month' | 'quarter' | 'year'
     * @param {FilterDescriptor} newFilterDescriptor
     */
    changeDateFilter(oldInterval, newFilterDescriptor) {
      // get the old filter descriptor from the active filters array
      const oldFilterDescriptor = this.activeFilters.find(
        (af) => af.interval === oldInterval
      );
      // get the old upperbound filter
      const oldUpperbound = {
        ...oldFilterDescriptor,
        value: oldFilterDescriptor.upperbound,
        operator: 'lte',
        emptyPair: true,
      };
      // add the field to the new filterDescriptor
      newFilterDescriptor.field = this.field;
      // get the new upperbound filter descriptor
      const newUpperbound = {
        ...newFilterDescriptor,
        value: newFilterDescriptor.upperbound,
        operator: 'lte',
        emptyPair: true,
      };
      // emit the callback
      this.$emit(
        'change-filters',
        [oldFilterDescriptor, oldUpperbound],
        [newFilterDescriptor, newUpperbound]
      );
      // get the active filters less the old filter
      const activeFilters = this.activeFilters.filter(
        (af) => af.interval !== oldInterval
      );
      // add the new filter descriptor
      activeFilters.push(newFilterDescriptor);
      // update the active filters
      this.activeFilters = activeFilters;
      // set the has filters and sorts, pass true arg to close the dropdown
      this.setFiltersAndSortState(true);
    },
    /**
     * - Emitted from DateFilterOptions
     * @param {String} interval 'week' | 'month' | 'quarter' | 'year'
     */
    removeDateFilter(interval, index = null, isAdvFilter = false) {
      // get the related filter descriptor
      const filterDescriptor = this.activeFilters.find(
        (af) => af.interval === interval
      );
      // generate the upperbound filter descriptor
      const upperboundDescriptor = !isAdvFilter
        ? {
          ...filterDescriptor,
          value: filterDescriptor.upperbound,
          operator: 'lte',
        }
        : null;
      // emit the callback
      this.$emit(
        'remove-filters',
        upperboundDescriptor
          ? [filterDescriptor, upperboundDescriptor]
          : [filterDescriptor],
        index
      );
      // remove the associated filter descriptor from the active filters
      this.activeFilters = this.activeFilters.filter(
        (af) => af.interval !== interval
      );
      // set the has filters and sorts, pass true arg to close the dropdown
      this.setFiltersAndSortState(true);
    },
    /**
     * Add a 'between' filter
     * @param {Number} min greater than or equal to
     * @param {Number} max less than or equal to
     */
    addBetweenFilter(min, max) {
      // add the filters to the parent
      this.$emit('add-filters', [
        {
          field: this.field,
          operator: 'gte',
          value: min,
          label: `Between ${min} and ${max}`,
        },
        {
          field: this.field,
          operator: 'lte',
          value: max,
          label: '',
        },
      ]);
      // push an object to the active filters array
      this.activeFilters.push({
        operator: 'between',
        value: [min, max],
        label: `Between ${min} and ${max}`,
      });
      // set has filters variable
      this.setFiltersAndSortState();
    },
    /**
     * @param {String} dir 'asc' | 'desc' | empty string
     */
    setSortDir(dir) {
      // if we are removing a sort
      if (dir === '') {
        this.$emit('remove-sort', this.field);
        // if another sort order is already set
      } else {
        // change the sort direction
        this.$emit('change-sort', this.field, dir);
      }
      // set the local sort direction
      this.sortDirection = dir;
      // set the has filters and sorts, pass true arg to close the dropdown
      this.setFiltersAndSortState(true);
    },
    /**
     * - Set an isempty/isnotempty filter
     * - These are handled differently because we want to look for empty OR null
     *   because sometimes empty strings are actually null values.
     * - i.e. if isnull || isempty, isnotnull || isnotempty
     * @param {Object} filter {label, operator}
     */
    setEmptyFilter(filter) {
      // create a new composite filter object
      const compositeFilter = {
        // only for non-empty and not-null strings do we need 'and' instead of 'or'
        field: this.field,
        operator: filter.operator,
        label: filter.label,
      };
      // look for any currently active empty filters that need be removed
      const activeEmpty = this.activeFilters.find(
        (af) => !af.value || af.value != 0
      );
      // if we already had an empty filter
      if (activeEmpty) {
        // remove the filter from the parent
        this.$emit('change-empty-filter', this.field, compositeFilter);
        // remove any previously active empty filters
        const activeFilters = this.activeFilters.filter(
          (af) => af.value || af.value == 0
        );
        activeFilters.push(filter);
        this.activeFilters = activeFilters;
      } else {
        // just push the new one onto the array
        this.activeFilters.push(filter);
        // emit add filter
        this.$emit('add-filters', [compositeFilter]);
      }
      // set the has filters and sorts
      this.setFiltersAndSortState(true);
    },
    /**
     * - Set an isempty/isnotempty filter
     * - These are handled differently because we want to look for empty OR null
     *   because sometimes empty strings are actually null values.
     * - i.e. if isnull || isempty, isnotnull || isnotempty
     * @param {Object} filter {label, operator}
     */
    setBooleanFilter(filter) {
      // create a new composite filter object
      const compositeFilter = {
        // only for non-empty and not-null strings do we need 'and' instead of 'or'
        logic: 'and',
        filters: [
          {
            field: this.field,
            operator: filter.operator,
            label: `Equal to ${filter.label}`,
            value: filter.label,
          },
        ],
      };
      // look for any currently active empty filters that need be removed
      const activeBoolean = this.activeFilters.find(
        (af) => af.label == true || af.label == false
      );
      // if we already had a boolean filter
      if (activeBoolean) {
        // remove the filter from the parent
        this.$emit('change-empty-filter', this.field, compositeFilter);
        // remove any previously active boolean filters
        const activeFilters = this.activeFilters.filter(
          (af) => ![true, false].includes(af.label)
        );
        activeFilters.push(filter);
        this.activeFilters = activeFilters;
      } else {
        // just push the new one onto the array
        this.activeFilters.push(filter);
        // emit add filter
        this.$emit('add-filters', [compositeFilter]);
      }
      // set the has filters and sorts
      this.setFiltersAndSortState(true);
    },
    removeBooleanFilter(operator) {
      // remove the filter from local state
      this.activeFilters = this.activeFilters.filter(
        (af) => af.label !== operator
      );
      // remove the filter from the table
      this.$emit('change-empty-filter', this.field);
      // set the has filters and sorts
      this.setFiltersAndSortState(true);
    },
    /**
     * Clear one of the empty filters when user click an empty filter row in the
     * filter options dropdown
     * @param {String} operator 'isempty' | 'isnotempty' | 'isnull' | 'isnotnull'
     */
    removeEmptyFilter(operator) {
      // remove the filter from local state
      this.activeFilters = this.activeFilters.filter(
        (af) => af.operator !== operator
      );
      // remove the filter from the table
      this.$emit('change-empty-filter', this.field);
      // set the has filters and sorts
      this.setFiltersAndSortState(true);
    },
    clearColumnFilterLabel() {
      // clear the sorts and filters from the child
      this.$refs['filter-options'].clearFilters();
      // set default operators
      this.$refs['filter-options'].setDefaultOperators();
      // reset the variables to default
      this.setInitialVariables();
      // remove all the active filters
      this.activeFilters = [];
      // clear the sort direction
      this.sortDirection = '';
    },
    /**
     * - clear all the sorts and filters for this column
     * - called internally or externally with shouldEmit param set to false
     * @param {Boolean} shouldEmit make callback to parent, default true
     */
    clearColumnFilters(shouldEmit = true) {
      this.clearColumnFilterLabel();
      // if events bubbling up (called internally)
      if (shouldEmit) {
        // clear the sorts filters from the parent
        this.$emit('clear-column-filters', this.field);
      }
      // set the has filters and sorts
      this.setFiltersAndSortState(true);
      // clear any values in the input field for text and numeric inputs
      this.inputValue = '';
      // clear any values in the input field for date input
      if (this.isDate) this.$refs.input.clearInput();
    },
    /**
     * Generates a kendo FilterDescriptor object (with bonus label property)
     * https://www.telerik.com/kendo-vue-ui/components/dataquery/api/FilterDescriptor/
     * @param {String} value text/calendar input value
     * @returns {Object}
     */
    getFilterDescriptor(value) {
      let valueText = value;
      if (this.isText) {
        valueText = `"${value}"`;
      } else if (this.isDate) {
        valueText = formatDate(value, this.format);
      } else if (this.isTime) {
        valueText = new Date(value * 1000).toISOString().slice(11, 19);
      }
      return {
        field: this.field,
        // capitalize the first letter
        label: `${this.filterOperator.label} ${valueText}`,
        operator: this.filterOperator.value,
        value,
      };
    },
    /**
     * Given an operator value, find and return the
     * @param {Object} activeFilter {<String>label, <String>operator}
     * @returns {String} label
     */
    getOperatorLabelByValue(activeFilter) {
      return activeFilter.label.capitalize() + activeFilter.operator === '';
    },
    /**
     * Set a timeout so the user has a chance to see the select animations
     */
    closeDropdownMenu() {
      // set a timeout to wait for the animation
      setTimeout(() => {
        // close the menu
        this.showDropdown = false;
      }, 350);
    },
    /**
     * Called externally from parent component
     * @param {String} dir 'asc' | 'desc'
     */
    setSort(dir) {
      this.sortDirection = dir;
      if (this.$refs['filter-options']) {
        this.$refs['filter-options'].setSort(dir);
      }
      // set the has filters and sorts
      this.setFiltersAndSortState();
    },
    /**
     * - Under normal circumstances this logic takes place inside computed
     *   properties but to improve perfomance, we only call the logic on an
     *   as-needed basis.
     * @param {Boolean} closeDropdownMenu
     */
    setFiltersAndSortState(closeDropdownMenu = false) {
      // close the dropdown menu if requested
      if (closeDropdownMenu) this.closeDropdownMenu();
      // wait for next tick to sell all these would-be computed properties
      this.$nextTick(() => {
        // set the has filters and sort states
        const hasFilters = this.activeFilters.length > 0;
        const isSorted = this.sortDirection.length > 0;
        this.hasFiltersOrSorts = hasFilters || isSorted;
        // set the count
        let filterSortCount = isSorted ? 1 : 0;
        this.filterSortCount = filterSortCount + this.activeFilters.length;
        // wait until the filter chips have mounted
        if (hasFilters) {
          this.$nextTick(() => {
            // get the width of parent
            const containerWidth = this.$refs.chipcontainer.offsetWidth - 8;
            // get the width of the last chip
            const lastChipWidth =
              this.$refs.filterchip[this.$refs.filterchip.length - 1].$el
                .offsetWidth;
            // if the last chip is larger than the container than the container
            if (lastChipWidth > containerWidth) {
              // emit call to parent to update the width of the column
              this.$emit('set-column-width', this.field, lastChipWidth + 8);
            }
          });
        }
      });
    },
  },
};
</script>

<style lang="scss">
.k-filter-container {
  display: flex;
  align-items: center;
  width: 100%;
  background: #e4eaf0;
}

.k-filter-btn {
  margin: 0;
  margin-right: 2px;
  position: relative;
  z-index: 1;
}
.k-filter-badge {
  .v-badge__badge {
    height: 16px;
    width: 16px;
    font-size: 9px;
    background-color: #4a687e !important;
    border-color: #4a687e !important;
    top: -3px;
    right: -5px;
  }
}
.k-filter-v-input {
  label {
    color: #a6a6a6 !important;
    font-size: 12px !important;
    top: 4px !important;
  }
  &.primary--text,
  &.v-input--is-label-active {
    .v-label {
      color: #053070 !important;
    }
  }
  &:not(.k-filter-v-date) {
    .v-input__slot {
      padding: 0 4px !important;
    }
  }
  .v-input__slot {
    max-width: calc(100% - 14px);
    min-height: 0px !important;
    border-radius: 2px;
    border-top-left-radius: 2px !important;
    border-top-right-radius: 2px !important;
    &::before,
    &::after {
      display: none;
    }
    .v-icon {
      cursor: pointer;
      &:hover {
        color: #0094fb;
      }
    }
  }
  input {
    color: #303030 !important;
    font-size: 12px;
    height: 12px;
    margin-top: 4px;
    padding: 8px 0 4px;
  }
  .v-input__append-inner {
    margin-top: 2.5px !important;
    margin-right: -4px;
  }
}
.k-active-filter-chip {
  background: #fff !important;
  font-size: 11px;
  border-radius: 9px;
  max-width: calc(100% - 8px);

  .v-chip__content {
    height: auto;
    padding: 2px 0px 1px 4px !important;
    white-space: initial;
    max-width: calc(100% - 4px);

    pre {
      text-wrap: unset;
      max-width: calc(100% - 24px);
      overflow-x: hidden;
      text-overflow: ellipsis;
    }

    .v-chip__close {
      width: 16px;
    }
  }

  .material-icons {
    color: #d51923 !important;
    font-family: 'Material Icons Outlined';
    font-size: 16px;
    margin-top: -0.5px;
  }
}
</style>
