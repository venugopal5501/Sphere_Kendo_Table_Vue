import { formatDate, formatNumber } from '@progress/kendo-intl';

export default {
  data() {
    return {
      resizing: false,
    };
  },
  methods: {
    /**
     * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
     *
     * @param {String} text The text to be rendered.
     * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
     *
     * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
     */
    getTextWidth(text, font) {
      // re-use canvas object for better performance
      const canvas =
        this.getTextWidth.canvas ||
        (this.getTextWidth.canvas = document.createElement('canvas'));
      const context = canvas.getContext('2d');
      context.font = font;
      const metrics = context.measureText(text);
      return metrics.width;
    },
    getCssStyle(element, prop) {
      return window.getComputedStyle(element, null).getPropertyValue(prop);
    },
    getCanvasFont(el = document.body) {
      const fontWeight = this.getCssStyle(el, 'font-weight') || 'normal';
      const fontSize = this.getCssStyle(el, 'font-size') || '16px';
      const fontFamily =
        this.getCssStyle(el, 'font-family') || 'Times New Roman';

      return `${fontWeight} ${fontSize} ${fontFamily}`;
    },
    getTitleMinWidth(gridIndex, column) {
      // find the width of the header cell text
      const headerTextWidth = this.getTextWidth(
        column.title,
        this.getCanvasFont(
          this.$refs.grid.$el.querySelector('thead tr').children[gridIndex]
        )
      );
      // determine if column is sortable
      const extraPadding = column.sortable === false ? 24 : 48;
      // add some padding and room for the button if there is any
      return headerTextWidth + extraPadding;
    },
    getFormattedText(text, column) {
      // if the column does not have a format
      if (!column.format) {
        // just return the text as is
        return text;
      }
      // return the formatted text dependent on filter type
      return column.filter === 'numeric'
        ? formatNumber(text, column.format.match(/:(.*)\}/)[1])
        : formatDate(new Date(text), column.format.match(/:(.*)\}/)[1]);
    },
    /**
     * resize the column to fit the longest string
     * @param {String} field column field
     */
    fitColumnContent(field) {
      this.resizing = true;
      // get the index of the column
      const gridIndex = this.columnOverrides
        .filter((col) => col.hidden !== true)
        .findIndex((col) => col.field === field);
      // get the GridColumnProp object itself
      const column = this.columnOverrides.find((col) => col.field === field);
      // get an example cell
      const cellExample = this.$refs.grid.$el.querySelector('tbody tr').children[gridIndex];
      // get the font details for our example cell
      const canvasFont = this.getCanvasFont(cellExample);
      // keep track of the longest width (default 200)
      let titleWidth = this.getTitleMinWidth(gridIndex, column);
      let longestWidth = titleWidth;
      if (this.paginatedItems != null && this.paginatedItems.length > 0) {
        // loop through the paginated items
        for (let i = 0; i < this.paginatedItems.length; i++) {
          // get the formatted text output
          const formattedText = this.getFormattedText(
            this.paginatedItems[i][field]
              ? this.paginatedItems[i][field].toString()
              : '',
            column
          );

          let buttons = this.$refs.grid.$el
            .querySelector('tbody tr:not(.k-grouping-row)')
            .children[gridIndex].querySelectorAll('.v-btn');
          let buttonWidth = 0;
          buttons.forEach((button) => {
            // Get the clientWidth of the button
            const width = button.clientWidth;
            // Get computed styles for the button
            const styles = window.getComputedStyle(button);
            // Retrieve margins
            const marginLeft = parseFloat(styles.marginLeft);
            const marginRight = parseFloat(styles.marginRight);
            // Add clientWidth, margins, and displayTypeWidth to the total width
            buttonWidth += width + marginLeft + marginRight;
          });
          // get the width of the text
          let textWidth =
            buttonWidth || this.getTextWidth(formattedText, canvasFont);

          let icons = this.$refs.grid.$el
            .querySelector('tbody tr:not(.k-grouping-row)')
            .children[gridIndex].querySelectorAll('.v-icon');
          icons.forEach((i) => {
            let computedStyle = window.getComputedStyle(i);
            let marginLeft = parseFloat(computedStyle.marginLeft);
            let marginRight = parseFloat(computedStyle.marginRight);
            let iconWidth =
              i.getBoundingClientRect().width + marginLeft + marginRight;
            textWidth += iconWidth > 0 ? iconWidth : 16;
          });
          // update the longest width
          longestWidth = textWidth > longestWidth ? textWidth : longestWidth;
        }
      }
      // set the column title width as titleWidth
      this.columnOverrides.find((col) => col.field === field).titleWidth =
        titleWidth + 20;
      // set the column width
      this.columnOverrides.find((col) => col.field === field).width =
        longestWidth + 20; // padding
    },
  },
};
