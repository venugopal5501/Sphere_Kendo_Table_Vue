<template>
  <v-menu v-model="showDropdown" offset-y left :close-on-content-click="false">
    <template v-slot:activator="{ on }">
      <div v-on="on">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn
              small
                        text

              class="k-header-btn"
              :disabled="disabled"
              v-on="!disabled ? on : (showDropdown = false)"
            >
              <v-icon class="material-icons-outlined">view_column</v-icon>
            </v-btn>
          </template>
          <span>Hide or show columns</span>
        </v-tooltip>
      </div>
    </template>
    <v-list subheader class="k-sort-filter-menu">
      <v-subheader>Columns:</v-subheader>
      <v-divider />
      <v-list-tile class="k-column-properties">
        <draggable
          v-if="columnList"
          v-model="columnList"
          handle=".k-drag-active"
          :disabled="hideReorderAndLock"
          :class="{ 'not-draggable': hideReorderAndLock }"
          @end="onMoveCallback"
        >
          <div
            v-for="(column, index) in columnList"
            :key="index"
            :class="[
              'k-column-draggable-item',
              column.reorderable === false
                ? 'k-drag-disabled'
                : 'k-drag-active',
            ]"
          >
            <v-tooltip top attach=".k-column-properties" nudge-top="-40">
              <template v-slot:activator="{ on: tooltip }">
                <div
                  class="mr-auto"
                  v-on="
                    (filters &&
                      filters.filters.some((c) => c.field === column.field)) ||
                    (group && group.some((g) => g.field == column.field))
                      ? tooltip
                      : ''
                  "
                >
                  <v-checkbox
                    v-model="column.visible"
                    :label="column.title"
                    hide-details
                    color="link"
                    :disabled="
                      isColumnFiltered(filters, column.field) ||
                      (group && group.some((g) => g.field == column.field))
                    "
                    @change="handleChangeCheckbox(column, $event)"
                  />
                </div>
              </template>
              <span
                v-if="
                  filters &&
                  filters.filters.some((c) => c.field === column.field)
                "
                >Cannot hide filtered column</span
              >
              <span v-else>Cannot hide grouped column</span>
            </v-tooltip>
            <v-icon
              v-if="!hideReorderAndLock"
              :class="['k-lock-icon', { locked: column.locked }]"
              @click="handleClickLock(column)"
              >{{ column.locked ? 'lock' : 'lock_open' }}</v-icon
            >
            <v-icon v-if="!hideReorderAndLock" class="k-drag-sort-handle"
              >drag_indicator</v-icon
            >
          </div>
        </draggable>
      </v-list-tile>
      <v-divider style="margin-top: 8px" />
      <v-list-tile class="k-column-action-btns">
        <a
          class="link--text"
          href="javascript:void(0)"
          @mousedown.prevent="handleClickShowAllColumns"
          >Select All</a
        >
        <a
          class="link--text"
          href="javascript:void(0)"
          @mousedown.prevent="$emit('reset-default-columns')"
          >Reset (to default)</a
        >
      </v-list-tile>
      <v-list-tile
        v-if="SBuserIsAdmin && tableKey != ''"
        class="k-column-action-btns"
      >
        <a
          class="link--text"
          :href="`${SbBaseUrl}/Admin/#/table-controls/${tableKey}`"
          target="_blank"
        >
          Configure this table
        </a>
      </v-list-tile>
    </v-list>
  </v-menu>
</template>
<script>
import draggable from 'vuedraggable';

function COMPARE(a, b) {
  if (a.orderIndex < b.orderIndex) {
    return -1;
  }
  if (a.orderIndex > b.orderIndex) {
    return 1;
  }
  return 0;
}

export default {
  name: 'ColumnManagementBtn',
  components: {
    draggable,
  },
  props: {
    columns: {
      type: Array,
      required: false,
      default: null,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    filters: {
      type: Object,
      required: false,
      default: null,
    },
    hideReorderAndLock: {
      type: Boolean,
      required: false,
      default: false,
    },
    tableKey: {
      type: String,
      default: '',
    },
    group: {
      type: Array,
      required: false,
      default: null,
    },
  },
  data() {
    return {
      showDropdown: false,
      handle: { handle: '.k-drag-sort-handle' },
      columnList: null,
      unReorderableIndexes: [],
    };
  },
  computed: {
    SBuserIsAdmin() {
      return this.$store.getters.userIsAdmin;
    },
  },
  mounted() {
    this.updateColumns();
  },
  methods: {
    isColumnFiltered(filter, field) {
      if (filter) {
        if (filter.filters.some((c) => c.field === field)) return true;
        else {
          for (let i = 0; i < filter.filters.length; i++) {
            if (filter.filters[i].hasOwnProperty('logic')) {
              let found = this.isColumnFiltered(filter.filters[i], field);
              if (found) return found;
            }
          }
          return false;
        }
      } else return false;
    },
    /**
     * called externally to avoid a watcher
     */
    updateColumns(cols) {
      let columns = cols || this.columns;
      this.columnList = null;
      if (columns) {
        columns.sort(COMPARE);
        setTimeout(() => {
          // create the column list, change hidden to visible for our checkbox
          this.columnList = columns
            .filter(
              (column) =>
                // keep id and select fields hidden
                column.invisible !== true
            )
            .map((column) => {
              return {
                ...column,
                visible: !column.hidden,
              };
            });
          this.columnList.forEach((e, i) => {
            if (!e.reorderable) this.unReorderableIndexes.push(i);
          });
        }, 50);
      }
    },
    handleChangeCheckbox(column, event) {
      this.$emit('toggle-column', column.field, !event);
    },
    handleClickLock(column) {
      // update the local data structure
      column.locked = !column.locked;
      // emit call to update parent columns
      this.$emit('lock-column', column.field, column.locked);
    },
    // eslint-disable-next-line complexity
    onMoveCallback(event) {
      // make sure there are no unorderables in between these two
      let unReorderableFound = false;
      const a =
        event.oldIndex < event.newIndex ? event.newIndex : event.oldIndex;
      const b =
        event.oldIndex > event.newIndex ? event.oldIndex : event.newIndex;
      for (let i = a; i < b + 1; i++) {
        // if we find a column that can't be reordered
        if (
          this.columnList[i].reorderable === false ||
          this.unReorderableIndexes.includes(event.newIndex)
        ) {
          // set the flag and break the loop
          unReorderableFound = true;
          break;
        }
      }
      // if either of the indexes is not reorderable
      if (unReorderableFound) {
        // wait for things to settle then revert
        setTimeout(() => {
          this.updateColumns(this.columns);
        }, 1);
      } else {
        // get the field of the moved item and the index of the closest one it moved
        const oldOrderIndex = this.columnList[event.newIndex].orderIndex;
        const newOrderIndex =
          this.columnList[
            event.newIndex < event.oldIndex
              ? event.newIndex + 1
              : event.newIndex - 1
          ].orderIndex;
        // find the feidls of the columns we intend to reorder
        this.$emit('move-column', oldOrderIndex, newOrderIndex);
      }
    },
    handleClickShowAllColumns() {
      // check all the boxes
      this.columnList = this.columnList.map((col) => {
        return { ...col, visible: true };
      });
      // emit the callback
      this.$emit('show-all-columns');
    },
  },
};
</script>
<style lang="scss">
.k-column-properties {
  overflow-y: auto;
  height: 200px;
  .v-list__tile {
    display: block;
  }
  .k-column-draggable-item {
    list-style-type: none;
    width: 100%;
    display: flex;
    align-items: center;
  }
  .v-input {
    margin-top: 4px;
    padding-top: 0;
  }
  .v-input--selection-controls__input {
    height: 16px;
    margin-right: 6px;
    width: 16px;
  }
  .v-input__slot {
    margin-bottom: 0px !important;
  }
  label {
    font-size: 10px !important;
    margin-right: 10px;
    color: rgb(32, 32, 32) !important;
  }
  input {
    height: 16px;
    width: 16px;
  }
  .v-icon {
    font-size: 16px;
    height: 16px;
  }
  .k-lock-icon {
    margin-right: 4px;
    &:hover,
    &.locked {
      color: #0094fb;
    }
  }
  .k-drag-active {
    cursor: grab;
  }
  .not-draggable {
    .k-drag-active {
      cursor: initial;
    }
  }
  .k-drag-disabled .k-drag-sort-handle {
    cursor: default;
    opacity: 0.4;
  }
}
.k-column-action-btns .v-list__tile {
  height: 24px;
  justify-content: space-between;
  width: 100%;
  a {
    font-size: 10px;
    line-height: 12px;
    border-bottom: 1px solid #0094fb;
  }
}
</style>

<style scoped lang="scss">
.k-sort-filter-menu {
  min-width: 190px;
}
</style>
