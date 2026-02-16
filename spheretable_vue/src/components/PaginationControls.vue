<template>
  <v-container grid-list-xs fluid class="k-pagination-footer" align-center>
    <v-layout row wrap :style="{ alignItems: 'center' }">
      <!-- rows per page dropdown -->
      <v-flex xs4>
        <span>Rows Per Page:</span>
        <pagination-options
          ref="pagination-options"
          :total-items-count="totalItemsCount"
          :filtered-items-count="filteredItemsCount"
          :is-server-side="isServerSide"
          :disabled="disabled"
          @set-page-size="setPageSize"
        />
        <span v-if="selectedItemsCount > 0" class="ml-1"
          ><em
            >{{ selectedItemsCount }} Row<span v-if="selectedItemsCount > 1"
              >s</span
            >
            Selected</em
          ></span
        >
      </v-flex>

      <!-- page navigation controls -->
      <v-flex xs4 class="k-page-nav-ctrls">
        <v-btn
          flat
          icon
          color="link"
          :disabled="isOnFirstPage"
          @mousedown="handleFirstPageNavClick"
        >
          <v-icon>skip_previous</v-icon>
        </v-btn>
        <v-btn
          flat
          icon
          color="link"
          :disabled="isOnFirstPage"
          @mousedown="handlePrevPageNavClick"
        >
          <v-icon :size="31">arrow_left</v-icon>
        </v-btn>
        <span :style="{ padding: '0 8px' }">{{ currPage }}</span>
        <v-btn
          flat
          icon
          color="link"
          :disabled="isOnLastPage"
          @mousedown="handleNextPageNavClick"
        >
          <v-icon :size="31">arrow_right</v-icon>
        </v-btn>
        <v-btn
          flat
          icon
          color="link"
          :disabled="isOnLastPage"
          @mousedown="handleLastPageNavClick"
        >
          <v-icon>skip_next</v-icon>
        </v-btn>
      </v-flex>

      <!-- items count, page and total -->
      <v-flex xs4 class="text-xs-right">
        {{ showingAmount }}
        <span v-if="hasFilters">(filtered from {{ totalItemsCount }})</span>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import PaginationOptions from './PaginationOptions.vue';

/**
 * - Close the dropdown menu when the user resizes the browser
 * - window.resize events are expensive, we want to add/remove as needed
 */

export default {
  name: 'PaginationControls',
  components: {
    PaginationOptions,
  },
  props: {
    skip: {
      type: Number,
      required: true,
    },
    filteredItemsCount: {
      type: Number,
      required: true,
    },
    totalItemsCount: {
      type: Number,
      required: true,
    },
    hasFilters: {
      type: Boolean,
      required: true,
    },
    // display the 'all' option for client-side tables only
    isServerSide: {
      type: Boolean,
      required: false,
      default: false,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    selectedItemsCount: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  data() {
    return {
      showDropdown: false,
      rowsPerPage: 10, // default 10
      currPage: 1,
    };
  },
  computed: {
    isOnFirstPage() {
      return this.rowsPerPage === 'all' || this.currPage === 1 || this.disabled;
    },
    isOnLastPage() {
      return (
        this.rowsPerPage === 'all' ||
        this.filteredItemsCount === 0 ||
        Math.ceil(this.filteredItemsCount / this.rowsPerPage) ===
          this.currPage ||
        this.disabled
      );
    },
    /**
     * @returns {String} e.g. 'Showing 1-10 of 25' | 'Showing 0'
     */
    showingAmount() {
      // if there are no filtered items
      if (this.filteredItemsCount === 0) return 'Showing 0';
      // calculate the theoretical index of the last row in the page
      const lastRowIndex =
        this.skip +
        (this.rowsPerPage === 'all'
          ? this.filteredItemsCount
          : this.rowsPerPage);
      // if the lastRowIndex exceeds the filtered items count, show that instead
      const endingRowIndex =
        lastRowIndex > this.filteredItemsCount
          ? this.filteredItemsCount
          : lastRowIndex;
      // return the string
      return `Showing ${this.skip + 1}-${endingRowIndex} of ${
        this.filteredItemsCount
      }`;
    },
  },
  methods: {
    /**
     * Callback from PaginationOptions
     * @param {Number|String} pageSize 5, 10, 25... | 'all'
     * @param {Boolean} emitCallback should we update the parent component
     */
    setPageSize(pageSize, emitCallback = true, isAllApplied = false) {
      // update the local variable
      this.rowsPerPage = pageSize;
      // propagate upward: emit pagination update event
      if (emitCallback) {
        this.$emit(
          'set-page-size',
          pageSize === 'all' ? this.totalItemsCount : pageSize,
          pageSize === 'all'
        );
        // propagate downward: update the child component
      } else {
        pageSize = isAllApplied ? 'all' : pageSize;
        this.$refs['pagination-options'].setPageSizeOption(pageSize);
      }
    },
    /**
     * Navigate to the first page
     */
    handleFirstPageNavClick() {
      // update the local current page variable
      this.currPage = 1;
      // emit the callback
      this.$emit('set-page', 1, false, true);
    },
    /**
     * Navigate to the previous page
     */
    handlePrevPageNavClick() {
      // subtract 1 form the current page number
      const currPage = this.currPage - 1;
      // set the curr page property
      this.currPage = currPage;
      // emit the callback to slice up the array of items
      this.$emit('set-page', currPage, true);
    },
    /**
     * Navigate to the next page
     */
    handleNextPageNavClick() {
      // add 1 to the current page number
      const currPage = this.currPage + 1;
      // update the curr page state
      this.currPage = currPage;
      // emit the callback
      this.$emit('set-page', currPage);
    },
    /**
     * Navigate to the last page
     */
    handleLastPageNavClick() {
      // get the max page number
      const lastPage = Math.ceil(this.filteredItemsCount / this.rowsPerPage);
      // set the current page
      this.currPage = lastPage;
      // emit the callback
      this.$emit('set-page', lastPage, false, true);
    },
    /**
     * Called externally from parent
     * @param {Number} page
     */
    setPage(page) {
      this.currPage = page;
    },
  },
};
</script>

<style lang="scss">
.k-pagination-footer {
  background: #e4eaf0;
  padding: 2px 6px;
}
.k-page-nav-ctrls {
  text-align: center;
  button {
    margin: 0;
    width: 28px;
  }
}
</style>
