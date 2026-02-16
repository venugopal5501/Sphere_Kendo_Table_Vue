import { getDroppedPriority, getTargetTopOffSet } from './ReOrder.js';
import ReOrder from '@/components/ReOrder.vue';
import DragClue from '@/components/DragClue.vue';
import DragPointer from '@/components/DragPointer.vue';
export default {
  components: {
    ReOrder,
    DragClue, // Displays data of the row being dragged
    DragPointer, // Shows a pointer to indicate the drop location (not being used)
  },
  data() {
    return {
      top: 0,
      left: 0,
      targetTopOffset: null,
      targetLeftOffset: null,
      showDropHints: false,
      showDragClueContent: null,
      dropPosition: '',
      activeItem: {},
      dragging: false,
      dragMouseY: 0,
      scrollInterval: null,
    };
  },
  computed: {
    isDragging() {
      return {
        dragging: this.activeItem.Priority,
      };
    },
  },
  methods: {
    // Captures the event whenever a drag occurs
    dragHandler(dataItem, event) {
      this.dragging = true;
      this.top = event.pageY - 140;
      this.left = event.pageX - 80;
      this.targetLeftOffset =
        this.getGridReference().offsetLeft +
        this.getGridReference().offsetLeft / 2;
      this.targetTopOffset = getTargetTopOffSet(event);
      this.dropPosition = this.getDropPosition(event);
      this.showDropHints = true;
      this.dragMouseY = event.clientY;
    },
    // Determines whether the item is dropped above or below the target
    getDropPosition(event) {
      return (this.dropPosition =
        event.offsetY >=
        event.originalEvent.target.parentElement.clientHeight / 2
          ? 'below'
          : 'above');
    },
    // Returns the scroll container within the grid
    getScrollContainer() {
      const grid = this.getGridReference();
      return grid ? grid.querySelector('.k-grid-content') : null;
    },
    // Begins dragging the item
    pressHandler(dataItem) {
      this.dragging = true;
      this.activeItem = dataItem;
      // Start auto-scrolling at regular intervals - for scrolling smoothness
      this.scrollInterval = setInterval(this.autoScroll, 50);
    },
    // Handles the release of the dragged item, stops dragging, and emits reorder event if priority changes
    releaseHandler(dataItem, event) {
      this.dragging = false;
      this.showDropHints = false;
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
      if (
        this.activeItem.Priority !=
        getDroppedPriority(event.originalEvent.target)
      ) {
        this.$emit(
          'reorder',
          this.activeItem.Priority,
          getDroppedPriority(event.originalEvent.target),
          this.dropPosition
        );
      }
    },
    // Shows the drag clue content when the mouse hovers over the grid
    gridMouseover() {
      this.showDragClueContent = true;
    },
    // Show the drag clue content when the mouse leaves the grid
    gridMouseout() {
      this.showDragClueContent = false;
    },
    getGridReference() {
      return document.querySelector('.k-grid');
    },
    // Handles auto-scrolling during dragging
    autoScroll() {
      const scrollContainer = this.getScrollContainer();
      if (!scrollContainer || !this.dragging) return;

      const rect = scrollContainer.getBoundingClientRect();
      const mouseY = this.dragMouseY;
      const threshold = 50; // Determines when scrolling starts based on proximity to the edge (in pixels)
      const scrollSpeed = 20; // Adjust scroll speed

      const fromTop = mouseY - rect.top;
      const fromBottom = rect.bottom - mouseY;
      // Scroll upwards if the mouse is near the top
      if (fromTop < threshold) {
        scrollContainer.scrollTop = Math.max(
          scrollContainer.scrollTop - scrollSpeed,
          0
        );
        // Scroll downwards if the mouse is near the bottom
      } else if (fromBottom < threshold) {
        const maxScroll =
          scrollContainer.scrollHeight - scrollContainer.clientHeight;
        scrollContainer.scrollTop = Math.min(
          scrollContainer.scrollTop + scrollSpeed,
          maxScroll
        );
      }
    },
  },
};
