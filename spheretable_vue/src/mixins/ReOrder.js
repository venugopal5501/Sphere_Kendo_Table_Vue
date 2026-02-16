// Retrieves the priority of the dropped item based on its data-itemid attribute
export function getDroppedPriority(target) {
  let tdElement = target.closest('td[data-itemid]');
  if (tdElement) {
    return parseInt(tdElement.getAttribute('data-itemid'), 10);
  } else {
    const trElement = target.closest('tr');
    if (trElement) {
      tdElement = trElement.querySelector('td[data-itemid]');
      if (tdElement) {
        return parseInt(tdElement.getAttribute('data-itemid'), 10);
      }
    }
  }
  return false;
}
// Calculates the vertical offset for the drop target based on mouse position
export function getTargetTopOffSet(event) {
  if (
    event.originalEvent.target.className !== 'k-drop-hint-line' &&
    event.originalEvent.target.className !== 'k-drop-hint k-drop-hint-h'
  ) {
    return event.offsetY >=
      event.originalEvent.target.parentElement.clientHeight / 2
      ? event.originalEvent.target.parentElement.offsetTop +
          document.querySelector('.k-grid-header').offsetHeight +
          document.querySelector('.k-grid').offsetTop +
          event.originalEvent.target.parentElement.clientHeight
      : event.originalEvent.target.parentElement.offsetTop +
          document.querySelector('.k-grid-header').offsetHeight +
          document.querySelector('.k-grid').offsetTop;
  }
}
