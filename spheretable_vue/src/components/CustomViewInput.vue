<!-- eslint-disable max-lines -->
<template>
  <div>
    <v-snackbar
      v-model="snackbar"
      color="green"
      :timeout="1000"
      :auto-height="true"
      :auto-width="true"
      top
    >
      {{ snackbarMessage }}
    </v-snackbar>
    <span style="font-size: 0.8rem">Custom Views</span>
    <div class="k-cv-container">
      <template>
        <v-menu
          v-model="showMenu"
          :close-on-content-click="false"
          :close-on-click="false"
          content-class="k-cv-menu"
          lazy
          min-width="250px"
          max-width="250px"
          transition="scale-transition"
          :nudge-left="firstMenuIconClicked && menuIconClickCount == 0 ? 0 : 7"
          offset-y
          full-width
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              ref="input"
              v-model="textInput"
              outline
              style="width: 250px"
              :class="{
                'select-mode': !createMode,
                'create-input': true,
                pointer:
                  !createMode &&
                  (!activeCustomView || activeCustomView.disabled),
              }"
              :label="createMode ? 'Create New' : null"
              :placeholder="createMode ? 'Enter new view name' : 'Select'"
              hide-details
              :disabled="loading"
              :readonly="
                !createMode && (!activeCustomView || activeCustomView.disabled)
              "
              :error="errorMsg"
              v-on="on"
              @focus="handleInputFocus"
            >
              <template v-slot:append>
                <v-tooltip top>
                  <template v-slot:activator="{ on, attr }">
                    <v-icon
                      v-show="createMode"
                      color="error"
                      v-bind="attr"
                      @click="cancelCreate"
                      v-on="on"
                    >
                      close
                    </v-icon>
                    <v-icon
                      v-show="!createMode"
                      color="link"
                      v-bind="attr"
                      @click="openMenu"
                      v-on="on"
                      >arrow_drop_down
                    </v-icon>
                  </template>
                  <span>{{ createMode ? 'Cancel Create' : 'Expand' }}</span>
                </v-tooltip>
              </template>
            </v-text-field>
          </template>
          <v-list v-show="!createMode" style="padding: 0">
            <v-expansion-panel class="custom-view-expansion-panel">
              <v-expansion-panel-content
                v-for="(customView, i) in customViews"
                :key="i"
                v-model="customView.expanded"
                :expand-icon="null"
              >
                <template v-slot:header>
                  <div
                    class="k-cv-header"
                    :class="{
                      active:
                        activeCustomView &&
                        activeCustomView.CustomViewId ==
                          customView.CustomViewId,
                    }"
                  >
                    <div class="k-cv-name">
                      <v-icon>{{
                        customView.expanded ? 'expand_less' : 'expand_more'
                      }}</v-icon>
                    </div>
                    <div
                      class="heading"
                      @click="selectCustomView(customView, true, $event)"
                    >
                      {{ customView.name }}
                      <span
                        v-if="customView.DefaultView"
                        style="font-size: 0.8rem; color: rgba(0, 0, 0, 0.6)"
                      >
                        Default view
                      </span>
                    </div>
                    <v-btn
                      v-if="!customView.disabled"
                      icon
                                flat

                      class="k-delete-cv-btn"
                      @click="
                        handleDeleteBtnClick(customView.CustomViewId, $event)
                      "
                    >
                      <v-icon>delete</v-icon>
                    </v-btn>
                  </div>
                </template>
                <v-list style="padding: 0">
                  <!-- filters -->
                  <v-list-tile class="k-cv-collapse-content">
                    <v-list-tile-content>
                      <v-list-tile-title class="k-cv-tile-title">
                        Filters:
                      </v-list-tile-title>
                      <v-list-tile-sub-title class="k-cv-tile-sub-title">
                        {{ customView.filterText }}
                      </v-list-tile-sub-title>
                    </v-list-tile-content>
                  </v-list-tile>

                  <!-- sort -->
                  <v-list-tile class="k-cv-collapse-content">
                    <v-list-tile-content>
                      <v-list-tile-title class="k-cv-tile-title"
                        >Sort:</v-list-tile-title
                      >
                      <v-list-tile-sub-title class="k-cv-tile-sub-title">
                        {{ customView.sortText }}
                      </v-list-tile-sub-title>
                    </v-list-tile-content>
                  </v-list-tile>

                  <!-- columns -->
                  <v-list-tile class="k-cv-collapse-content">
                    <v-list-tile-content>
                      <v-list-tile-title class="k-cv-tile-title"
                        >Columns:</v-list-tile-title
                      >
                      <v-list-tile-sub-title class="k-cv-tile-sub-title">
                        {{ customView.columnsText }}
                      </v-list-tile-sub-title>
                    </v-list-tile-content>
                  </v-list-tile>

                  <!-- grouping -->
                  <v-list-tile class="k-cv-collapse-content">
                    <v-list-tile-content>
                      <v-list-tile-title class="k-cv-tile-title"
                        >Group By:</v-list-tile-title
                      >
                      <v-list-tile-sub-title class="k-cv-tile-sub-title">
                        {{ customView.groupByText }}
                      </v-list-tile-sub-title>
                    </v-list-tile-content>
                  </v-list-tile>

                  <!-- pagination -->
                  <v-list-tile class="k-cv-collapse-content">
                    <v-list-tile-content>
                      <v-list-tile-title class="k-cv-tile-title"
                        >Pagination:</v-list-tile-title
                      >
                      <v-list-tile-sub-title class="k-cv-tile-sub-title">
                        <div
                          style="
                            width: 100%;
                            display: flex;
                            justify-content: space-between;
                          "
                        >
                          <div>Page: {{ customView.page }}</div>
                          <div>
                            Page Size:
                            {{
                              customView.isAllApplied
                                ? 'All'
                                : customView.pageSize
                            }}
                          </div>
                        </div>
                      </v-list-tile-sub-title>
                    </v-list-tile-content>
                  </v-list-tile>
                </v-list>
              </v-expansion-panel-content>
            </v-expansion-panel>
            <v-divider />
            <v-btn
                        flat

              class="k-filter-menu-item active k-cv-create-btn"
              color="primary"
              @mousedown="handleCreateNewClick"
            >
              Create New
            </v-btn>
          </v-list>
          <v-list v-show="createMode" style="padding: 0">
            <!-- filters -->
            <v-list-tile class="k-cv-collapse-content">
              <v-list-tile-content>
                <v-list-tile-title class="k-cv-tile-title">
                  Filters:
                </v-list-tile-title>
                <v-list-tile-sub-title class="k-cv-tile-sub-title">
                  {{ newCustomView.filterText }}
                </v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>

            <!-- sort -->
            <v-list-tile class="k-cv-collapse-content">
              <v-list-tile-content>
                <v-list-tile-title class="k-cv-tile-title"
                  >Sort:</v-list-tile-title
                >
                <v-list-tile-sub-title class="k-cv-tile-sub-title">
                  {{ newCustomView.sortText }}
                </v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>

            <!-- columns -->
            <v-list-tile class="k-cv-collapse-content">
              <v-list-tile-content>
                <v-list-tile-title class="k-cv-tile-title"
                  >Columns:</v-list-tile-title
                >
                <v-list-tile-sub-title class="k-cv-tile-sub-title">
                  {{ newCustomView.columnsText }}
                </v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>

            <!-- grouping -->
            <v-list-tile class="k-cv-collapse-content">
              <v-list-tile-content>
                <v-list-tile-title class="k-cv-tile-title"
                  >Group By:</v-list-tile-title
                >
                <v-list-tile-sub-title class="k-cv-tile-sub-title">
                  {{ newCustomView.groupByText }}
                </v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>

            <!-- pagination -->
            <v-list-tile class="k-cv-collapse-content">
              <v-list-tile-content>
                <v-list-tile-title class="k-cv-tile-title"
                  >Pagination:</v-list-tile-title
                >
                <v-list-tile-sub-title class="k-cv-tile-sub-title">
                  <div
                    style="
                      width: 100%;
                      display: flex;
                      justify-content: space-between;
                    "
                  >
                    <div>Page: {{ page }}</div>
                    <div>
                      Page Size:
                      {{ isAllApplied ? 'All' : pageSize }}
                    </div>
                  </div>
                </v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-menu>
      </template>
      <template
        v-if="createMode || (activeCustomView && !activeCustomView.disabled)"
      >
        <v-checkbox
          v-model="makeDefaultFlag"
          class="default-checkbox mt-0 pt-0"
          color="link"
          :label="`Make Default`"
        />
        <v-tooltip top>
          <template v-slot:activator="{ on, attr }">
            <v-icon v-bind="attr" color="link" v-on="on" @click="saveView">
              save
            </v-icon>
          </template>
          <span>Save View</span>
        </v-tooltip>
      </template>
      <div v-if="errorMsg" class="k-cv-error k-fade-in pt-1">
        {{ errorMsg }}
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'CustomViewInput',
  props: {
    columns: {
      type: Array, // array of kendo GridColumnProps objects
      required: false,
      default() {
        return [];
      },
    },
    filter: {
      type: Object, // root kendo CompositeFilterDescriptor object
      required: false,
      default: null,
    },
    sort: {
      type: Array, // kendo SortDescriptor object
      required: true,
    },
    group: {
      type: Array, // array of kendo GroupDescriptors objects
      required: false,
      default() {
        return [];
      },
    },
    pageSize: {
      type: Number,
      required: true,
    },
    skip: {
      type: Number,
      required: true,
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
    moduleName: {
      type: String,
      required: false,
      default: '',
    },
    appliedFiltersCount: {
      type: Number,
      required: false,
      default() {
        return 0;
      },
    },
    isAdvFiltersApplied: {
      type: Boolean,
      required: false,
      default: false,
    },
    isAllApplied: {
      type: Boolean,
      required: false,
      default: false,
    },
    customViews: {
      type: Array,
      required: true,
      default() {
        return [];
      },
    },
    defaultView: {
      type: Object,
      required: true,
      default() {
        return {};
      },
    },
  },
  data() {
    return {
      textInput: '',
      showMenu: false,
      activeCustomView: null,
      activeDropdownIndex: -1,
      errorMsg: null,
      createMode: false,
      makeDefaultFlag: false,
      initialCustomView: {},
      snackbar: false,
      snackbarMessage: '',
      menuIconClickCount: 0,
      firstMenuIconClicked: false,
    };
  },
  computed: {
    /**
     * @returns {Boolean}
     */
    nameAlreadyTaken() {
      return !!this.customViews.find((cv) => cv.name === this.textInput);
    },
    /**
     * @returns {Number}
     */
    page() {
      return this.skip === 0 ? 1 : this.skip / this.pageSize + 1;
    },
    newCustomView() {
      return {
        name: this.textInput,
        columnsFields: this.getColumnsFields(),
        columnsText: this.getColumnsText(),
        filter: this.filter,
        filterText: this.filter ? this.getFilterText().slice(1, -1) : 'none',
        sort: this.sort,
        sortText: this.sort.length > 0 ? this.getSortText() : 'none',
        group: this.group,
        groupByText: this.getGroupByText(),
        pageSize: this.pageSize,
        isAllApplied: this.isAllApplied,
        skip: this.skip,
        page: this.skip === 0 ? 1 : this.skip / this.pageSize + 1,
        appliedFiltersCount: this.appliedFiltersCount,
        isAdvFiltersApplied: this.isAdvFiltersApplied,
      };
    },
  },
  async mounted() {},
  methods: {
    generateInitialView(filter, sort, pageSize, skip, columns) {
      this.initialCustomView = {
        name: 'SPHEREboard Default View',
        columnsFields: this.getColumnsFields(columns),
        columnsText: this.getColumnsText(columns),
        filter: filter,
        filterText: filter ? this.getFilterText(filter).slice(1, -1) : 'none',
        sort: sort,
        sortText: sort.length > 0 ? this.getSortText(sort) : 'none',
        pageSize: pageSize,
        skip: skip,
        page: skip === 0 ? 1 : skip / pageSize + 1,
        disabled: true,
      };
      this.customViews.unshift(this.initialCustomView);
    },
    handleInputFocus() {
      // clear the error message
      this.errorMsg = null;
      // add event listener to the document body
      document.body.addEventListener(
        'mousedown',
        this.handleDocumentClick,
        false
      );
    },
    openMenu() {
      this.showMenu = true;
      if (this.menuIconClickCount == 0) this.firstMenuIconClicked = true;
    },
    /**
     *
     * @param {String} key 'ArrowDown' | 'ArrowUp'
     */
    setActiveDropdownIndex(key) {
      // if the user clicked the up arrow
      if (key === 'ArrowUp') {
        // if we were already at -1
        if (this.activeDropdownIndex === -1) {
          // make the create new button the active index
          this.activeDropdownIndex = this.customViews.length;
        } else {
          this.activeDropdownIndex = this.activeDropdownIndex - 1;
        }
        // if the user clicked the down arrow
      } else {
        // if we were already at the last index (create new button)
        if (this.activeDropdownIndex === this.customViews.length) {
          // make the text input the active index
          this.activeDropdownIndex = -1;
        } else {
          this.activeDropdownIndex = this.activeDropdownIndex + 1;
        }
      }
    },
    /**
     *
     * @param {Event} event
     */
    handleDocumentClick(event) {
      // if the user clicked outside of the target area
      if (this.didClickOutside(event.target)) {
        // close the menu
        this.showMenu = false;
        this.menuIconClickCount++;
        // remove the event listener
        document.body.removeEventListener(
          'mousedown',
          this.handleDocumentClick,
          false
        );
      }
    },
    /**
     * Recursive function to determine if the target element is outside menu or input
     * @param {DOMElement} target
     * @returns {Boolean}
     */
    // eslint-disable-next-line complexity
    didClickOutside(target, body = document.body) {
      // if we reach the document body without finding our the parent elements
      if (target === body) {
        // break recursion and return true
        return true;
      }
      // if we find the menu or input
      if (
        target == null ||
        target.classList.contains('k-cv-menu') ||
        (this.$refs.input && target === this.$refs.input.$el) ||
        (this.$refs.menuButton && target === this.$refs.menuButton.$el)
      ) {
        // we are still within the component, menu should remain open
        return false;
      }
      // we havent matched any of our targets, recurse
      return this.didClickOutside(target.parentElement, body);
    },
    /**
     * - User clicks create new button
     */
    handleCreateNewClick() {
      this.createMode = true;
      this.textInput = '';
      this.$refs.input.focus();
    },
    cancelCreate() {
      this.createMode = false;
      this.textInput = '';
      this.newCustomView = {};
      this.activeCustomView = null;
    },
    /**
     * - User clicks save icon
     */
    // eslint-disable-next-line complexity
    saveView() {
      // trim the text input
      const name = this.textInput.trim();
      // instantiate error message string
      let errorMsg = '';
      // if there is currently no text in the input
      if (name.length === 0) {
        // set the error message
        errorMsg = 'Please enter a name';
        // if this name is already taken
      }
      // check to see if this exact configuration already exists
      let cvs = this.createMode
        ? [...this.customViews]
        : this.customViews.filter(
            (v) => v.CustomViewId != this.activeCustomView.CustomViewId
          );
      cvs = cvs.map((c) => {
        return {
          name: c.name,
          columnsFields: c.columnsFields,
          columnsText: c.columnsText,
          filter: c.filter,
          filterText: c.filterText,
          sort: c.sort,
          sortText: c.sortText,
          pageSize: c.pageSize,
          skip: c.skip,
          page: c.page,
        };
      });
      let newCV = { ...this.newCustomView };
      let duplicateName = '';
      delete newCV['name'];
      const identicalCustomViewObject = cvs.find((cv) => {
        let name = cv.name;
        delete cv['name'];
        if (JSON.stringify(cv) == JSON.stringify(newCV)) {
          duplicateName = name;
        }
        return JSON.stringify(cv) == JSON.stringify(newCV);
      });
      // if this exact custom view configuration already exists
      if (identicalCustomViewObject) {
        errorMsg = `Custom view already exists as "${duplicateName}"`;
      }
      if (this.createMode && this.nameAlreadyTaken)
        errorMsg = 'Duplicate view name';
      // if there were any errors
      if (errorMsg.length) {
        // set the error message and return
        this.errorMsg = errorMsg;
        return;
      }
      this.errorMsg = null;
      this.newCustomView.DefaultView = this.makeDefaultFlag ? 1 : 0;
      var customData = {
        Module: this.moduleName,
        UserSTSGUID: this.$store.getters.userId,
        ViewName: name,
        ViewData: JSON.stringify(this.newCustomView),
        DefaultView: this.makeDefaultFlag ? 1 : 0,
      };
      if (this.createMode) {
        // insert the new custom view object into the second to last position of the array
        this.customViews.splice(this.customViews.length, 0, this.newCustomView);
        axios
          .post('/CustomViewApi/SetCustomViewData', customData)
          .then(async (response) => {
            let vId = response.data[0].CustomViewId;
            this.newCustomView.CustomViewId = vId;
            if (this.makeDefaultFlag) {
              // make call to update default view
              await this.updateDefaultCustomView(vId);
            }
            this.createMode = false;
            this.activeCustomView = this.newCustomView;
            this.textInput = this.activeCustomView.name;
            this.snackbar = true;
            this.snackbarMessage = 'View saved successfully';
            this.$emit('custom-view-added', this.snackbar);
          });
      } else {
        customData.CustomViewId = this.activeCustomView.CustomViewId;
        customData.appliedFiltersCount = this.appliedFiltersCount;
        axios
          .put('/CustomViewApi/UpdateCustomViewData', customData)
          .then(async () => {
            if (this.makeDefaultFlag) {
              // make call to update default view
              await this.updateDefaultCustomView(
                this.activeCustomView.CustomViewId
              );
            }
            let index = this.customViews.findIndex(
              (v) => v.CustomViewId == customData.CustomViewId
            );
            if (index != -1) {
              this.customViews[index] = this.newCustomView;
              this.customViews[index].CustomViewId = customData.CustomViewId;
            }
            this.snackbar = true;
            this.snackbarMessage = 'View saved successfully';
          });
      }
    },

    async updateDefaultCustomView(viewId) {
      await axios
        .post(
          `/CustomViewApi/SetCustomDefaultView?viewId=${viewId}&stsGuid=${this.$store.getters.userId}`
        )
        .then(() => {
          this.resetDefaultView(viewId);
        });
    },
    /**
     * Recursively generate nested filter text from tree structure
     * @param {Object} filter  kendo CompositeFilterDescriptor object
     * @returns {String}
     */
    getFilterText(filter = this.filter) {
      // instantiate string variable
      let filterText = '(';
      // loop through the filters
      for (let i = 0; i < filter.filters.length; i++) {
        let label = '';
        // extract the label or recurse to get an array of labels
        if (filter.filters[i].field) {
          label =
            '"' +
            this.getColumnTitle(filter.filters[i].field) +
            '" ' +
            (filter.filters[i].operator
              ? filter.filters[i].label
              : this.getFilterText(filter.filters[i]));
        } else {
          filterText += this.getFilterText(filter.filters[i]);
        }
        // return the label
        filterText += `${label} ${filter.logic.toUpperCase()} `;
      }
      // remove the trailing logic statement, add a trailing paren and return
      return (
        filterText.slice(0, filterText.length - (filter.logic.length + 2)) + ')'
      );
    },
    getColumnTitle(field) {
      return this.columns
        ? this.columns.filter((c) => c.field == field)[0].title
        : '';
    },
    /**
     * generate sort filter text for collapsible content
     * @returns {String}
     */
    getSortText(sort = this.sort) {
      return sort
        .map((s) => `${this.getColumnTitle(s.field)} ${s.dir}`)
        .join(', ');
    },
    getColumnsText(columns = this.columns) {
      return columns
        ? columns
            .filter((c) => !c.invisible && !c.hidden)
            .map(
              (c) =>
                `${this.getColumnTitle(c.field)}${c.locked ? '(Locked)' : ''}`
            )
            .join(', ')
        : '';
    },
    getColumnsFields(columns = this.columns) {
      return columns
        ? columns.map((c) => {
            return {
              field: c.field,
              locked: c.locked,
              orderIndex: c.orderIndex,
              hidden: c.hidden,
              invisible: c.invisible,
            };
          })
        : [];
    },
    getGroupByText() {
      // TODO: generate group by text summary
      return this.group
        ? this.group
            .map((g) => {
              return this.getColumnTitle(g.field);
            })
            .join(', ')
        : '';
    },
    /**
     * Delete a custom view
     * @param {Number} index
     */
    async handleDeleteBtnClick(viewID, e) {
      e.stopPropagation();
      await axios
        .delete(`/CustomViewApi/DeleteCustomViewData?id=${viewID}`)
        .then(() => {
          let index = this.customViews.findIndex(
            (v) => v.CustomViewId == viewID
          );
          // remove the index from the custom views array
          this.customViews.splice(index, 1);
          if (this.activeCustomView.CustomViewId == viewID) {
            this.activeCustomView = null;
            this.textInput = '';
            this.selectCustomView(this.customViews[0]);
          }
          this.snackbar = true;
          this.snackbarMessage = 'View deleted successfully';
        });
    },
    resetDefaultView(viewID) {
      this.customViews = this.customViews.map((v) => {
        v.DefaultView = 0;
        return v;
      });
      let index = this.customViews.findIndex((v) => v.CustomViewId == viewID);
      // remove the index from the custom views array
      this.customViews[index].DefaultView = 1;
    },
    selectDefaultView(emmitBack = true) {
      if (Object.keys(this.defaultView).length === 0) {
        this.selectCustomView(this.initialCustomView, emmitBack);
      } else {
        this.selectCustomView(this.defaultView, emmitBack);
      }
    },
    selectCustomView(customView, emmitBack = true, e) {
      if (e) e.stopPropagation();
      if (customView) {
        this.activeCustomView = customView;
        this.textInput = this.activeCustomView.name;
        this.makeDefaultFlag = customView.DefaultView;
        if (emmitBack) this.$emit('custom-view-selected', customView);
      }
    },
  },
};
</script>

<style lang="scss">
.k-cv-container {
  display: flex;
  align-items: center;
  .default-checkbox {
    .v-input__slot {
      margin-bottom: 0;
      margin: 0 10px;
    }
    .v-messages {
      min-height: 0;
    }
  }
  .sb-bordered-input {
    margin-top: 0;
    margin-bottom: 4px;
  }
  .create-input {
    height: 36px;
    .v-input__slot {
      min-height: unset;
      border: 1px solid #a9b5c7 !important;
      border-radius: 0;
      padding: 0 0 0 6px !important;
      label {
        top: 7px;
        &.v-label--active {
          transform: translateY(-7px) scale(0.7);
        }
      }
      input {
        margin-top: 6px;
        padding-bottom: 0;
      }
    }
    &.pointer {
      .v-input__slot {
        input {
          cursor: pointer;
        }
      }
    }
    .v-input__append-inner {
      margin-top: 5px;
      .v-input__icon .v-icon {
        font-size: 24px;
      }
    }
    &.select-mode {
      .v-input__slot {
        input {
          margin-top: 2px;
          padding-bottom: 10px;
        }
      }
    }
  }
}
.k-cv-input {
  padding: 0;
  height: 26px;
  margin-left: 0.5px;
  margin-top: 0 !important;
  .v-text-field__slot {
    padding-left: 10px;
  }
  label.v-label {
    left: 10px !important;
    top: 2px;
    font-size: 12px !important;
    &.v-label--active {
      top: 4px;
      left: 0px !important;
    }
  }
  &.primary--text {
    .v-label.v-label--active {
      left: 0px !important;
      color: #0094fb !important;
    }
  }
  .v-input__icon .v-icon {
    font-size: 24px !important;
    color: #0094fb;
    margin-top: -4px;
  }
  .v-input__slot {
    &::before,
    &::after {
      display: none;
    }
    input {
      padding: 0 0 2px 0;
      height: 26px;
      line-height: 1;
      font-size: 12px;
      color: #303030 !important;
    }
  }
}
.k-cv-menu {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  min-width: 250px !important;
  .v-expansion-panel__header {
    padding: 6px !important;
    min-height: 0;
  }
}
.k-cv-create-btn {
  padding: 5px 0 !important;
  font-size: 14px !important;
  .v-btn__content {
    justify-content: left !important;
    margin-left: 35px;
  }
}
.k-cv-error {
  padding-left: 8px;
  font-size: 10px;
  color: #d51923;
  transition: 300ms ease-out;
  opacity: 0;
}
.k-fade-in {
  opacity: 1;
}
.k-cv-header {
  display: flex;
  width: 100%;
  align-items: center;
  &:hover .k-delete-cv-btn .v-icon {
    color: #d51923;
  }
  .heading {
    flex: 1;
    line-height: 20px;
  }
}
.k-cv-name {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  .v-icon {
    font-size: 20px;
    color: #0094fb;
  }
}
.k-delete-cv-btn {
  font-size: 16px;
  height: 20px;
  width: 20px;
  margin: 0;
  .v-icon {
    font-size: 16px;
    color: #a6a6a6;
  }
}
.k-cv-collapse-content {
  background-color: rgba(0, 0, 0, 0.04);
  .v-list__tile {
    height: unset;
    min-height: 48px;
  }
}
.k-cv-tile-title {
  font-size: 11px;
  color: #4a687e;
  font-weight: 600;
}
.k-cv-tile-sub-title {
  font-size: 11px;
  white-space: initial;
}
.custom-view-expansion-panel {
  box-shadow: none;
  .v-expansion-panel__header {
    padding: 0 !important;
    .k-cv-header {
      padding: 6px;
      &.active {
        background-color: #ddf1ff;
      }
    }
  }
}
</style>
