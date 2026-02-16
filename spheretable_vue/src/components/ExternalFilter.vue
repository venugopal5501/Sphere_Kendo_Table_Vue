<template>
  <div>
    <component
      :is="!notModal ? 'v-dialog' : 'div'"
      v-model="showFilterDialog"
      max-width="1200px"
      persistent
    >
      <v-card class="exteranl-filter-card" :class="moduleName">
        <v-card-text :class="{ 'not-modal': notModal }">
          <template v-if="!notModal">
            <p class="mb-0">Advanced Filters:</p>
            <v-divider class="mb-3" />
          </template>
          {{ selectedFilterText }}
          <v-form v-model="validForm">
            <kFilter
              :fields="columnFields"
              :value="filter"
              :default-group-filter="defaultGroupFilter"
              @change="onFilterChange"
            >
              <template v-slot:customDateFilter="{ props }">
                <custom-date-filter
                  ref="date-filter-input"
                  :filter-obj="props.filter"
                  not-modal
                  :date-format="
                    columnFields.find((f) => f.name == props.filter.field)
                      .format
                  "
                  @filter-change="filterApplied = false"
                  @valid-date="
                    (v) => {
                      validDateFilter = v;
                    }
                  "
                />
              </template>
              <template v-slot:customNumericFilter="{ props }">
                <custom-filter-input
                  :filter-obj="props.filter"
                  not-modal
                  filter-input-type="number"
                  @filter-change="filterApplied = false"
                />
              </template>
              <template v-slot:customBooleanFilter="{ props }">
                <custom-filter-input
                  :filter-obj="props.filter"
                  not-modal
                  filter-input-type="boolean"
                  @filter-change="filterApplied = false"
                />
              </template>
              <template v-slot:customTextFilter="{ props }">
                <custom-filter-input
                  :filter-obj="props.filter"
                  not-modal
                  filter-input-type="text"
                  @filter-change="filterApplied = false"
                />
              </template>
            </kFilter>
            <v-layout wrap row class="my-2 filter-btns">
              <v-flex>
                <v-btn
                flat
                  small
                  class="c-pointer apply-btns"
                  :class="{ 'mt-0 ml-1': notModal }"
                  :disabled="
                    (filter.filters.length == 0 && !notModal) || !validFilter
                  "
                  @click="applyExternalFilters"
                >
                  <span v-if="notModal">Refresh Sample Data </span>
                  <span v-else>
                    <span v-if="filterApplied">Applied</span
                    ><span v-if="!filterApplied"> Apply </span>
                  </span>
                </v-btn>
              </v-flex>
              <v-flex v-if="!notModal">
                <v-btn
                  flat
                  small
                  outline
                  color="error"
                  class="c-pointer active sb_btn_solid"
                  @click="closeFilterDialog"
                >
                  <span class="c-pointer" color="error"> Cancel </span>
                </v-btn>
              </v-flex>
            </v-layout>
          </v-form>
        </v-card-text>
      </v-card>
    </component>
  </div>
</template>
<script>
import { Filter, Operators } from '@progress/kendo-vue-data-tools';
import { formatDate } from '@progress/kendo-intl';
import CustomDateFilter from './CustomDateFilter.vue';
import CustomFilterInput from './CustomExternalFilterInput.vue';
const filterOperatorLabels = {
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
const dateFilterOperators = [
  { text: 'Date is exactly', operator: 'eq' },
  { text: 'Date is before', operator: 'lt' },
  { text: 'Date is after', operator: 'gt' },
  { text: 'Last 7 days', operator: 'week' },
  { text: 'Last 30 days', operator: 'month' },
  { text: 'Last 3 months', operator: 'quarter' },
  { text: 'Last year', operator: 'year' },
];
const noInputFilterOpearators = [
  'isnull',
  'isnotnull',
  'isempty',
  'isnotempty',
  'week',
  'month',
  'quarter',
  'year',
];
export default {
  components: {
    kFilter: Filter,
    CustomDateFilter: CustomDateFilter,
    CustomFilterInput: CustomFilterInput,
  },
  props: {
    columns: {
      type: Array,
      required: false,
      default() {
        return [];
      },
    },
    gridFilter: {
      type: Object,
      default() {
        return { logic: 'and', filters: [] };
      },
    },
    moduleName: {
      type: String,
      default() {
        return '';
      },
    },
    notModal: {
      type: Boolean,
    },
  },
  data: function () {
    return {
      showFilterDialog: false,
      filtersStatus: 'Apply Filters',
      defaultGroupFilter: {
        logic: 'and',
        filters: [],
      },
      filter: {
        logic: 'and',
        filters: [],
      },
      filterApplied: false,
      appliedFilters: {
        logic: 'and',
        filters: [],
      },
      selectedFilterText: '',
      validDateFilter: true,
      validForm: false,
    };
  },
  computed: {
    columnFields() {
      let fields = [];
      if (this.columns) {
        // eslint-disable-next-line complexity
        this.columns.forEach((c) => {
          if (!c.hidden && !c.inivisible && c.field != 'selected') {
            let fieldObj = {
              name: c.field,
              label: c.title,
              filter: c.filter,
              format: c.format,
              operators:
                c.filter == 'date' ? dateFilterOperators : Operators[c.filter],
            };
            if (c.filter == 'date') {
              fieldObj.filterRender = 'customDateFilter';
            } else if (c.filter == 'numeric') {
              fieldObj.filterRender = 'customNumericFilter';
            } else if (c.filter == 'boolean') {
              fieldObj.filterRender = 'customBooleanFilter';
            } else {
              fieldObj.operators = fieldObj.operators.filter(function (
                operator
              ) {
                return (
                  operator.operator != 'isnull' &&
                  operator.operator != 'isnotnull'
                );
              });
              fieldObj.filterRender = 'customTextFilter';
            }
            fields.push(fieldObj);
          }
        });
      }
      return fields;
    },
    validFilter() {
      return this.validForm && this.validDateFilter;
    },
  },
  watch: {
    gridFilter: {
      handler(newValue) {
        this.filter = this.appliedFilters = { ...newValue };
        if (
          this.notModal ? this.filter.filters.length == 0 : !this.filter.filters
        ) {
          this.setDefaultFilterRow(this.notModal ? null : this.columnFields[0]);
          this.filterApplied = false;
        } else {
          this.filterApplied = true;
        }
      },
      immediate: true,
      deep: true,
    },
    // Show one filter row by default
    columnFields(newValue) {
      if (this.filter.filters.length == 0) {
        this.setDefaultFilterRow(this.notModal ? null : newValue[0]);
      }
    },
    filter: {
      handler: function () {
        if (this.notModal) {
          this.$emit('filter-update', this.filter);
        }
        this.selectedFilterText = this.generateSelectedFilterText(this.filter);
      },
      immediate: true,
      deep: true,
    },
    validFilter: {
      handler: function () {
        this.$emit('valid-filter', this.validFilter);
      },
      immediate: true,
    },
  },
  methods: {
    generateSelectedFilterText(filter = this.filter) {
      // instantiate string variable
      let filterText = '(';
      // loop through the filters
      for (let i = 0; i < filter.filters.length; i++) {
        let label = '';
        // extract the label or recurse to get an array of labels
        if (filter.filters[i].field) {
          label =
            '"' +
            this.getColumnTitle(filter.filters[i].field) +
            '" ' +
            (filter.filters[i].operator
              ? this.getFilterLabel(filter.filters[i])
              : this.generateSelectedFilterText(filter.filters[i]));
        } else {
          filterText += this.generateSelectedFilterText(filter.filters[i]);
        }
        // return the label
        filterText += `${label} ${filter.logic.toUpperCase()} `;
      }
      // remove the trailing logic statement, add a trailing paren and return
      return (
        filterText.slice(0, filterText.length - (filter.logic.length + 2)) +
        (filter.filters.length > 0 ? ')' : '')
      );
    },

    getColumnTitle(field) {
      return (this.notModal ? this.columns.length > 0 : this.columns)
        ? this.columns.filter((c) => c.field == field)[0].title
        : '';
    },
    setDefaultFilterRow(filterRowObj) {
      this.filter = { filters: [], logic: 'and' };
      if (filterRowObj != null) {
        this.filter.filters.push({
          field: filterRowObj.name,
          operator: filterRowObj.operators[0].operator,
          value: '',
        });
      }
    },
    setFilterLabel(filtersArr) {
      filtersArr.forEach((f) => {
        if (f.hasOwnProperty('logic') && f.hasOwnProperty('filters')) {
          this.setFilterLabel(f.filters);
        } else {
          //get column filter type
          let fieldObj = this.columnFields.filter(
            (cf) => cf.name == f.field
          )[0];
          let operator = f.originalOperator ? f.originalOperator : f.operator;
          // Check if the field is date type
          if (fieldObj.filter == 'date') {
            if (['week', 'month', 'quarter', 'year'].includes(operator)) {
              this.generateDateFilterDescriptor(f, operator);
            } else {
              f.originalOperator = null;
            }
          }
          f.label = this.getFilterLabel(f);
        }
      });
      return filtersArr;
    },
    // eslint-disable-next-line complexity
    getFilterLabel(filterObj) {
      let fieldObj = this.columnFields.filter(
        (cf) => cf.name == filterObj.field
      )[0];
      let filLabel = '';
      if (fieldObj && fieldObj.filter == 'date') {
        let operator =
          filterObj.operator == 'gte' || filterObj.operator == 'lte'
            ? filterObj.originalOperator == filterObj.operator
              ? filterObj.interval
              : filterObj.originalOperator || filterObj.interval
            : filterObj.operator;
        filLabel = dateFilterOperators.find(
          (dateOperator) => dateOperator.operator == operator
        ).text;
        if (noInputFilterOpearators.includes(operator)) {
          return `in ${filLabel}`;
        } else {
          filLabel = filLabel.substr(filLabel.indexOf(' ') + 1);
          let valueText = fieldObj.format
            ? formatDate(
                filterObj.value ? new Date(filterObj.value) : null,
                fieldObj.format.match(/:(.*)\}/)[1]
              )
            : formatDate(
                filterObj.value ? new Date(filterObj.value) : null,
                'MM/dd/yyyy'
              );
          return `${filLabel} ${valueText}`;
        }
      } else {
        filLabel = noInputFilterOpearators.includes(filterObj.operator)
          ? 'Is ' + filterOperatorLabels[filterObj.operator]
          : filterOperatorLabels[filterObj.operator] +
            ' ' +
            (filterObj.value || filterObj.value == false || filterObj.value == 0
              ? `"${filterObj.value}"`
              : '""');
        return filLabel;
      }
    },
    generateDateFilterDescriptor(filterObj, interval) {
      // set the value based on the interval
      let upperbound = new Date();
      let value = new Date(upperbound);
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
      //Add the upperbound for date intervals
      filterObj.value = value;
      filterObj.originalOperator = filterObj.operator;
      filterObj.operator = 'gte';
      filterObj.interval = interval;
      filterObj.upperbound = upperbound;
    },
    onFilterChange(event) {
      this.filterApplied = false;
      if (event.filter !== null) {
        this.filter = event.filter;
        this.addDefaultFilterForEmptyGroup(event.filter.filters);
        this.updateUI(event);
        this.$nextTick(() => {
          if (this.$refs['date-filter-input'] == undefined)
            this.validDateFilter = true;
        });
      } else {
        this.filter = this.defaultGroupFilter;
      }
    },
    updateUI(event = null, onDialogOpen = false) {
      // eslint-disable-next-line complexity
      setTimeout(() => {
        let mainElement = event
          ? event.target.$el
          : document.querySelector(`.exteranl-filter-card.${this.moduleName}`);
        let toolbars = mainElement.querySelectorAll(
          '.exteranl-filter-card .k-filter-container .k-filter-group-main ul li .k-filter-toolbar:not(.k-filter-group-main)'
        );
        for (let i = 0; i < toolbars.length; i++) {
          var name =
            toolbars[i].querySelectorAll('.k-filter-field .k-input-value-text')
              .length > 0
              ? toolbars[i].querySelectorAll(
                  '.k-filter-field .k-input-value-text'
                )[0].innerHTML
              : '';
          if (name != '') {
            var columnType = this.columnFields.find((c) => {
              return c.label == name;
            }).filter;
            var operator =
              toolbars[i].querySelectorAll('.k-filter-value .v-label').length >
              0
                ? toolbars[i].querySelectorAll('.k-filter-value .v-label')[0]
                    .innerHTML
                : ' ';
            if (
              (columnType == 'text' &&
                (operator.includes('Null') || operator.includes('Not null'))) ||
              (columnType == 'numeric' &&
                (operator.includes('Empty') || operator.includes('Not empty')))
            ) {
              toolbars[i]
                .getElementsByClassName('k-toolbar')[0]
                .setAttribute('disabled', true);
            }
          }
          let buttonElements =
            toolbars[i]
              .closest('.k-filter-lines')
              .previousSibling.querySelector(
                '.k-toolbar > .k-toolbar-item:first-child '
              ) ||
            toolbars[i]
              .closest('.k-filter-lines')
              .previousSibling.querySelector('.k-toolbar > span:first-child ');
          let logic = buttonElements.querySelector(
            '.k-button-group button.k-selected .k-button-text'
          ).innerHTML;
          toolbars[i].setAttribute('data-logic', logic);
        }
        let addIcons = mainElement.querySelectorAll(
          '.k-filter-container .k-filter-group-main .k-toolbar .k-button span.k-button-icon.k-i-filter-add-expression'
        );
        for (let j = 0; j < addIcons.length; j++) {
          addIcons[j]
            .closest('.k-toolbar')
            .classList.add('button-group-toolbar');
          addIcons[j]
            .closest('.k-toolbar')
            .closest('.k-filter-toolbar')
            .classList.add('button-group-filter-toolbar');
          if (
            addIcons[j]
              .closest('.k-toolbar')
              .closest('.k-filter-toolbar')
              .closest('.k-filter-item')
          )
            addIcons[j]
              .closest('.k-toolbar')
              .closest('.k-filter-toolbar')
              .closest('.k-filter-item')
              .classList.add('button-group-filter-item');
          let noOfFilterRows = 0;
          let lastAllGroups = false;
          let lis =
            addIcons[j].closest('.k-filter-toolbar').nextSibling.children;
          let childGroupHeight = 0,
            noOfChildGroups = 0;
          if (!lis) {
            lis = [];
          }
          for (noOfFilterRows; noOfFilterRows < lis.length; noOfFilterRows++) {
            if (lis[noOfFilterRows].querySelector('.k-filter-lines')) {
              if (noOfFilterRows == lis.length - 1) {
                break;
              } else {
                noOfChildGroups++;
                childGroupHeight +=
                  lis[noOfFilterRows].getBoundingClientRect().height *
                  (onDialogOpen ? 2 : 1);
              }
            } else {
              lastAllGroups = noOfChildGroups == 0;
            }
          }
          let buttonContainer =
            addIcons[j].closest('button').closest('.k-toolbar-item') ||
            addIcons[j].closest('button').closest('span');
          if (noOfFilterRows == noOfChildGroups) {
            buttonContainer.classList.add('no-filters');
          } else {
            buttonContainer.classList.remove('no-filters');
            if (lastAllGroups) childGroupHeight = 0;
            buttonContainer.style.top = `calc(${
              noOfFilterRows - noOfChildGroups
            }*76px + 13px + ${childGroupHeight}px)`;
          }
        }
      });
    },
    addDefaultFilterForEmptyGroup(filtersArr) {
      let filterRowObj = this.columnFields[0];
      filtersArr.forEach((f) => {
        if (f.hasOwnProperty('logic') && f.hasOwnProperty('filters')) {
          if (f.filters.length == 0) {
            f.filters.push({
              field: filterRowObj.name,
              operator: filterRowObj.operators[0].operator,
              value: '',
            });
          } else {
            this.addDefaultFilterForEmptyGroup(f.filters);
          }
        }
      });
    },
    applyExternalFilters() {
      let externalFilter = { ...this.filter };
      externalFilter.filters = this.setFilterLabel(externalFilter.filters);
      this.$emit('external-filters', externalFilter);
      this.filterApplied = true;
      this.showFilterDialog = false;
    },
    closeFilterDialog() {
      if (
        this.appliedFilters &&
        this.appliedFilters.filters &&
        this.appliedFilters.filters.length
      ) {
        this.filter = this.appliedFilters;
      } else {
        this.setDefaultFilterRow(this.columnFields[0]);
      }
      this.showFilterDialog = false;
    },
    openFilterDialog() {
      this.showFilterDialog = true;
      this.$nextTick(() => {
        if (this.$refs['date-filter-input'])
          this.$refs['date-filter-input'].setValue();
      });
      this.updateUI(null, true);
    },
  },
};
</script>
<style lang="scss">
.exteranl-filter-card {
  // Filters Options
  .k-filter-container {
    list-style: none;
    background: none;
    padding: 0;
    .k-filter-toolbar {
      padding: 15px 0;
    }
    //main li
    .k-filter-group-main {
      position: relative;
      //AND/OR
      .k-toolbar {
        background: #eef4f8;
        border: 0;
        overflow: visible;
        width: 425px;
        &.button-group-toolbar {
          background: none;
        }
        .k-button-group {
          button.k-button {
            background: none;
            border: 0;
            color: #222;
            padding: 0;
            &:focus {
              box-shadow: none !important;
            }
            &.k-selected {
              background: none;
              border: 0;
              span {
                font-weight: 600;
                &:before {
                  content: '\e837';
                  color: #0094fb;
                }
              }
            }
            span {
              vertical-align: middle;
              line-height: 1;
              &:before {
                content: '\e836';
                font-family: 'Material Icons';
                font-size: 18px;
                margin: 0 5px;
              }
            }
          }
        }
        .k-filter-value {
          .v-input__control {
            .v-input__slot {
              height: 28px;
              max-width: 100%;
            }
          }
          .input-boolean {
            .v-input__slot {
              background-color: #fff;
              .v-select__selections {
                padding-top: 0;
                .v-select__selection {
                  margin: 6px 0 0;
                }
              }
            }
            .v-text-field__details {
              display: none;
            }
          }
          .k-filter-v-input {
            input {
              height: 18px;
              margin-top: 6px;
              font-family: 'Nunito Sans', 'Work Sans', sans-serif;
            }
          }
        }
        // Buttons
        > span:nth-child(2):not(.k-filter-operator) {
          position: absolute;
          left: 442px;
          &.no-filters {
            left: 358px;
            top: 13px !important;
          }
        }
        > .k-toolbar-item:nth-child(2):not(.k-filter-operator) {
          position: absolute;
          left: 442px;
          &.no-filters {
            left: 376px;
            top: 13px !important;
          }
        }
        .k-filter-field {
          .k-filter-dropdown {
            background: #fff;
          }
        }
        .k-button {
          background: none;
          border: 0;
          z-index: 2;
          padding: 0;
          span.k-button-icon {
            font-size: 19px;
            font-family: 'Material Icons';
            &.k-i-filter-add-expression {
              color: #0094fb;
              border: solid 1px #0094fb;
              border-radius: 100%;
              line-height: initial;
              &::before {
                content: '\e145';
              }
            }
            &.k-i-filter-add-group {
              width: unset;
              &::before {
                content: 'New Group';
                font-family: 'Work sans';
                font-size: 14px;
                display: inline-block;
                padding: 5px 4px 5px 24px;
                color: #0094fb;
                border: 1px solid #0094fb;
                font-weight: 500;
              }
              &::after {
                content: '\e145';
                color: #0094fb;
                position: absolute;
                left: 3px;
                font-size: 18px;
              }
            }
            &:focus {
              border: 0;
              box-shadow: none;
            }
          }
          span.k-i-calendar {
            font-family: 'WebComponentsIcons';
          }
          &:focus {
            border: 0;
            box-shadow: none;
          }
        }
        .k-i-close {
          color: #f00;
          border: solid 1px #f00;
          border-radius: 100%;
          line-height: initial;
          &::before {
            content: '\e15b';
          }
        }
        &.button-group-toolbar {
          .k-i-close {
            width: unset;
            border: none;
            &::before {
              content: 'Remove Group';
              font-family: 'Work sans';
              font-size: 14px;
              display: inline-block;
              padding: 4px 4px 4px 25px;
              color: #f00;
              border: 1px solid #f00;
              font-weight: 500;
            }
            &::after {
              content: '\e15b';
              position: absolute;
              left: 4px;
              font-size: 18px;
            }
          }
          & > .k-toolbar-item {
            &:first-child {
              button {
                margin-right: 5px;
              }
            }
          }
        }
      }
      ul {
        position: relative;
        &:before {
          content: '';
          position: absolute;
          width: 10px;
          height: 1px;
          background-color: rgba(0, 0, 0, 0.08);
          top: -38px;
          left: 4px;
        }
        &.k-filter-lines {
          padding-left: 64px;
        }
        // Filter-item
        li {
          position: relative;
          &:before {
            content: '';
            position: absolute;
            width: 1px;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.08);
            top: -38px;
            left: -60px;
          }
          &:not(.button-group-filter-item) {
            & + .k-filter-item {
              & > .k-filter-toolbar::after {
                content: attr(data-logic);
                position: absolute;
                top: -10px;
              }
            }
          }
          .k-filter-toolbar {
            &:not(.k-filter-group-main) {
              &::before {
                content: '';
                position: absolute;
                width: 60px;
                height: 1px;
                background-color: rgba(0, 0, 0, 0.08);
                top: 37px;
                left: -60px;
              }
              &.button-group-filter-toolbar {
                &::before {
                  width: 64px;
                  top: 56px;
                }
                &::after {
                  content: '';
                }
              }
            }
          }
          // If for li last child vertical not required enable below code
          // &:last-child {
          //   &:before {
          //     height: 46px;
          //   }
          // }
        }
      }

      .k-filter-toolbar.button-group-filter-toolbar {
        & + .k-filter-lines {
          li.k-filter-item:only-child {
            .k-toolbar:not(.button-group-toolbar) {
              span:nth-child(4) button[title='Close'] {
                pointer-events: none;
                opacity: 0.5;
              }
              .k-toolbar-item:nth-child(4) button[title='Close'] {
                pointer-events: none;
                opacity: 0.5;
              }
            }
          }
        }
        &.k-filter-group-main {
          & > .button-group-toolbar {
            span:nth-child(4) button[title='Close'] {
              pointer-events: none;
              opacity: 0.5;
            }
            .k-toolbar-item:nth-child(4) button[title='Close'] {
              pointer-events: none;
              opacity: 0.5;
            }
          }
          & + .k-filter-group-main.k-filter-lines > .k-filter-item:first-child {
            & > .k-filter-toolbar > .k-toolbar {
              span:nth-child(4) button[title='Close'] {
                pointer-events: none;
                opacity: 0.5;
              }
              .k-toolbar-item:nth-child(4) button[title='Close'] {
                pointer-events: none;
                opacity: 0.5;
              }
            }
          }
        }
      }
    }
    .k-filter-lines {
      list-style: none;
      .k-filter-operator {
        width: 40px;
        text-align: center;
        .k-dropdownlist {
          text-indent: 9px;
          background: none;
          border: 0;
          &:before {
            content: '\ef4f';
            width: inherit;
            font-family: 'Material Icons';
            font-size: 20px;
            text-indent: 0;
            color: #0094fb;
            text-align: center;
          }
          .k-input-inner,
          .k-button-solid-base {
            display: none;
          }
          &.k-picker-solid:focus {
            box-shadow: none;
          }
        }
      }
    }
  }
  & > .not-modal {
    .k-filter-container {
      .k-filter-group-main {
        .k-filter-toolbar.button-group-filter-toolbar {
          & + .k-filter-lines {
            li.k-filter-item:only-child {
              .k-toolbar:not(.button-group-toolbar) {
                span:nth-child(4) button[title='Close'] {
                  pointer-events: unset;
                  opacity: unset;
                }
              }
              &.button-group-filter-item {
                .k-toolbar:not(.button-group-toolbar) {
                  .k-toolbar-item:nth-child(4) button[title='Close'] {
                    pointer-events: unset;
                    opacity: unset;
                  }
                }
              }
              &:not(.button-group-filter-item) {
                .k-toolbar:not(.button-group-toolbar) {
                  .k-toolbar-item:nth-child(4) button[title='Close'] {
                    pointer-events: none;
                    opacity: 0.5;
                  }
                }
              }
            }
          }
          &.k-filter-group-main {
            &
              + .k-filter-group-main.k-filter-lines
              > .k-filter-item:first-child {
              & > .k-filter-toolbar > .k-toolbar {
                .k-toolbar-item:nth-child(4) button[title='Close'] {
                  pointer-events: unset;
                  opacity: unset;
                }
              }
            }
          }
        }
      }
    }
  }
  // Filter bottom buttons
  .filter-btns {
    > .flex {
      flex: 0 0 auto;
      .v-btn {
        min-width: 100px;
        text-transform: capitalize;
      }
      .apply-btns {
        background: #0094fb;
        color: #fff !important;
        border-radius: 5px;
        &:disabled {
          background: #a6acb0;
        }
      }
    }
  }
}
</style>
