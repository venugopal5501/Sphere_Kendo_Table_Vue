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
          text
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
          text
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
      <!-- contains -->
      <div>
        <v-btn
          text
          color="info"
          :class="operator.contains"
          @mousedown="handleOperatorClick('Contains', 'contains')"
        >
          Contains
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- does not contain -->
      <div>
        <v-btn
          text
          color="info"
          :class="operator.doesnotcontain"
          @mousedown="handleOperatorClick('Does not contain', 'doesnotcontain')"
        >
          Does Not Contain
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- equal to -->
      <div>
        <v-btn
          text
          color="info"
          :class="operator.eq"
          @mousedown="handleOperatorClick('Equal to', 'eq')"
        >
          Equal to
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- not equal to -->
      <div>
        <v-btn
          text
          color="info"
          :class="operator.neq"
          @mousedown="handleOperatorClick('Not equal to', 'neq')"
        >
          Not equal to
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- starts with -->
      <div>
        <v-btn
          text
          color="info"
          :class="operator.startswith"
          @mousedown="handleOperatorClick('Starts with', 'startswith')"
        >
          Starts With
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- ends with -->
      <div>
        <v-btn
          text
          color="info"
          :class="operator.endswith"
          @mousedown="handleOperatorClick('Ends with', 'endswith')"
        >
          Ends With
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- is empty -->
      <div>
        <v-btn
          text
          color="info"
          :class="empty.isempty"
          @mousedown="handleEmptyClick('Empty', 'isempty')"
        >
          Empty
          <v-icon class="k-operation-check-icon" color="primary">check</v-icon>
        </v-btn>
      </div>

      <!-- is not empty -->
      <div>
        <v-btn
          text
          color="info"
          :class="empty.isnotempty"
          @mousedown="handleEmptyClick('Not empty', 'isnotempty')"
        >
          Not Empty
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

import filterOptionsMixin from '@/mixins/filterOptions.mixin';

export default {
  name: 'TextFilterOptions',
  mixins: [filterOptionsMixin],
  data() {
    return {
      operator: {
        contains: 'k-filter-menu-item active', // default active
        doesnotcontain: 'k-filter-menu-item',
        eq: 'k-filter-menu-item',
        neq: 'k-filter-menu-item',
        startswith: 'k-filter-menu-item',
        endswith: 'k-filter-menu-item',
      },
    };
  },

  methods: {
    getNewOperatorObj() {
      return {
        contains: 'k-filter-menu-item',
        doesnotcontain: 'k-filter-menu-item',
        eq: 'k-filter-menu-item',
        neq: 'k-filter-menu-item',
        startswith: 'k-filter-menu-item',
        endswith: 'k-filter-menu-item',
      };
    },
  },
};
</script>
