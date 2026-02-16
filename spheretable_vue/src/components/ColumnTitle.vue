<template>
  <div
    ref="container"
    class="k-title-container"
    :data-cy="column.downloadable ? '' : 'non-downloadable'"
  >
    <v-tooltip top>
      <template v-slot:activator="{ on: on, attr }">
        <div
          v-bind="attr"
          class="k-title-text"
          v-on="hasTooltip ? on : undefined"
        >
          <span>{{ title }}</span>
        </div>
      </template>
      <span>{{ column.tooltip || title }}</span>
    </v-tooltip>

    <div>
      <v-btn
        v-if="showSortBtn"
                  flat

        small
        :class="sortingClass"
        :disabled="disabled"
        @click="handleSortClick"
      >
        <div class="k-sort-btn-content">
          <span class="k-sort-title-content">{{ sortText }}</span>
          <v-icon :class="iconClass">straight</v-icon>
          <span>{{ sortCount }}</span>
        </div>
      </v-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ColumnTitle',
  props: {
    field: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    // disable the inputs if there are no items
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    // Kendo is stupid and doesn't pass the whole column object, why???
    columns: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      isLocked: false,
      sortDirection: '',
      clickCount: 0, // click 1x = sort to opposite dir, 2x = remove sort
      /**
       * - Under normal circumstances the below props should be computed, but in
       *   the interest of efficiency, let's make them data props
       * - They are still reactive but we avoid the overhead of an additional
       *   function call + logic
       */
      sortingClass: 'k-sort-btn',
      sortText: 'A-Z',
      iconClass: 'k-sort-title-icon',
      sortCount: null,
      hasTooltip: false,
      /**
       * non-reactive props:
       * - showSortBtn {Boolean}
       */
    };
  },
  created() {
    // find this column object because stupid kendo does provide all the props
    const thisColumn = this.columns.find((col) => col.field === this.field);
    // only show the sort button if the column title is not an empty string
    this.showSortBtn = this.title.length > 0 && thisColumn.sortable !== false;
    this.column = thisColumn;
  },
  mounted() {
    this.setTooltip(true);
    // add the double click event listener via the DOM because we can't access the component as a ref
    const resizer = this.$refs.container
      .closest('th')
      .querySelector('.k-column-resizer');
    if (resizer)
      setTimeout(() => {
        if (this.$refs.container) {
          this.$refs.container
            .closest('th')
            .querySelector('.k-column-resizer')
            .addEventListener('dblclick', this.doubleClickExpand, false);
        }
      }, 500);
  },
  methods: {
    /**
     * Called by mounted
     * Also called externally from parent component when column is resized
     */
    // eslint-disable-next-line complexity
    setTooltip(onMounted = false) {
      let thWidth =
          onMounted && this.column.width
            ? this.column.width
            : this.$el.getBoundingClientRect().width,
        availableWidth =
          thWidth -
          this.$el.querySelector('span + div').getBoundingClientRect().width,
        titleElement = this.$el.querySelector('.k-title-text'),
        titlePadding = titleElement
          ? parseInt(
              window
                .getComputedStyle(titleElement, null)
                .getPropertyValue('padding-left')
            )
          : '',
        titleWidth = titlePadding
          ? this.$el.querySelector('.k-title-text span').getBoundingClientRect()
              .width + titlePadding
          : '';
      if (titleWidth) {
        this.hasTooltip = this.column.alwaysShowTooltip
          ? true
          : availableWidth == 0
          ? false
          : availableWidth < titleWidth;
      }
    },
    handleSortClick(event) {
      // stop propagation because there is some unwanted kendo event firing
      event.stopPropagation();
      // if we already have 1 click
      if (this.clickCount === 1) {
        // set the sort to the opposite
        const sortDir = this.sortDirection === 'asc' ? 'desc' : 'asc';
        // update the reactive JSX props
        this.updateReactiveProps(sortDir);
        // update the state
        this.sortDirection = sortDir;
        // // set the sort
        this.$emit('change-sort', this.field, sortDir, 'column-filter');
        // increment the click count
        this.clickCount = 2;
      } else if (this.clickCount === 2) {
        // update the reactive jsx props
        this.updateReactiveProps('');
        // remove sort
        this.sortDirection = '';
        // remove the sort
        this.$emit('remove-sort', this.field, 'column-filter');
        // reset the click count
        this.clickCount = 0;
        // reset the sort count
        this.sortCount = null;
        // first click sort ascending
        this.hasTooltip = false;
      } else {
        // update the reactive JSX props
        this.updateReactiveProps('asc');
        // update the state
        this.sortDirection = 'asc';
        // // set the sort
        this.$emit('change-sort', this.field, 'asc', 'column-filter');
        // increment the click count
        this.clickCount = 1;
      }
    },
    /**
     * Called externally from parent component
     * @param {String} dir 'asc' | 'desc' | empty string
     */
    setSort(dir) {
      // update the reactive JSX props
      this.updateReactiveProps(dir);
      // set the sort direction
      this.sortDirection = dir;
      // reset click count
      this.clickCount = dir.length > 0 ? 1 : 0;
    },
    /**
     * Called externally from parent component
     * @param {Number} sortCount
     */
    setSortCount(sortCount) {
      this.sortCount = sortCount;
      // Updating tooltips visibility after sorting
      setTimeout(() => {
        this.setTooltip();
      }, 350);
    },
    /**
     * - Usually these would be updated with computed props
     * - We can save some memory overhead by avoiding evaluation inside the
     *   observer, updating them manually on an as-needed basis
     * @param {String} dir
     */
    updateReactiveProps(dir) {
      // we are sorting by something
      this.sortingClass = `k-sort-btn ${dir.length > 0 ? 'visible' : ''}`;
      // if we are sorting in descending order
      if (dir === 'desc') {
        this.sortText = 'Z-A';
        this.iconClass = 'k-sort-title-icon inverted';
        // if ascending
      } else {
        this.sortText = 'A-Z';
        this.iconClass = 'k-sort-title-icon';
      }
    },
    doubleClickExpand(e) {
      e.stopPropagation();
      e.preventDefault();
      this.$emit('fit-column-content', this.column.field);
    },
  },
};
</script>

<style scoped lang="scss">
// The textter your SCSS, the more efficient
.k-title-container {
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
  &:hover .k-sort-btn {
    opacity: 1;
  }
}
.k-sort-btn {
  color: #fff;
  margin: 0;
  padding: 0;
  min-width: 40px;
  margin-right: 8px;
  opacity: 0;
  transition-timing-function: ease-out;
  &.visible {
    opacity: 1;
    min-width: 50px;
  }
  &.v-btn--disabled {
    display: none;
  }
}
.k-sort-btn-content {
  display: flex;
  align-items: center;
  margin-right: -6px;
  margin-bottom: -2px;
}
.k-title-text {
  flex-grow: 1;
  overflow: hidden;
  padding: 8px 0 8px 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.k-sort-title-content {
  font-size: 9px;
}
.k-sort-title-icon {
  font-size: 18px;
  transform: translateY(-2px);
  &.inverted {
    transform: rotate(-180deg) translateY(0);
  }
}
</style>