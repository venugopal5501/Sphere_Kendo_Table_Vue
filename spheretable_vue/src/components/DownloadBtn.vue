<template>
  <v-menu
    v-model="showDropdown"
    offset-y
    left
    :close-on-content-click="false"
    :disabled="isDisabled"
  >
    <template v-slot:activator="{ on }">
      <div v-on="on">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn
              small
                        text

              class="k-header-btn k-header-download-btn"
              :disabled="isDisabled"
              :loading="loading"
              v-on="on"
            >
              <v-icon>download</v-icon>
            </v-btn>
          </template>
          <span>{{
            loading
              ? 'Exporting to file, please wait'
              : showExcel
              ? 'Download .csv or .xlsx file'
              : 'Download .csv file'
          }}</span>
        </v-tooltip>
      </div>
    </template>
    <v-list subheader class="k-sort-filter-menu">
      <v-subheader>Download:</v-subheader>
      <v-divider />
      <div v-if="showExcel">
        <v-btn
                    text

          color="info"
          :class="classExcel"
          @mousedown="handleDownloadClick('classExcel')"
        >
          <span>Excel file</span>
          <v-progress-circular
            indeterminate
            color="primary"
            :size="14"
            :width="1"
            class="k-download-progress"
          />
        </v-btn>
      </div>
      <div>
        <v-btn
                    text

          color="info"
          :class="classCsv"
          @mousedown="handleDownloadClick('classCsv')"
        >
          <span>CSV file</span>
          <v-progress-circular
            indeterminate
            color="primary"
            :size="14"
            :width="1"
            class="k-download-progress"
          />
        </v-btn>
      </div>
    </v-list>
  </v-menu>
</template>

<script>
import { utils, writeFileXLSX } from 'xlsx';
import closeDropdownResizeMixin from '@/mixins/closeDropdownResize.mixin';
import { formatDate, formatNumber } from '@progress/kendo-intl';
import Cookies from 'js-cookie';

export default {
  name: 'DownloadBtn',
  mixins: [closeDropdownResizeMixin],
  props: {
    filteredItems: {
      type: Array,
      required: false,
      default: null,
    },
    columns: {
      type: Array,
      required: false,
      default: null,
    },
    name: {
      type: String,
      required: false,
      default: 'sphere-table',
    },
    serverSide: {
      type: Boolean,
      required: false,
      default: false,
    },
    apiEndpoint: {
      type: String,
      required: false,
      default: null,
    },
    filter: {
      type: Object,
      required: false,
      default: null,
    },
    sort: {
      type: Array,
      required: false,
      default() {
        return [];
      },
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      showDropdown: false,
      /**
       * - Keep track of both loading states so user can download both at the
       *   same time if they click the mouse fast enough or there is a long wait
       *   for server response.
       */
      loading: false, // excel or csv
      classExcel: 'k-filter-menu-item',
      classCsv: 'k-filter-menu-item',
    };
  },
  computed: {
    isDisabled() {
      return (
        this.filteredItems === null ||
        this.filteredItems.length === 0 ||
        this.loading ||
        this.disabled
      );
    },
    showExcel() {
      return !this.serverSide;
    },
  },
  methods: {
    /**
     * @param {String} propName 'classCsv' : 'classExcel'
     */
    async handleDownloadClick(propName) {
      // set the loading states
      this[propName] = 'k-filter-menu-item active';
      this.loading = true;
      // remove any download cookies
      Cookies.remove('downloadFile');
      // if serverside
      if (this.serverSide) {
        // create a promise to wait for our cookie
        await new Promise((resolve) => {
          // create the link and click it
          const visibleColumns = this.columns
            .filter((column) => !column.hidden && !column.invisible)
            .map((column) => ({
              ColumnField: column.field,
              ColumnTitle: column.title,
              ColumnOrder: column.orderIndex,
            }));

          const params = {
            filter: JSON.stringify(this.filter),
            sort: JSON.stringify(this.sort),
            returnAllRows: true,
            downloadFile: true,
            includeCounts: false,
            // TODO: remove pageSize, it should be infurred by returnAllRows
            pageSize: 999999999,
            visibleColumns: JSON.stringify(visibleColumns),
          };
          const link = document.createElement('a');
          let queryParamAppender = this.apiEndpoint.includes('?') ? '&' : '?';
          link.href = `${this.SbBaseUrl}${
            this.apiEndpoint
          }${queryParamAppender}${new URLSearchParams(params).toString()}`;
          link.setAttribute('download', this.downloadFileName('csv'));
          document.body.appendChild(link);
          link.click();
          // create a new interval
          const cookieCheckInterval = setInterval(() => {
            // if we get a download cookie
            if (Cookies.get('downloadFile')) {
              // clear the download cookie
              Cookies.remove('downloadFile');
              // update loading state and class
              this.loading = false;
              this.classCsv = 'k-filter-menu-item';
              // clear the interval
              clearInterval(cookieCheckInterval);
              // resolve the promise
              return resolve(true);
            }
          }, 500);
        });
        // if client side
      } else {
        setTimeout(() => {
          // initiate the download
          propName === 'classCsv'
            ? this.downloadCsv(propName)
            : this.downloadExcel(propName);
        }, 1);
      }
    },
    /**
     * getVisibleItems
     */
    getVisibleItems() {
      const items = JSON.parse(JSON.stringify(this.filteredItems)).map(
        (obj) => {
          //mapping columns with respective data
          return this.columns
            .map((col) => col.field)
            .reduce((acc, key) => {
              if (obj.hasOwnProperty(key)) {
                acc[key] = obj[key];
              }
              return acc;
            }, {});
        }
      );
      // get an array of hidden fields
      const hiddenFields = this.columns
        .filter((c) => c.hidden || c.downloadable === false)
        .map((c) => c.field);
      // loop through all the items
      for (let i = 0; i < items.length; i++) {
        // loop through all the hidden fields
        for (let j = 0; j < hiddenFields.length; j++) {
          // delete the hidden fields from the item
          delete items[i][hiddenFields[j]];
        }
      }
      return items;
    },
    /**
     * Generate required file name
     * uses regex to add spaces in pascal case
     * and replace the spaces with hyphen (-).
     */
    downloadFileName(extention) {
      return `${this.name
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .trim()
        .replace(/\s{2,}/g, ' ')
        .split(' ')
        .join('-')}.${extention}`;
    },
    /**
     * - Generate a .xlsx file from the sorted table data
     * - uses SheetJS (node module import xlsx)
     * - https://docs.sheetjs.com/docs/getting-started/example#export-a-file
     * @param {String} propName 'classCsv' : 'classExcel'
     */
    // eslint-disable-next-line complexity
    downloadExcel(propName) {
      // copy the filtered items to a new object so we can edit the values
      const items = this.getVisibleItems();
      // get an array of numeric and date columns only (only these 2 types have filters)
      const columns = this.columns.filter(
        (column) => !column.hidden && column.downloadable
      );
      // loop through the items
      for (let i = 0; i < items.length; i++) {
        // loop through all the columns
        for (let j = 0; j < columns.length; j++) {
          // format the date
          if (columns[j].filter === 'date') {
            if (
              items[i][columns[j].field] &&
              items[i][columns[j].field] !== null &&
              items[i][columns[j].field] !== ''
            ) {
              items[i][columns[j].field] = formatDate(
                new Date(items[i][columns[j].field]),
                columns[j].format.match(/:(.*)\}/)[1]
              );
            }
          } else {
            let dummyCellElement = document.createElement('span');
            dummyCellElement.innerHTML = items[i][columns[j].field];
            items[i][columns[j].field] =
              dummyCellElement.textContent || dummyCellElement.innerText;
            if (columns[j].filter === 'numeric') {
              items[i][columns[j].field] = formatNumber(
                items[i][columns[j].field],
                columns[j].format.match(/:(.*)\}/)[1]
              );
            }
          }
        }
      }
      // create a new worksheet
      const worksheet = utils.json_to_sheet(items, {
        origin: 'A2', // start at row 2 to save room for the headers
        skipHeader: true,
      });
      // add the headers
      utils.sheet_add_aoa(
        worksheet,
        [
          this.columns
            .filter((c) => !c.hidden && c.downloadable)
            .map((c) => c.title || c.field),
        ],
        {
          origin: 'A1',
        }
      );
      // create a new workbood and append our sheet to it
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'test');
      // init donwload
      writeFileXLSX(workbook, this.downloadFileName('xlsx'), {
        compression: true,
      });
      // clean up, set the download active class and close the dropdown menu
      this.finishDownload(propName);
    },
    /**
     * Adapted from this stackoverflow answer:
     * https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
     * @param {String} propName 'classCsv' : 'classExcel'
     */
    downloadCsv(propName) {
      const filename = this.downloadFileName('csv');
      // filtering unhidden columns
      let columns = this.columns.filter(
        (c) => !c.hidden && c.downloadable !== false
      );
      // eslint-disable-next-line complexity
      const processRow = (row, baseCase) => {
        let finalVal = '';
        for (let j = 0; j < row.length; j++) {
          let innerValue = row[j] === null ? '' : row[j].toString();
          let dummyCellElement = document.createElement('span');
          dummyCellElement.innerHTML = innerValue;
          innerValue =
            dummyCellElement.textContent || dummyCellElement.innerText;
          if (!baseCase) {
            if (columns[j].filter === 'date') {
              innerValue = formatDate(
                row[j] ? new Date(row[j]) : row[j],
                columns[j].format.match(/:(.*)\}/)[1]
              );
            } else if (columns[j].filter === 'numeric') {
              innerValue = formatNumber(
                row[j],
                columns[j].format.match(/:(.*)\}/)[1]
              );
            }
          }
          let result = innerValue.replace(/"/g, '""');
          if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
          if (j > 0) finalVal += ',';
          finalVal += result;
        }
        return finalVal + '\n';
      };

      let csvFile = '';
      const rows = this.getVisibleItems().map((r) => Object.values(r));
      rows.unshift(
        this.columns
          .filter((c) => !c.hidden && c.downloadable)
          .map((c) => c.title || c.field)
      );
      for (let i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i], i === 0);
      }
      const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
      if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, filename);
      } else {
        const link = document.createElement('a');
        if (link.download !== undefined) {
          // feature detection
          // Browsers that support HTML5 download attribute
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      // set the download active class and close the dropdown menu
      this.finishDownload(propName);
    },
    /**
     * Complete the downloading process, reset active state(s)
     * @param {String} propName 'classCsv' : 'classExcel'
     */
    finishDownload(propName) {
      // set a timeout function provide cushion for browser download initiation
      setTimeout(() => {
        // deactivate the class
        this[propName] = 'k-filter-menu-item';
        // close the dropdown
        this.showDropdown = false;
        // if the other file type class is not active
        if (
          !this[propName === 'classCsv' ? 'classExcel' : 'classCsv'].includes(
            'active'
          )
        ) {
          // remove loading state from the dropdown button
          this.loading = false;
        }
      }, 250);
    },
  },
};
</script>

<style lang="scss">
.k-header-download-btn {
  .v-progress-circular {
    height: 16px !important;
    width: 16px !important;
  }
  .v-icon {
    line-height: 18px;
    font-size: 18px !important;
    margin-bottom: -2px;
  }
}
.k-filter-menu-item {
  .k-download-progress {
    margin-left: 16px;
    opacity: 0;
  }
  &.active .k-download-progress {
    opacity: 1;
  }
}
</style>
