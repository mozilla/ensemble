/**
 * Return a new sorted array, except with one value bumped to the front. This
 * function does not sort an array in place; a new array is returned.
 *
 * For example:
 *
 * > bumpSort(['group B', 'group A', 'group C', 'control'], 'control');
 * ['control', 'group A', 'group B', 'group C']
 */
export function bumpSort(array, valueToBump) {
  const arrayCopy = array.slice();
  const valueIndex = arrayCopy.indexOf(valueToBump);

  if (valueIndex === -1) return arrayCopy.sort();

  const arrayOfBumped = arrayCopy.splice(valueIndex, 1);
  return arrayOfBumped.concat(arrayCopy.sort());
}
