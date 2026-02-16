<template>
  <v-menu
    v-model="showDropdown"
    offset-y
    left
    :close-on-content-click="false"
    :disabled="disabled"
  >
    <template v-slot:activator="{ on }">
      <div v-on="on">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn
              small
              flat
              class="k-header-btn k-header-filter-btn"
              :disabled="disabled"
              v-on="on"
            >
              <v-icon v-on="on">filter_alt</v-icon>
              <span v-if="appliedFilterCount" class="filter-check-icon">{{
                appliedFilterCount
              }}</span>
            </v-btn>
          </template>
          <span>Clear or hide sorts and filters</span>
        </v-tooltip>
      </div>
    </template>
    <v-list subheader class="k-sort-filter-menu">
      <v-subheader>Filter Controls:</v-subheader>
      <v-divider />
      <div>
        <v-btn
          flat
          color="info"
          :class="showFiltersClass"
          :disabled="isOrApplied"
          @mousedown="handleShowFiltersClick"
        >
          <span>
            <v-icon :size="14" class="mr-3 vertical-align-middle"
              >visibility</v-icon
            >
            <span>Show filters</span>
          </span>
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>
      <div>
        <v-btn
          flat
          color="info"
          :class="hideFiltersClass"
          :disabled="isOrApplied"
          @mousedown="handleHideFiltersClick"
        >
          <span>
            <v-icon :size="14" class="mr-3 vertical-align-middle"
              >visibility_off</v-icon
            >
            <span>Hide filters</span>
          </span>
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <div>
        <v-btn
          v-if="showAdvancedFilter"
          flat
          color="info"
          class="k-filter-menu-item active"
          @mousedown="handleApplyFilters"
        >
          <span>
            <v-icon :size="14" class="mr-3 vertical-align-middle"
              >filter_alt</v-icon
            >
            <span>Advanced Filters</span>
          </span>
          <v-icon
            v-if="appliedFilterCount"
            class="k-operation-check-icon"
            color="primary"
            >check</v-icon
          >
        </v-btn>
      </div>
      <v-divider style="margin-top: 4px; margin-bottom: 2px" />
      <div>
        <v-btn
          flat
          color="error"
          class="k-filter-menu-item k-error-menu-item"
          @mousedown="handleClearAllClick"
        >
          Clear all
        </v-btn>
      </div>
    </v-list>
  </v-menu>
</template>

<script>
import closeDropdownResizeMixin from '@/mixins/closeDropdownResize.mixin';

export default {
  name: 'FilterControlBtn',
  mixins: [closeDropdownResizeMixin],
  props: {
    // disable the inputs if there are no items
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    appliedFilterCount: {
      type: Number,
      default() {
        return 0;
      },
    },
    showAdvancedFilter: {
      type: Boolean,
      required: false,
      default: false,
    },
    isOrApplied: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      showDropdown: false,
      // could be computed props, instead use data props to improve performance
      showFiltersClass: 'k-filter-menu-item active',
      hideFiltersClass: 'k-filter-menu-item',
    };
  },
  methods: {
    /**
     * Change the text and icon of the list item and update parent
     */
    handleShowFiltersClick() {
      // udpate the active class
      this.showFiltersClass = 'k-filter-menu-item active';
      this.hideFiltersClass = 'k-filter-menu-item';
      // emit callback and close dropdonw
      this.toggleFiltersCallback(true);
    },
    /**
     * Change the text and icon of the list item and update parent
     */
    handleHideFiltersClick() {
      // udpate the active class
      this.hideFiltersClass = 'k-filter-menu-item active';
      this.showFiltersClass = 'k-filter-menu-item';
      // emit callback and close dropdonw
      this.toggleFiltersCallback(false);
    },
    /**
     * @param {Boolean} visible
     */
    toggleFiltersCallback(visible) {
      // emit function to toggle filter display
      this.$emit('set-show-filters', visible, false);
      // allow time for animation to play out before closing the dropdown menu
      setTimeout(() => {
        this.showDropdown = false;
      }, 300);
    },
    handleClearAllClick() {
      // emit callback to delete all sorts and filters
      this.$emit('clear-all');
      setTimeout(() => {
        this.showDropdown = false;
      }, 300);
    },
    /**
     * - called externall
     * - reset state to indicate filters are currently shown
     */
    showFilters() {
      this.showFiltersClass = 'k-filter-menu-item active';
      this.hideFiltersClass = 'k-filter-menu-item';
    },
    handleApplyFilters() {
      this.$emit('open-adv-filter');
    },
  },
};
</script>
<style>
.vertical-align-middle {
  vertical-align: middle;
}
.k-table-actions .v-btn.k-header-btn span.filter-check-icon {
  font-size: 11px;
  position: absolute;
  top: -16px;
  right: -5px;
  background: red;
  color: white;
  border-radius: 100%;
  font-weight: bold;
  height: 18px;
  width: 18px;
  line-height: 18px;
}
</style>
