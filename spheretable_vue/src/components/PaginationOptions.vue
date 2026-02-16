<template>
  <v-menu
    v-model="showDropdown"
    offset-y
    style="z-index: 10; display: inline-block"
    :close-on-content-click="false"
    :disabled="isDisabled"
  >
    <template v-slot:activator="{ on }">
      <v-btn
        small
        class="k-pagination-options-btn"
        :disabled="isDisabled"
        v-on="on"
        @mousedown="addResizeEventListener"
      >
        {{ pageSize }}
        <v-icon color="link">arrow_drop_down</v-icon>
      </v-btn>
    </template>
    <v-list subheader class="k-sort-filter-menu">
      <v-subheader>Rows Per Page:</v-subheader>
      <v-divider />

      <!-- 5 -->
      <div>
        <v-btn
          text
          color="info"
          :class="tileClass['5']"
          @mousedown="handlePageSizeOptionClick(5)"
        >
          <span>5</span>
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- 10 -->
      <div>
        <v-btn
          text
          color="info"
          :class="tileClass['10']"
          :disabled="isDisabled_10"
          @mousedown="handlePageSizeOptionClick(10)"
        >
          <span>10</span>
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- 25 -->
      <div>
        <v-btn
          text
          color="info"
          :class="tileClass['25']"
          :disabled="isDisabled_25"
          @mousedown="handlePageSizeOptionClick(25)"
        >
          <span>25</span>
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- 50 -->
      <div>
        <v-btn
          text
          color="info"
          :class="tileClass['50']"
          :disabled="isDisabled_50"
          @mousedown="handlePageSizeOptionClick(50)"
        >
          <span>50</span>
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- 100 -->
      <div>
        <v-btn
          text
          color="info"
          :class="tileClass['100']"
          :disabled="isDisabled_100"
          @mousedown="handlePageSizeOptionClick(100)"
        >
          <span>100</span>
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- 250 -->
      <div>
        <v-btn
          text
          color="info"
          :class="tileClass['250']"
          :disabled="isDisabled_250"
          @mousedown="handlePageSizeOptionClick(250)"
        >
          <span>250</span>
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- all -->
      <div>
        <v-btn
          v-if="displayAllOption"
          text
          color="info"
          :class="tileClass['all']"
          @mousedown="handlePageSizeOptionClick('all')"
        >
          <span>All</span>
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>
    </v-list>
  </v-menu>
</template>

<script>
import closeDropdownResizeMixin from '@/mixins/closeDropdownResize.mixin';

export default {
  name: 'PaginationOptions',
  mixins: [closeDropdownResizeMixin],
  props: {
    totalItemsCount: {
      type: Number,
      required: true,
    },
    // dependency of isDisabled data state
    filteredItemsCount: {
      type: Number,
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
  },
  data() {
    return {
      pageSize: 10,
      showDropdown: false,
      tileClass: {
        5: 'k-filter-menu-item',
        10: 'k-filter-menu-item active',
        25: 'k-filter-menu-item',
        50: 'k-filter-menu-item',
        100: 'k-filter-menu-item',
        250: 'k-filter-menu-item',
        all: 'k-filter-menu-item',
      },
      /**
       * Non-reactive data props:
       * - displayAllOption {Boolean}
       */
    };
  },
  computed: {
    isDisabled() {
      return this.totalItemsCount === 0 || this.disabled;
    },
    // disable page size options if the data set is too small
    isDisabled_10() {
      return this.filteredItemsCount < 6;
    },
    isDisabled_25() {
      return this.filteredItemsCount < 11;
    },
    isDisabled_50() {
      return this.filteredItemsCount < 26;
    },
    isDisabled_100() {
      return this.filteredItemsCount < 51;
    },
    isDisabled_250() {
      return this.filteredItemsCount < 101;
    },
    displayAllOption() {
      return !this.isServerSide && this.totalItemsCount < 1000;
    },
  },
  methods: {
    /**
     * @param {Number|String} pageSize 5, 10, 25, 50, 100, 250 | 'all'
     */
    handlePageSizeOptionClick(pageSize) {
      // this is redundant but updating the class first improves animation responsiveness
      this.tileClass[pageSize] = 'k-filter-menu-item active';
      // if we are already at this page size, do nothing
      if (this.pageSize === pageSize) return false;
      // set the data props
      this.setPageSizeOption(pageSize);
      // emit the callback function
      this.$emit('set-page-size', pageSize);
      // allow time for animation to play out before closing the dropdown menu
      setTimeout(() => {
        this.showDropdown = false;
      }, 350);
    },
    /**
     * used both internall and externally by parent
     * @param {Number|String} pageSize 5, 10, 25, 50, 100, 250 | 'all'
     */
    setPageSizeOption(pageSize) {
      // set the page size
      this.pageSize = pageSize;
      // create a new empty tile class object
      const tileClass = {
        5: 'k-filter-menu-item',
        10: 'k-filter-menu-item',
        25: 'k-filter-menu-item',
        50: 'k-filter-menu-item',
        100: 'k-filter-menu-item',
        250: 'k-filter-menu-item',
        all: 'k-filter-menu-item',
      };
      // set the current tile class
      tileClass[pageSize] = 'k-filter-menu-item active';
      // set the data property
      this.tileClass = tileClass;
    },
  },
};
</script>

<style lang="scss">
.k-pagination-options-btn {
  margin: 0;
  margin-left: 8px;
  min-width: 0;
  padding-right: 0;
  text-transform: capitalize;
}
</style>
