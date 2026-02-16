export default {
  props: {
    sortable: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  data() {
    /**
     * - We use normal data props to store class names instead of embedding
     *   the logic in the JSX to avoid additional Observers and maintain
     *   performance.
     * - Also we can kill 2 birds with 1 stone by outputting the class and
     *   determining active state at the same time.
     * - i.e. if class name .includes('active'), then it's active
     */
    return {
      sort: {
        asc: 'k-filter-menu-item',
        desc: 'k-filter-menu-item',
      },
      empty: {
        isempty: 'k-filter-menu-item',
        isnotempty: 'k-filter-menu-item',
        isnull: 'k-filter-menu-item',
        isnotnull: 'k-filter-menu-item',
      },
      boolean: {
        true: 'k-filter-menu-item',
        false: 'k-filter-menu-item',
      },
    };
  },
  /**
   * - Complex logic takes place here so it only computes when called upon by
   *   the user. Instead of using constant memory resources, we opt for a
   *   quick small spike of resource usage.
   */
  methods: {
    /**
     * set a sort direction
     * @param {String} dir
     */
    handleSortClick(dir) {
      // if the sort is already active
      if (this.sort[dir].includes('active')) {
        // remove the active class
        this.sort = {
          asc: 'k-filter-menu-item',
          desc: 'k-filter-menu-item',
        };
        // remove the sort dir
        this.$emit('set-sort-dir', '');
        // if no sort or the other sort is active
      } else {
        // set the current sort
        this.$set(this.sort, dir, 'k-filter-menu-item active');
        // create a fresh sort object
        this.$set(
          this.sort,
          dir === 'asc' ? 'desc' : 'asc',
          'k-filter-menu-item'
        );
        // update the dir
        this.$emit('set-sort-dir', dir);
      }
    },
    /**
     * Set operator
     * @param {String} label
     * @param {String} value
     */
    handleOperatorClick(label, value) {
      // redundant but improves animation performance
      this.$set(this.operator, value, 'k-filter-menu-item active');
      // if the user selected the 'between' option
      if (value === 'between') {
        // set the between prop of the parent ColumnFilter
        this.$emit('set-between', true);
        // for all other values (operators)
      } else {
        // remove the between flag
        this.$emit('set-between', false);
        // emit callback to set the filter operator
        this.$emit('set-filter-operator', { label, value });
      }
      // create a fresh operator object
      const operator = this.getNewOperatorObj();
      // set the new class to active
      operator[value] = 'k-filter-menu-item active';
      // update the operator data prop
      this.operator = operator;
    },
    /**
     * Set empty
     * @param {String} label
     * @param {String} operator
     */
    handleEmptyClick(label, operator) {
      // if the emptiness is already active
      if (this.empty[operator].includes('active')) {
        // remove the active class
        this.$set(this.empty, operator, 'k-filter-menu-item');
        // remove this emptiness
        this.$emit('remove-empty-filter', operator);
        // if the other dir is already active
      } else {
        // redundant but improves animation performance
        this.$set(this.empty, operator, 'k-filter-menu-item active');
        // emit the sort direction
        this.$emit('set-empty-filter', { label, operator });
        // create a fresh empty object
        const empty = {
          isempty: 'k-filter-menu-item',
          isnotempty: 'k-filter-menu-item',
          isnull: 'k-filter-menu-item',
          isnotnull: 'k-filter-menu-item',
        };
        // set the new class to active
        empty[operator] = 'k-filter-menu-item active';
        // update the operator data prop
        this.empty = empty;
      }
    },
    /**
     * Set boolean filter
     * @param {String} label
     * @param {String} operator
     */
    handleBooleanClick(label, operator) {
      // if the emptiness is already active
      if (this.boolean[label].includes('active')) {
        // remove the active class
        this.$set(this.boolean, label, 'k-filter-menu-item');
        // remove this boolean filter
        this.$emit('remove-boolean-filter', label);
        // if the other dir is already active
      } else {
        // redundant but improves animation performance
        this.$set(this.boolean, operator, 'k-filter-menu-item active');
        // emit the sort direction
        this.$emit('set-boolean-filter', { label, operator });
        // create a fresh empty object
        const boolean = {
          true: 'k-filter-menu-item',
          false: 'k-filter-menu-item',
        };
        // set the new class to active
        boolean[label] = 'k-filter-menu-item active';
        // update the operator data prop
        this.boolean = boolean;
      }
    },
    /**
     * - called externally
     * - remove empty and sort active class state
     */
    clearFilters() {
      // create a fresh sort object
      this.sort = {
        asc: 'k-filter-menu-item',
        desc: 'k-filter-menu-item',
      };
      // create a fresh empty object
      this.clearEmpties();
      this.clearBoolean();
      // if this is a date input
      if (this.deactivateInterval) {
        // remove the interval selection
        this.deactivateInterval();
      }
    },
    /**
     * - called externally
     * - clear a single empty active state
     */
    clearEmpties() {
      this.empty = {
        isempty: 'k-filter-menu-item',
        isnotempty: 'k-filter-menu-item',
        isnull: 'k-filter-menu-item',
        isnotnull: 'k-filter-menu-item',
      };
    },
    /**
     * - called externally
     * - clear a single boolean active state
     */
    clearBoolean() {
      this.boolean = {
        true: 'k-filter-menu-item',
        false: 'k-filter-menu-item',
      };
    },
    /**
     *
     * @param {String} dir 'asc' | 'desc' | empty string
     */
    setSort(dir) {
      // refresh the sort classes
      const sort = {
        asc: 'k-filter-menu-item',
        desc: 'k-filter-menu-item',
      };
      // if we have a sort direction
      if (dir !== '') {
        // update the cooresponding direction class
        sort[dir] = 'k-filter-menu-item active';
      }
      // set the sort
      this.sort = sort;
    },
    // set default operators
    setDefaultOperators() {
      let keys = Object.keys(this.operator);
      let operator = this.getNewOperatorObj();
      operator[keys[0]] = 'k-filter-menu-item active';
      this.operator = operator;
    },
  },
};
