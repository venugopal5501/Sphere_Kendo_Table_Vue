/**
 * These are the different "buckets" that a column can be in. A column can only
 * be a single type, and all tables must define a list of columns for each type
 */
export default {
  default: {
    key: 'defaultColumns',
    label: 'Default columns',
    description: 'These columns are shown when the table initially loads',
    typeColor: 'success',
  },
  extra: {
    key: 'otherColumns',
    label: 'Extra available columns',
    description:
      'These columns are not shown by default but are available for the user to add in',
    typeColor: 'primary',
  },
  hidden: {
    key: 'hiddenColumns',
    label: 'Hidden columns',
    description: 'These columns are fully hidden and unavailable for users',
    typeColor: undefined,
  },
};
