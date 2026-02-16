<template>
  <v-list subheader class="k-sort-filter-menu">
    <div v-if="sortable">
      <v-subheader>Sorting:</v-subheader>
      <v-divider />

      <!-------------------------------------------------------------------------- 
      - This component is designed to have as little reactivity as possible.
      - Inputs are hard coded instead of passing them through a for loop. This 
        is more efficient because it uses fewer JS Observers and less logic +
        memory once compiled.
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
              A-Z
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
              Z-A
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
      <!-- True -->
      <div>
        <v-btn
          flat
          color="info"
          :class="boolean.true"
          @mousedown="handleBooleanClick(true, 'eq')"
        >
          True
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- False -->
      <div>
        <v-btn flat
          color="info"
          :class="boolean.false"
          @mousedown="handleBooleanClick(false, 'eq')"
        >
          False
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>
    </span>

    <v-divider style="margin-top: 4px; margin-bottom: 2px" />
    <slot>
      <!-- clear all btn goes here -->
    </slot>
  </v-list>
</template>

<script>

import filterOptionsMixin from '../mixins/filterOptions.mixin';

export default {
  name: 'BooleanFilterOptions',
  mixins: [filterOptionsMixin],
  data() {
    return {
      operator: {
        true: 'k-filter-menu-item',
        false: 'k-filter-menu-item',
      },
    };
  },

  methods: {
    getNewOperatorObj() {
      return {
        true: 'k-filter-menu-item',
        false: 'k-filter-menu-item',
      };
    },
  },
};
</script>
