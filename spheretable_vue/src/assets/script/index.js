import columnTypes from './columnTypes';
// import allTables from './modules';
/**
 * The list of all table configs
 */
// export const tables = allTables;

/**
 * Parse response from the API to be the same format as `tables`
 * @param {{ Id: number, TableKey: string, Column: string, Order: number, ColumnType: string }[]} tableData - Response from the API
 */
export const parseFromApiResponse = (tableData, tables) => {
  let columnsByTable = {};
  /* eslint-disable-next-line no-unused-vars */
  tableData.map(
    ({
      TableKey,
      ColumnName,
      ColumnOrder,
      ColumnType,
      ColumnRename,
      ColumnTooltip,
    }) => {
      if (ColumnType === null) {
        ColumnType = 'extra';
      }
      var specificTable = tables.filter((x) => x.key === TableKey)[0];
      if (specificTable === undefined) {
        return;
      }
      if (columnsByTable[TableKey] === undefined) {
        columnsByTable[TableKey] = {};
      }
      if (columnsByTable[TableKey][ColumnType] === undefined) {
        columnsByTable[TableKey][ColumnType] = [];
      }
      var colType = getColType(
        specificTable.defaultColumns,
        specificTable.otherColumns,
        ColumnName
      );
      const columnConfig = {
        source: ColumnName,
        order: ColumnOrder,
        rename: ColumnRename,
        tooltip: ColumnTooltip,
        type: colType,
      };
      columnsByTable[TableKey][ColumnType].push(columnConfig);
    }
  );
  return Object.entries(columnsByTable).map(([key, columns]) => {
    let matchedTable = tables.filter((t) => t.key === key)[0];
    return {
      key,
      name: matchedTable ? matchedTable.name : key,
      defaultColumns: (columns.default || []).sort((a, b) => a.order - b.order),
      otherColumns: (columns.extra || []).sort((a, b) => a.order - b.order),
      hiddenColumns: (columns.hidden || []).sort((a, b) => a.order - b.order),
    };
  });
};

/**
 * Pulls the column type defined by the JavaScript
 * @param {array} defaultCol
 * @param {array} otherCol
 * @param {string} ColumnName
 */

function getColType(defaultCol, otherCol, ColumnName) {
  if (defaultCol && otherCol) {
    var defaultColType = defaultCol.filter((x) => x.source === ColumnName);
    var otherColType = otherCol.filter((x) => x.source === ColumnName);
    if (defaultColType.length > 0) {
      return defaultColType[0].type;
    }
    if (otherColType.length > 0) {
      return otherColType[0].type;
    }
  }
  return 'text';
}

/**
 * Parse a table config into the format to save to the DB with the API
 * @param {object} table
 */
export const parseForSaving = (table) => {
  let rowsToSave = [];
  let order = 0;
  for (let [ColumnType, { key }] of Object.entries(columnTypes)) {
    if (ColumnType == 'extra') {
      ColumnType = null;
    }
    for (let column of table[key]) {
      rowsToSave.push({
        TableKey: table.key,
        ColumnName: column.source,
        ColumnOrder: order,
        ColumnType,
        ColumnRename: column.rename || null,
        ColumnTooltip: column.tooltip || null,
      });
      order += 1;
    }
  }
  return rowsToSave;
};
