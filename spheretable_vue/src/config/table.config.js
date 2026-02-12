/**
 * - SphereBoard has 3 types of tables
 * - Pass one of the following strings as the "tableType" prop:
 *    + simple
 *    + actionable
 *    + granular
 */
export const TABLE_SETTINGS = {
  simple: {
    selectable: false,
    columnReorderable: false,
    columnTogglable: false,
    columnFreezable: false,
    reorderable: false,
    rowHighlight: false,
    customViews: false,
    groupable: false,
  },
  actionable: {
    selectable: true,
    columnReorderable: false,
    columnTogglable: false,
    columnFreezable: false,
    reorderable: true,
    rowHighlight: true,
    customViews: false,
    groupable: false,
  },
  granular: {
    selectable: true,
    columnReorderable: true,
    columnTogglable: true,
    columnFreezable: true,
    reorderable: true,
    rowHighlight: true,
    customViews: true,
    groupable: true,
  },
  simpleGranular: {
    selectable: false,
    columnReorderable: true,
    columnTogglable: true,
    columnFreezable: true,
    reorderable: true,
    rowHighlight: true,
    customViews: true,
    groupable: true,
  },
};
