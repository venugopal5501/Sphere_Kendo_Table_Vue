<template>
  <Draggable
    v-if="field === 'rowReorder'"
    ref="draggable"
    @press="onPress"
    @drag="onDrag"
    @release="onRelease"
  >
    <td :data-itemid="dataItem.Priority" :class="tdClass">
      <span data-drag-handle="true">
        <v-icon
          id="reordericon"
          class="material-icons"
          style="pointer-events: none"
        >
          drag_indicator
        </v-icon>
      </span>
    </td>
  </Draggable>
  <td v-else>
    <v-icon
      id="reordericon"
      class="material-icons"
      style="pointer-events: none"
    >
      block
    </v-icon>
  </td>
</template>
<script>
import { Draggable } from '@progress/kendo-vue-common';
import { reorderIcon } from '@progress/kendo-svg-icons';
export default {
  emits: {
    pressHandler: null,
    dragHandler: null,
    releaseHandler: null,
  },
  components: {
    Draggable,
  },
  props: {
    field: {
      type: String,
      default() {
        return '';
      },
    },
    dataItem: {
      type: Object,
      default() {
        return {};
      },
    },
    dropPosition: {
      type: String,
      default() {
        return '';
      },
    },
  },
  data() {
    return {
      isDragged: false,
      reorderIcon,
      dragClass: '',
      itemId: null,
    };
  },
  computed: {
    tdClass: function () {
      return this.dropPosition;
    },
  },
  methods: {
    onPress(event) {
      const element = this.$refs.draggable && this.$refs.draggable.element;
      if (!event.isTouch) event.originalEvent.preventDefault();
      this.isDragged = true;
      this.itemId = element ? element.getAttribute('data-itemid') : null;
      if (element) {
        this.$emit('pressHandler', this.$props.dataItem, event, element);
      }
      this.toggleRow('disable');
    },
    onDrag(event) {
      const element = this.$refs.draggable && this.$refs.draggable.element;
      if (!event.isTouch) {
        event.originalEvent.preventDefault();
      }
      event.originalEvent.stopPropagation();
      if (element) {
        this.$emit('dragHandler', this.$props.dataItem, event, element);
      }
    },
    onRelease(event) {
      document.getElementsByTagName('body')[0].style.cursor = 'default';
      const element = this.$refs.draggable && this.$refs.draggable.element;
      this.isDragged = false;
      if (element) {
        this.$emit('releaseHandler', this.$props.dataItem, event, element);
      }
      this.toggleRow('enable');
    },
    toggleRow(type) {
      document.querySelectorAll('.k-grid tbody tr').forEach((row) => {
        const td = row.querySelector(`td[data-itemid="${this.itemId}"]`);
        const firstTd = row.querySelector('td:first-child');
        if (td) {
          row.classList.toggle('disabled-row', type === 'disable');
        }
        if (firstTd && type !== 'disable') {
          firstTd.classList.remove('above', 'below');
        }
      });
    },
  },
};
</script>

<style>
#reordericon {
  display: flex;
  margin-top: 10px;
  margin-bottom: 10px;
  margin-left: auto;
  margin-right: auto;
}
.k-grid.dragging tbody tr:hover td.below,
.k-grid.dragging tbody tr:hover td.below ~ td {
  border-bottom-color: #0094fb;
}
.k-grid.dragging tbody tr:hover td.above,
.k-grid.dragging tbody tr:hover td.above ~ td {
  border-top-color: #0094fb;
}
.disabled-row {
  background-color: #f5f5f5 !important;
  color: #a0a0a0 !important;
  pointer-events: none !important;
  opacity: 0.6;
  user-select: none;
}
</style>
