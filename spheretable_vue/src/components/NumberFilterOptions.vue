<template>
  <v-list subheader class="k-sort-filter-menu k-number-filter-menu">
    <div v-if="sortable">
      <v-subheader>Sorting:</v-subheader>
      <v-divider />

      <!-------------------------------------------------------------------------- 
      Why is this code repetitive?
       - TextFilterOptions, NumberFilterOptions, DateFilterOptions are all very
         similar
       - Hard coding allows us to avoid additional props and JSX logic overhead
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
          <v-icon class="k-operation-check-icon" color="info">check</v-icon>
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
          <v-icon class="k-operation-check-icon" color="info">check</v-icon>
        </v-btn>
      </div>
    </div>

    <v-subheader>Filter:</v-subheader>
    <v-divider />

    <span data-options="filter">
      <!-- equal to -->
      <div>
        <v-btn
          flat
          color="info"
          :class="operator.eq"
          @mousedown="handleOperatorClick('Equal to', 'eq')"
        >
          <span>
            <span class="k-filter-item-symbol">&#61;</span>
            Equal to
          </span>
          <v-icon class="k-operation-check-icon" color="info">check</v-icon>
        </v-btn>
      </div>

      <!-- not equal to -->
      <div>
        <v-btn
          flat
          color="info"
          :class="operator.neq"
          @mousedown="handleOperatorClick('Not equal to', 'neq')"
        >
          <span>
            <span class="k-filter-item-symbol">&ne;</span>
            Not equal to
          </span>
          <v-icon class="k-operation-check-icon" color="info">check</v-icon>
        </v-btn>
      </div>

      <!-- greater than or equal to -->
      <div>
        <v-btn
          flat
          color="info"
          :class="operator.gte"
          @mousedown="handleOperatorClick('Greater than or equal to', 'gte')"
        >
          <span>
            <span class="k-filter-item-symbol">&GreaterEqual;</span>
            Greater than or equal to
          </span>
          <v-icon class="k-operation-check-icon" color="info">check</v-icon>
        </v-btn>
      </div>

      <!-- greater than -->
      <div>
        <v-btn
          flat
          color="info"
          :class="operator.gt"
          @mousedown="handleOperatorClick('Greater than', 'gt')"
        >
          <span>
            <span class="k-filter-item-symbol">&#62;</span>
            Greater than
          </span>
          <v-icon class="k-operation-check-icon" color="info">check</v-icon>
        </v-btn>
      </div>

      <!-- less than or equal to -->
      <div>
        <v-btn
          flat
          color="info"
          :class="operator.lte"
          @mousedown="handleOperatorClick('Less than or equal to', 'lte')"
        >
          <span>
            <span class="k-filter-item-symbol">&leq;</span>
            Less than or equal to
          </span>
          <v-icon class="k-operation-check-icon" color="info">check</v-icon>
        </v-btn>
      </div>

      <!-- less than -->
      <div>
        <v-btn
          flat
          color="info"
          :class="operator.lt"
          @mousedown="handleOperatorClick('Less than', 'lt')"
        >
          <span>
            <span class="k-filter-item-symbol">&#60;</span>
            Less than
          </span>
          <v-icon class="k-operation-check-icon" color="info">check</v-icon>
        </v-btn>
      </div>

      <!-- is null -->
      <div>
        <v-btn
          flat
          color="info"
          :class="empty.isnull"
          @mousedown="handleEmptyClick('Null', 'isnull')"
        >
          <span>
            <span class="k-filter-item-symbol">&empty;</span>
            Null
          </span>
          <v-icon class="k-operation-check-icon" color="info">check</v-icon>
        </v-btn>
      </div>

      <!-- is not null -->
      <div>
        <v-btn
          flat
          color="info"
          :class="empty.isnotnull"
          @mousedown="handleEmptyClick('Not null', 'isnotnull')"
        >
          <span>
            <span class="k-filter-item-symbol">&ne;&empty;</span>
            Not null
          </span>
          <v-icon class="k-operation-check-icon" color="info">check</v-icon>
        </v-btn>
      </div>
    </span>

    <!-- between -->
    <div>
      <v-btn
        flat
        color="info"
        :class="operator.between"
        @mousedown="handleOperatorClick('Between', 'between')"
      >
        <span>
          <span class="k-filter-item-symbol" style="font-size: 8px">
            &lbrack;a&comma;b&rbrack;
          </span>
          Between
        </span>
        <v-icon class="k-operation-check-icon" color="info">check</v-icon>
      </v-btn>
    </div>

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
  data() {
    return {
      operator: {
        eq: 'k-filter-menu-item active', // default active
        neq: 'k-filter-menu-item',
        lt: 'k-filter-menu-item',
        lte: 'k-filter-menu-item',
        gt: 'k-filter-menu-item',
        gte: 'k-filter-menu-item',
        between: 'k-filter-menu-item',
      },
    };
  },
  methods: {
    getNewOperatorObj() {
      return {
        eq: 'k-filter-menu-item',
        neq: 'k-filter-menu-item',
        lt: 'k-filter-menu-item',
        lte: 'k-filter-menu-item',
        gt: 'k-filter-menu-item',
        gte: 'k-filter-menu-item',
        between: 'k-filter-menu-item',
      };
    },
  },
};
</script>

<style lang="scss">
.k-number-filter-menu {
  .k-filter-item-symbol {
    width: 27px;
    text-align: center;
    display: inline-block;
    font-weight: 500;
  }
}
</style>
