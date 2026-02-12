/**
 * Validation rules for form inputs
 */
export const required = (v) => (v != null && !!v) || 'Required';
export const positive = (v) => v > 0 || 'Must be a positive value';
export const minLength = (min) => (v) =>
  (v && v.length >= min) || `Must be at least ${min} characters`;
export const maxLength = (max) => (v) =>
  (v && v.length <= max) || `Must be at most ${max} characters`;
export const noSpaces = (v) =>
  (v != null && v.indexOf('  ') == -1 && v.indexOf(' ') != 0) ||
  'Please remove extra spaces';
export const singleLine = (v) =>
  !v || v.split('\n').length === 1 || 'Must only be one line';
export const spaceCheck = (v) =>
  (v != null && v.trimStart() === v) || 'Leading spaces are not allowed';

/**
 * A regex to validate a distinguished name
 * From https://regexr.com/3l4au
 */
const ouRegex =
  /^(?:(?<cn>[Cc][Nn]=(?<name>[^,]*)),)?(?:(?<path>(?:(?:([Cc][Nn])|([Oo][Uu]))=[^,]+,?)+),)?(?<domain>(?:[Dd][Cc]=[^,]+,?)+)$/;
/**
 * Validate an distinguished name, which should look like "OU=My Demo OU,DC=12Sphere,DC=com"
 * @param {string} v - The value to test
 */
export const validDistinguishedName = (v) =>
  ouRegex.test(v) || 'Invalid OU format';
/**
 * Validate an Active Directory name #+\\<>][?";:|=@*
 * https://superuser.com/questions/979770/what-characters-are-valid-for-active-directory-groups/979778#979778
 * https://www.ibm.com/docs/en/sva/9.0.3?topic=names-characters-disallowed-user-group-name
 * @param {string} v - The value to test
 */
export const validActiveDirectoryName = (v) => {
  if (v[0] === ' ') return 'Cannot contain leading spaces';
  if (v[v.length - 1] === ' ') return 'Cannot contain trailing spaces';
  if (v[v.length - 1] === '.') return 'Cannot contain period(.) at the end';
  for (let char of `#+\\<>][?";:|=@*`) {
    if (v.includes(char)) return `Cannot contain '${char}'`;
  }
  return true;
};

/**
 * A regex to validate a IP Address
 * @param {string} v - The value to test
 */
const ipRegex = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;
export const ipAddress = (v) => ipRegex.test(v) || 'IP address must be valid';

export const doesNotContain = (keywords) => (value) => {
  const lowerCaseValue = value.toLowerCase();
  const badMatches = keywords.reduce((matches, keyword) => {
    const lowerCaseKeyword = keyword.toLowerCase();
    if (lowerCaseValue.includes(lowerCaseKeyword)) {
      matches.push(keyword);
    }
    return matches;
  }, []);

  return badMatches.length === 0
    ? true
    : `Cannot contain ${badMatches.join(', ')}`;
};
