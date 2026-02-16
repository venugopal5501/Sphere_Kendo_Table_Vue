/**
 * - Hide a dropdown menu when user resizes
 * - window.resize event listeners are quite expensive so we want to remove the
 *   listener when the dropdown closes
 */
export default {
  /**
   * - I hate watchers but these dropdown components unmount and it's watching
   *   an internal property
   */
  watch: {
    showDropdown(newVal) {
      if (!newVal)
        window.removeEventListener('resize', this.handleWindowResize, false);
    },
  },
  methods: {
    /**
     * Attach this event to the dropdown menu trigger
     */
    addResizeEventListener() {
      window.addEventListener('resize', this.handleWindowResize, false);
    },
    /**
     * - Close the dropdown menu when the user resizes the browser
     * - window.resize events are expensive, we want to add/remove as needed
     */
    handleWindowResize() {
      this.showDropdown = false;
    },
  },
};
