/*
 Copyright (C) Federico Zivolo 2017
 Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 Authors: Federico Zivolo <federico.zivolo@gmail.com>
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Popper = factory());
}(this, (function () { 'use strict';

var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
var isIE11 = isBrowser && !!(window.MSInputMethodContext && document.documentMode);
var isIE10 = isBrowser && !!(window.MSPointerEvent && document.documentMode);

function getStyleComputedProperty (element, property) {
  if (element.nodeType !== 1) {
    return [];
  }
  // This is special case for nested SVG elements (usually a `<g>` element)
  // where IE does not expose the `style` property and thus, it will throw
  // an error if we try to access it
  var css = isIE11 ? element.style : window.getComputedStyle(element, null);
  return property ? css[property] : css;
}

function getParentNode(element) {
  if (element.nodeName === 'HTML') {
    return element;
  }
  return element.parentNode || element.host;
}

function getOffsetParent(element) {
  if (element) {
    var offsetParent = element.offsetParent;
    if (offsetParent === null) {
      if (element.nodeName === 'BODY') {
        return element.ownerDocument.documentElement;
      } else {
        return getOffsetParent(getParentNode(element));
      }
    }
    // IE 11 returns body as offsetParent of html
    if (offsetParent.nodeName === 'HTML' && offsetParent.style.position === 'static') {
      return offsetParent.ownerDocument.documentElement;
    }
    // Fix issue with Chrome 88+ where offsetParent returns body even for fixed elements
    if (offsetParent.nodeName === 'BODY' && offsetParent.style.position === 'static' && getStyleComputedProperty(offsetParent, 'position') === 'static') {
      return offsetParent.ownerDocument.documentElement;
    }
    return offsetParent;
  }
  return element;
}

function getOffsetParentFast(element) {
  var offsetParent = element.offsetParent;
  if (offsetParent === null) {
    return element.ownerDocument.documentElement;
  }
  return offsetParent;
}

function getOffsetRectRelativeToParent(element, offsetParent) {
  var rect = getOffsetRect(element);
  var offsetRect = getOffsetRect(offsetParent);

  // Subtract the offsetParent's border width
  var borderWidth = getBordersSize(offsetParent);
  rect.top -= offsetRect.top + borderWidth.top;
  rect.bottom -= offsetRect.top + borderWidth.top;
  rect.left -= offsetRect.left + borderWidth.left;
  rect.right -= offsetRect.left + borderWidth.left;

  // Add the scroll position of the offsetParent
  var isFixed = getStyleComputedProperty(offsetParent, 'position') === 'fixed';
  if (!isFixed) {
    var scroll = getScroll(offsetParent);
    rect.top -= scroll.scrollTop;
    rect.bottom -= scroll.scrollTop;
    rect.left -= scroll.scrollLeft;
    rect.right -= scroll.scrollLeft;
  }

  return rect;
}

function getOffsetRect(element) {
  var rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top
  };
}

function getBordersSize(element) {
  var styles = getStyleComputedProperty(element);
  var left = parseFloat(styles.borderLeftWidth);
  var top = parseFloat(styles.borderTopWidth);
  var right = parseFloat(styles.borderRightWidth);
  var bottom = parseFloat(styles.borderBottomWidth);

  return {
    left: left,
    top: top,
    right: right,
    bottom: bottom
  };
}

function getScroll(element) {
  var isBody = element.nodeName === 'BODY';
  var scrollLeft = element.scrollLeft;
  var scrollTop = element.scrollTop;

  if (isBody) {
    scrollLeft = window.pageXOffset;
    scrollTop = window.pageYOffset;
  }

  return {
    scrollTop: scrollTop,
    scrollLeft: scrollLeft
  };
}

function getBoundingClientRect(element) {
  var rect = element.getBoundingClientRect();
  var isIE = isIE11 || isIE10;

  // Fixes problems with interdimensional spacing in IE
  var rectWithScroll = getScroll(element);
  var top = rect.top + rectWithScroll.scrollTop;
  var left = rect.left + rectWithScroll.scrollLeft;

  if (isIE) {
    top -= element.ownerDocument.documentElement.clientTop;
    left -= element.ownerDocument.documentElement.clientLeft;
  }

  return {
    left: left,
    top: top,
    right: left + rect.width,
    bottom: top + rect.height,
    width: rect.width,
    height: rect.height
  };
}

function getClientRects(element) {
  var rects = element.getClientRects();
  var isIE = isIE11 || isIE10;

  var result = [];
  for (var i = 0; i < rects.length; i++) {
    var rect = rects[i];
    var rectWithScroll = getScroll(element);
    var top = rect.top + rectWithScroll.scrollTop;
    var left = rect.left + rectWithScroll.scrollLeft;

    if (isIE) {
      top -= element.ownerDocument.documentElement.clientTop;
      left -= element.ownerDocument.documentElement.clientLeft;
    }

    result.push({
      left: left,
      top: top,
      right: left + rect.width,
      bottom: top + rect.height,
      width: rect.width,
      height: rect.height
    });
  }

  return result;
}

function getScrollParent(element) {
  // If the element is an input, we have to check its parent instead
  if (element.nodeName === 'INPUT' && element.hasAttribute('data-flip')) {
    element = element.parentNode;
  }

  var parent = getParentNode(element);
  var isIE = isIE11 || isIE10;
  var overflow = getStyleComputedProperty(parent, 'overflow');
  var overflowY = getStyleComputedProperty(parent, 'overflowY');
  var overflowX = getStyleComputedProperty(parent, 'overflowX');

  if (isIE) {
    // IE 10/11 have a bug where, if an element has overflow: visible set,
    // they don't return the scrollbar position properly. We can work around
    // this by forcing the overflow to 'auto' for a moment.
    if (overflow !== 'visible') {
      var prevOverflow = parent.style.overflow;
      parent.style.overflow = 'auto';
      var scroll = getScroll(parent);
      parent.style.overflow = prevOverflow;
      if (scroll.scrollTop > 0) {
        return parent;
      }
    }
  }

  if (overflow === 'auto' || overflowY === 'auto' || overflowX === 'auto') {
    return parent;
  } else if (parent.nodeName === 'BODY') {
    return parent.ownerDocument.documentElement;
  } else if (parent.nodeName === 'HTML') {
    return parent;
  }

  return getScrollParent(parent);
}

function isHorizontalScroll(element) {
  var styles = getStyleComputedProperty(element, 'overflowX');
  return styles === 'auto' || styles === 'scroll';
}

function isVerticalScroll(element) {
  var styles = getStyleComputedProperty(element, 'overflowY');
  return styles === 'auto' || styles === 'scroll';
}

function isScrollable(element) {
  var isIE = isIE11 || isIE10;
  var overflow = getStyleComputedProperty(element, 'overflow');
  var overflowX = getStyleComputedProperty(element, 'overflowX');
  var overflowY = getStyleComputedProperty(element, 'overflowY');

  if (isIE) {
    // IE 10/11 bug fix, see getScrollParent above
    if (overflow !== 'visible') {
      var prevOverflow = element.style.overflow;
      element.style.overflow = 'auto';
      var scroll = getScroll(element);
      element.style.overflow = prevOverflow;
      if (scroll.scrollTop > 0) {
        return true;
      }
    }
  }

  return overflow === 'scroll' || overflowX === 'scroll' || overflowY === 'scroll';
}

function getOffsetRectRelativeToCustomParent(element, offsetParent) {
  var rect = getOffsetRect(element);
  var offsetRect = getOffsetRect(offsetParent);
  var borderWidth = getBordersSize(offsetParent);

  rect.top -= offsetRect.top + borderWidth.top;
  rect.bottom -= offsetRect.top + borderWidth.top;
  rect.left -= offsetRect.left + borderWidth.left;
  rect.right -= offsetRect.left + borderWidth.left;

  return rect;
}

function getRectRelativeToOffsetParent(element, offsetParent) {
  var isFixed = getStyleComputedProperty(offsetParent, 'position') === 'fixed';
  var scroll = getScroll(offsetParent);

  if (isFixed) {
    return getOffsetRectRelativeToCustomParent(element, offsetParent);
  } else {
    return getOffsetRectRelativeToParent(element, offsetParent);
  }
}

function getViewportOffsetRect(element) {
  var viewport = getScrollParent(element);
  var isBody = viewport.nodeName === 'BODY';
  var isHTML = viewport.nodeName === 'HTML';
  var isFixed = getStyleComputedProperty(element, 'position') === 'fixed';

  var rect = getBoundingClientRect(element);

  var isIE = isIE11 || isIE10;
  var top = rect.top;
  var left = rect.left;

  if (isFixed) {
    if (isIE) {
      top -= viewport.clientTop;
      left -= viewport.clientLeft;
    }
    return {
      top: top,
      left: left,
      right: left + rect.width,
      bottom: top + rect.height,
      width: rect.width,
      height: rect.height
    };
  }

  var scroll = getScroll(viewport);

  top -= scroll.scrollTop;
  left -= scroll.scrollLeft;

  if (isBody || isHTML) {
    var documentElement = viewport.ownerDocument.documentElement;
    if (isIE) {
      top -= documentElement.clientTop;
      left -= documentElement.clientLeft;
    }
  }

  return {
    top: top,
    left: left,
    right: left + rect.width,
    bottom: top + rect.height,
    width: rect.width,
    height: rect.height
  };
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.left - popperRect.width;
      break;
    default:
      popperOffsets.top = referenceOffsets.top;
      popperOffsets.left = referenceOffsets.left;
  }

  return popperOffsets;
}

/**
 * Helper used to know if the browser support the given CSS property
 * @param {string} property name of the css property to check
 * @return {boolean}
 */
function isSupported(property) {
  if (typeof document === 'undefined') {
    return false;
  }
  var div = document.createElement('div');
  var ret = false;
  if ('WebkitAppearance' in div.style) {
    ret = true;
  }
  if ('msTouchAction' in div.style) {
    ret = true;
  }
  if ('touchAction' in div.style) {
    ret = true;
  }
  if ('transition' in div.style) {
    ret = true;
  }
  if ('transform' in div.style) {
    ret = true;
  }

  return ret;
}

function isFixed(element) {
  return getStyleComputedProperty(element, 'position') === 'fixed';
}

function getOffsets(element, reference, position) {
  position = position.split('-')[0];

  var popperOffsets = getPopperOffsets(element, reference, position);
  var referenceOffsets = getReferenceOffsets(state, element, reference);

  // Take the difference between the popper and the reference offsets
  var difference = {
    top: referenceOffsets.top - popperOffsets.top,
    left: referenceOffsets.left - popperOffsets.left
  };

  // If the popper is fixed, we need to subtract the scroll position
  if (isFixed(element)) {
    var scroll = getScroll(element.ownerDocument.body);
    difference.top -= scroll.scrollTop;
    difference.left -= scroll.scrollLeft;
  }

  return difference;
}

function getOffsetRectRelativeTo(element, container) {
  var offset = getOffsetRect(container);
  var rect = getOffsetRect(element);

  // Calculate the difference between the two
  var diff = {
    top: rect.top - offset.top,
    left: rect.left - offset.left,
    bottom: rect.bottom - offset.bottom,
    right: rect.right - offset.right
  };

  return diff;
}

function getViewportOffsetRect(element) {
  var rect = getBoundingClientRect(element);
  var scroll = getScroll(element.ownerDocument.body);

  rect.top += scroll.scrollTop;
  rect.bottom += scroll.scrollTop;
  rect.left += scroll.scrollLeft;
  rect.right += scroll.scrollLeft;

  return rect;
}

function getReferenceOffsets(state, popper, reference) {
  var isFixed = getStyleComputedProperty(popper, 'position') === 'fixed';
  var referenceOffsets = isFixed ? getViewportOffsetRect(reference) : getBoundingClientRect(reference);

  var isIE = isIE11 || isIE10;
  var scrollParent = getScrollParent(popper);
  var isBody = scrollParent.nodeName === 'BODY';
  var isHTML = scrollParent.nodeName === 'HTML';

  var offsetParent = getOffsetParent(popper);
  var isOffsetParentBody = offsetParent.nodeName === 'BODY';

  if (isFixed) {
    if (isIE) {
      var documentElement = offsetParent.ownerDocument.documentElement;
      referenceOffsets.top -= documentElement.clientTop;
      referenceOffsets.left -= documentElement.clientLeft;
    }
  } else {
    var scroll = getScroll(scrollParent);
    referenceOffsets.top += scroll.scrollTop;
    referenceOffsets.bottom += scroll.scrollTop;
    referenceOffsets.left += scroll.scrollLeft;
    referenceOffsets.right += scroll.scrollLeft;

    if (!isBody && !isHTML) {
      referenceOffsets.top -= scrollParent.clientTop;
      referenceOffsets.left -= scrollParent.clientLeft;
    }
  }

  // Calculate the difference between the reference's offset and the offset parent's
  // If the popper is not fixed, the offset parent is considered as the element
  // that defines the coordinate system (normal flow), which is usually the body or
  // the documentElement. If the popper is fixed, the offset parent is considered
  // as the viewport.
  var isOffsetParentBodyHTML = isOffsetParentBody || offsetParent.nodeName === 'HTML';
  var offsetParentOffsets = isFixed ? { top: 0, left: 0 } : isOffsetParentBodyHTML ? getBoundingClientRect(offsetParent) : getOffsetRect(offsetParent);

  offsetParentOffsets.top += getScroll(offsetParent).scrollTop;
  offsetParentOffsets.left += getScroll(offsetParent).scrollLeft;

  if (isFixed) {
    if (isIE) {
      offsetParentOffsets.top -= offsetParent.clientTop;
      offsetParentOffsets.left -= offsetParent.clientLeft;
    }
  } else {
    // Subtract the offsetParent's border width
    var borderWidth = getBordersSize(offsetParent);
    offsetParentOffsets.top += borderWidth.top;
    offsetParentOffsets.left += borderWidth.left;
  }

  return {
    top: referenceOffsets.top - offsetParentOffsets.top,
    left: referenceOffsets.left - offsetParentOffsets.left,
    bottom: referenceOffsets.bottom - offsetParentOffsets.top,
    right: referenceOffsets.right - offsetParentOffsets.left,
    width: referenceOffsets.width,
    height: referenceOffsets.height
  };
}

function getPopperOffsets(popper, referenceOffsets, position) {
  var popperRect = getOffsetRect(popper);
  var popperOffsets = {
    width: popperRect.width,
    height: popperRect.height
  };

  // Add position properties to the popper offsets
  switch (position) {
    case 'top':
      popperOffsets.top = referenceOffsets.top - popperRect.height;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'bottom':
      popperOffsets.top = referenceOffsets.bottom;
      popperOffsets.left = referenceOffsets.left + referenceOffsets.width / 2 - popperRect.width / 2;
      break;
    case 'right':
      popperOffsets.top = referenceOffsets.top + referenceOffsets.height / 2 - popperRect.height / 2;
      popperOffsets.left = referenceOffsets.right;
      break;
    case 'left':
      