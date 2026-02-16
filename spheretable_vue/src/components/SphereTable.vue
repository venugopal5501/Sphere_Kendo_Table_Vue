<!-- eslint-disable max-lines -->
<template>
  <div
    class="sphere-table"
    :class="[tableType, soloFullHeightTable ? 'full-height-kendo-table' : '']"
  >
    <div :class="tableContainerClass">
      <div class="k-table-actions">
        <div v-if="tableHeaderDesc" class="table-header-table-desc">
          <p>
            {{ tableHeaderDesc }}
          </p>
        </div>
        <div class="table-header-actions justify-end align-center">
          <div
            v-if="tableSettings && tableSettings.customViews"
            class="mr-auto"
          >
            <custom-view-input
              v-if="showCv"
              ref="customViewInput"
              :columns="columnOverrides"
              :applied-filters-count="appliedFilterCount"
              :is-adv-filters-applied="isOrAdvFiltersApplied"
              :filter="filter"
              :sort="sort"
              :page-size="pageSize"
              :is-all-applied="isAllApplied"
              :skip="skip"
              :group="group"
              :loading="isLoading"
              :module-name="moduleName"
              :custom-views="customViews"
              :default-view="defaultView"
              @custom-view-selected="selectCustomView"
              @custom-view-added="customViewAdded"
            />
          </div>
          <slot
            name="aboveTable"
            :total-items-count="totalItemsCount"
            :extra-response-properties="extraResponseProperties"
            :filtered-items-count="filteredItemsCount"
          />
          <slot name="actionBtns" />
          <!-- show/hide columns button -->
          <slot name="saveReportBtns" :props="saveReportProps" />
          <column-management-btn
            v-if="isReorderable || columnToggleable"
            ref="column-management-btn"
            :columns="columnOverrides"
            :filters="filter"
            :group="group"
            :hide-reorder-and-lock="columnToggleable && tableType === 'simple'"
            :disabled="isDisabled || disableColumnMngt"
            :table-key="configurableTableKey"
            @show-all-columns="showAllColumns"
            @reset-default-columns="resetDefaultColumns"
            @toggle-column="toggleColumn"
            @move-column="moveColumn"
            @lock-column="lockColumn"
          />
          <!-- show alert message if we try to hide all columns -->
          <v-dialog v-model="openDialog" max-width="500px" persistent>
            <v-card>
              <v-card-text>
                <v-layout>
                  <v-flex> {{ alertMessage }} </v-flex>
                  <div>
                    <v-icon class="c-pointer" @click="openDialog = false">
                      close
                    </v-icon>
                  </div>
                </v-layout>
              </v-card-text>
            </v-card>
          </v-dialog>
          <!-- filter controls button -->
          <filter-control-btn
            ref="filter-control-btn"
            :disabled="isDisabled"
            :show-advanced-filter="
              tableType == 'granular' || tableType == 'simpleGranular' || advancedFilterable
            "
            :is-or-applied="isOrAdvFiltersApplied"
            :applied-filter-count="appliedFilterCount"
            @clear-all="clearAllSortsFiltersAndGrouping"
            @set-show-filters="setShowFilters"
            @open-adv-filter="openExternalFilters"
          />
          <!-- download button -->
          <download-btn
            v-if="!nonDownloadable"
            :filtered-items="filteredItems"
            :columns="columnOverrides"
            :name="name"
            :server-side="isServerSide"
            :api-endpoint="apiEndpoint"
            :filter="filter"
            :sort="sort"
            :disabled="isDisabled"
            @error="(error) => $emit('error', error)"
          />
        </div>
      </div>
      <div>
        <external-filter
          v-if="
            tableType == 'granular' ||
            tableType == 'simpleGranular' ||
            advancedFilterable
          "
          ref="external-filters"
          :columns="columnOverrides"
          :grid-filter="filter"
          :module-name="moduleName"
          @external-filters="applyExternalFilters"
        ></external-filter>
      </div>
      <skeleton-loader :loading="isLoading" type="table">
        <Grid
          ref="grid"
          :class="isDragging"
          :data-items="paginatedItems"
          :columns="columnOverrides"
          :filterable="true"
          :resizable="true"
          :loader="isUpdating"
          :reorderable="isReorderable"
          :groupable="isGroupable"
          :group="group"
          :style="{ cursor: dragging ? 'grabbing' : 'default' }"
          expand-field="expanded"
          pager="paginationSlotTemplate"
          :selected-field="selectedField"
          v-bind="$attrs"
          v-on="$listeners"
          @rowclick="onSelectionChange"
          @headerselectionchange="onHeaderSelectionChange"
          @columnreorder="columnReorder"
          @columnresize="onColumnResize"
          @expandchange="onExpandchange"
          @datastatechange="onDatastatechange"
        >
          <!-- If no records are available a message is displayed -->
          <Grid-no-records>
            <slot v-if="hasNoItems" name="noRecordsMsg">
              No records available
            </slot>
            <slot
              v-if="!hasNoItems && $slots.noFilteredRecordsMsg"
              name="noFilteredRecordsMsg"
            >
              No records available
            </slot>
          </Grid-no-records>

          <!-- Column title and lock button -->
          <template v-slot:headerTemplate="{ props }">
            <div>
              <column-title
                v-if="showFilterComponents"
                :ref="`column-title-${props.field}`"
                :field="props.field"
                :title="props.title"
                :disabled="isDisabled"
                :columns="columnOverrides"
                @change-sort="changeSort"
                @remove-sort="removeSort"
                @fit-column-content="fitColumnContent"
              />
              <slot :name="`below-header`" v-bind="{ props }" />
            </div>
          </template>

          <template v-slot:emptySlot />
          <!-- Re-order component to handle row dragging and dropping -->
          <template v-slot:rowReorder="{ props }">
            <re-order
              :data-item="props.dataItem"
              :field="props.field"
              :drop-position="dropPosition"
              :style="{ cursor: dragging ? 'grabbing' : 'grab' }"
              @dragHandler="dragHandler"
              @pressHandler="pressHandler"
              @releaseHandler="releaseHandler"
            />
          </template>
          <template v-slot:selectTemplate="{ props }">
            <td v-if="props.rowType == 'data'">
              <div v-if="props.dataItem.selectable != false">
                <input
                  v-model="props.dataItem.selected"
                  type="checkbox"
                  class="k-checkbox k-checkbox-md k-rounded-md"
                  @change.stop="onSelectionChange(props, true)"
                />
              </div>
              <v-icon
                v-else
                :class="props.dataItem.noSelectIconColor"
                :title="
                  props.dataItem.noSelectMessage ||
                  'This item is not selectable'
                "
              >
                {{ props.dataItem.noSelectIcon || SbIcons.status.warn }}
              </v-icon>
            </td>
            <div
              v-else-if="props.rowType == 'groupHeader'"
              class="group-select-checkbox"
              :style="`left: ${30 + props.level * 32}px`"
            >
              <input
                :id="`group-select-checkbox-level-${props.level}`"
                v-model="props.dataItem.selected"
                type="checkbox"
                class="k-checkbox k-checkbox-md k-rounded-md"
                @change.stop="onSelectionChange(props, true, true, props.level)"
              />
            </div>
          </template>

          <template v-slot:timeTemplate="{ props }">
            <td>
              {{
                new Date(props.dataItem[props.field] * 1000)
                  .toISOString()
                  .slice(11, 19)
              }}
            </td>
          </template>

          <!-- Column filter -->
          <template v-slot:filterSlotTemplate="{ props }">
            <column-filter
              v-if="showFilterComponents"
              :ref="`column-filter-${props.field}`"
              :field="props.field"
              :filter-type="props.filterType"
              :columns="columnOverrides"
              :show-filters="showFilters"
              :disabled="isDisabled"
              :server-side="isServerSide"
              :is-utc-time="isUtcTime"
              @add-filters="addFilters"
              @change-empty-filter="changeEmptyFilter"
              @change-filters="changeFilters"
              @remove-filters="removeFilters"
              @change-sort="changeSort"
              @remove-sort="removeSort"
              @clear-column-filters="clearColumnFilters"
              @set-show-filters="setShowFilters"
              @set-column-width="setColumnWidth"
            />
          </template>

          <!-- pagination -->
          <template v-slot:paginationSlotTemplate>
            <pagination-controls
              v-if="hasColumns"
              ref="pagination"
              :skip="skip"
              :total-items-count="totalItemsCount"
              :filtered-items-count="filteredItemsCount"
              :has-filters="hasFilters"
              :is-server-side="isServerSide"
              :disabled="disabled"
              :selected-items-count="
                ['actionable', 'granular'].includes(tableType)
                  ? selectedItemsCount
                  : 0
              "
              @set-page="setPage"
              @set-page-size="setPageSize"
            />
          </template>

          <!-- slot inheritance -->
          <slot v-for="slot in Object.keys($slots)" :slot="slot" :name="slot" />
          <template
            v-for="(_, slotName) in $scopedSlots"
            :slot="slotName"
            slot-scope="slotData"
          >
            <slot :name="slotName" v-bind="slotData" />
          </template>
        </grid>
        <!-- Provides a visual clue for the user while dragging an item. -->
        <drag-clue
          v-if="showDropHints"
          :top="top"
          :left="left"
          :data-item="activeItem"
          :show-content="showDragClueContent"
          :columns="columnOverrides"
        />
      </skeleton-loader>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
import { Grid, GridNoRecords } from '@progress/kendo-vue-grid';
import { process } from '@progress/kendo-data-query';
import SkeletonLoader from './SkeletonLoader.vue'
import ColumnFilter from './ColumnFilter.vue';
import ColumnTitle from './ColumnTitle.vue';
import ColumnManagementBtn from './ColumnManagementBtn.vue';
import DownloadBtn from './DownloadBtn.vue';
import PaginationControls from './PaginationControls.vue';
import FilterControlBtn from './FilterControlBtn.vue';
import '@/css/kendo-sphere-theme.scss'
import { TABLE_SETTINGS } from '@/config/table.config';
import { formatDate } from '@progress/kendo-intl';
import resizeColumnDoubleClickMixin from '@/mixins/resizeColumnDoubleClick.mixin';
import CustomViewInput from './CustomViewInput.vue';
import ExternalFilter from './ExternalFilter.vue';
// All the row-reorder stuff will be in this mixin
import rowReorder from '@/mixins/rowReorder.mixin';

const COMPARE = (a, b) => {
  if (a.orderIndex < b.orderIndex) {
    return -1;
  }
  if (a.orderIndex > b.orderIndex) {
    return 1;
  }
  return 0;
};

export default {
  name: 'SphereTable',
  components: {
    DownloadBtn,
    Grid,
    SkeletonLoader,
    ColumnFilter,
    ColumnTitle,
    PaginationControls,
    FilterControlBtn,
    GridNoRecords,
    ColumnManagementBtn,
    CustomViewInput,
    ExternalFilter,
  },
  mixins: [resizeColumnDoubleClickMixin, rowReorder],
  props: {
    // useful for file downloads
    name: {
      type: String,
      required: false,
      default: 'table',
    },
    savedReportId: {
      type: Number,
      required: false,
      default: null,
    },
    isUtcTime: {
      type: Boolean,
      default: false,
    },
    // see table.config file
    tableType: {
      type: String,
      required: false,
      validator(value) {
        // TABLE_SETTINGS contain 4 options
        return ['simple', 'actionable', 'granular', 'simpleGranular'].includes(
          value
        );
      },
      default: 'simple',
    },
    showCv: {
      type: Boolean,
      default: true,
    },
    /**
     * - Overwrite column properties by passing an array of kendo GridColumn
     *   objects
     * - Must have a matching field prop
     * https://www.telerik.com/kendo-vue-ui/components/grid/api/GridColumnProps/
     */
    columns: {
      type: Array,
      required: false,
      default() {
        return [];
      },
    },
    /**
     * Useful to make the table as client-side forcefully
     * irrespective of the no.of total records in the table
     */
    clientSide: {
      type: Boolean,
      required: false,
      default: false,
    },
    /**
     * Useful to make the table as server-side forcefully
     * irrespective of the no.of total records in the table
     */
    serverSide: {
      type: Boolean,
      required: false,
      default: false,
    },
    columnToggleable: {
      type: Boolean,
      required: false,
      default: false,
    },
    dataItems: {
      type: Array,
      required: false,
      default: null,
    },
    // TODO: convert all table API endpoints to GET requests, delete this prop
    requestMethod: {
      type: String,
      required: false,
      validator(value) {
        return ['get', 'post'].includes(value.toLowerCase());
      },
      default: 'get',
    },
    apiEndpoint: {
      type: String,
      required: false,
      default: null,
    },
    // displays skeleton loader
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
    /**
     * - Only applies to actionable tables
     * - single select mode instead of default multiselect
     */
    singleSelect: {
      type: Boolean,
      required: false,
      default: false,
    },
    /**
     * - Disable all buttons and grey out table rows except selected
     * - Useful if you are in some kind of edit mode for a single row
     */
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    highlightRow: {
      type: String,
      default: '',
    },
    updateDataItems: {
      type: Function,
      required: false,
      default: undefined,
    },
    configurableTableKey: {
      type: String,
      default: '',
    },
    nonDownloadable: {
      type: Boolean,
    },
    pageLength: {
      type: Number,
      default: 10,
    },
    // useful for custom views
    moduleName: {
      type: String,
      required: false,
      default: '',
    },
    disableColumnMngt: {
      type: Boolean,
      required: false,
      default: false,
    },
    soloFullHeightTable: {
      type: Boolean,
    },
    tableHeaderDesc: {
      type: String,
      required: false,
      default: undefined,
    },
    rowReorder: {
      type: Boolean,
    },
    advancedFilterable: {
      type: Boolean,
    },
    lastRefreshTriggered: {
      type: String,
      required: false,
      default: '',
    },
    showCustomViews: {
      type: Boolean,
      default: true,
    },
    isGroupable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      columnOverrides: null, // (Array)
      items: null, // (Array) populated from dataItems prop or fetched from API
      tableMaxSizeItems: null,
      tableMaxSize: null,
      filteredItems: null, // (Array) populated from items
      paginatedItems: null, // (Array) populated from filtered items
      totalItemsCount: 0,
      filteredItemsCount: 0,
      extraResponseProperties: {},
      tableSettings: null, // (Object) from TABLE_SETTINGS, set on creation
      // pagination
      skip: 0, // current page starting index
      pageSize:
        this.tableType == 'granular' || this.tableType == 'simpleGranular'
          ? 25
          : this.pageLength, // rows per page, default 10
      sort: [],
      group: [], // Array kendo GroupDescriptors
      // kendo CompositeFilterDescriptor
      // https://www.telerik.com/kendo-vue-ui/components/dataquery/api/CompositeFilterDescriptor/
      filter: null,
      showFilters: true, // allow user to toggle display of filter chips
      // boolean if any filters are applied
      // this could be a computed prop but we are avoiding those for performance
      hasFilters: false,
      hasColumns: true,
      // isLoading: true,
      isUpdating: false,
      reorderable: true,
      showFilterComponents: true,
      headerCheckbox: null,
      openDialog: false,
      alertMessage: 'You must select at least one column',
      hasNoItems: true,
      isServerSide: false,
      tableLimitKey: 'simpleTableMaxLimit',
      selectedField: undefined,
      isReorderable: false,
      appliedFilterCount: 0,
      isOrAdvFiltersApplied: false,
      isAllApplied: false,
      filteredColumnsFromRoute: [],
      selectedItemsCount: 0,
      headerSelectionChecked: false, // To store headerSelection for server-side table when pagination, filter applied
      customViews: [],
      defaultView: {},
      allUnselectedFilteredItemsIds: [], // To store the unchecked items in the table to persisit unselection when pagination, filter applied
      refreshTableCount: 0,
      customViewChoosen: false,
      defaultColumns: null,
      key: 0,
    };
  },
  /**
   * WARNING: Please minimize use of computed properties and watchers in this
   *  component. Tables handle large amounts of data and must be perfectly
   *  memory efficient. Computed properties and watchers use JavaScript
   *  Observers which continuously fire on every DOM event and use a significant
   *  amount of memory, especially when the observed data is complex.
   */
  computed: {
    isLoading() {
      return this.items === null || this.loading;
    },
    isDisabled() {
      return this.hasNoItems || this.disabled || this.loading;
    },
    tableContainerClass() {
      return `sphere-table-container${this.disabled ? ' disabled' : ''}`;
    },
    saveReportProps() {
      return {
        columns: this.columnOverrides,
        appliedFiltersCount: this.appliedFilterCount,
        isAdvFiltersApplied: this.isOrAdvFiltersApplied,
        filter: this.filter,
        sort: this.sort,
        pageSize: this.pageSize,
        isAllApplied: this.isAllApplied,
        skip: this.skip,
        group: this.group,
        customViews: this.customViews,
        defaultView: this.defaultView,
      };
    },
  },
  watch: {
    filter: {
      handler(newVal) {
        this.appliedFilterCount = 0;
        if (newVal) {
          this.calFilterCount(newVal.filters);
        }
        if (newVal === null) {
          this.clearAllSortsFiltersAndGrouping();
        }
      },
      deep: true,
    },
    paginatedItems: {
      handler(newItems) {
        this.$emit('updated-pagination', newItems);
      },
    },
  },
  // eslint-disable-next-line complexity
  async created() {
    window.addEventListener('resize', this.windowResizeHandler);
    // get the maximum table size
    await this.getTableMaxSize();
    if (TABLE_SETTINGS[this.tableType]) {
      // set the table settings based on table type
      this.tableSettings = TABLE_SETTINGS[this.tableType];
      // set the selected field class if table settings call for it
      this.selectedField = TABLE_SETTINGS[this.tableType].selectable
        ? 'selected'
        : undefined;
      // reorderable
      this.isReorderable = TABLE_SETTINGS[this.tableType].reorderable;
      // groupable
      this.isGroupable = TABLE_SETTINGS[this.tableType].groupable;
    }
    this.setParamsFromRoute();
  },
  // eslint-disable-next-line complexity
  async mounted() {
    if (!this.$store.getters.tableConfigsLoaded) {
      await this.$store.dispatch('LOAD_COLUMN_CONFIGS');
    }
    if (this.configurableTableKey && this.tableType === 'simple')
      this.columnToggleable = true;
    this.setParamsFromRoute();
    // set filtered columns applied from route
    if (this.filter && this.filter.filters.length) {
      this.filteredColumnsFromRoute = this.filter.filters.map(
        (filterObj) => filterObj.field
      );
    }
    // wait for the custom views to set
    if (this.moduleName && this.showCustomViews) await this.getCustomViews();
    // Check if custom views are available in the table settings
    let hasCustomViews = false;
    if (this.showCustomViews) {
      hasCustomViews = this.tableSettings && this.tableSettings.customViews;
    }

    // Refresh the table data
    await this.refreshTable();
    // Generate the initial custom view if custom views exist
    if (hasCustomViews) {
      const filteredColumns = this.columns.filter((v) => v.defaultSort);
      var defaultSort = [];
      if (filteredColumns.length > 0) {
        defaultSort = [
          {
            field: filteredColumns.length > 0 ? filteredColumns[0].field : '',
            dir:
              filteredColumns.length > 0 ? filteredColumns[0].defaultSort : '',
          },
        ];
      }
      this.$refs.customViewInput.generateInitialView(
        null,
        defaultSort,
        25,
        0,
        this.defaultColumns
      );
    }

    // Set the default custom view
    if (hasCustomViews && !this.$route.query.filter) {
      this.$refs.customViewInput.selectDefaultView(false); // false indicates not to emmit back
    }

    if (this.soloFullHeightTable) this.setTableMaxHeight();
    this.$nextTick(() => {
      this.resetAllColumnsWidth();
    });
    //get the header checkbox
    this.headerCheckboxSelector();
    // Get the grid content element
    const gridBody = document.getElementsByClassName('k-grid-content')[0];
    // Add event listeners to show and hide the drag clue content on mouseover and mouseout
    gridBody.addEventListener('mouseover', this.gridMouseover, false);
    gridBody.addEventListener('mouseout', this.gridMouseout, false);
  },
  destroyed() {
    window.removeEventListener('resize', this.windowResizeHandler);
  },
  unmounted() {
    const gridBody = document.getElementsByClassName('k-grid-content')[0];
    // Remove event listeners for mouseover and mouseout to stop showing/hiding the drag clue
    gridBody.removeEventListener('mouseover', this.gridMouseover, false);
    gridBody.removeEventListener('mouseout', this.gridMouseout, false);
  },
  methods: {
    windowResizeHandler(event) {
      // clear the resize timeout if there is one
      clearTimeout(this.resizeTimeout);
      // set a new timeout
      this.resizeTimeout = setTimeout(() => {
        if (event.isTrusted) this.resetAllColumnsWidth();
      }, 100);
    },
    calFilterCount(filtersArr) {
      filtersArr.forEach((f) => {
        if (f.hasOwnProperty('logic') && f.hasOwnProperty('filters')) {
          this.calFilterCount(f.filters);
        } else {
          this.appliedFilterCount += 1;
        }
      });
      this.columns.forEach((columns) => {
        if (
          columns.hasOwnProperty('hiddenFilter') &&
          this.appliedFilterCount > 0
        ) {
          this.appliedFilterCount -= 1;
        }
      });
    },
    headerCheckboxSelector() {
      if (this.$el.querySelector('.k-column-title .k-checkbox')) {
        this.headerCheckbox = this.$el.querySelector(
          '.k-column-title .k-checkbox'
        );
      }
    },
    setParamsFromRoute() {
      // set default data from the url route query or default
      let { page, pageSize, filter, sort, table } = this.$route.query;
      // if no target table mentioned in the query or matching name
      if (!table || table === this.name) {
        // set the params from the url query
        pageSize = this.pageSize = pageSize
          ? parseInt(pageSize)
          : this.pageSize;
        this.skip = page ? pageSize * parseInt(page) : this.skip;
        this.sort = sort ? JSON.parse(sort) : this.sort;
        if (filter) {
          this.filter = JSON.parse(filter);
          this.hasFilters = true;
        }
      }
    },
    // eslint-disable-next-line complexity
    async getTableMaxSize() {
      let maxSizeKey;
      if (this.tableType === 'simple') {
        this.tableLimitKey = 'simpleTableMaxLimit';
        maxSizeKey = 'SimpleTableMaxSize';
      } else if (this.tableType === 'actionable') {
        this.tableLimitKey = 'actionableTableMaxLimit';
        maxSizeKey = 'ActionableTableMaxSize';
      } else if (
        this.tableType === 'granular' ||
        this.tableType == 'simpleGranular'
      ) {
        this.tableLimitKey = 'granularTableMaxLimit';
        maxSizeKey = 'GranularTableMaxSize';
      }
      await this.$store.dispatch('LOAD_SITE_CONFIG_VALUES');
      // Set the max table size in the store if not set already
      const storeValue = this.$store.getters[this.tableLimitKey];
      if (storeValue != null) {
        this.tableMaxSize = storeValue;
      } else if (maxSizeKey) {
        const maxSizeValue =
          this.$store.state.columnConfig.siteConfigValues[maxSizeKey];
        this.tableMaxSize = maxSizeValue;
      }
    },
    /**
     * - Emitted from ColumnFilters component
     * - Accepts an array of Kendo FilterDescriptor objects
     * - i.e. [FilterDescriptor, CompositeFilterDescriptor, ...]
     * https://www.telerik.com/kendo-vue-ui/components/dataquery/api/FilterDescriptor/
     * https://www.telerik.com/kendo-vue-ui/components/dataquery/api/CompositeFilterDescriptor/
     * @param {Array} filterDescriptors array of FilterDescriptors (normal or composite)
     */
    addFilters(filterDescriptors) {
      // create a new filter object variable, pre-populate with new filter
      const filter = {
        logic: 'and',
        filters: [],
      };
      // if there are any existing filters
      if (this.filter) {
        // add them to the array of our new filter object
        filter.filters.push(...this.filter.filters);
      }
      filter.filters.push(...filterDescriptors);
      // update the filter
      this.updateFilter(filter);
      // show the filters
      this.setShowFilters();
    },
    /**
     * - Emitted from ColumnFilters component (via FilterOptions component)
     * - Swap out two composite filter descriptors to avoid 2 seperate updates
     * https://www.telerik.com/kendo-vue-ui/components/dataquery/api/CompositeFilterDescriptor/
     * @param {String} field column field
     * @param {Object} compositeFilterDescriptor default null
     */
    changeEmptyFilter(field, compositeFilterDescriptor = null) {
      let filtertype = this.columnOverrides.find(
        (c) => c.field == field
      ).filter;
      // eslint-disable-next-line complexity
      const filters = this.filter.filters.filter((f) => {
        if (filtertype == 'text') {
          return (
            (f.operator != 'isempty' && f.operator != 'isnotempty') ||
            f.field != field
          );
        } else if (filtertype == 'numeric') {
          return (
            (f.operator != 'isnull' && f.operator != 'isnotnull') ||
            f.field != field
          );
        } else {
          return f.logic === undefined || f.filters[0].field !== field;
        }
      });

      // created the new filter object
      let filter =
        filters.length || compositeFilterDescriptor !== null
          ? {
              logic: 'and',
              filters,
            }
          : null;
      // if we have a replacement filter
      if (compositeFilterDescriptor) {
        filter.filters.push(compositeFilterDescriptor);
      }
      // update the filter
      this.updateFilter(filter);
    },
    /**
     * - Replace a normal non-composite Filter Descriptor
     * https://www.telerik.com/kendo-vue-ui/components/dataquery/api/FilterDescriptor/
     * @param {Array} oldFilterDescriptors array of FilterDescriptors
     * @param {Array} newFilterDescriptors [FilterDescriptor]
     */
    changeFilters(oldFilterDescriptors, newFilterDescriptors = null) {
      // created the new filter object
      let filter = {
        logic: 'and',
        // remove the old filter from the array of filters
        filters: this.filter.filters.filter(
          (filterDescriptor) =>
            !oldFilterDescriptors.find(
              (oldFilterDescriptor) =>
                filterDescriptor.field === oldFilterDescriptor.field &&
                filterDescriptor.operator === oldFilterDescriptor.operator &&
                filterDescriptor.value === oldFilterDescriptor.value
            )
        ),
      };
      // if there is a new filter descriptor
      if (newFilterDescriptors) {
        // push that onto our array
        filter.filters.push(...newFilterDescriptors);
        // if there are no filters left
      } else if (!filter.filters.length) {
        // nullify our filter object
        filter = null;
      }
      // if we have no filters left, nulify the filter object
      filter = filter.filters.length > 0 ? filter : null;
      // update the filter
      this.updateFilter(filter);
    },
    /**
     * - Emitted from ColumnFilter component
     * https://www.telerik.com/kendo-vue-ui/components/dataquery/api/FilterDescriptor/
     * @param {Array} FilterDescriptors array of FilterDescriptor objects
     */
    removeFilters(filterDescriptors, index) {
      let filter = this.removeFromFilterObject(
        this.filter,
        filterDescriptors,
        index + 1
      );
      if (filter && filter.filters && filter.filters.length == 0) filter = null;
      // update the filter
      this.updateFilter(filter);
    },
    removeFromFilterObject(filter, filterDescriptors, index, fIndex = 0) {
      let fieldIndex = fIndex;
      // eslint-disable-next-line complexity
      filter.filters.forEach((f, i) => {
        if (f.hasOwnProperty('logic') && f.hasOwnProperty('filters')) {
          if (
            filterDescriptors.hasOwnProperty('groupFilters') &&
            filterDescriptors.groupFilters == f.groupFilters
          )
            filter.filters.splice(i, 1);
          else {
            filter.filters[i] = this.removeFromFilterObject(
              f,
              filterDescriptors,
              index,
              fieldIndex
            );
            if (filter.filters[i].filters.length == 0)
              filter.filters.splice(i, 1);
          }
        } else {
          if (f.field == filterDescriptors[0].field) {
            fieldIndex++;
            if (fieldIndex == index)
              filter.filters.splice(
                i - filterDescriptors.length + 1,
                filterDescriptors.length
              );
          }
        }
      });
      return filter;
    },
    /**
     * - Update the filters and return to the first page
     * https://www.telerik.com/kendo-vue-ui/components/dataquery/api/CompositeFilterDescriptor/
     * @param {CompositeFilterDescriptor} filter
     */
    updateFilter(filter) {
      // if we calculate load time to be greater than .5 seconds
      if (!this.isUpdating && this.needsTimeToLoad({ filter })) {
        this.isUpdating = true;
        return setTimeout(() => {
          this.updateFilter(filter);
        }, 1);
      }
      // reset skip to 0 and page to 1
      const skip = 0;
      const page = 1;
      // set the property
      this.filter = filter;
      this.hasFilters = filter !== null;
      this.skip = skip;
      this.page = page;
      // set the filtered items array
      this.setFilteredItems({ filter, skip, page });
    },
    /**
     * - Change the sort directed for a given field
     * - Emitted by ColumnTitle when clicking the sort button
     * - Emitted by ColumnFilter when a sort is activated but the user selects
     *   the opposite sort direction from the filter options dropdown
     * @param {String} field
     * @param {String} dir 'asc' | 'desc'
     * @param {String} updateComponent 'column-title' | 'column-filter'
     */
    changeSort(field, dir, updateComponent = 'column-title') {
      const sort = [
        { field, dir },
        ...this.sort.filter((s) => s.field !== field),
      ];
      // update the sort props
      this.setSort(sort, `${updateComponent}-${field}`, dir);
      this.$emit('sort-updated');
    },
    /**
     * - Emitted by ColumnTitle and ColumnFilter
     * @param {String} field to be removed
     * @param {String} updateComponent 'column-title' | 'column-filter'
     */
    removeSort(field, updateComponent = 'column-title') {
      // remove the designated sort object from the array
      const sort = this.sort.filter((s) => s.field !== field);
      // update the sort props
      this.setSort(sort, `${updateComponent}-${field}`, '');
      this.$emit('sort-updated');
      // Update the sort count
      this.$refs[`column-title-${field}`].setSortCount(null);
    },
    /**
     * https://www.telerik.com/kendo-vue-ui/components/dataquery/api/SortDescriptor/
     * @param {Array} sort array of SortDescriptor objects
     * @param {String} ref reference to component
     * @param {String} dir 'asc' | 'desc' | ''
     */
    setSort(sort, ref, dir) {
      // update the cooresponding component
      this.$refs[ref].setSort(dir);
      if (sort.length == 1)
        this.$refs[`column-title-${sort[0].field}`].setSortCount(null);
      else if (sort.length > 1) {
        sort.forEach((s, index) => {
          this.$refs[`column-title-${s.field}`].setSortCount(index + 1);
        });
      }
      // then update the prop
      this.sort = sort;
      // if we calculate load time to be greater than .5 seconds
      if (this.needsTimeToLoad({ sort })) {
        // display the loader
        this.isUpdating = true;
        // this.$nextTick(() => {
        return setTimeout(() => {
          // set the filtered items array
          this.setFilteredItems({ sort });
        }, 1);
      }
      // set the filtered items array
      this.setFilteredItems({ sort });
    },
    /**
     * - Clear all sorts, filters and grouping
     * - Emitted by FilterControlBtn
     * - Take advantage of 2-way data binding and update the column components
     *   manually. This avoids the need for watchers and computed properties.
     */
    clearAllSortsFiltersAndGrouping() {
      // get the default sort
      const sort = this.getDefaultSort();
      // clear grouping
      if (this.isGroupable) this.group = [];
      // nullify all filters
      this.filter = null;
      // set the filtered items array
      this.setFilteredItems({ filter: null, sort });
      /**
       * - Loop through the ColumnFilter and ColumnTitle refs.
       * - Call the clear methods on each component individually
       * - I know this seems inefficient but it is preferred to using watchers
       */
      this.columnOverrides.forEach((column) => {
        if (
          !column.hidden &&
          !column.invisible &&
          column.title != '' &&
          this.$refs[`column-title-${column.field}`] &&
          this.$refs[`column-filter-${column.field}`]
        ) {
          // clear the sorts from the column titles
          this.$refs[`column-title-${column.field}`].setSort('');
          this.$refs[`column-title-${column.field}`].setSortCount(null);
          // clear the sort
          this.$refs[`column-filter-${column.field}`].clearColumnFilters(false);
        }
      });
      // set the hasFilters data prop manually because it's not a computed prop
      this.hasFilters = false;
      // clear the sort array and set default sort
      this.sort = sort;
      // Clear Advanced Filters
      this.appliedFiltersCount = 0;
      // show the filters
      this.setShowFilters(this.filter == null, true);
    },
    /**
     * - Clear sorts and filters for a single column
     * - Emitted by ColumnFilter from the 'Clear all' menu option
     * - Also called by ClearSortsAndFilters when uses click 'Clear all' menu
     *   option from FilterControlBtn
     * @param {String} field
     */
    // eslint-disable-next-line complexity
    clearColumnFilters(field) {
      // if we don't have any filters or sorts do nothing
      if (this.sortDirection === '' && this.filter === null) return;
      // set title sort direction
      this.$refs[`column-title-${field}`].setSort('');
      this.$refs[`column-title-${field}`].setSortCount(null);
      // remove it from the sort array
      const sort = this.sort.filter((s) => s.field !== field);
      // if there are any existing filters
      let filter = null;
      if (this.filter !== null) {
        filter = this.removeAllFromFilterObject(this.filter, field);
        if (filter && filter.filters && filter.filters.length == 0)
          filter = null;
        // Clear Advanced Filters when no filters exist on table
        if (filter == null) this.appliedFiltersCount = 0;
      }
      // set the filtered items array
      this.setFilteredItems({ filter, sort });
      // update some local variables once everything is completed
      this.filter = filter;
      this.sort = sort;
      if (sort.length == 1) {
        this.$refs[`column-title-${sort[0].field}`].setSortCount(null);
      } else if (sort.length > 1) {
        sort.forEach((s, index) => {
          this.$refs[`column-title-${s.field}`].setSortCount(index + 1);
        });
      }
      // set the hasFilters data prop manually because it's not a computed prop
      this.hasFilters = filter !== null;
    },

    removeAllFromFilterObject(filter, field) {
      for (let i = filter.filters.length - 1; i >= 0; i--) {
        if (
          filter.filters[i].hasOwnProperty('logic') &&
          filter.filters[i].hasOwnProperty('filters')
        ) {
          filter.filters[i] = this.removeAllFromFilterObject(
            filter.filters[i],
            field
          );
          if (filter.filters[i].filters.length == 0)
            filter.filters.splice(i, 1);
        } else {
          if (filter.filters[i].field == field) {
            filter.filters.splice(i, 1);
          }
        }
      }
      return filter;
    },
    /**
     * - Emitted from FilterControlBtn, ColumnFilter or internally from
     *   this.addFilter();
     * - hide or show the filter options
     * - update the hide/show state in FilterControlBtn
     * @param {Boolean} show
     * @param {Boolean} updateHeaderBtn change FilterControlBtn visibility icon + text
     */
    setShowFilters(show = this.showFilters, updateHeaderBtn = true) {
      if (updateHeaderBtn && show != this.showFilters) {
        this.$refs['filter-control-btn'].showFilters();
      }
      this.showFilters = show;
    },
    sliceForPaginatedItems(skip, pageSize) {
      if (this.group && this.group.length > 0) {
        let processedData = process(this.filteredItems, {
          filter: this.filter,
          sort: this.sort,
          group: this.group,
          take: pageSize,
          skip: skip,
        });
        processedData.data = this.formatGroupedData(processedData.data);
        return processedData.data;
      } else {
        return this.filteredItems.slice(skip, skip + pageSize);
      }
    },
    formatServerSideGroupedData(data, level = 1, filter = []) {
      // eslint-disable-next-line complexity
      data = data.map((i) => {
        if (i.items.length > 0) {
          let column = this.columnOverrides.find((c) => c.field == i.field);
          if (column.filter == 'date') {
            i.value = formatDate(
              i.value,
              column.format.replace('{0:', '').replace('}', '')
            );
          }
          const matchedItem = this.extraResponseProperties.Data.find((d) => {
            d[i.field] = this.formatIfDate(d[i.field], column);
            return (
              d[i.field] === i.value &&
              filter.every((f) => {
                d[f.key] = this.formatIfDate(d[f.key], column);
                f.value = this.formatIfDate(f.value, column);
                return d[f.key] === f.value;
              })
            );
          });

          filter.push({ key: i.field, value: i.value });
          if (matchedItem) {
            i.value = `${String(i.value).replace(
              /(<([^>]+)>)/gi,
              ''
            )}(${matchedItem[level].toString()})`;
          }
        }
        if (
          i.items[0].hasOwnProperty('items') &&
          i.items[0].hasOwnProperty('field') &&
          i.items[0].hasOwnProperty('value') &&
          i.items[0].hasOwnProperty('aggregates')
        ) {
          level = level + 1;
          i.items = i.items.map((j) => {
            j = this.formatServerSideGroupedData(
              i.items.filter((k) => k == j),
              level,
              filter
            );
            filter.pop();
            return j[0];
          });
        }
        level = 1;
        filter = [];
        return i;
      });
      return data;
    },
    formatIfDate(value, column) {
      if (column.filter === 'date') {
        if (!value) return '';
        if (column.format == '{0:M/d/yyyy}') {
          value = new Date(value).toISOString().slice(0, 10);
        } else if (
          column.format == '{0:yyyy-MM-dd HH:mm:ss}' ||
          column.format == '{0:MM/dd/yyyy}'
        ) {
          value = new Date(value);
        }
        const formattedDate = formatDate(
          value,
          column.format.replace('{0:', '').replace('}', '')
        );
        return formattedDate;
      }
      return value;
    },
    formatGroupedData(data) {
      // eslint-disable-next-line complexity
      data = data.map((i) => {
        if (i.items.length > 0) {
          let column = this.columnOverrides.find((c) => c.field == i.field);
          if (column.filter == 'date') {
            i.value = formatDate(
              i.value,
              column.format.replace('{0:', '').replace('}', '')
            );
          }
          if (i.aggregates[i.field] && i.aggregates[i.field].count) {
            i.value = `${String(i.value).replace(/(<([^>]+)>)/gi, '')}(${
              i.aggregates[i.field].count
            })`;
          }
        }
        if (
          i.items[0].hasOwnProperty('items') &&
          i.items[0].hasOwnProperty('field') &&
          i.items[0].hasOwnProperty('value') &&
          i.items[0].hasOwnProperty('aggregates')
        ) {
          i.items = i.items.map((j) => {
            j = this.formatGroupedData(i.items.filter((k) => k == j));
            return j[0];
          });
        }
        return i;
      });
      return data;
    },
    selectGroupedItems(data, selected) {
      data.items = data.items.map((i) => {
        i.selected = selected;
        if (
          i.hasOwnProperty('items') &&
          i.hasOwnProperty('field') &&
          i.hasOwnProperty('value') &&
          i.hasOwnProperty('aggregates')
        ) {
          i = this.selectGroupedItems(i, selected);
        }
        return i;
      });
      return data;
    },
    // eslint-disable-next-line complexity
    areAllSubGroupsSelected(data) {
      let selected = true;
      for (let i = 0; i < data.length; i++) {
        if (
          data[i].hasOwnProperty('items') &&
          data[i].hasOwnProperty('field') &&
          data[i].hasOwnProperty('value') &&
          data[i].hasOwnProperty('aggregates')
        ) {
          selected = this.areAllSubGroupsSelected(data[i].items);
          if (!selected) break;
        } else {
          selected =
            !data[i].hasOwnProperty('selectable') || data[i].selectable
              ? data[i].selected
              : true;
          if (!selected) break;
        }
      }
      return selected;
    },
    updateGroupSelectionValue(data = this.paginatedItems) {
      if (this.group && this.group.length > 0) {
        data = data.map((i) => {
          if (
            i.hasOwnProperty('items') &&
            i.hasOwnProperty('field') &&
            i.hasOwnProperty('value') &&
            i.hasOwnProperty('aggregates')
          ) {
            if (typeof i.value == 'string')
              i.value = i.value.replace(/(<([^>]+)>)/gi, '');
            i.selected = this.areAllSubGroupsSelected(i.items);
            this.updateGroupSelectionValue(i.items);
          }
          return i;
        });
        this.paginatedItems = data;
      }
    },
    /**
     * @param {Number} page
     */
    // eslint-disable-next-line complexity
    async setPage(page, backward = false, jump = false) {
      // to get the new skip, multiply the page number by page size
      const skip = (page - 1) * this.pageSize;
      const maxSize = Math.max(this.tableMaxSize, this.pageSize);
      const oldPage =
        this.skip === 0
          ? 0
          : this.skip % maxSize == 0
          ? this.skip / maxSize
          : (this.skip - (this.skip % maxSize)) / maxSize;
      // set the skip
      this.skip = skip;
      const newPage =
        this.skip === 0
          ? 0
          : this.skip % maxSize == 0
          ? this.skip / maxSize
          : (this.skip - (this.skip % maxSize)) / maxSize;
      // keep track of server side success
      let serverSideSuccess = true;
      // if server side
      if (this.isServerSide) {
        // Below conditions are to achieve Hybrid Client/Server side approach
        // On the initial call we get the tableMaxSize no.of records,
        // so for tableMaxSize/PageSize no.of pages we can utilize these records without making a new call, this is called hybrid approach.
        if (
          this.pageSize > this.tableMaxSize || // When pageSize is greaterthan tableMaxSize then we have to always hit db and fetch new items
          (jump && oldPage != newPage) || // When the current page is around first or last page then we don't need to hit db
          page == 0 ||
          (page == 1 && this.pageSize == this.tableMaxSize) || // For the first page when pageSize is equal to tableMaxSize then we have to always hit db and fetch new items
          (page != 1 &&
            (backward ? page : page - 1) %
              ~~(this.tableMaxSize / this.pageSize) ==
              0) // Once we reach the end of tableMaxSizeItems then to move to new page we have to hit db and fetech next tableMaxSize no.of records
        ) {
          serverSideSuccess = await this.setFilteredItemsServerSide(
            { skip },
            true
          );
        } else {
          this.filteredItems = this.tableMaxSizeItems.slice(
            skip % (this.tableMaxSize - (this.tableMaxSize % this.pageSize)),
            (skip % (this.tableMaxSize - (this.tableMaxSize % this.pageSize))) +
              this.pageSize
          );
          if (this.group && this.group.length > 0) {
            let processedData = process(this.filteredItems, {
              group: this.group,
            });
            this.paginatedItems = this.formatServerSideGroupedData(
              processedData.data
            );
          } else {
            if (this.updateDataItems != undefined) {
              this.filteredItems = this.updateDataItems(this.filteredItems);
            }
            this.paginatedItems = this.filteredItems;
          }
          serverSideSuccess = true;
        }
        // if client side
      } else {
        // slice up our filteredItems array to get the new paginatedItems array
        let paginatedItems = this.sliceForPaginatedItems(skip, this.pageSize);
        this.paginatedItems = paginatedItems;
      }
      if (serverSideSuccess) {
        this.$emit('pagination-updated', {
          page: page,
          rowsPerPage: this.pageSize,
        });
      }
      if (this.highlightRow) {
        this.$nextTick(() => {
          let col = this.highlightRow;
          this.highLightRowByColValue(col);
        });
      }
      // if this is a multi select table
      if (this.selectedField && this.headerCheckbox) {
        this.updateGroupSelectionValue();
        this.updateHeaderSelectionValue();
      }
      this.$nextTick(() => {
        this.$emit('table-updated');
      });
    },
    /**
     * @param {Number|String} pageSize 5, 10, 25... | 'all'
     */
    // eslint-disable-next-line complexity
    async setPageSize(pageSize, isAllApplied = false) {
      // check if 'all' option is applied or not in rows per page
      this.isAllApplied = isAllApplied;
      // set the page size data prop
      this.pageSize = this.pageLength = pageSize;
      // Maintain the current row index despite the page change to avoid disorienting the user
      const currPage = this.skip === 0 ? 1 : Math.floor(this.skip / pageSize);
      // calculate the skip property based on our new current page and size
      const skip = (currPage === 1 ? 0 : currPage) * pageSize;
      // set the skip
      this.skip = skip;
      // keep track of server side success
      let serverSideSuccess = true;
      // if server side
      if (this.isServerSide) {
        if (pageSize <= this.tableMaxSize) {
          var slicedItems = this.tableMaxSizeItems.slice(
            skip % this.tableMaxSize,
            (skip % this.tableMaxSize) + pageSize
          );
          if (this.group && this.group.length > 0) {
            let processedData = process(slicedItems, {
              group: this.group,
            });
            this.paginatedItems = this.formatServerSideGroupedData(
              processedData.data
            );
          } else {
            if (this.updateDataItems != undefined) {
              slicedItems = this.updateDataItems(slicedItems);
            }
            this.filteredItems = this.paginatedItems = slicedItems;
          }
        } else
          serverSideSuccess = await this.setFilteredItemsServerSide(
            {
              skip,
              pageSize,
            },
            true
          );
        // if client side
      } else {
        // set the filtered items
        this.paginatedItems = this.sliceForPaginatedItems(skip, pageSize);
        this.updateGroupSelectionValue();
      }
      // make a call down to the PaginationControls component to set new page
      this.$refs['pagination'].setPage(currPage === 1 ? 1 : currPage + 1);
      // if everything was successful
      if (serverSideSuccess) {
        // emit the pagination updated callback
        this.$emit('pagination-updated', {
          page: currPage,
          rowsPerPage: pageSize,
        });
        this.updateGroupSelectionValue();
        // HeaderSelection Updated when pagination update
        this.updateHeaderSelectionValue();
      }
      if (this.highlightRow) {
        this.$nextTick(() => {
          let col = this.highlightRow;
          this.highLightRowByColValue(col);
        });
      }
    },
    // Set selected value for all filteredItems
    setFilteredItemsSelected() {
      let selected =
        this.headerSelectionChecked ||
        this.columnOverrides[0].headerSelectionValue;

      // If header checkbox is checked once, select the filteredItems when paging, flter applied
      if (selected) {
        this.filteredItems = this.filteredItems.map((item) => {
          item.selected =
            !item.hasOwnProperty('selectable') || item.selectable
              ? selected
              : false;
          if (
            this.allUnselectedFilteredItemsIds.includes(item[this.selUniqueKey])
          )
            item.selected = false;
          return item;
        });
        let filteredItemsIds = this.filteredItems.map(
          (item) => item.id || item.Id || item.ID
        );
        this.items = this.items.map((item) => {
          if (filteredItemsIds.includes(item.id || item.Id || item.ID))
            return { ...item, selected };
          else return item;
        });
        // set the paginated items
        if (!this.isServerSide) {
          this.paginatedItems = this.sliceForPaginatedItems(
            this.skip,
            this.pageSize
          );
        } else {
          if (this.group && this.group.length > 0) {
            let processedData = process(this.filteredItems, {
              group: this.group,
            });
            this.paginatedItems = this.formatGroupedData(processedData.data);
          } else {
            this.paginatedItems = this.filteredItems;
          }
        }
      }
    },
    /**
     * - Update the width of a column if the filter chip is too large
     * - Emitted from ColumnFilter component
     * @param {String} field
     * @param {Number} width
     */
    setColumnWidth(field, width) {
      // find the index of our target column in the local array
      const targetIndex = this.columnOverrides.findIndex(
        (c) => c.field === field
      );
      // replace it with a copy but update the width
      this.columnOverrides.splice(targetIndex, 1, {
        ...this.columnOverrides[targetIndex],
        width,
      });
      this.$nextTick(() => {
        this.setHeadersTooltip();
      });
    },
    resetAllColumnsWidth() {
      let firstColumnField = '';
      if (this.columnOverrides) {
        let visiblecolumns = this.columnOverrides.filter(
          (column) =>
            !column.hidden &&
            !column.invisible &&
            !column.hasOwnProperty('resizable')
        );
        visiblecolumns.forEach((c, i) => {
          if (i == 0) firstColumnField = c.field;
          this.fitColumnContent(c.field);
        });
        // eslint-disable-next-line complexity
        this.$nextTick(() => {
          let tableFullWidth = this.$el
              .querySelector('.k-grid-table')
              .getBoundingClientRect().width,
            tableContainerWidth = this.$el
              .querySelector('.k-grid-table')
              .closest('div')
              .getBoundingClientRect().width;
          if (
            this.$el.querySelector('.k-grid-table').closest('.v-dialog') &&
            this.$el
              .querySelector('.k-grid-table')
              .closest('.v-dialog')
              .classList.contains('dialog-transition-enter')
          ) {
            tableFullWidth = tableFullWidth * 2;
            tableContainerWidth = tableContainerWidth * 2;
          }
          let scrollableWidth = tableFullWidth - tableContainerWidth;
          if (tableContainerWidth == 0) {
            if (this.$el.closest('.sb-tabs')) {
              tableContainerWidth = this.$el
                .closest('.sb-tabs')
                .querySelector('.k-grid-table')
                ? this.$el
                    .closest('.sb-tabs')
                    .querySelector('.k-grid-table')
                    .getBoundingClientRect().width
                : this.$el.closest('.sb-tabs').getBoundingClientRect().width;
            } else if (
              this.$el.closest('.v-dialog') &&
              this.$el
                .closest('.v-dialog')
                .classList.contains('v-dialog--active')
            ) {
              tableContainerWidth =
                this.$el.closest('.v-dialog').getBoundingClientRect().width -
                50;
            } else if (this.$el.closest('.skeleton-loader.loading'))
              tableContainerWidth =
                this.$el
                  .closest('.skeleton-loader.loading')
                  .getBoundingClientRect().width - 20;
          }
          if (scrollableWidth > 0) {
            let columnsWidthDiff = [];
            this.columnOverrides
              .filter(
                (column) =>
                  !column.hidden &&
                  !column.invisible &&
                  !column.hasOwnProperty('resizable')
              )
              .forEach((c) => {
                if (c.width > c.titleWidth)
                  columnsWidthDiff.push({
                    field: c.field,
                    width: c.width,
                    titleWidth: c.titleWidth,
                  });
              });
            columnsWidthDiff.sort((a, b) => b.width - a.width);
            if (columnsWidthDiff.length > 0) {
              let sumOfWidthDiff = 0;
              for (let i = 0; i < columnsWidthDiff.length; i++) {
                sumOfWidthDiff =
                  sumOfWidthDiff +
                  columnsWidthDiff[i].width -
                  columnsWidthDiff[i].titleWidth;

                if (sumOfWidthDiff < scrollableWidth) {
                  if (columnsWidthDiff[i].field == firstColumnField) {
                    if (columnsWidthDiff[i].width > tableContainerWidth)
                      this.columnOverrides.find(
                        (col) => col.field === columnsWidthDiff[i].field
                      ).width = Math.max(400, columnsWidthDiff[i].titleWidth);
                  } else
                    this.columnOverrides.find(
                      (col) => col.field === columnsWidthDiff[i].field
                    ).width = columnsWidthDiff[i].titleWidth;
                } else {
                  this.columnOverrides.find(
                    (col) => col.field === columnsWidthDiff[i].field
                  ).width =
                    columnsWidthDiff[i].titleWidth +
                    sumOfWidthDiff -
                    scrollableWidth -
                    1;
                  break;
                }
              }
            }
          } else {
            let sumOfColumnsWidth = this.columnOverrides
              .filter((column) => !column.hidden && !column.invisible)
              .reduce((a, b) => a + b.width, 0);
            let checkboxColumn = this.columnOverrides.find(
              (c) => c.field == 'selected'
            );
            if (checkboxColumn) sumOfColumnsWidth += checkboxColumn.width;
            let extraWidthForEachColumn =
              (tableContainerWidth - sumOfColumnsWidth) / visiblecolumns.length;
            if (extraWidthForEachColumn > 0)
              visiblecolumns.forEach(
                (c) => (c.width += extraWidthForEachColumn)
              );
          }
          this.setHeadersTooltip();
        });
      }
    },
    /**
     * User select a column by clicking the row or checkbox (actionable)
     * @param {Event} event
     * @param {Boolean} isCustomSelection user clicks select all checkbox
     */
    // eslint-disable-next-line complexity
    onSelectionChange(
      event,
      isCustomSelection = false,
      isGroupSelection = false
    ) {
      if (
        this.group &&
        this.group.length &&
        event.hasOwnProperty('event') &&
        event.event.target.classList.contains('k-reset')
      ) {
        event.event.stopPropagation();
        return;
      }
      // get the dataItem
      let dataItem = event.dataItem ? event.dataItem : event.event.dataItem;
      // Return if column is unselectable
      if (event.dataItem.selectable == false) {
        return;
      }
      // get the selection
      const selected = isCustomSelection
        ? dataItem.selected
        : !dataItem.selected;
      // if the singleSelect prop is set to true
      if (this.singleSelect) {
        // look for any other selected items
        const currentlySelected = this.items.find(
          (item) => item.selected && item.ID !== dataItem.ID
        );
        // if we find one
        if (currentlySelected) {
          // deselect it
          currentlySelected.selected = false;
        }
        // if the user selected a new one
        dataItem.selected = selected;
        this.paginatedItems.splice(0, 1, this.paginatedItems[0]);
        // multiselect
      } else {
        dataItem.selected = selected;
        // if user changed select all checkbox
        if (isCustomSelection) {
          // udpate the items
          this.items.forEach((item) => {
            if (
              (dataItem.Id && item.Id == dataItem.Id) ||
              (dataItem.id && item.id == dataItem.id) ||
              (dataItem.ID && item.ID == dataItem.ID)
            ) {
              item.selected = selected;
              return;
            }
          });
        }
        if (
          !this.singleSelect &&
          (this.tableType === 'actionable' || this.tableType === 'granular')
        ) {
          this.headerCheckboxSelector();
          if (
            this.isServerSide &&
            this.extraResponseProperties.FilteredItemsIds &&
            this.extraResponseProperties.FilteredItemsIds.length
          )
            this.setUnselectedIdsArray(selected, dataItem);
        }
        if (isGroupSelection) {
          if (this.group && this.group.length == 1) {
            let processedData = process(this.filteredItems, {
              group: this.group,
            });
            // eslint-disable-next-line complexity
            const matchedItem = function traverse(items) {
              for (let i of items) {
                if (
                  i.field === dataItem.field &&
                  i.value === dataItem.value.split('(')[0]
                ) {
                  return i;
                }
                if (i.items && i.field && i.value) {
                  const found = traverse.call(this, i.items);
                  if (found) return found;
                }
              }
              return null;
            }.call(this, processedData.data);
            dataItem = this.selectGroupedItems(matchedItem, selected);
          } else {
            dataItem = this.selectGroupedItems(dataItem, selected);
          }
        }
        if (this.selectedField && this.headerCheckbox) {
          this.updateHeaderSelectionValue();
        }
        this.updateGroupSelectionValue();
      }

      // gotta wait until the data is set before emitting the callback
      this.$nextTick(() => {
        this.setSelectedItemsCount();
      });
    },
    setUnselectedIdsArray(selected, selectedItem) {
      if (!selected) {
        this.allUnselectedFilteredItemsIds.push(
          selectedItem[this.selUniqueKey]
        );
      } else {
        let itemIndex = this.allUnselectedFilteredItemsIds.indexOf(
          selectedItem[this.selUniqueKey]
        );
        if (itemIndex != -1)
          this.allUnselectedFilteredItemsIds.splice(itemIndex, 1);
      }
    },
    /**
     * User click the "select all" checkbox
     * @param {Event} event
     */
    onHeaderSelectionChange(event) {
      const selected = event.event.target.checked;
      if (this.isServerSide)
        this.tableMaxSizeItems = this.tableMaxSizeItems.map((item) => {
          return !item.hasOwnProperty('selectable') || item.selectable
            ? { ...item, selected }
            : { ...item, selected: false };
        });
      this.filteredItems = this.filteredItems.map((item) => {
        return !item.hasOwnProperty('selectable') || item.selectable
          ? { ...item, selected }
          : { ...item, selected: false };
      });
      let filteredItemsIds = this.filteredItems.map(
        (item) => item.id || item.Id || item.ID
      );
      this.items = this.items.map((item) => {
        if (filteredItemsIds.includes(item.id || item.Id || item.ID))
          return { ...item, selected };
        else return item;
      });
      // set the paginated items
      if (!this.isServerSide) {
        this.paginatedItems = this.sliceForPaginatedItems(
          this.skip,
          this.pageSize
        );
      } else {
        this.headerSelectionChecked = selected;
        // Reset unselected-items array when header checkbox is checked
        if (selected) this.allUnselectedFilteredItemsIds = [];
        if (this.group && this.group.length > 0) {
          let processedData = process(this.filteredItems, {
            group: this.group,
          });
          this.paginatedItems = this.formatGroupedData(processedData.data);
        } else {
          this.paginatedItems = this.filteredItems;
        }
      }
      this.columnOverrides[0].headerSelectionValue = selected;
      // gotta wait until the data is set before emitting the callback
      if (!selected) {
        this.$nextTick(() => {
          this.selectedItemsCount = 0;
          // Reset unselectedFilteredItems when header checkbox is unchecked
          this.allUnselectedFilteredItemsIds = [];
        });
      }
      this.$nextTick(() => {
        this.setSelectedItemsCount();
      });
      this.updateGroupSelectionValue();
    },
    // Set Selected Items count when table is serverside
    setSelectedItemsCount() {
      let selectedFilteredItems = [];
      if (this.filteredItems) {
        selectedFilteredItems = this.filteredItems.filter(
          (item) => item.selectable != false && item.selected
        );
      }
      if (
        this.headerCheckbox &&
        this.extraResponseProperties.FilteredItemsIds
      ) {
        // If headerSelection is checked once
        if (this.headerSelectionChecked) {
          let allFilteredItemsIds =
            this.extraResponseProperties.FilteredItemsIds;

          if (this.headerCheckbox.checked) {
            this.selectedItemsCount = allFilteredItemsIds.length;
            selectedFilteredItems = allFilteredItemsIds;
          } else {
            selectedFilteredItems = allFilteredItemsIds.filter((item) => {
              if (
                !this.allUnselectedFilteredItemsIds.includes(
                  item[this.selUniqueKey]
                )
              )
                return item;
            });
          }
        }
      }
      this.selectedItemsCount = selectedFilteredItems.length;
      // emit the selected array
      this.$emit('selectionchange', selectedFilteredItems);
    },
    /**
     * Updated the select all checkbox value in the table column header
     */
    // eslint-disable-next-line complexity
    updateHeaderSelectionValue() {
      let selectableFilterItemsLength = this.filteredItems.filter(
        (item) => !item.selectable
      ).length;
      // update the column overrides (select is always first value)
      this.columnOverrides[0].headerSelectionValue =
        this.filteredItems.length !== 0 &&
        this.filteredItems.some(
          (item) => item.selectable || !item.hasOwnProperty('selectable')
        ) &&
        this.filteredItems.findIndex(
          (item) =>
            (!item.selected && !item.hasOwnProperty('selectable')) ||
            ((item.selectable || !item.hasOwnProperty('selectable')) &&
              !item.selected)
        ) === -1;
      // Make header checkbox false for server-side table if few items were unchecked earlier
      if (this.isServerSide && this.allUnselectedFilteredItemsIds.length)
        this.columnOverrides[0].headerSelectionValue = false;
      this.headerCheckboxSelector();
      // update the header checkbox dom element
      if (this.headerCheckbox) {
        this.headerCheckbox.checked =
          this.pageSize !== selectableFilterItemsLength
            ? this.columnOverrides[0].headerSelectionValue
            : false;
        this.setServerSideHeaderCheckboxValue();
      }
    },
    // Set Headercheckbox for server side tables if it has all filtered items ids
    setServerSideHeaderCheckboxValue() {
      if (
        this.extraResponseProperties &&
        this.extraResponseProperties.FilteredItemsIds &&
        this.extraResponseProperties.FilteredItemsIds.length
      ) {
        this.headerCheckbox.checked =
          this.columnOverrides[0].headerSelectionValue;
      }
    },
    /**
     * - Called by ColumnManagementBtn
     * - Toggle on all columns at once
     */
    showAllColumns() {
      this.columnOverrides = this.columnOverrides.map((col) => {
        return {
          ...col,
          hidden:
            col.field == 'selected'
              ? col.hidden
              : col.invisible
              ? col.invisible
              : false,
        };
      });
      this.updateColumnFilterOrder(this.columnOverrides);
    },
    /**
     * - Called by ColumnManagementBtn
     * - Reassemble the columns to original state
     * - Callback updateColumns on ColumnManagmentBtn to refresh column states
     */
    resetDefaultColumns() {
      if (
        this.items.length > 0 &&
        this.items != null &&
        this.items != undefined
      ) {
        // reassemble the columns to original state
        const columnOverrides = this.getColumns(this.items);
        // update the column managemnet btn
        this.$refs['column-management-btn'].updateColumns(columnOverrides);
        // reset the columns
        this.columnOverrides = columnOverrides;
        this.updateColumnFilterOrder(columnOverrides);
        // reset the table to original state
        this.refreshTable();
      }
    },
    /**
     * Emitted by ColumnManagementBtn
     * @param {String} field
     * @param {Boolean} hidden
     */
    toggleColumn(field, hidden) {
      this.columnOverrides.find((col) => col.field === field).hidden = hidden;
      this.updateColumnFilterOrder(this.columnOverrides);
      if (
        this.columnOverrides.filter((col) => col.hidden == false).length <=
        (this.tableType == 'actionable' || this.tableType == 'granular' ? 1 : 0) // because actionable and granular tables will always have one visible column which is `selected` so it should be compared with 1
      ) {
        this.columnOverrides.find((col) => col.field === field).hidden =
          !hidden;
        this.openDialog = true;
      }
      this.resetAllColumnsWidth();
    },
    /**
     * Emitted from ColumnManagementBtn
     * @param {Integer} prev old index of moved item
     * @param {Integer} next new index of moved item
     */
    async moveColumn(oldIndex, newIndex) {
      // create a copy of the column overrides (to avoid a nextTick update)
      const columnOverrides = JSON.parse(JSON.stringify(this.columnOverrides));
      // get teh name of the field of the item that has been moved
      const movedField = columnOverrides.find(
        (col) => col.orderIndex === oldIndex
      ).field;
      // calculate the start and end points
      let a, b, x;
      if (oldIndex > newIndex) {
        a = newIndex;
        b = oldIndex + 1;
        x = 1;
      } else {
        a = oldIndex + 1;
        b = newIndex;
        x = -1;
      }
      // get columnOverrides within range
      const colRange = columnOverrides.filter(
        (col) => col.orderIndex >= a && col.orderIndex <= b
      );
      // update the orderIndex property of the items in range
      for (let i = 0; i < colRange.length; i++) {
        colRange[i].orderIndex = colRange[i].orderIndex + 1 * x;
      }
      // update the moved item
      columnOverrides.find((col) => col.field === movedField).orderIndex =
        newIndex;
      // sort
      columnOverrides.sort(COMPARE);
      // set the new columns
      this.columnOverrides = columnOverrides;
      this.updateColumnFilterOrder(columnOverrides);
    },
    /**
     * Kendo grid onColumnreorder
     * @param {Object} options
     *  - https://www.telerik.com/kendo-vue-ui/components/grid/api/GridColumnReorderEvent/
     */
    async columnReorder(options) {
      /**
       * - loop through the column by index from the prev to the next
       * - make sure we are not interrupting any columns that shall remain unorderable
       * */
      let unReorderableFound = false;
      const a = options.prev < options.next ? options.prev : options.next;
      const b = options.prev > options.next ? options.next : options.prev;
      for (let i = a; i < b + 1; i++) {
        // if we find a column that can't be reordered
        if (options.columns[i].reorderable === false) {
          // set the flag and break the loop
          unReorderableFound = true;
          break;
        }
      }
      // if this does not cause a reordering
      if (!unReorderableFound) {
        // we may proceed with the reordering
        const columnOverrides = this.columnOverrides.map((col) => {
          // loop for a matching column in the options
          const colMatch =
            options.columns.find((opt) => opt.field === col.field) || {};
          return {
            ...col,
            ...colMatch,
          };
        });
        this.columnOverrides = columnOverrides;
        this.updateColumnFilterOrder(columnOverrides);
        // if this reordering was in violation
      } else {
        // we have to reset the columns on the grid because it tries to update them
        this.$refs.grid.initColumns(this.columnOverrides);
      }
    },
    /**
     * Column filters need to be updated and reinitialized whenever they move
     * @param {Array} columnOverrides array of GridColumnProps objects
     */
    async updateColumnFilterOrder(columnOverrides) {
      this.$refs['column-management-btn'].updateColumns(columnOverrides);
      // rerender the columns
      this.showFilterComponents = false;
      await this.$nextTick();
      this.showFilterComponents = true;
      // wait for the chilren components to mount
      await this.$nextTick();
      this.reinitAllColumnsFilterAndSort();
      // resize the columns
      await this.$nextTick();
      this.resetAllColumnsWidth();
    },
    reinitAllColumnsFilterAndSort() {
      // we need to reinit all the column filters and titles as well
      if (this.columnOverrides) {
        this.columnOverrides.forEach((col) => {
          // update the filter ref
          const filterRef = this.$refs[`column-filter-${col.field}`];
          if (filterRef) {
            // find the ref and make the call to reinit the variables if advanced filters not applied
            if (!this.isOrAdvFiltersApplied)
              filterRef.reinitFilters(this.filter, this.sort);
            else filterRef.reinitSort(this.sort);
          }
          // update the column title ref
          const titleRef = this.$refs[`column-title-${col.field}`];
          if (titleRef) {
            // look for the index of a matching sorts
            const sortIndex = this.sort.findIndex(
              (sd) => sd.field === col.field
            );
            if (sortIndex > -1) {
              // update the sort
              titleRef.setSort(this.sort[sortIndex].dir);
              // update the sort order
              titleRef.setSortCount(
                this.sort.length > 1 ? sortIndex + 1 : null
              );
            } else {
              // clear the sorts from the column titles
              this.$refs[`column-title-${col.field}`].setSort('');
            }
          }
        });
      }
    },
    /**
     *
     * @param {String} field
     * @param {Boolean} locked
     */
    lockColumn(field, locked) {
      this.columnOverrides.find((col) => col.field === field).locked = locked;
    },
    /**
     * - This formula roughly determines if a filtering operation will
     *   require more than half a second to complete
     * - The 600 is a constant I determine through testing
     * @param {Object} filterParams {filter, sort} optional
     * @returns {Boolean}
     */
    needsTimeToLoad(filterParams) {
      // if server side
      if (this.isServerSide) {
        // return false becasue the isUpdating state change is called elsewhere
        return false;
      }
      // set the variables
      const filter =
        filterParams.filter === undefined ? this.filter : filterParams.filter;
      const filterCount = filter === null ? 0 : filter.filters.length;
      const sort = filterParams.sort || this.sort;
      // if this takes more than 500 ms to load
      return (this.totalItemsCount / 600) * (filterCount + sort.length) > 500;
    },
    /**
     * Update the filtered items and paginated
     * @param {Object} filterParams {filter, sort, skip, pageSize, items, group} optional
     */
    // eslint-disable-next-line complexity
    async setFilteredItems(filterParams = {}, donotFetchIds = false) {
      const standardFilterParams = this.standardizeFilterParams(filterParams);
      // if the skip is 0, return to page 1
      if (filterParams.skip === 0) {
        this.$refs['pagination'].setPage(1);
      }
      // if serverSide
      if (this.isServerSide) {
        // set the filtered items server side
        await this.setFilteredItemsServerSide(
          standardFilterParams,
          donotFetchIds,
          false
        );
        // if client side
      } else {
        this.setFilteredItemsClientSide(standardFilterParams);
      }
      if (this.items.length > 0 || this.hasFilters) this.hasNoItems = false;
      else this.hasNoItems = true;
      // hide the loader
      this.isUpdating = false;
      // if this is a multi select table
      if (this.selectedField && this.headerCheckbox) {
        this.updateHeaderSelectionValue();
      }
      if (this.highlightRow) {
        this.$nextTick(() => {
          let col = this.highlightRow;
          this.highLightRowByColValue(col);
        });
      }
      this.$nextTick(() => {
        this.$emit('table-updated');
      });
    },
    /**
     * - Filter params key value pairs are all optional
     * - This methdod fills in the blanks and returns a fully standardized
     *   object with all the latest data
     * - This helps guard against race conditions and avoid awaiting for data
     *   properties to get set via $nextTick
     * @param {Object} filterParams {filter, sort, skip, pageSize, items}
     * @returns {Object}
     */
    standardizeFilterParams(filterParams) {
      // set the variables in an object
      return {
        items: filterParams.items || this.items,
        filter:
          filterParams.filter === undefined ? this.filter : filterParams.filter,
        sort: filterParams.sort || this.sort,
        skip: filterParams.skip === 0 ? 0 : this.skip,
        pageSize: filterParams.pageSize || this.pageSize,
        group: filterParams.group || this.group,
      };
    },
    /**
     * Transforms the given column filter object by modifying specific filter conditions.
     * @param {Object} colFilter - The column filter object to transform.
     * @returns {Object} The transformed column filter object.
     * The function checks if the colFilter object and its filters property exist. If they do,
     * it maps through each filter in the filters array and transforms certain filter conditions:
     *
     * - If a filter has an operator 'isempty' or 'isnull', it replaces that filter with a
     *   new filter object that combines both conditions using a logical 'or'.
     *
     * - If a filter has an operator 'isnotempty' or 'isnotnull', it replaces that filter
     *   with a new filter object that combines both conditions using a logical 'and'.
     */
    transformFilter(colFilter) {
      if (colFilter && colFilter.filters) {
        colFilter.filters = colFilter.filters.map((filter) => {
          if (filter.operator === 'isempty') {
            return {
              logic: 'or',
              filters: [
                {
                  field: filter.field,
                  operator: 'isempty',
                  label: filter.label,
                },
                {
                  field: filter.field,
                  operator: 'isnull',
                  label: filter.label,
                },
              ],
            };
          }
          if (filter.operator === 'isnotempty') {
            return {
              logic: 'and',
              filters: [
                {
                  field: filter.field,
                  operator: 'isnotempty',
                  label: filter.label,
                },
                {
                  field: filter.field,
                  operator: 'isnotnull',
                  label: filter.label,
                },
              ],
            };
          }
          return filter;
        });
      }
      return colFilter;
    },
    /**
     * - Client side only
     * @param {Object} filterParams {filter, sort, skip, pageSize, items}
     */
    setFilteredItemsClientSide(filterParams) {
      // Format Date Filter if any
      const formattedFilter = this.formatDateFilterValue(
        this.transformFilter(
          filterParams.filter ? { ...filterParams.filter } : filterParams.filter
        )
      );
      // Get the filtered items
      const filteredItems = process(filterParams.items, {
        filter: formattedFilter,
        sort: filterParams.sort,
      });

      // Set the items and filtered items
      this.items = filterParams.items;
      this.filteredItems = filteredItems.data;
      this.filteredItemsCount = filteredItems.total;

      // Set paginated items
      this.paginatedItems = this.sliceForPaginatedItems(
        this.skip,
        this.pageSize
      );

      // Update selected items count on next tick
      this.$nextTick(this.setSelectedItemsCount);
    },
    /**
     * - Server side only
     * @param {Object} filterParams {filter, sort, skip, pageSize, items}
     * @param {Boolean} needsStandardization
     *  - sometimes we get a fully standardized filterParams object
     *  - if that's the case, no need to standardize again
     */
    async setFilteredItemsServerSide(
      filterParams,
      donotFetchIds = false,
      needsStandardization = true
    ) {
      // set the loader
      this.isUpdating = true;
      // make the axios request
      const params = this.getRequestParams(filterParams, needsStandardization);
      if (donotFetchIds) {
        params.returnAllFilteredItemIds = false;
      }
      // make the API call using the request method prop
      // TODO: Conver all POST requests to GET for all table data API endpoints
      return await axios[this.requestMethod.toLowerCase()](this.apiEndpoint, {
        params,
      })
        // eslint-disable-next-line complexity
        .then((response) => {
          // get a list of all the date keys
          const dateColumnKeys = this.columnOverrides
            .filter((c) => c.filter === 'date')
            .map((dc) => {
              return { field: dc.field, format: dc.format };
            });
          let items;
          if (dateColumnKeys.length) {
            items = this.setDateFormat(response.data.Data, dateColumnKeys);
          } else {
            items = response.data.Data;
          }
          // if this is an actionable table
          if (
            this.tableType === 'actionable' ||
            this.tableType === 'granular'
          ) {
            // add a selected property to each of the items
            items = this.setTableItemKey(items);
          }
          if (this.updateDataItems != undefined) {
            items = this.updateDataItems(items);
          }
          // set the filtered items count
          this.filteredItemsCount = response.data.FilteredItemsCount;
          let res = { ...response.data };
          if (donotFetchIds) {
            if (
              (this.tableType == 'actionable' ||
                this.tableType == 'granular') &&
              this.extraResponseProperties &&
              this.extraResponseProperties.FilteredItemsIds
            ) {
              let ids = this.extraResponseProperties.FilteredItemsIds;
              this.extraResponseProperties = res.ExtendedResult;
              this.extraResponseProperties.FilteredItemsIds = ids;
            }
          } else this.extraResponseProperties = res.ExtendedResult;

          this.tableMaxSizeItems = items;
          items = items.slice(
            filterParams.skip %
              Math.max(
                this.tableMaxSize - (this.tableMaxSize % this.pageSize),
                this.pageSize
              ),
            (filterParams.skip %
              Math.max(
                this.tableMaxSize - (this.tableMaxSize % this.pageSize),
                this.pageSize
              )) +
              this.pageSize
          );
          // set all the items arrays
          this.items = this.filteredItems = items;
          if (this.group && this.group.length > 0) {
            let processedData = process(items, { group: this.group });
            this.paginatedItems = this.formatServerSideGroupedData(
              processedData.data
            );
          } else {
            this.paginatedItems = items;
          }
          if (
            this.tableType === 'actionable' ||
            this.tableType === 'granular'
          ) {
            if (
              this.extraResponseProperties &&
              this.extraResponseProperties.FilteredItemsIds &&
              this.extraResponseProperties.FilteredItemsIds.length
            ) {
              this.selUniqueKey = Object.keys(
                this.extraResponseProperties.FilteredItemsIds[0]
              )[0];
              this.setFilteredItemsSelected();
            }
            // During server-side updates, all the items will be unselected
            this.$nextTick(() => {
              this.setSelectedItemsCount();
            });
          }
          // change the loading state
          this.isUpdating = false;
          // success return true
          return true;
        })
        .catch((error) => {
          // emit the error
          this.$emit('error', error);
          // failure return false
          return false;
        });
    },
    /**
     * TODO: textten the query params
     * - Server side only
     * - Prepare the params to send with the axios request
     * @param {Object} filterParams {filter, sort, skip, pageSize, items} optional
     * @param {Boolean} needsStandardization
     *  - sometimes we get a fully standardized filterParams object
     *  - if that's the case, no need to standardize again
     * @returns {Object}
     */
    // eslint-disable-next-line complexity
    getRequestParams(filterParams = {}, needsStandardization = true) {
      // standardize the filter params
      const { skip, pageSize, sort, filter, group } = needsStandardization
        ? this.standardizeFilterParams(filterParams)
        : filterParams;
      const maxSize = Math.max(
        this.tableMaxSize - (this.tableMaxSize % pageSize),
        pageSize
      );
      // return the object formatted for the API
      return {
        skip: skip - (skip % maxSize),
        pageSize: maxSize,
        sort: JSON.stringify(sort),
        filter: JSON.stringify(filter),
        group: group ? JSON.stringify(this.group) : undefined,
        includeCounts: true,
        returnAllRows: !this.isServerSide,
        returnAllFilteredItemIds:
          (this.tableType == 'actionable' || this.tableType == 'granular') &&
          !this.singleSelect
            ? true
            : undefined,
      };
    },
    // set unique ID for selection for actionable table
    setTableItemKey(items) {
      items = items.map((item, idx) => {
        item.ID = item.ID || item.Id || idx + 1;
        item.selected = false;
        return item;
      });
      return items;
    },
    /**
     * When should I call this method?
     *  - on mount
     *  - if the dataItems prop updates, call it externally from parent
     *    component using $ref['my-sphere-table-ref'].refreshTable()
     *
     * Any other ways to refresh the table?
     * - this.setFilteredItems();
     * @param {Object} apiParams {page, pageSize, filter, sort}
     */
    // eslint-disable-next-line complexity
    async refreshTable(apiParams = {}) {
      this.dropPosition = '';
      this.defaultView = this.customViews.find((c) => c.DefaultView === 1);
      this.refreshTableCount++;
      // get the maximum table size
      if (this.tableMaxSize === null) await this.getTableMaxSize();
      //reset header selection check value
      this.headerSelectionChecked = false;
      // some initial variables from the api params prop
      let {
        page,
        pageSize,
        filter,
        sort,
        defaultCustomView = false,
        group,
      } = apiParams;
      pageSize = this.pageSize = pageSize || this.pageSize;
      sort = sort ? sort : this.getDefaultSort(sort);
      let skip = (this.skip =
        page != undefined && page == 0 ? pageSize * page : this.skip);
      this.filter = filter = filter || this.filter;
      this.hasFilters =
        this.filter && this.filter.filters
          ? this.filter.filters.length > 0
          : this.filter !== null;
      this.sort = sort = sort || this.sort;
      this.group = group;
      if (!this.isServerSide && this.skip >= 5) skip = 0;
      // set the loader
      this.isUpdating = true;
      // clear the previous items and columns (this will also set loading state)
      this.items = this.filteredItems = this.paginatedItems = null;
      // instantiate the items variable so we can pass it to getColumns
      let items = JSON.parse(JSON.stringify(this.dataItems)) || [];
      // if we were not passed any data-items as a prop
      if (this.dataItems === null) {
        // if the user did not supply an API endpoint
        if (!this.apiEndpoint) {
          // throw an error
          throw new Error(
            'At least one of the following props is required: dataItems, apiEndpoint'
          );
        }
        if (this.refreshTableCount == 1)
          this.isServerSide = this.clientSide ? false : true;

        // Check if there is a default custom view
        if (
          !defaultCustomView &&
          this.showCustomViews &&
          this.defaultView &&
          this.customViews.length > 0 &&
          (this.tableType == 'granular' || this.tableType == 'simpleGranular')
        ) {
          // If there is a default custom view, apply its respective filters.
          await this.setCustomFilters(this.defaultView);
        }

        // if serverside we need to populate the body obj with additional params
        let params = this.getRequestParams(
          {
            skip,
            pageSize: this.pageSize,
            filter: this.filter,
            sort: this.sort,
            group: this.group,
          },
          false
        );
        if (this.isServerSide && this.refreshTableCount == 1)
          params.pageSize = this.tableMaxSize
            ? this.tableMaxSize
            : params.pageSize
            ? params.pageSize
            : this.pageLength;
        if (!this.isServerSide) {
          params.group = [];
          params.filter = null;
        }
        //Since the api supports int32 we are passing a number which is
        //in the range of int32
        if (this.clientSide) params.pageSize = 9999999;

        // make the API call using the request method prop
        // TODO: Conver all POST requests to GET for all table data API endpoints
        const response = await axios[this.requestMethod.toLowerCase()](
          this.apiEndpoint,
          { params }
        )
          .then((response) => response)
          .catch((error) => {
            this.$emit('error', error);
            return false;
          });
        // if we got an error
        if (!response) {
          // kill the table reload
          return false;
        }
        // TODO: consistent API endpoint data response
        items = response.data.Data || response.data;
        let res = { ...response.data };
        this.extraResponseProperties = res.ExtendedResult;
        if (
          (this.tableType == 'actionable' || this.tableType == 'granular') &&
          this.extraResponseProperties &&
          this.extraResponseProperties.FilteredItemsIds &&
          this.extraResponseProperties.FilteredItemsIds.length
        ) {
          this.selUniqueKey = Object.keys(
            this.extraResponseProperties.FilteredItemsIds[0]
          )[0];
        }
        // set total items and filtered items counts
        this.totalItemsCount = response.data.TotalItemsCount || items.length;
        this.isServerSide =
          (this.totalItemsCount > this.tableMaxSize || this.serverSide) &&
          !this.clientSide;
        if (this.isServerSide) {
          // and set the filtered item count
          this.filteredItemsCount = response.data.FilteredItemsCount;
          this.tableMaxSizeItems = items;
          // TODO: Figure out a way for a hybrid approch.
          items = items.slice(
            skip %
              Math.max(
                this.tableMaxSize - (this.tableMaxSize % this.pageSize),
                this.pageSize
              ),
            (skip %
              Math.max(
                this.tableMaxSize - (this.tableMaxSize % this.pageSize),
                this.pageSize
              )) +
              (this.pageSize
                ? this.pageSize
                : this.pageLength
                ? this.pageLength
                : params.pageSize)
          );
        } else {
          this.isServerSide = false;
          delete params.returnAllFilteredItemIds;
          params.filter = null;
          // If the table is client side and it has filter query params, then to get all the records initially and apply filter from client-side making it null here
          if (this.$route.query.filter || this.customViews.length > 0) {
            items = await this.getTotalTableItems(params);
          }
        }
        if (this.updateDataItems != undefined) {
          items = this.updateDataItems(items);
        }
        // If table is serverside, set the filtered and paginated items as well
        if (this.isServerSide) this.filteredItems = this.paginatedItems = items;
        // if we did recive items from a parent component (only available if client side)
      } else {
        // and set the total items count
        this.totalItemsCount = this.dataItems.length;
      }
      // generate the columns based on the item object keys
      let columnOverrides = null;
      if (!this.columnOverrides) {
        // if we have no items
        if (items.length === 0) {
          if (this.configurableTableKey) {
            this.columns = this.updateConfigurableTableOptions(this.columns);
          }
          // if we do not have any pre-defined columns, throw warning
          if (this.columns.length === 0) {
            // throw a warning
            console.warn(
              'You must provide columns prop if there are no table rows'
            );
          } else {
            // create a dummy item with the column keys
            const item = {};
            this.columns.forEach((column) => {
              item[column.field] = 'x';
            });
            // use the dummy item to generate the overrides
            columnOverrides = this.getColumns([item]);
          }
        } else {
          // pass the array of items to the column overrides
          columnOverrides = this.getColumns(items);
        }
        // set the columns
        this.columnOverrides = columnOverrides;
        if (this.tableSettings && this.tableSettings.customViews) {
          this.defaultColumns = JSON.parse(JSON.stringify(columnOverrides));
          if (this.defaultView && Object.entries(this.defaultView).length > 0) {
            this.customViewChoosen = true;
            this.columnOverrides.forEach((col, index) => {
              let customCol = this.defaultView.columnsFields.filter(
                (c) => c.field == col.field
              )[0];
              if (customCol) {
                this.columnOverrides[index].hidden = customCol.hidden;
                this.columnOverrides[index].locked = customCol.locked;
                this.columnOverrides[index].orderIndex = customCol.orderIndex;
                this.columnOverrides[index].invisible = customCol.invisible;
              }
            });
          }
        }
      } else {
        columnOverrides = this.columnOverrides;
      }
      // if this is an actionable table
      if (this.tableType === 'actionable' || this.tableType == 'granular') {
        // add a selected property to each of the items
        items = this.setTableItemKey(items);
      }
      // Null Check
      if (!columnOverrides) {
        columnOverrides = [];
      }
      // get a list of all the date keys
      const dateKeys = columnOverrides
        .filter((c) => c.filter === 'date')
        .map((dc) => dc.field);
      // get a list of all the time key
      const timeKeys = columnOverrides
        .filter((c) => c.filter === 'time')
        .map((dc) => dc.field);
      // if we have any date columns
      if (dateKeys.length || timeKeys.length) {
        // loop through all the items
        for (let i = 0; i < items.length; i++) {
          // loop through the keys
          for (let j = 0; j < dateKeys.length; j++) {
            // if it is not null or empty or undefined and not already a date object
            if (
              items[i][dateKeys[j]] &&
              items[i][dateKeys[j]] !== null &&
              items[i][dateKeys[j]] !== '' &&
              Object.prototype.toString.call(items[i][dateKeys[j]]) !==
                '[object Date]'
            ) {
              // convert the row column into dates
              const date = new Date(items[i][dateKeys[j]]);
              const format = columnOverrides.filter(
                (c) => c.field == dateKeys[j]
              )[0].format;
              // if the date format has a time, reset the date to current time
              if (/H|m|s/.test(format)) {
                date.setMilliseconds(0);
                items[i][dateKeys[j]] = date;
              } else {
                items[i][dateKeys[j]] = new Date(
                  formatDate(date, dateKeys[j].format)
                );
              }
            }
          }
          // loop through all the time keys
          for (let j = 0; j < timeKeys.length; j++) {
            // if the value is not null and is a string formated hh:mm:ss
            if (
              items[i][timeKeys[j]] &&
              items[i][timeKeys[j]] !== null &&
              items[i][timeKeys[j]] !== ''
            ) {
              // find the matching string hh:mm:ss
              const timeMatch = items[i][timeKeys[j]].match(/\d\d:\d\d:\d\d/);
              // if we have a match
              if (timeMatch) {
                // set the value in seconds
                const [h, m, s] = timeMatch[0]
                  .split(':')
                  .map((t) => parseInt(t));
                items[i][timeKeys[j]] = h * 3600 + m * 60 + s;
              }
            }
          }
        }
      }
      // if there are only 5 items or less, set the page size to 5
      if (
        this.refreshTableCount === 1
          ? items.length < 6
          : items.length < 6 && this.totalItemsCount < 6
      ) {
        // update page size data prop
        pageSize = this.pageSize || 5;
        // wait for the pagination component to mount
        this.$nextTick(() => {
          // update the child component, second param false to prevent callback emit
          this.$refs['pagination'].setPageSize(
            5,
            false,
            this.isAllApplied && !this.isServerSide
          );
        });
      } else if (
        this.refreshTableCount === 1
          ? items.length < 11
          : items.length < 11 && this.totalItemsCount < 11
      ) {
        pageSize = this.pageSize = 10;
        this.$nextTick(() => {
          // this might need to be reset to 10 if this method is called twice
          this.$refs['pagination'].setPageSize(
            pageSize,
            false,
            this.isAllApplied && !this.isServerSide
          );
        });
      } else {
        pageSize = this.pageSize =
          this.tableType == 'granular' || this.tableType == 'simpleGranular'
            ? this.defaultView &&
              this.defaultView.pageSize !== undefined &&
              this.defaultView.pageSize !== null
              ? this.defaultView.pageSize
              : 25
            : this.pageSize;
        this.$nextTick(() => {
          // this might need to be reset to required page size if this method is called twice
          this.$refs['pagination'].setPageSize(
            pageSize,
            false,
            this.isAllApplied && !this.isServerSide
          );
        });
      }
      // Using the setPage method to set page 1 as the default for pagination while switching tabs or onload tables
      if (page !== undefined && page !== null) {
        this.$refs['pagination'].setPage(page + 1);
      }
      // if there are any items
      if (items.length > 0) {
        // disabled may have been set earlier, need to re-enable
        this.hasNoItems = false;
        // set a default starting sort state based on overrides
        sort = this.getDefaultSort(sort);
        // if there are no items
      } else {
        this.hasNoItems = true;
      }
      // we only need to call set filtered items if we are not server side
      if (!this.isServerSide) {
        // set the filtered items array
        this.setFilteredItems({ sort, pageSize, items });
        // if this is serverside and we don't have items but we do have filters
      }
      // set the items
      this.items = items;
      // set the sort
      this.sort = sort;
      // set the page size
      this.pageSize = pageSize;
      // show pagination
      this.hasColumns = columnOverrides.length > 0;
      if (this.isServerSide && this.group && this.group.length > 0) {
        let processedData = process(items, {
          group: this.group,
        });
        this.paginatedItems = this.formatServerSideGroupedData(
          processedData.data
        );
      }
      // additional cleanup
      this.$nextTick(() => {
        // double make sure to clear updating state
        this.isUpdating = false;
        // if this is a reoderable column
        if (
          (this.isReorderable || this.columnToggleable) &&
          this.$refs['column-management-btn']
        ) {
          // update the columns for the column management btn dropdown menu
          this.$refs['column-management-btn'].updateColumns(columnOverrides);
        }
        // if there are any filters
        if (this.filter && !this.isOrAdvFiltersApplied) {
          // loop the columns
          this.columnOverrides.forEach((col) => {
            const columnFilter = this.$refs[`column-filter-${col.field}`];
            // reinit the filters
            if (columnFilter) {
              columnFilter.reinitFilters(this.filter, this.sort);
            }
          });
        }
        // Reset selected items count for actionable table
        this.setSelectedItemsCount();
        // emit callback table mounted
        this.$emit('mounted', this.items, this.totalItemsCount);
      });
      if (this.highlightRow) {
        this.$nextTick(() => {
          let col = this.highlightRow;
          this.highLightRowByColValue(col);
        });
      }
      this.$nextTick(() => {
        this.resetAllColumnsWidth();
        if (this.soloFullHeightTable) this.setTableMaxHeight();
      });
      if (defaultCustomView) {
        if (this.defaultView) {
          this.$refs.customViewInput.selectCustomView(this.defaultView);
        }
      }
    },

    /**
     * set date format
     * @param {Object} data
     * @param {array} dateColumnKeys
     * return items after setting date format
     */
    // eslint-disable-next-line complexity
    setDateFormat(data, dateColumnKeys) {
      let items = data;
      // if we have any date columns
      if (dateColumnKeys.length) {
        // loop through all the items
        for (let i = 0; i < items.length; i++) {
          // loop through the keys
          for (let j = 0; j < dateColumnKeys.length; j++) {
            // if it is not null or empty or undefined and not already a date object
            if (
              items[i][dateColumnKeys[j].field] &&
              items[i][dateColumnKeys[j].field] !== null &&
              items[i][dateColumnKeys[j].field] !== '' &&
              Object.prototype.toString.call(
                items[i][dateColumnKeys[j].field]
              ) !== '[object Date]'
            ) {
              // convert the row column into dates
              const date = new Date(items[i][dateColumnKeys[j].field]);
              // if the date format has a time, reset the date to current time
              if (/H|m|s/.test(dateColumnKeys[j].format)) {
                items[i][dateColumnKeys[j].field] = date;
              } else {
                items[i][dateColumnKeys[j].field] = new Date(
                  formatDate(
                    date,
                    dateColumnKeys[j].format.replace('{0:', '').replace('}', '')
                  )
                );
              }
            }
          }
        }
      }
      return items;
    },
    /**
     * @param {Array} items array of table row objects
     * @returns {Array} of kendo GridColumnProp objects
     * https://www.telerik.com/kendo-vue-ui/components/grid/api/GridColumnProps
     * Additional GridColumnProp options:
     * - downloadable
     *    + indicates is a field should be included in the file download
     *    + default true
     * - invisible
     *    + does not display in the column management btn dropdown menu
     */
    // eslint-disable-next-line complexity
    getColumns(items) {
      // create an array of columns from the columns from and item keys
      const keys = [
        ...new Set(
          Object.keys(items[0]).concat(this.columns.map((c) => c.field))
        ),
      ];
      // Deleting 'selected' key
      if (this.tableType === 'actionable' || this.tableType == 'granular') {
        const selectedIndex = keys.indexOf('selected');
        const IDIndex = keys.indexOf('ID');
        if (selectedIndex > -1) {
          keys.splice(selectedIndex, 1);
          keys.splice(IDIndex, 1);
        }
      }
      // loop through the keys
      // eslint-disable-next-line complexity
      let columns = keys.map((key) => {
        // grab column type since we need it to set a few object properties
        const columnType = this.getColumnType(items, key);
        // create a default title splitting the key by camel case words
        let title = this.getColumnTitleWithSpaces(key);
        // grab any overrides from the gridColumns prop
        const overrides = this.columns.find((gc) => gc.field === key) || {};
        // return array of formatted kendo column objects
        // https://www.telerik.com/kendo-vue-ui/components/grid/api/GridColumnProps
        return {
          field: key, // string
          title,
          filter: columnType, // string
          filterable: true,
          format:
            columnType === 'date'
              ? '{0:MM/dd/yyyy}'
              : columnType === 'numeric'
              ? '{0:##,#.################}'
              : undefined,
          hidden:
            key.toLowerCase() === 'id' || key.toLowerCase() === '_id'
              ? true
              : overrides.invisible || false,
          invisible: false,
          headerCell: 'headerTemplate',
          filterCell: 'filterSlotTemplate',
          className:
            columnType === 'numeric' ? 'text-xs-right' : 'text-xs-left',
          width: 200,
          locked: false,
          reorderable: true,
          downloadable: true,
          groupable: this.isGroupable,
          cell: columnType === 'time' ? 'timeTemplate' : undefined,
          ...overrides,
        };
      });

      if (this.configurableTableKey) {
        columns = this.updateConfigurableTableOptions(columns);
      }
      // Unhide the columns if the filter is applied on it from the route params
      this.displayFilteredColumns(columns);
      // reorder the columns as needed
      columns = this.setOrderIndex(columns);
      // if this is an actionable table, add the selected column header if not already added
      if (
        this.rowReorder &&
        (this.tableType === 'actionable' || this.tableType === 'simple')
      ) {
        columns.unshift({
          field: 'rowReorder',
          title: '',
          cell: 'rowReorder',
          width: 75,
          headerCell: 'headerTemplate',
          className: 'text-xs-left',
          orderIndex: -2,
          invisible: true,
          filterable: false,
          sortable: false,
          resizable: false,
          reorderable: false,
          groupable: false,
          downloadable: false,
          locked: false,
        });
      }
      if (
        (this.tableType === 'actionable' || this.tableType == 'granular') &&
        !keys.includes('selected')
      ) {
        columns.unshift({
          downloadable: false,
          field: 'selected',
          cell: 'selectTemplate',
          width: 34,
          filterable: false,
          headerSelectionValue: false,
          resizable: false,
          reorderable: false,
          sortable: false,
          orderIndex: -1,
          invisible: true,
          hidden: false,
          groupable: false,
        });
        // if the singleSelect prop is true, hide the select all checkbox
        if (this.singleSelect) {
          columns[0].headerCell = 'emptySlot';
        }
      }
      return columns;
    },
    /**
     * Called with in this ocmponent
     * Unhide the column if filter is applied on it from route params
     * @param {Array} columns array of GridColumns
     * @returns {Array} GridColumns
     */
    displayFilteredColumns(columns) {
      if (this.filteredColumnsFromRoute.length) {
        columns = columns.map((columnObj) => {
          const isFilterHidden =
            columnObj.hasOwnProperty('hiddenFilter') && columnObj.hiddenFilter;
          if (
            this.filteredColumnsFromRoute.includes(columnObj.field) &&
            !isFilterHidden
          ) {
            columnObj.hidden = false;
          }
          return columnObj;
        });
      }
      return columns;
    },
    /**
     * Called with in this ocmponent
     * Sets configurable table features like tooltip, order, title and show/hode
     * @param {Array} columns array of GridColumnProps
     * @returns {Array} GridColumnProps
     */
    updateConfigurableTableOptions(columns) {
      const config = this.$store.getters.tableConfigs.filter(
        (t) => t.key === this.configurableTableKey
      )[0];
      columns = columns.map((column) => {
        let col = config.defaultColumns.filter(
          (c) => c.source == column.field
        )[0];
        if (col) {
          col.hidden = false;
        } else {
          col = config.otherColumns.filter((c) => c.source == column.field)[0];
          if (col) {
            col.hidden = true;
          } else {
            col = config.hiddenColumns.filter(
              (c) => c.source == column.field
            )[0];
            if (col) {
              col.hidden = true;
              col.invisible = true;
            }
          }
        }
        if (col) {
          column.title =
            col.rename || this.getColumnTitleWithSpaces(col.source);
          column.hidden = col.hidden;
          column.tooltip = col.tooltip;
          column.orderIndex = col.order;
          column.invisible = col.invisible;
          if (col.tooltip) column.alwaysShowTooltip = true;
        } else {
          column.hidden = true;
          column.invisible = true;
        }
        return column;
      });
      config.defaultColumns.forEach((dc) => {
        let idx = columns.findIndex((c) => c.field == dc.source);
        if (idx == -1) {
          columns.push({
            field: dc.source,
            title: dc.rename,
            tooltip: dc.tooltip,
            orderIndex: dc.order,
            hidden: false,
          });
        }
      });
      config.otherColumns.forEach((dc) => {
        let idx = columns.findIndex((c) => c.field == dc.source);
        if (idx == -1) {
          columns.push({
            field: dc.source,
            title: dc.rename,
            tooltip: dc.tooltip,
            orderIndex: dc.order,
            hidden: true,
          });
        }
      });
      config.hiddenColumns.forEach((dc) => {
        let idx = columns.findIndex((c) => c.field == dc.source);
        if (idx == -1) {
          columns.push({
            field: dc.source,
            title: dc.rename,
            tooltip: dc.tooltip,
            orderIndex: dc.order,
            hidden: true,
            invisible: true,
          });
        }
      });
      return columns;
    },
    // Here adding space to the key value and capitalizing it
    getColumnTitleWithSpaces(colName) {
      let colTitle = colName
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
      return colTitle.charAt(0).toUpperCase() + colTitle.slice(1);
    },
    /**
     * Reorder the columns based on GridColumnProps.orderIndex
     * @param {Array} columns array of GridColumnProps
     * @returns {Array} GridColumnProps
     */
    setOrderIndex(columns) {
      // get a text array of all the defined order indexes
      const orderIndexes = columns
        .filter((c) => !isNaN(c.orderIndex))
        .map((c) => c.orderIndex);
      // helper method to get the next available index
      let index = 0;
      const getNextIndex = (i) => {
        let index = i + 1;
        return orderIndexes.includes(index) ? getNextIndex(index) : index;
      };
      // loop through all the columns
      for (let i = 0; i < columns.length; i++) {
        // or current column has an order index already
        if (!isNaN(columns[i].orderIndex)) {
          // skip
          continue;
        }
        // set an order index
        index = columns[i].orderIndex = getNextIndex(index);
      }
      // now sort the columns
      return columns.sort(COMPARE);
    },
    /**
     * @param {Object} items table row
     * @param {String} field column field
     * @returns {String} date | numeric | text
     */
    // eslint-disable-next-line complexity
    getColumnType(items, field) {
      // if the type is already specified by the column return that
      const column = this.columns.find((col) => col.field === field);
      if (column && column.filter) {
        return column.filter;
      }
      // loop through all the items
      for (let i = 0; i < items.length; i++) {
        // if empty string, continue
        let value = items[i][field];
        if (typeof value == 'boolean') {
          return 'boolean';
        }
        if (value) value = value.toString();
        if (items[i][field] === '' || items[i][field] === null) continue;
        if (this.isDate(value)) {
          return 'date';
        } else if (!isNaN(value)) {
          return 'numeric';
        } else if (value) {
          return 'text';
        }
      }
      // default text
      return 'text';
    },
    /**
     * @param {*} value
     * @returns {Boolean}
     */
    isDate(value) {
      // standard API date format
      const dateRegex = /\d{4}-\d\d-\d\d.*\d\d:\d\d/;
      // regex for js Date objects .toString() eg 24 2023 16:29:27
      const dateStringRegex = /\d\d\s\d{4} \d\d:\d\d:\d\d/;
      // check to see if it matches our regex or is a date object already
      return (
        Object.prototype.toString.call(value) === '[object Date]' ||
        dateRegex.test(value) ||
        dateStringRegex.test(value)
      );
    },

    /**
     * - Setting the default sort to the column
     * - called by refreshTable
     * - Also called by ClearSortsAndFilters when uses click 'Clear all' menu
     * https://www.telerik.com/kendo-vue-ui/components/dataquery/api/SortDescriptor/
     * @param {Array} sort array of Kendo SortDescriptors
     * @returns {Array} Kendo SortDescriptors
     */
    getDefaultSort(sort = []) {
      // get a text list of all the fields that are already being sorted
      const alreadySorted = sort.map((s) => s.field);
      // getting any columns that have a default sort value
      const defaultSortColumns = this.columns.filter(
        (column) => column.defaultSort
      );
      // if there are any predefined default sorts
      if (defaultSortColumns.length) {
        // loop through the sort columns
        defaultSortColumns.forEach((column) => {
          // if this field is not already being sorted (e.g. set by url params)
          if (!alreadySorted.includes(column.field)) {
            // push that onto the array
            sort.push({
              field: column.field,
              dir: column.defaultSort,
            });
          }
        });
      }
      // update the default sorted column's title and filter components
      this.$nextTick(() => {
        if (sort.length == 0) {
          if (this.columnOverrides) {
            this.columnOverrides.forEach((col) => {
              if (this.$refs[`column-title-${col.field}`]) {
                this.$refs[`column-title-${col.field}`].setSort('');
                this.$refs[`column-title-${col.field}`].setSortCount(null);
              }
            });
          }
        } else if (sort.length == 1) {
          if (
            this.$refs[`column-title-${sort[0].field}`] &&
            this.$refs[`column-filter-${sort[0].field}`]
          ) {
            this.$refs[`column-title-${sort[0].field}`].setSort(sort[0].dir);
            this.$refs[`column-filter-${sort[0].field}`].setSort(sort[0].dir);
            this.$refs[`column-title-${sort[0].field}`].setSortCount(null);
          }
        } else {
          // loop through the sort array
          sort.forEach((s, index) => {
            // update the title and filter components
            this.$refs[`column-title-${s.field}`].setSort(s.dir);
            this.$refs[`column-filter-${s.field}`].setSort(s.dir);
            this.$refs[`column-title-${s.field}`].setSortCount(index + 1);
          });
        }
      });
      // return the sort array
      return sort;
    },
    /**
     * - Setting the header tooltip on column resize
     * - Use timeout to prevent this event from firing too many times
     * @param {Object} options kendo object
     */
    onColumnResize(options) {
      // clear the resize timeout if there is one
      clearTimeout(this.resizeTimeout);
      // set a new timeout
      this.resizeTimeout = setTimeout(() => {
        if (this.resizing) {
          this.resizing = false;
          return false;
        }
        // find the corresponding column and update the width
        this.columnOverrides.find(
          (col) => col.field === options.columns[options.index].field
        ).width = options.newWidth;
        // options.end is a boolean indicating that resizing is done
        // Setting the tooltip after resizing
        if (options.end) {
          this.setHeadersTooltip();
        }
      }, 200);
    },
    /**
     * - Called externally from parent component when the table data-items is loaded asynchronously
     */
    setHeadersTooltip() {
      this.columnOverrides.forEach((column) => {
        if (
          !column.hidden &&
          !column.invisible &&
          column.title != '' &&
          this.$refs[`column-title-${column.field}`]
        ) {
          this.$refs[`column-title-${column.field}`].setTooltip();
        }
      });
    },
    /**
     * - Called with in this component when the table is updated
     */
    // eslint-disable-next-line complexity
    highLightRowByColValue: function (column) {
      if (
        this.paginatedItems &&
        this.paginatedItems.length > 0 &&
        (typeof this.paginatedItems[0][column] === 'number' ||
          typeof this.paginatedItems[0][column] === 'string')
      ) {
        if (this.paginatedItems[0].hasOwnProperty(column)) {
          // eslint-disable-next-line complexity
          this.paginatedItems.forEach((item, index) => {
            this.$el
              .querySelectorAll('.k-grid-content table tbody tr')
              [index].classList.remove('warning', 'error', 'color_white');
            if (
              this.$el.querySelectorAll('.k-grid-content table tbody tr')[index]
            ) {
              if (
                (column === 'Status' && item[column] === 'Failed') ||
                item[column] === 3
              ) {
                this.$el
                  .querySelectorAll('.k-grid-content table tbody tr')
                  [index].classList.add('error', 'color_white');
              } else if (
                (column === 'Status' && item[column] === 'Errors') ||
                item[column] === 2
              ) {
                this.$el
                  .querySelectorAll('.k-grid-content table tbody tr')
                  [index].classList.add('warning', 'color_white');
              }
            }
          });
        }
      } else {
        if (
          this.paginatedItems &&
          this.paginatedItems.length > 0 &&
          this.paginatedItems[0].hasOwnProperty(column)
        ) {
          let color = 'error';
          this.paginatedItems.forEach((item, index) => {
            if (
              this.$el.querySelectorAll('.k-grid-content table tbody tr')[index]
            ) {
              if (item[column] == true) {
                this.$el
                  .querySelectorAll('.k-grid-content table tbody tr')
                  [index].classList.add(color, 'color_white');
              } else {
                this.$el
                  .querySelectorAll('.k-grid-content table tbody tr')
                  [index].classList.remove(color, 'color_white');
              }
            }
          });
        }
      }
    },

    // /**
    //  * - Select the custom view
    //  */
    // eslint-disable-next-line complexity
    selectCustomView(customView) {
      if (customView && this.columnOverrides) {
        // we need to reinit all the column filters and titles as well
        this.columnOverrides.forEach((col, index) => {
          let customCol = customView.columnsFields.filter(
            (c) => c.field == col.field
          )[0];
          if (customCol) {
            this.columnOverrides[index].hidden = customCol.hidden;
            this.columnOverrides[index].locked = customCol.locked;
            this.columnOverrides[index].orderIndex = customCol.orderIndex;
            this.columnOverrides[index].invisible = customCol.invisible;
          }
          this.$nextTick(() => {
            // update the filter ref
            const filterRef = this.$refs[`column-filter-${col.field}`];
            if (filterRef) {
              filterRef.clearColumnFilterLabel();
              // find the ref and make the call to reinit the variables
              if (!customView.isAdvFiltersApplied)
                filterRef.reinitFilters(customView.filter, customView.sort);
              else filterRef.reinitSort(customView.sort);
            }
            // update the column title ref
            const titleRef = this.$refs[`column-title-${col.field}`];
            if (titleRef) {
              // clear the sorts from the column titles
              this.$refs[`column-title-${col.field}`].setSort('');
              this.$refs[`column-title-${col.field}`].setSortCount(null);
              // look for the index of a matching sorts
              const sortIndex = customView.sort.findIndex(
                (sd) => sd.field === col.field
              );
              if (sortIndex > -1) {
                // update the sort
                titleRef.setSort(customView.sort[sortIndex].dir);
                // update the sort order
                titleRef.setSortCount(
                  customView.sort.length > 1 ? sortIndex + 1 : null
                );
              }
            }
          });
        });
        if (!this.customViewChoosen) {
          this.customViewChoosen = !(
            customView.name == 'SPHEREboard Default View'
          );
        }
        if (
          (this.tableType == 'granular' ||
            this.tableType == 'simpleGranular') &&
          this.customViewChoosen &&
          this.customViews.length > 0
        ) {
          this.columnOverrides[0].headerSelectionValue = false;
          this.isOrAdvFiltersApplied = customView.isAdvFiltersApplied || false;
          this.isAllApplied = customView.isAllApplied || false;
          this.skip = customView.skip;
          this.page =
            customView.skip === 0
              ? 1
              : customView.skip / customView.pageSize + 1;
          this.pageSize = customView.pageSize;
          this.hasFilters = customView.filter !== null;
          this.sort = customView.sort;
          this.group = customView.group;
          this.filter = this.isServerSide
            ? customView.filter
            : this.formatDateFilterValue(customView.filter);
          this.setFilteredItems({
            sort: customView.sort,
            pageSize: customView.pageSize,
            filter: customView.filter,
            group: customView.group,
            skip: customView.skip,
          });
          this.$refs['pagination'].setPage(this.page);
          this.$refs['pagination'].setPageSize(
            this.pageSize,
            false,
            this.isAllApplied && !this.isServerSide
          );
          this.$refs['column-management-btn'].updateColumns(
            this.columnOverrides
          );
          this.appliedFiltersCount = customView.appliedFiltersCount;
        }
      }
    },
    formatDateFilterValue(filter) {
      if (filter && Array.isArray(filter.filters))
        filter.filters = filter.filters.map((f) => {
          if (f.field && this.columnOverrides) {
            let column = this.columnOverrides.find((c) => c.field == f.field);
            if (column && column.filter == 'date') f.value = new Date(f.value);
          } else {
            f = this.formatDateFilterValue(f);
          }
          return f;
        });
      return filter;
    },
    onExpandchange(event) {
      this.$set(
        event.dataItem,
        event.target.$props.expandField,
        event.dataItem.expanded === undefined ? false : !event.dataItem.expanded
      );
    },
    /**
     * User changes grouping
     * @param {GridDataStateChangeEvent} event
     */
    onDatastatechange(event) {
      var duplicatedGroup = event.data.group.filter((x) => {
        return (
          event.data.group.filter((y) => {
            return y.field == x.field;
          }).length > 1
        );
      });

      if (duplicatedGroup.length === 0) {
        this.group = event.data.group;

        if (this.group)
          this.group.forEach(
            (g) => (g.aggregates = [{ field: g.field, aggregate: 'count' }])
          );
        this.setFilteredItems({
          group: event.data.group,
          skip: 0,
        });
        this.updateGroupSelectionValue();
        // update the page number back to original
        this.$emit('pagination-updated', {
          page: 1,
          rowsPerPage: this.pageSize,
        });
      }
    },
    applyExternalFilters(externalFilterObj) {
      this.isOrAdvFiltersApplied = this.getIsOrFilterApplied(externalFilterObj);
      this.updateFilter(externalFilterObj);
      // clear the filters on the column
      this.columnOverrides.forEach((col) => {
        // access the filter ref
        const filterRef = this.$refs[`column-filter-${col.field}`];
        if (filterRef) {
          filterRef.activeFilters = [];
          filterRef.reinitSort(this.sort);
        }
        if (!this.isOrAdvFiltersApplied) {
          const columnFilter = this.$refs[`column-filter-${col.field}`];
          // reinit the filters
          if (columnFilter) {
            columnFilter.reinitFilters(this.filter, this.sort, true);
          }
        }
      });
    },
    openExternalFilters() {
      this.$refs['external-filters'].openFilterDialog();
    },
    //set custom view filters, if we any deafult view exists
    setCustomFilters(customView) {
      this.isAllApplied = customView.isAllApplied;
      this.isAdvFiltersApplied = customView.isAdvFiltersApplied || false;
      this.skip = customView.skip;
      this.page =
        customView.skip === 0 ? 1 : customView.skip / customView.pageSize + 1;
      this.pageSize = customView.pageSize;
      this.hasFilters = customView.filter !== null;
      this.sort = customView.sort;
      this.group = customView.group;
      this.filter = this.isServerSide
        ? customView.filter
        : this.formatDateFilterValue(customView.filter);
    },
    /**
     * - Make API call to get any custom views
     * - Set the default custom view if there is one
     */
    async getCustomViews() {
      return await new Promise((resolve, reject) => {
        axios
          .get('/CustomViewApi/GetCustomViewData', {
            params: {
              Module: this.moduleName,
              UserSTSGUID: this.$store.getters.userId,
              IsReportCenter:
                this.savedReportId !== null && this.savedReportId !== undefined,
            },
          })
          .then(async (response) => {
            // set the custom views
            let customViews = response.data.map((cv) => {
              let viewData = JSON.parse(cv.ViewData);
              viewData.CustomViewId = cv.CustomViewId;
              viewData.DefaultView = cv.DefaultView;
              viewData.name = cv.ViewName;
              return viewData;
            });
            this.customViews = customViews.filter(
              (v) =>
                v.hasOwnProperty('columnsFields') &&
                (this.savedReportId
                  ? v.CustomViewId === this.savedReportId
                  : true)
            );
            // if there is a default custom view
            this.defaultView = this.customViews.find((cv) => cv.DefaultView);

            return resolve(true);
          })
          .catch((error) => {
            // log the error
            console.error(error);
            // emit the error
            reject(false);
          });
      });
    },

    setTableMaxHeight() {
      let tablePositionTop = this.$el
        .getElementsByClassName('k-grid')[0]
        .getBoundingClientRect().top;
      const applicationFooterHeight =
          document.querySelector('footer.v-footer').clientHeight,
        spacingBelowCard = 12,
        cardPadingBottom = parseInt(
          window
            .getComputedStyle(
              this.$el.closest('.sb_component_card_body > .v-card__text'),
              null
            )
            .getPropertyValue('padding-bottom')
        ),
        cardLoaderHeight = this.$el
          .closest('.sb_component_card_body')
          .querySelector('.sb_component_card_time_loader').clientHeight;
      // substracting the card loader height because loader will be gone once the table is completely loaded
      if (
        this.$el
          .closest('.sb_component_card_body')
          .querySelector('.sb_component_card_loader_bar') &&
        tablePositionTop > 0
      )
        tablePositionTop = tablePositionTop - 35;
      if (cardLoaderHeight > 0 && tablePositionTop > 0)
        tablePositionTop = tablePositionTop - (cardLoaderHeight + 5);
      if (tablePositionTop == 0 || tablePositionTop > window.innerHeight)
        tablePositionTop = 171;
      let maxHeight =
        'calc(100vh - ' +
        (tablePositionTop +
          cardPadingBottom +
          applicationFooterHeight +
          spacingBelowCard) +
        'px)';
      this.$el.getElementsByClassName('k-grid')[0].style.maxHeight = maxHeight;
    },
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
    // To get total table items if it is client side
    async getTotalTableItems(requestParams) {
      requestParams.pageSize = this.tableMaxSize;
      const response = await axios[this.requestMethod.toLowerCase()](
        this.apiEndpoint,
        { params: requestParams }
      )
        .then((response) => response)
        .catch((error) => {
          this.$emit('error', error);
          return false;
        });
      return response.data.Data;
    },
    customViewAdded(status) {
      if (status && !this.customViewChoosen) {
        this.customViewChoosen = true;
      }
    },
  },
};
</script>

<style lang="scss">
@import '../css/kendoOverrides.css';
.sphere-table {
  height: 100%;
  position: relative;
  .sphere-table-container {
    position: absolute;
    height: 100%;
    width: 100%;
    &.disabled {
      .k-master-row:not(.k-selected) td {
        filter: brightness(80%);
      }
      .k-virtual-content {
        position: relative;
        &:before {
          content: '';
          position: absolute;
          height: 100%;
          width: 100%;
          z-index: 1;
        }
      }
    }
  }
  .card-desc {
    display: flex;
    text-align: left;
  }
  .skeleton-loader {
    height: calc(100% - 40px);
  }
  .loader-content-wrapper {
    height: 100%;
  }
  .k-grid {
    max-height: 100%;
    flex-flow: column;
  }
  .k-grid-header {
    background: #e4eaf0;
    position: relative;
    &::before {
      content: '';
      height: 33px;
      width: 100%;
      position: absolute;
      background-color: #4a687e;
    }
  }
  .k-grid-container {
    flex: 1;
    td {
      .v-icon {
        font-size: 16px;
      }
      pre {
        font-family: 'Work Sans';
        white-space: pre-wrap;
      }
    }
    .k-loader-container {
      z-index: 99;
    }
  }
  &.full-height-kendo-table {
    .sphere-table-container {
      position: relative !important;
      height: unset;
    }
    .k-grid-container {
      min-height: 27.14px;
    }
  }
  .k-pagination-footer {
    flex: 0;
  }
  .k-filter-row {
    background: #9bb2c3;
    th {
      padding: 0;
      vertical-align: top;
      &:empty {
        background: linear-gradient(to bottom, #e4eaf0 37px, #9bb2c3 40px);
      }
    }
  }
  thead .k-link {
    display: block;
  }
  .k-header {
    padding: 0;
    height: 32px;
  }
  .k-column-title {
    cursor: default;
    .k-checkbox {
      margin: 8px;
    }
  }
  .k-loader-canvas {
    display: none;
  }
  .k-grouping-row {
    position: relative;
    height: 33px;
    background-color: #b3ccdd;
    td {
      width: 100%;
    }
    .k-reset {
      color: rgba(0, 0, 0, 0.54);
    }
    .group-select-checkbox {
      position: absolute;
      top: 8px;
    }
  }
  &.actionable,
  &.granular {
    .k-grouping-row {
      .k-reset {
        .k-icon {
          margin-right: 30px;
        }
      }
    }
  }
  .k-grouping-row td,
  .k-group-cell {
    background-color: #b3ccdd;
    &:empty {
      background-color: #7b96a9 !important;
    }
  }
  .k-grouping-header {
    background-color: #e3e9ef;
    color: #6f787e;
    .k-indicator-container {
      font-size: 14px;
      padding: 0;
      min-height: 25px;
      .k-chip {
        padding: 4px;
        border-radius: 16px;
        background-color: #2d96e0;
        color: #ffffff;
        .k-chip-actions {
          margin-left: 4px;
          .k-icon {
            padding: 2px;
            border-radius: 50%;
            background-color: #fff;
            border: 1px solid red;
            color: red;
            cursor: pointer;
          }
        }
      }
    }
  }
}
.k-table-actions {
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
  .v-btn {
    background: transparent !important;
    border: 1px solid #0094fb !important;
    border-radius: 2px;
    box-shadow: none !important;
    color: #0094fb !important;
    height: 30px;
    font-size: 12px;
    font-weight: 500;
    margin: 0 0 0 7px;
    min-width: auto;
    text-transform: capitalize;
    &:disabled,
    &.theme--light.v-btn.v-btn--disabled:not(.v-btn--icon):not(.v-btn--text):not(.v-btn--outline) {
      background: transparent !important;
      background-color: transparent !important;
      border-color: rgba(0, 0, 0, 0.26) !important;
      color: rgba(0, 0, 0, 0.26) !important;
    }
    &.k-header-btn {
      background-color: #0094fb !important;
      border: none !important;
      min-width: 30px !important;
      padding: 0;
      .v-icon {
        color: #fff !important;
        font-size: 16px;
      }
      &:disabled {
        background-color: rgba(0, 0, 0, 0.26) !important;
      }
    }
    &.error--text:not(:disabled) {
      color: #ef5350 !important;
      border-color: #ef5350 !important;
    }
    &.success--text:not(:disabled) {
      border-color: #00ce7c !important;
      color: #00ce7c !important;
    }
  }
}
.k-sort-filter-menu {
  padding: 8px 0 4.5px;
  .v-subheader {
    font-size: 9px;
    height: 17px;
    padding: 3px 8px 0 8px;
  }
  hr {
    margin: 0 8px 4px 8px;
  }
}
.k-operation-check-icon {
  font-size: 12px !important;
  margin-left: 16px;
  opacity: 0;
  transition: 50ms ease-out;
}
.k-filter-menu-item {
  font-size: 10px;
  font-weight: 400;
  height: auto;
  margin: 0;
  padding: 0;
  text-transform: none;
  width: 100%;
  .v-btn__content {
    color: #303030 !important;
    height: auto;
    justify-content: space-between;
    padding: 2px 8px;
    width: 100%;
  }
  .v-icon {
    font-size: 15px;
  }
  &.active {
    .v-btn__content,
    .v-icon {
      color: #0094fb !important;
    }
    .k-operation-check-icon {
      opacity: 1;
    }
  }
  &:disabled .v-btn__content {
    color: #a6a6a6 !important;
  }
}
.k-error-menu-item .v-btn__content {
  justify-content: center;
  color: #d51923 !important;
}
.k-sort-icon-container {
  display: flex;
  align-items: center;
  .v-icon {
    font-size: 14px;
    transform: translateY(-1px);
    &.inverted {
      transform: rotate(-180deg) translateY(0);
    }
  }
}

.k-animation-container.k-animation-container-relative,
.menuable__content__active {
  z-index: 250 !important;
}
.table-header-actions {
  display: flex;
  margin-bottom: 6px;
  width: 100%;
  display: flex;
  margin-bottom: 6px;
}
.k-grid .k-grid-content .k-grid-norecords {
  background: var(--Blue-100, #eaeef2);
  & > td {
    padding: 30px;
    font-size: 13px;
    color: var(--Neutral-100, #707070);
    border: 1px solid var(--Neutral-500, #a6acb0);
    & > div {
      max-width: 370px;
      margin: auto;
    }
  }
}
/*color for status columns */
.status-class-Failed,
.status-class-Errors {
  color: #ef5350 !important;
}
.status-class-Succeeded {
  color: #4caf50 !important;
}
.status-class-Cancelled {
  color: darkslategrey !important;
}
.status-class-Scheduled,
.status-class-Scheduled\:.Recurring,
.status-class-In.Progress,
.status-class-Pending.Reporting {
  color: #0094fb !important;
}
.status-class-Succeeded.with.Warnings,
.status-class-Succeeded.with.Failure {
  color: #ff9800 !important;
}

</style>