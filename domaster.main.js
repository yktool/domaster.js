/* domaster.main.js ver.0.0.0 create by dai_fuku optimized */
(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    // CommonJS / Node.js
    module.exports = factory();
  } else {
    // browser global
    const targetGlobal = root || globalThis;
    targetGlobal.domaster = targetGlobal.DM = factory();
  }
})(typeof window !== "undefined" ? window : globalThis, function(unde) {
  "use strict";

  /* --- start polyfill --- */

  var _IntersectionObserver, _IntersectionObserverEntry, _ResizeObserver, _AbortController, _AbortSignal;

  /**
   * abortcontroller-polyfill
   * Copyright (c) 2017 Martin Carlberg
   * Released under the MIT License
   * https://github.com/mo/abortcontroller-polyfill/blob/master/LICENSE
   */

  /* Modified */
  (function() {
    "use strict";

    if (typeof window !== "object") return;
    if ("AbortController" in window && "AbortSignal" in window) {
      _AbortController = window.AbortController;
      _AbortSignal = window.AbortSignal;
      return;
    };

    var Emitter = function() {
      this.listeners = {};
    };

    Emitter.prototype.addEventListener = function(type, callback) {
      if (!(type in this.listeners)) {
        this.listeners[ type ] = [];
      }
      this.listeners[ type ].push(callback);
    };

    Emitter.prototype.removeEventListener = function(type, callback) {
      if (!(type in this.listeners)) return;
      var stack = this.listeners[ type ];
      for (var i = 0, l = stack.length; i < l; i++) {
        if (stack[ i ] === callback) {
          stack.splice(i, 1);
          return;
        }
      }
    };

    Emitter.prototype.dispatchEvent = function(event) {
      if (!(event.type in this.listeners)) return true;
      var stack = this.listeners[ event.type ].slice();
      for (var i = 0, l = stack.length; i < l; i++) {
        stack[ i ].call(this, event);
      }
      return !event.defaultPrevented;
    };

    var AbortSignal = function() {
      Emitter.call(this);
      this.aborted = false;
      this.onabort = null;
    };
    AbortSignal.prototype = Object.create(Emitter.prototype);
    AbortSignal.prototype.constructor = AbortSignal;

    AbortSignal.prototype.toString = function() {
      return "[object AbortSignal]";
    };

    AbortSignal.prototype.dispatchEvent = function(event) {
      if (event.type === "abort") {
        if (typeof this.onabort === "function") {
          this.onabort.call(this, event);
        }
      }
      return Emitter.prototype.dispatchEvent.call(this, event);
    };

    var AbortController = function() {
      this.signal = new AbortSignal;
    };

    AbortController.prototype.abort = function() {
      if (this.signal.aborted) return;
      this.signal.aborted = true;
      var event;
      try {
        event = new Event("abort");
      } catch (e) {
        if (typeof document !== "undefined" && document.createEvent) {
          event = document.createEvent("Event");
          event.initEvent("abort", false, false);
        } else {
          event = { type: "abort", bubbles: false, cancelable: false };
        }
      }
      this.signal.dispatchEvent(event);
    };

    AbortController.prototype.toString = function() {
      return "[object AbortController]";
    };

    _AbortController = window.AbortController || AbortController;
    _AbortSignal = window.AbortSignal || AbortSignal;
  }());

  /**
   * Copyright 2016 Google Inc. All Rights Reserved.
   *
   * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
   *
   * https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
   */

  /* Modified */
  (function() {
    "use strict";

    if (typeof window !== "object") return;

    if ("IntersectionObserver" in window &&
      "IntersectionObserverEntry" in window &&
      "intersectionRatio" in window.IntersectionObserverEntry.prototype) {

      if (!("isIntersecting" in window.IntersectionObserverEntry.prototype)) {
        Object.defineProperty(window.IntersectionObserverEntry.prototype, "isIntersecting", {
          get() {
            return this.intersectionRatio > 0;
          }
        });
      }
      _IntersectionObserver = window.IntersectionObserver;
      _IntersectionObserverEntry = window.IntersectionObserverEntry;
      return;
    }

    var getFrameElement = doc => {
      try {
        return doc.defaultView && doc.defaultView.frameElement || null;
      } catch (e) {
        return null;
      }
    },
      document = (startDoc => {
        var doc = startDoc,
          frame = getFrameElement(doc);
        while (frame) {
          doc = frame.ownerDocument;
          frame = getFrameElement(doc);
        }
        return doc;
      })(window.document),

      registry = [],
      crossOriginUpdater = null,
      crossOriginRect = null,

      IntersectionObserverEntry = function(entry) {
        this.time = entry.time;
        this.target = entry.target;
        this.rootBounds = ensureDOMRect(entry.rootBounds);
        this.boundingClientRect = ensureDOMRect(entry.boundingClientRect);
        this.intersectionRect = ensureDOMRect(entry.intersectionRect || getEmptyRect());
        this.isIntersecting = !!entry.intersectionRect;

        var targetRect = this.boundingClientRect,
          targetArea = targetRect.width * targetRect.height,
          intersectionRect = this.intersectionRect,
          intersectionArea = intersectionRect.width * intersectionRect.height;

        if (targetArea) {
          this.intersectionRatio = Number((intersectionArea / targetArea).toFixed(4));
        } else {
          this.intersectionRatio = this.isIntersecting ? 1 : 0;
        }
      },
      IntersectionObserver = function(callback, opt_options) {
        var options = opt_options || {};
        if (typeof callback != "function") {
          throw new Error("callback must be a function");
        }
        if (
          options.root &&
          options.root.nodeType != 1 &&
          options.root.nodeType != 9
        ) {
          throw new Error("root must be a Document or Element");
        }

        this._checkForIntersections = throttle(
          this._checkForIntersections.bind(this),
          this.THROTTLE_TIMEOUT);

        this._callback = callback;
        this._observationTargets = [];
        this._queuedEntries = [];
        this._rootMarginValues = this._parseRootMargin(options.rootMargin);

        this.thresholds = this._initThresholds(options.threshold);
        this.root = options.root || null;
        this.rootMargin = this._rootMarginValues.map(margin =>
          margin.value + margin.unit
        ).join(" ");

        this._monitoringDocuments = [];
        this._monitoringUnsubscribes = [];
      }

    IntersectionObserver.prototype.THROTTLE_TIMEOUT = 100;
    IntersectionObserver.prototype.POLL_INTERVAL = null;
    IntersectionObserver.prototype.USE_MUTATION_OBSERVER = true;

    IntersectionObserver._setupCrossOriginUpdater = function() {
      if (!crossOriginUpdater) {
        crossOriginUpdater = function(boundingClientRect, intersectionRect) {
          if (!boundingClientRect || !intersectionRect) {
            crossOriginRect = getEmptyRect();
          } else {
            crossOriginRect = convertFromParentRect(boundingClientRect, intersectionRect);
          }
          registry.forEach(function(observer) {
            observer._checkForIntersections();
          });
        };
      }
      return crossOriginUpdater;
    };

    IntersectionObserver._resetCrossOriginUpdater = function() {
      crossOriginUpdater = null;
      crossOriginRect = null;
    };

    IntersectionObserver.prototype.observe = function(target) {
      var isTargetAlreadyObserved = this._observationTargets.some(item =>
        item.element == target
      );

      if (isTargetAlreadyObserved) return;

      if (!(target && target.nodeType == 1)) {
        throw new Error("target must be an Element");
      }

      this._registerInstance();
      this._observationTargets.push({ element: target, entry: null });
      this._monitorIntersections(target.ownerDocument);
      this._checkForIntersections();
    };

    IntersectionObserver.prototype.unobserve = function(target) {
      this._observationTargets = this._observationTargets.filter(item =>
        item.element != target
      );
      this._unmonitorIntersections(target.ownerDocument);
      if (this._observationTargets.length == 0) {
        this._unregisterInstance();
      }
    };

    IntersectionObserver.prototype.disconnect = function() {
      this._observationTargets = [];
      this._unmonitorAllIntersections();
      this._unregisterInstance();
    };

    IntersectionObserver.prototype.takeRecords = function() {
      var records = this._queuedEntries.slice();
      this._queuedEntries = [];
      return records;
    };

    IntersectionObserver.prototype._initThresholds = function(opt_threshold) {
      var threshold = opt_threshold || [ 0 ];
      if (!Array.isArray(threshold)) threshold = [ threshold ];

      return threshold.sort().filter(function(t, i, a) {
        if (typeof t != "number" || isNaN(t) || t < 0 || t > 1) {
          throw new Error("threshold must be a number between 0 and 1 inclusively");
        }
        return t !== a[ i - 1 ];
      });
    };

    IntersectionObserver.prototype._parseRootMargin = function(opt_rootMargin) {
      var marginString = opt_rootMargin || "0px",
        margins = marginString.split(/\s+/).map(margin => {
          var parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);
          if (!parts) {
            throw new Error("rootMargin must be specified in pixels or percent");
          }
          return { value: parseFloat(parts[ 1 ]), unit: parts[ 2 ] };
        });

      margins[ 1 ] = margins[ 1 ] || margins[ 0 ];
      margins[ 2 ] = margins[ 2 ] || margins[ 0 ];
      margins[ 3 ] = margins[ 3 ] || margins[ 1 ];

      return margins;
    };

    IntersectionObserver.prototype._monitorIntersections = function(doc) {
      var win = doc.defaultView;
      if (!win || this._monitoringDocuments.indexOf(doc) != -1) return;

      var callback = this._checkForIntersections,
        monitoringInterval = null,
        domObserver = null;

      if (this.POLL_INTERVAL) {
        monitoringInterval = win.setInterval(callback, this.POLL_INTERVAL);
      } else {
        addEvent(win, "resize", callback, true);
        addEvent(doc, "scroll", callback, true);

        if (this.USE_MUTATION_OBSERVER && "MutationObserver" in win) {
          domObserver = new win.MutationObserver(callback);
          domObserver.observe(doc, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
          });
        }
      }

      this._monitoringDocuments.push(doc);
      this._monitoringUnsubscribes.push(function() {
        var win = doc.defaultView;
        if (win) {
          if (monitoringInterval) {
            win.clearInterval(monitoringInterval);
          }
          removeEvent(win, "resize", callback, true);
        }
        removeEvent(doc, "scroll", callback, true);
        if (domObserver) {
          domObserver.disconnect();
        }
      });

      var rootDoc = (this.root && (this.root.ownerDocument || this.root)) || document;
      if (doc != rootDoc) {
        var frame = getFrameElement(doc);
        if (frame) {
          this._monitorIntersections(frame.ownerDocument);
        }
      }
    };

    IntersectionObserver.prototype._unmonitorIntersections = function(doc) {
      var index = this._monitoringDocuments.indexOf(doc);
      if (index == -1) return;

      var rootDoc = (this.root && (this.root.ownerDocument || this.root)) || document,

        hasDependentTargets = this._observationTargets.some(item => {
          var itemDoc = item.element.ownerDocument;
          if (itemDoc == doc) {
            return true;
          }
          while (itemDoc && itemDoc != rootDoc) {
            var frame = getFrameElement(itemDoc);
            itemDoc = frame && frame.ownerDocument;
            if (itemDoc == doc) return true;
          }
          return false;
        });

      if (hasDependentTargets) return;

      var unsubscribe = this._monitoringUnsubscribes[ index ];
      this._monitoringDocuments.splice(index, 1);
      this._monitoringUnsubscribes.splice(index, 1);
      unsubscribe();

      if (doc != rootDoc) {
        var frame = getFrameElement(doc);
        if (frame) {
          this._unmonitorIntersections(frame.ownerDocument);
        }
      }
    };

    IntersectionObserver.prototype._unmonitorAllIntersections = function() {
      var unsubscribes = this._monitoringUnsubscribes.slice(0);
      this._monitoringDocuments.length = 0;
      this._monitoringUnsubscribes.length = 0;
      for (var i = 0; i < unsubscribes.length; i++) {
        unsubscribes[ i ]();
      }
    };

    IntersectionObserver.prototype._checkForIntersections = function() {
      if (!this.root && crossOriginUpdater && !crossOriginRect) return;

      var rootIsInDom = this._rootIsInDom(),
        rootRect = rootIsInDom ? this._getRootRect() : getEmptyRect();

      this._observationTargets.forEach(item => {
        var target = item.element,
          targetRect = getBoundingClientRect(target),
          rootContainsTarget = this._rootContainsTarget(target),
          oldEntry = item.entry,
          intersectionRect = rootIsInDom && rootContainsTarget && this._computeTargetAndRootIntersection(target, targetRect, rootRect),
          rootBounds = null;
        if (!this._rootContainsTarget(target)) {
          rootBounds = getEmptyRect();
        } else if (!crossOriginUpdater || this.root) {
          rootBounds = rootRect;
        }

        var newEntry = item.entry = new IntersectionObserverEntry({
          time: now(),
          target: target,
          boundingClientRect: targetRect,
          rootBounds: rootBounds,
          intersectionRect: intersectionRect
        });

        if (!oldEntry) {
          this._queuedEntries.push(newEntry);
        } else if (rootIsInDom && rootContainsTarget) {
          if (this._hasCrossedThreshold(oldEntry, newEntry)) {
            this._queuedEntries.push(newEntry);
          }
        } else {
          if (oldEntry && oldEntry.isIntersecting) {
            this._queuedEntries.push(newEntry);
          }
        }
      }, this);

      if (this._queuedEntries.length) {
        this._callback(this.takeRecords(), this);
      }
    };

    IntersectionObserver.prototype._computeTargetAndRootIntersection = function(target, targetRect, rootRect) {
      if (window.getComputedStyle(target).display == "none") return;

      var intersectionRect = targetRect,
        parent = getParentNode(target),
        atRoot = false;

      while (!atRoot && parent) {
        var parentRect = null,
          parentComputedStyle = parent.nodeType == 1 ? window.getComputedStyle(parent) : {};

        if (parentComputedStyle.display == "none") return null;

        if (parent == this.root || parent.nodeType == 9) {
          atRoot = true;
          if (parent == this.root || parent == document) {
            if (crossOriginUpdater && !this.root) {
              if (!crossOriginRect || crossOriginRect.width == 0 && crossOriginRect.height == 0) {
                parent = null;
                parentRect = null;
                intersectionRect = null;
              } else {
                parentRect = crossOriginRect;
              }
            } else {
              parentRect = rootRect;
            }
          } else {
            var frame = getParentNode(parent),
              frameRect = frame && getBoundingClientRect(frame),
              frameIntersect = frame && this._computeTargetAndRootIntersection(frame, frameRect, rootRect);
            if (frameRect && frameIntersect) {
              parent = frame;
              parentRect = convertFromParentRect(frameRect, frameIntersect);
            } else {
              parent = null;
              intersectionRect = null;
            }
          }
        } else {
          var doc = parent.ownerDocument;
          if (parent != doc.body && parent != doc.documentElement && parentComputedStyle.overflow != "visible") {
            parentRect = getBoundingClientRect(parent);
          }
        }

        if (parentRect) {
          intersectionRect = computeRectIntersection(parentRect, intersectionRect);
        }
        if (!intersectionRect) break;
        parent = parent && getParentNode(parent);
      }
      return intersectionRect;
    };

    IntersectionObserver.prototype._getRootRect = function() {
      var rootRect;
      if (this.root && !isDoc(this.root)) {
        rootRect = getBoundingClientRect(this.root);
      } else {
        var doc = isDoc(this.root) ? this.root : document,
          html = doc.documentElement,
          body = doc.body;
        rootRect = {
          top: 0,
          left: 0,
          right: html.clientWidth || body.clientWidth,
          width: html.clientWidth || body.clientWidth,
          bottom: html.clientHeight || body.clientHeight,
          height: html.clientHeight || body.clientHeight
        };
      }
      return this._expandRectByRootMargin(rootRect);
    };

    IntersectionObserver.prototype._expandRectByRootMargin = function(rect) {
      var margins = this._rootMarginValues.map((margin, i) =>
        margin.unit == "px" ? margin.value : margin.value * (i % 2 ? rect.width : rect.height) / 100
      ),

        newRect = {
          top: rect.top - margins[ 0 ],
          right: rect.right + margins[ 1 ],
          bottom: rect.bottom + margins[ 2 ],
          left: rect.left - margins[ 3 ]
        };

      newRect.width = newRect.right - newRect.left;
      newRect.height = newRect.bottom - newRect.top;
      return newRect;
    };

    IntersectionObserver.prototype._hasCrossedThreshold = function(oldEntry, newEntry) {
      var oldRatio = oldEntry && oldEntry.isIntersecting ? oldEntry.intersectionRatio || 0 : -1,
        newRatio = newEntry.isIntersecting ? newEntry.intersectionRatio || 0 : -1;

      if (oldRatio === newRatio) return;

      for (var i = 0; i < this.thresholds.length; i++) {
        var threshold = this.thresholds[ i ];
        if (threshold == oldRatio || threshold == newRatio || threshold < oldRatio !== threshold < newRatio) {
          return true;
        }
      }
    };

    IntersectionObserver.prototype._rootIsInDom = function() {
      return !this.root || containsDeep(document, this.root);
    };

    IntersectionObserver.prototype._rootContainsTarget = function(target) {
      var rootDoc = (this.root && (this.root.ownerDocument || this.root)) || document;
      return (
        containsDeep(rootDoc, target) && (!this.root || rootDoc == target.ownerDocument)
      );
    };

    IntersectionObserver.prototype._registerInstance = function() {
      if (registry.indexOf(this) < 0) {
        registry.push(this);
      }
    };

    IntersectionObserver.prototype._unregisterInstance = function() {
      var index = registry.indexOf(this);
      if (index != -1) registry.splice(index, 1);
    };

    var now = _ =>
      window.performance && performance.now && performance.now(),

      throttle = (fn, timeout) => {
        var timer = null;
        return _ => {
          if (!timer) {
            timer = setTimeout(_ => {
              fn();
              timer = null;
            }, timeout);
          }
        };
      },

      addEvent = (node, event, fn, opt_useCapture) => {
        if (typeof node.addEventListener == "function") {
          node.addEventListener(event, fn, opt_useCapture || false);
        } else if (typeof node.attachEvent == "function") {
          node.attachEvent("on" + event, fn);
        }
      },

      removeEvent = (node, event, fn, opt_useCapture) => {
        if (typeof node.removeEventListener == "function") {
          node.removeEventListener(event, fn, opt_useCapture || false);
        } else if (typeof node.detachEvent == "function") {
          node.detachEvent("on" + event, fn);
        }
      },

      computeRectIntersection = (rect1, rect2) => {
        var top = Math.max(rect1.top, rect2.top),
          bottom = Math.min(rect1.bottom, rect2.bottom),
          left = Math.max(rect1.left, rect2.left),
          right = Math.min(rect1.right, rect2.right),
          width = right - left,
          height = bottom - top;

        return (width >= 0 && height >= 0) && {
          top: top,
          bottom: bottom,
          left: left,
          right: right,
          width: width,
          height: height
        } || null;
      },

      getBoundingClientRect = el => {
        var rect;
        try {
          rect = el.getBoundingClientRect();
        } catch (err) { }

        if (!rect) return getEmptyRect();

        if (!(rect.width && rect.height)) {
          rect = {
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.right - rect.left,
            height: rect.bottom - rect.top
          };
        }
        return rect;
      },

      getEmptyRect = _ =>
        ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }),

      ensureDOMRect = rect => {
        if (!rect || "x" in rect) {
          return rect;
        }
        return {
          top: rect.top,
          y: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          x: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height
        };
      },

      convertFromParentRect = (parentBoundingRect, parentIntersectionRect) => {
        var top = parentIntersectionRect.top - parentBoundingRect.top,
          left = parentIntersectionRect.left - parentBoundingRect.left;
        return {
          top: top,
          left: left,
          height: parentIntersectionRect.height,
          width: parentIntersectionRect.width,
          bottom: top + parentIntersectionRect.height,
          right: left + parentIntersectionRect.width
        };
      },

      containsDeep = (parent, child) => {
        var node = child;
        while (node) {
          if (node == parent) return true;
          node = getParentNode(node);
        }
        return false;
      },

      getParentNode = node => {
        var parent = node.parentNode;
        if (node.nodeType == 9 && node != document) {
          return getFrameElement(node);
        }
        if (parent && parent.assignedSlot) {
          parent = parent.assignedSlot.parentNode;
        }
        if (parent && parent.nodeType == 11 && parent.host) {
          return parent.host;
        }
        return parent;
      },

      isDoc = node =>
        node && node.nodeType === 9;

    _IntersectionObserver = IntersectionObserver;
    _IntersectionObserverEntry = IntersectionObserverEntry;
  }());

  /* ResizeObserver polyfill */
  (function() {
    "use strict";

    if (typeof window !== "object") return;

    if (typeof window.ResizeObserver === "function") {
      _ResizeObserver = window.ResizeObserver;
      return;
    }

    var observationTargets = [],
      animationFrameId = null,

      getContentRect = target => {
        var rect;
        try {
          rect = target.getBoundingClientRect();
        } catch (e) {
          rect = { width: 0, height: 0, top: 0, left: 0 };
        }

        var style = window.getComputedStyle(target),
          paddingLeft = parseFloat(style.paddingLeft) || 0,
          paddingTop = parseFloat(style.paddingTop) || 0,
          paddingRight = parseFloat(style.paddingRight) || 0,
          paddingBottom = parseFloat(style.paddingBottom) || 0,
          borderLeft = parseFloat(style.borderLeftWidth) || 0,
          borderTop = parseFloat(style.borderTopWidth) || 0,
          borderRight = parseFloat(style.borderRightWidth) || 0,
          borderBottom = parseFloat(style.borderBottomWidth) || 0,

          width = Math.max(0, rect.width - paddingLeft - paddingRight - borderLeft - borderRight),
          height = Math.max(0, rect.height - paddingTop - paddingBottom - borderTop - borderBottom);

        return {
          top: paddingTop,
          left: paddingLeft,
          width: width,
          height: height,
          right: paddingLeft + width,
          bottom: paddingTop + height,
          x: paddingLeft,
          y: paddingTop
        };
      },

      ResizeObserverEntry = function(target, rect) {
        this.target = target;
        this.contentRect = rect;
        this.borderBoxSize = [ { inlineSize: target.offsetWidth || 0, blockSize: target.offsetHeight || 0 } ];
        this.contentBoxSize = [ { inlineSize: rect.width, blockSize: rect.height } ];
        this.devicePixelContentBoxSize = [ {
          inlineSize: Math.round(rect.width * (window.devicePixelRatio || 1)),
          blockSize: Math.round(rect.height * (window.devicePixelRatio || 1))
        } ];
      },

      checkAll = _ => {
        animationFrameId = null;
        if (!observationTargets.length) return;

        var callbacks = new Map;

        for (var i = 0; i < observationTargets.length; i++) {
          var item = observationTargets[ i ],
            rect = getContentRect(item.target);

          if (!item.lastRect || item.lastRect.width !== rect.width || item.lastRect.height !== rect.height) {
            item.lastRect = rect;
            var entry = new ResizeObserverEntry(item.target, rect);
            if (!callbacks.has(item.observer)) {
              callbacks.set(item.observer, []);
            }
            callbacks.get(item.observer).push(entry);
          }
        }

        callbacks.forEach((entries, observer) => {
          observer._callback(entries, observer);
        });

        scheduleCheck();
      },

      scheduleCheck = _ => {
        if (!animationFrameId && observationTargets.length > 0) {
          animationFrameId = typeof window.requestAnimationFrame === "function"
            ? window.requestAnimationFrame(checkAll)
            : setTimeout(checkAll, 20);
        }
      },

      ResizeObserver = function(callback) {
        if (typeof callback !== "function") {
          throw new TypeError("ResizeObserver callback must be a function");
        }
        this._callback = callback;
        this._targets = [];
      };

    ResizeObserver.prototype.observe = function(target) {
      if (!(target && target.nodeType === 1)) {
        throw new TypeError("target must be an Element");
      }
      if (this._targets.indexOf(target) !== -1) return;

      this._targets.push(target);
      observationTargets.push({
        observer: this,
        target: target,
        lastRect: null
      });
      scheduleCheck();
    };

    ResizeObserver.prototype.unobserve = function(target) {
      var index = this._targets.indexOf(target);
      if (index === -1) return;

      this._targets.splice(index, 1);
      for (var i = observationTargets.length - 1; i >= 0; i--) {
        if (observationTargets[ i ].observer === this && observationTargets[ i ].target === target) {
          observationTargets.splice(i, 1);
          break;
        }
      }
    };

    ResizeObserver.prototype.disconnect = function() {
      for (var i = 0; i < this._targets.length; i++) {
        var target = this._targets[ i ];
        for (var j = observationTargets.length - 1; j >= 0; j--) {
          if (observationTargets[ j ].observer === this && observationTargets[ j ].target === target) {
            observationTargets.splice(j, 1);
          }
        }
      }
      this._targets = [];
    };

    _ResizeObserver = ResizeObserver;
  }());

  /* --- end polyfill --- */

  var supportsEventListenerSignal = (_ => {
    let supportsSignal = false;
    try {
      const options = Object.defineProperty({}, "signal", {
        get() {
          supportsSignal = true;
          return new _AbortController().signal;
        }
      });
      const dummy = _ => { };
      window.addEventListener("test-signal-check", dummy, options);
      window.removeEventListener("test-signal-check", dummy, options);
    } catch (e) {
      supportsSignal = false;
    }
    return supportsSignal;
  })(),

    obj = Object.prototype,
    style = getComputedStyle,
    d = document,

    NO = _ => false,

    isElement = target => {
      if (!target || target.nodeType !== 1) return false;
      let doc = target.ownerDocument,
        win = (doc && doc.defaultView) || window;
      return target instanceof win.Element;
    },
    isList = target => target instanceof HTMLCollection || target instanceof NodeList,
    isDM = target => target instanceof DM,
    isTem = target => target instanceof DMTem,
    isState = target => target instanceof DMState,
    isComponent = target => target instanceof DMComponent,
    isObject = target => obj.toString.call(target) === "[object Object]",
    isString = target => typeof target === "string",
    isNumber = target => typeof target === "number",
    isFunction = target => typeof target === "function",

    hasOwn = (target, prop) => obj.hasOwnProperty.call(target, prop),

    Default = Symbol("default"),
    once = Symbol("once"),
    isOnceSymbol = target => target === once,

    FindTags = target => {
      const firstChar = target.charCodeAt(0);
      if (firstChar === 36) { // "$"
        return d.getElementById(target.slice(1));
      } else if (firstChar === 95) { // "_"
        var elements = d.getElementsByClassName(target.slice(1));
      } else {
        var elements = d.querySelectorAll(target);
      }
      return elements.length === 1 ? elements[ 0 ] : elements;
    },

    ElementMap = new Map,
    getData = target => ElementMap.get(target),

    BlockElements = /^(?:html|body|article|aside|footer|header|hgroup|main|nav|search|section|h[1-6]|p|blockquote|pre|address|div|figure|figcaption|hr|ul|ol|dl|dt|dd|form|fieldset|legend|details|summary|dialog)$/,
    InlineElements = /^(?:a|span|strong|em|b|i|small|mark|del|ins|code|kbd|samp|var|abbr|cite|q|time|data|dfn|bdo|bdi|ruby|rt|rp|sub|sup|label|wbr|s|u)$/,
    InlineBlockElements = /^(?:button|input|select|textarea|meter|progress|img|video|audio|canvas|iframe|embed|object)$/,
    NoneElements = /^(?:head|title|meta|link|style|script|template)$/,
    OtherElements = new Map([
      [ "li", "list-item" ],
      [ "table", "table" ],
      [ "caption", "table-caption" ],
      [ "thead", "table-header-group" ],
      [ "tbody", "table-row-group" ],
      [ "tfoot", "table-footer-group" ],
      [ "tr", "table-row" ],
      [ "td", "table-cell" ],
      [ "th", "table-cell" ],
      [ "colgroup", "table-column-group" ],
      [ "col", "table-column-group" ],
      [ "ruby", "ruby" ],
      [ "rt", "ruby-text" ]
    ]),

    getDisplay = el => {
      const Tag = el.tagName.toLowerCase();
      return BlockElements.test(Tag) ? "block" :
        InlineElements.test(Tag) ? "inline" :
          InlineBlockElements.test(Tag) ? "inline-block" :
            NoneElements.test(Tag) ? "none" :
              OtherElements.get(Tag) || "block"
    },

    ishiding = el => {
      const styles = style(el);
      return styles.visibility === "hidden" ? [ "visibility", "hidden" ] :
        styles.opacity === "0" ? [ "opacity", "0" ] :
          styles.display === "none" ? [ "display", "none" ] :
            false;
    },

    getElValue = el => {
      if (!el) return "";
      if (el.tagName === "SELECT" && el.multiple) {
        return Array.from(el.selectedOptions).map(opt => opt.value);
      }
      return el.value !== unde ? el.value : "";
    },

    getCustomData = (el, key) => {
      const elData = getData(el),
        store = elData ? elData.get("customData") : null;
      if (store && store.has(key)) return store.get(key);
      return el.dataset ? el.dataset[ key ] : unde;
    },

    getCssVar = (el, formattedName) => style(el).getPropertyValue(formattedName).trim(),

    createEventHandler = (f, el, isOnce, eventList, Edata, controller) => {
      if (!isFunction(f)) return f;
      return function(...args) {
        if (isOnce) {
          const idx = eventList.indexOf(Edata);
          if (idx !== -1) eventList.splice(idx, 1);
          controller.abort();
        }
        return f.apply(el, args);
      };
    },

    createDelegatedHandler = (selector, fn) => {
      return function(e) {
        const targetElement = e.target.closest(selector);
        if (targetElement && this.contains(targetElement)) {
          fn.call(targetElement, e, targetElement);
        }
      };
    },

    clearTargetEvents = targetElement => {
      const target = getData(targetElement);
      if (!target) return;
      const events = target.get("events");
      if (!events) return;
      events.forEach((eventList, eventName) => {
        for (let i = 0; i < eventList.length; i++) {
          eventList[ i ].Controller.abort();
        }
        events.set(eventName, []);
      });
    },

    patchNode = (oldNode, newNode) => {
      if (oldNode.nodeType !== newNode.nodeType || oldNode.nodeName !== newNode.nodeName) {
        oldNode.replaceWith(newNode.cloneNode(true));
        return;
      }

      if (oldNode.nodeType === Node.TEXT_NODE) {
        if (oldNode.textContent !== newNode.textContent) {
          oldNode.textContent = newNode.textContent;
        }
        return;
      }

      if (oldNode.nodeType === Node.ELEMENT_NODE) {
        const oldAttrs = oldNode.attributes,
          newAttrs = newNode.attributes;

        for (let i = 0, len = oldAttrs.length; i < len; i++) {
          const attr = oldAttrs[ i ];
          if (!newNode.hasAttribute(attr.name)) {
            oldNode.removeAttribute(attr.name);
          }
        }

        for (let i = 0, len = newAttrs.length; i < len; i++) {
          const attr = newAttrs[ i ];
          if (oldNode.getAttribute(attr.name) !== attr.value) {
            oldNode.setAttribute(attr.name, attr.value);
          }
        }

        if ("value" in oldNode && oldNode.value !== newNode.value && d.activeElement !== oldNode) {
          oldNode.value = newNode.value;
        }

        const oldChildren = Array.from(oldNode.childNodes),
          newChildren = Array.from(newNode.childNodes),
          max = Math.max(oldChildren.length, newChildren.length);

        for (let i = 0; i < max; i++) {
          if (!oldChildren[ i ]) {
            oldNode.appendChild(newChildren[ i ].cloneNode(true));
          } else if (!newChildren[ i ]) {
            cleanupElement(oldChildren[ i ]);
            oldChildren[ i ].remove();
          } else {
            patchNode(oldChildren[ i ], newChildren[ i ]);
          }
        }
      }
    },

    downEvent = window.PointerEvent ? "pointerdown" :
      ("ontouchstart" in window ? "touchstart" :
        "mousedown"),

    uniqueEvents = new Map([
      [ "scrollIn", (fn, target, controller, { margin, type, limit }, data) => {
        const eventList = getData(target).get("events").get("scrollIn"),
          { signal } = controller;
        let count = 0,
          isInView = false,
          rafId = null;

        if (isNumber(margin)) {
          margin = String(margin) + (isString(type) ? type : "px");
        }

        const options = {
          root: null,
          rootMargin: `0px 0px ${margin || "-150px"}`,
          threshold: [ 0, 0.1 ]
        },

          observer = new _IntersectionObserver(entries => {
            const entry = entries[ entries.length - 1 ];
            if (!entry) return;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(_ => {
              if (entry.isIntersecting && entry.intersectionRatio >= 0.05 && !isInView) {
                isInView = true;
                fn(entry);
                count++;
                if (limit && count >= limit) {
                  const idx = eventList.indexOf(data);
                  if (idx !== -1) eventList.splice(idx, 1);
                  controller.abort();
                }
              } else if (!entry.isIntersecting || entry.intersectionRatio === 0) {
                isInView = false;
              }
            });
          }, options);

        observer.observe(target);

        signal.addEventListener("abort", _ => {
          if (rafId) cancelAnimationFrame(rafId);
          observer.disconnect();
        });
      } ],
      [ "scrollOut", (fn, target, controller, { margin, type, limit }, data) => {
        const eventList = getData(target).get("events").get("scrollOut"),
          { signal } = controller;
        let count = 0,
          isInView = null,
          rafId = null;

        if (isNumber(margin)) {
          margin = String(margin) + (isString(type) ? type : "px");
        }

        const options = {
          root: null,
          rootMargin: `0px 0px ${margin || "-150px"}`,
          threshold: [ 0, 0.1 ]
        },

          observer = new _IntersectionObserver(entries => {
            const entry = entries[ entries.length - 1 ];
            if (!entry) return;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(_ => {
              if (!entry.isIntersecting || entry.intersectionRatio === 0) {
                if (isInView === true) {
                  isInView = false;
                  fn(entry);
                  count++;
                  if (limit && count >= limit) {
                    const idx = eventList.indexOf(data);
                    if (idx !== -1) eventList.splice(idx, 1);
                    controller.abort();
                  }
                } else {
                  isInView = false;
                }
              } else if (entry.isIntersecting && entry.intersectionRatio >= 0.05) {
                isInView = true;
              }
            });
          }, options);

        observer.observe(target);

        signal.addEventListener("abort", _ => {
          if (rafId) cancelAnimationFrame(rafId);
          observer.disconnect();
        });
      } ],
      [ "scrollInOut", (fns, target, controller, { margin, type, limit }, data) => {
        const eventList = getData(target).get("events").get("scrollInOut"),
          { signal } = controller,

          fnIn = Array.isArray(fns) ? fns[ 0 ] :
            isFunction(fns) ? fns :
              fns ? fns.in : unde,
          fnOut = Array.isArray(fns) ? fns[ 1 ] :
            fns ? fns.out : unde;

        let isInView = null,
          rafId = null;

        if (isNumber(margin)) {
          margin = String(margin) + (isString(type) ? type : "px");
        }

        const options = {
          root: null,
          rootMargin: `0px 0px ${margin || "-150px"}`,
          threshold: [ 0, 0.1 ]
        },

          observer = new _IntersectionObserver(entries => {
            const entry = entries[ entries.length - 1 ];
            if (!entry) return;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(_ => {
              if (entry.isIntersecting && entry.intersectionRatio >= 0.05) {
                if (isInView !== true) {
                  isInView = true;
                  if (isFunction(fnIn)) fnIn.call(target, entry);
                }
              } else if (!entry.isIntersecting || entry.intersectionRatio === 0) {
                if (isInView === true) {
                  isInView = false;
                  if (isFunction(fnOut)) fnOut.call(target, entry);
                } else if (isInView === null) {
                  isInView = false;
                }
              }
            });
          }, options);

        observer.observe(target);

        signal.addEventListener("abort", _ => {
          if (rafId) cancelAnimationFrame(rafId);
          observer.disconnect();
        });
      } ],
      [ "clickOutside", function(fn, target, controller) {
        const { signal } = controller,

          handler = e => {
            if (target && !target.contains(e.target)) {
              fn(e);
            }
          };

        if (supportsEventListenerSignal) {
          d.addEventListener(downEvent, handler, { signal });
        } else {
          d.addEventListener(downEvent, handler);
          signal.addEventListener("abort", _ => {
            d.removeEventListener(downEvent, handler);
          }, { once: true });
        }
      } ]
    ]),

    SetEvent = (type, target, { fn, name, isOnce }, unique) => {
      const len = target.length;
      for (let i = 0; i < len; i++) {
        const el = target[ i ];
        if (!el) continue;

        let data = ElementMap.get(el);
        if (!data) {
          data = new Map;
          ElementMap.set(el, data);
        }

        let events = data.get("events");
        if (!events) {
          events = new Map;
          data.set("events", events);
        }

        let eventList = events.get(type);
        if (!eventList) {
          eventList = [];
          events.set(type, eventList);
        }

        const controller = new _AbortController,
          Edata = { fn, name, Controller: controller };
        eventList.push(Edata);

        let handler;
        if (isFunction(fn)) {
          handler = createEventHandler(fn, el, isOnce, eventList, Edata, controller);
        } else if (Array.isArray(fn)) {
          handler = fn.map(f => createEventHandler(f, el, isOnce, eventList, Edata, controller));
        } else if (isObject(fn)) {
          handler = {};
          const keys = Object.keys(fn);
          for (let i = 0; i < keys.length; i++) {
            const key = keys[ i ];
            handler[ key ] = createEventHandler(fn[ key ], el, isOnce, eventList, Edata, controller);
          }
        }

        if (uniqueEvents.has(type)) {
          const uniqueEventSet = uniqueEvents.get(type),
            uniqueOpts = isOnce ? Object.assign({}, unique, { limit: 1 }) : (unique || {});
          uniqueEventSet(handler, el, controller, uniqueOpts, Edata);
        } else {
          if (isFunction(handler)) {
            if (supportsEventListenerSignal) {
              el.addEventListener(type, handler, { signal: controller.signal });
            } else {
              el.addEventListener(type, handler);
              controller.signal.addEventListener("abort", _ => {
                el.removeEventListener(type, handler);
              }, { once: true });
            }
          }
        }
      }
    },

    RemoveEvent = (type, target, targetName) => {
      const len = target.length;
      for (let i = 0; i < len; i++) {
        const data = ElementMap.get(target[ i ]);
        if (!data) continue;
        const events = data.get("events");
        if (!events) continue;
        const eventList = events.get(type);
        if (!eventList) continue;

        const remaining = eventList.filter(e => {
          if (!targetName || e.name === targetName) {
            e.Controller.abort();
            return false;
          }
          return true;
        });
        events.set(type, remaining);
      }
    },
    RemoveEventByEvent = (target, name) => {
      const data = getData(target);
      if (!data) return;
      const events = data.get("events");
      if (!events) return;

      const eventList = events.get(name);
      if (!eventList) return;

      const len = eventList.length;
      for (let i = 0; i < len; i++) {
        eventList[ i ].Controller.abort();
      }
      events.set(name, []);
    },

    cleanupElement = target => {
      const data = getData(target);
      if (!data) return;

      const events = data.get("events");
      events && events.forEach(eventList => {
        for (let i = 0; i < eventList.length; i++) {
          if (eventList[ i ].Controller) {
            eventList[ i ].Controller.abort();
          }
        }
      });

      const resizeObserver = data.get("resizeObserver");
      if (resizeObserver) resizeObserver.disconnect();

      ElementMap.delete(target);
    },

    Illegal = (prop, type = "", cl = "DM") => {
      throw new TypeError(`Method ${type}${cl}.prototype.${prop} called on incompatible receiver #<${cl}>`)
    },

    renderTemplate = (htmlString, data) => {
      const regex = /\{\{\s*(\w+)\s*\}\}/g;

      return htmlString.replace(regex, (match, key) => {
        return match.startsWith('"') ? match : data[ key ] !== unde ? data[ key ] : match;
      });
    },

    componentRegistry = new Map,

    sanitizeTree = root => {
      const dangerousTags = root.querySelectorAll("script, iframe, object, embed, style");
      for (let i = 0; i < dangerousTags.length; i++) {
        dangerousTags[ i ].remove();
      }

      const allElements = root.querySelectorAll("*");
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[ i ],
          attrs = el.attributes;

        for (let j = attrs.length - 1; j >= 0; j--) {
          const attr = attrs[ j ],
            name = attr.name.toLowerCase(),
            val = attr.value.trim().toLowerCase();

          if (name.startsWith("on")) {
            el.removeAttribute(attr.name);
          } else if ((name === "href" || name === "src" || name === "action") && val.startsWith("javascript:")) {
            el.removeAttribute(attr.name);
          }
        }
      }
    },
    parser = new DOMParser,

    escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    },

    extend = (name, value) =>
      Object.defineProperty(DM.prototype, name, {
        value,
        writable: true,
        enumerable: false,
        configurable: true
      }),

    events = "blur0focus0focusin0focusout0resize0scroll0click0dblclick0mousedown0mouseup0mousemove0mouseover0mouseout0mouseenter0mouseleave0change0select0submit0keydown0keypress0keyup0contextmenu0scrollIn0scrollOut0scrollInOut0clickOutside".split(0),

    ready = d.readyState !== "loading";
  ready || d.addEventListener("DOMContentLoaded", _ => { ready = true; });

  class XArray extends Array { }

  /* --- WeakMaps for Private Properties --- */
  const stateDataMap = new WeakMap,
    stateListenersMap = new WeakMap,

    componentConfigMap = new WeakMap,
    componentStateMap = new WeakMap,
    componentElementMap = new WeakMap,
    componentUnsubMap = new WeakMap,

    dmAllMap = new WeakMap,
    dmLengthMap = new WeakMap,
    dmFalsyMap = new WeakMap,
    dmElementsMap = new WeakMap,

    temTargetMap = new WeakMap,
    temDataMap = new WeakMap,

    notifyState = (instance, key, newValue, oldValue) => {
      const listeners = stateListenersMap.get(instance);
      if (!listeners) return;
      if (listeners.has(key)) {
        listeners.get(key).forEach(fn => fn(newValue, oldValue));
      }
      if (listeners.has("*")) {
        listeners.get("*").forEach(fn => fn(key, newValue, oldValue));
      }
    },

    bindComponentEvents = (instance, config, element, state) => {
      if (!isObject(config.events)) return;
      const dmEl = new DM(element),
        keys = Object.keys(config.events),
        len = keys.length;
      for (let i = 0; i < len; i++) {
        const key = keys[ i ],
          spaceIdx = key.indexOf(" "),
          eventType = spaceIdx !== -1 ? key.slice(0, spaceIdx) : key,
          selector = spaceIdx !== -1 ? key.slice(spaceIdx + 1) : "*",
          handler = config.events[ key ];

        dmEl.event.on(eventType, selector, e => {
          handler.call(instance, e, state.data);
        });
      }
    },

    resolveTemTarget = place => {
      if (isElement(place)) return place;
      if (isDM(place) && place.length > 0) return place[ 0 ];
      if (isString(place)) {
        const el = FindTags(place);
        return isList(el) ? el[ 0 ] : el;
      }
      return null;
    }

  class DMState {
    constructor(initialData = {}) {
      stateListenersMap.set(this, new Map);
      const self = this,
        dataProxy = new Proxy(Object.assign({}, initialData), {
          set(target, prop, value) {
            const oldValue = target[ prop ];
            if (oldValue !== value) {
              target[ prop ] = value;
              notifyState(self, prop, value, oldValue);
            }
            return true;
          },
          get(target, prop) {
            return target[ prop ];
          }
        });
      stateDataMap.set(this, dataProxy);
    }

    get data() {
      return stateDataMap.get(this);
    }

    subscribe(key, callback) {
      const listeners = stateListenersMap.get(this);
      if (!listeners.has(key)) {
        listeners.set(key, new Set);
      }
      listeners.get(key).add(callback);
      return _ => listeners.get(key).delete(callback);
    }
  }

  class DMComponent {
    constructor(config) {
      componentConfigMap.set(this, config);
      const initialState = isFunction(config.state) ? config.state() : (config.state || {});
      componentStateMap.set(this, new DMState(initialState));
      componentElementMap.set(this, null);
      componentUnsubMap.set(this, null);
    }

    get state() {
      return componentStateMap.get(this).data;
    }

    render() {
      const config = componentConfigMap.get(this),
        state = componentStateMap.get(this),
        html = config.template(state.data);

      let element = componentElementMap.get(this);

      if (!element) {
        element = domaster.parseSafe(html);
        if (element instanceof DocumentFragment) {
          const wrapper = d.createElement("div");
          wrapper.appendChild(element);
          element = wrapper;
        }
        componentElementMap.set(this, element);

        bindComponentEvents(this, config, element, state);

        const unsub = state.subscribe("*", _ => {
          const nextHTML = config.template(state.data);
          new DM(element).morph(nextHTML);
          if (isFunction(config.updated)) {
            config.updated(element, state.data);
          }
        });
        componentUnsubMap.set(this, unsub);

        if (isFunction(config.mounted)) {
          setTimeout(_ => config.mounted(element, state.data), 0);
        }
      } else {
        new DM(element).morph(html);
      }

      return element;
    }

    destroy() {
      const unsub = componentUnsubMap.get(this),
        element = componentElementMap.get(this);
      if (unsub) unsub();
      if (element) new DM(element).remove;
    }
  }

  class DM {
    constructor(BaseElement) {
      dmAllMap.set(this, Default);
      dmLengthMap.set(this, 0);
      dmFalsyMap.set(this, false);
      dmElementsMap.set(this, new XArray);

      if (isString(BaseElement)) {
        BaseElement = FindTags(BaseElement);
      }
      const len = BaseElement ? BaseElement.length : 0;
      if (!BaseElement || len === 0) {
        dmFalsyMap.set(this, true);
        return;
      }

      let elementsSource = BaseElement;
      if ((isList(BaseElement) || Array.isArray(BaseElement)) && !(len > 1)) {
        elementsSource = BaseElement[ 0 ];
      }

      if (len > 1) {
        dmAllMap.set(this, BaseElement);
        dmLengthMap.set(this, len);
        const elements = new XArray(len);

        for (let i = 0; i < len; i++) {
          const el = BaseElement[ i ];
          this[ i ] = el;
          elements[ i ] = el;

          let data = ElementMap.get(el);
          if (!data) {
            data = new Map;
            ElementMap.set(el, data);
          }
          let parentList = data.get("parent");
          if (!parentList) {
            parentList = [];
            data.set("parent", parentList);
          }
          parentList.includes(BaseElement) || parentList.push(BaseElement);
        }
        dmElementsMap.set(this, elements);
      } else {
        const el = elementsSource.nodeType ? elementsSource : BaseElement;
        this[ 0 ] = el;
        dmLengthMap.set(this, 1);
        const elements = new XArray;
        elements.push(el);
        dmElementsMap.set(this, elements);
        ElementMap.has(el) || ElementMap.set(el, new Map);
      }
    }

    get length() {
      if (!isDM(this)) Illegal("length", "get ");
      return dmLengthMap.get(this);
    }

    get Elements() {
      if (!isDM(this)) Illegal("Elements", "get ");
      return dmElementsMap.get(this);
    }

    n(index = 0) {
      if (!isDM(this)) Illegal("n");
      const len = dmLengthMap.get(this),
        targetIndex = index >= 0 ? index : len + index;
      return new DM(this[ targetIndex ]);
    }

    get odd() {
      if (!isDM(this)) Illegal("odd", "get ");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy || len === 1) return this;
      const odd = [];
      for (let i = 0; i < len; i += 2) {
        odd.push(this[ i ]);
      }
      return new DM(odd);
    }

    get even() {
      if (!isDM(this)) Illegal("even", "get ");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy) return this;
      if (len === 1) return new DM(null);
      const even = [];
      for (let i = 1; i < len; i += 2) {
        even.push(this[ i ]);
      }
      return new DM(even);
    }

    nth(n) {
      if (!isDM(this)) Illegal("nth");
      if (!n || n <= 0) return this;
      const len = dmLengthMap.get(this),
        nth = [];
      for (let i = n - 1; i < len; i += n) {
        nth.push(this[ i ]);
      }
      return new DM(nth);
    }

    get event() {
      if (!isDM(this)) Illegal("event", "get ");

      const self = this,

        removeAll = function() {
          if (dmFalsyMap.get(self)) return self;
          const all = dmAllMap.get(self),
            len = dmLengthMap.get(self);

          if (all !== Default) {
            ElementMap.forEach(function(value, key) {
              const parents = value.get("parent");
              if (parents && parents.includes(all)) {
                clearTargetEvents(key);
              }
            });
          }

          if (len === 1) {
            clearTargetEvents(self[ 0 ]);
          }

          return self;
        };

      function eventFn(option) {
        if (dmFalsyMap.get(self)) return self;
        const len = dmLengthMap.get(self);

        if (arguments[ 0 ] === "on" && arguments.length >= 4) {
          let args = Array.from(arguments),
            isOnce = false;
          if (isOnceSymbol(args[ args.length - 1 ])) {
            isOnce = true;
            args.pop();
          }
          const type = args[ 1 ],
            selector = args[ 2 ],
            fn = args[ 3 ],
            name = args[ 4 ] || fn.name,
            delegatedHandler = createDelegatedHandler(selector, fn);
          return self.event("add", type, delegatedHandler, name, isOnce ? once : unde);
        }

        if (arguments[ 0 ] === "off") {
          const type = arguments[ 1 ],
            name = arguments[ 2 ];
          if (name) {
            RemoveEvent(type, self, name);
          } else if (type) {
            for (let i = 0; i < len; i++) {
              RemoveEventByEvent(self[ i ], type);
            }
          }
          return self;
        }

        if (!isObject(option)) {
          let options = Array.from(arguments),
            isOnce = false;
          if (options.length > 0 && isOnceSymbol(options[ options.length - 1 ])) {
            isOnce = true;
            options.pop();
          }

          if (options[ 0 ] === "remove" && options.length === 2) {
            option = { remove: options[ 1 ] };
          } else {
            const type = options[ 1 ],
              fn = options[ 2 ],
              name = isString(options[ 3 ]) ? options[ 3 ] : (fn ? fn.name : "");

            option = {
              [ options[ 0 ] ]: {
                [ type ]: {
                  fn: fn,
                  name: name,
                  isOnce: isOnce
                }
              }
            };
            if (options.length > 4 && uniqueEvents.has(type) && isObject(options[ 4 ])) {
              option[ options[ 0 ] ][ type ].data = options[ 4 ];
            } else if (options.length > 3 && uniqueEvents.has(type)) {
              option[ options[ 0 ] ][ type ].data = options[ 3 ];
            }
          }
        }

        if (option.add && isObject(option.add)) {
          const addKeys = Object.keys(option.add),
            addLen = addKeys.length;
          for (let i = 0; i < addLen; i++) {
            const eventName = addKeys[ i ],
              data = option.add[ eventName ],
              arg = [ eventName, self, data ];
            if (hasOwn(data, "data") && uniqueEvents.has(eventName)) {
              arg.push(data.data);
            }
            Reflect.apply(SetEvent, null, arg);
          }
        }

        if (option.remove) {
          if (isObject(option.remove)) {
            const removeKeys = Object.keys(option.remove),
              removeLen = removeKeys.length;
            for (let i = 0; i < removeLen; i++) {
              const eventName = removeKeys[ i ];
              RemoveEvent(eventName, self, option.remove[ eventName ].name);
            }
          } else if (isString(option.remove)) {
            for (let i = 0; i < len; i++) {
              RemoveEventByEvent(self[ i ], option.remove);
            }
          } else if (Array.isArray(option.remove)) {
            const types = option.remove;
            for (let i = 0; i < types.length; i++) {
              const type = types[ i ];
              for (let j = 0; j < len; j++) {
                RemoveEventByEvent(self[ j ], type);
              }
            }
          }
        }
        return self;
      }

      eventFn.on = function(type, selector, fn, name) {
        if (!isString(type) || !isString(selector) || !isFunction(fn)) return self;
        let args = Array.from(arguments),
          isOnce = false;
        if (isOnceSymbol(args[ args.length - 1 ])) {
          isOnce = true;
          args.pop();
        }
        const targetName = isString(args[ 3 ]) ? args[ 3 ] : fn.name,
          delegatedHandler = createDelegatedHandler(selector, fn);
        return self.event("add", type, delegatedHandler, targetName, isOnce ? once : unde);
      };

      eventFn.off = function(type, name) {
        if (!isString(type)) return self;
        const len = dmLengthMap.get(self);
        if (name) {
          RemoveEvent(type, self, name);
        } else {
          for (let i = 0; i < len; i++) {
            RemoveEventByEvent(self[ i ], type);
          }
        }
        return self;
      };

      eventFn._removeAll = removeAll;
      return new Proxy(eventFn, {
        get(target, prop) {
          if (Reflect.has(target, prop)) return Reflect.get(target, prop);
        },
        set(_, EventName, EventFunction) {
          if (!isFunction(EventFunction)) return true;
          self.event({
            add: {
              [ EventName ]: {
                fn: EventFunction,
                name: EventFunction.name
              }
            }
          });
          return true;
        }
      });
    }

    once(...args) {
      if (!isDM(this)) Illegal("once");
      if (isObject(args[ 0 ])) {
        const option = args[ 0 ];
        if (option.add && isObject(option.add)) {
          const keys = Object.keys(option.add);
          for (let i = 0; i < keys.length; i++) {
            const item = option.add[ keys[ i ] ];
            if (isObject(item)) {
              item.isOnce = true;
            }
          }
        }
        return this.event(option);
      }
      return this.event("add", ...args, once);
    }

    observeResize(fn) {
      if (!isDM(this)) Illegal("observeResize");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy || !isFunction(fn)) return this;

      for (let i = 0; i < len; i++) {
        const el = this[ i ],
          observer = new _ResizeObserver(entries => {
            for (let i = 0; i < entries.length; i++) {
              const entry = entries[ i ];
              fn.call(el, entry.contentRect, entry);
            }
          });
        observer.observe(el);

        const elData = getData(el);
        if (elData) {
          elData.set("resizeObserver", observer);
        }
      }
      return this;
    }

    text(value = Default) {
      if (!isDM(this)) Illegal("text");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this),
        elements = dmElementsMap.get(this);
      if (value === Default) {
        if (falsy) return null;
        return len === 1 ? this[ 0 ].textContent : elements.map(el => el.textContent);
      }
      if (falsy) return this;
      for (let i = 0; i < len; i++) {
        this[ i ].textContent = value;
      }
      return this;
    }

    html(value = Default) {
      if (!isDM(this)) Illegal("html");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this),
        elements = dmElementsMap.get(this);
      if (value === Default) {
        if (falsy) return null;
        return len === 1 ? this[ 0 ].innerHTML : elements.map(el => el.innerHTML);
      }
      if (falsy) return this;
      for (let i = 0; i < len; i++) {
        this[ i ].innerHTML = value;
      }
      return this;
    }

    scrollToSelf(options = { behavior: "smooth", block: "start" }) {
      if (!isDM(this)) Illegal("scrollToSelf");
      if (dmFalsyMap.get(this)) return this;
      this[ 0 ].scrollIntoView(options);
      return this;
    }

    bind(stateInstance, keyOrFn, targetAttr = "text") {
      if (!isDM(this) || !(stateInstance instanceof DMState)) return this;

      if (isFunction(keyOrFn)) {
        const update = _ => keyOrFn.call(this, stateInstance.data);
        stateInstance.subscribe("*", update);
        update();
        return this;
      }

      const key = String(keyOrFn),
        updateDOM = val => {
          const value = val === unde || val === null ? "" : val;
          if (targetAttr === "text") {
            this.text(value);
          } else if (targetAttr === "html") {
            this.html(value);
          } else if (targetAttr === "val") {
            this.val(value);
          } else if (targetAttr.startsWith("attr:")) {
            const attrName = targetAttr.slice(5);
            this.attr(attrName, value);
          }
        };

      stateInstance.subscribe(key, updateDOM);
      updateDOM(stateInstance.data[ key ]);

      if (targetAttr === "val") {
        this.event.on("input", "input, textarea, select", e => {
          stateInstance.data[ key ] = e.target.value;
        });
      }

      return this;
    }

    style() {
      if (!isDM(this)) Illegal("style");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy) return this;
      if (isObject(arguments[ 0 ])) {
        const styles = arguments[ 0 ],
          keys = Object.keys(styles),
          length = keys.length;
        for (let i = 0, prop, value; prop = keys[ i ], value = styles[ prop ], i < length; i++) {
          for (let j = 0, el; el = this[ j ], j < len; j++) {
            el.style[ prop ] = value;
          }
        }
      }
      return this;
    }

    get child() {
      if (!isDM(this)) Illegal("child", "get ");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy) return [];
      if (len > 1) {
        const child = new Array(len);
        for (let i = 0; i < len; i++) {
          const children = this[ i ].children;
          child[ i ] = children && children.length ? new DM(children) : new DM(null);
        }
        return child;
      } else {
        return [ new DM(this[ 0 ].children) ];
      }
    }

    get parent() {
      if (!isDM(this)) Illegal("parent", "get ");
      if (dmFalsyMap.get(this)) return this;
      const len = dmLengthMap.get(this),
        parents = [];
      for (let i = 0; i < len; i++) {
        const p = this[ i ].parentElement;
        if (p && !parents.includes(p)) parents.push(p);
      }
      return new DM(parents);
    }

    closest(selector) {
      if (!isDM(this)) Illegal("closest");
      if (dmFalsyMap.get(this)) return this;
      if (!isString(selector)) return new DM(null);
      const len = dmLengthMap.get(this),
        matches = [];
      for (let i = 0; i < len; i++) {
        const el = this[ i ].closest(selector);
        if (el && !matches.includes(el)) matches.push(el);
      }
      return new DM(matches);
    }

    siblings(selector) {
      if (!isDM(this)) Illegal("siblings");
      if (dmFalsyMap.get(this)) return this;
      const len = dmLengthMap.get(this),
        sibs = [];
      for (let i = 0; i < len; i++) {
        const parent = this[ i ].parentElement;
        if (!parent) continue;
        const children = parent.children;
        for (let j = 0; j < children.length; j++) {
          const child = children[ j ];
          if (child !== this[ i ] && !sibs.includes(child)) {
            if (!selector || (isString(selector) && child.matches(selector))) {
              sibs.push(child);
            }
          }
        }
      }
      return new DM(sibs);
    }

    get prev() {
      if (!isDM(this)) Illegal("prev", "get ");
      if (dmFalsyMap.get(this)) return this;
      const len = dmLengthMap.get(this),
        prevs = [];
      for (let i = 0; i < len; i++) {
        const el = this[ i ].previousElementSibling;
        if (el && !prevs.includes(el)) prevs.push(el);
      }
      return new DM(prevs);
    }

    get next() {
      if (!isDM(this)) Illegal("next", "get ");
      if (dmFalsyMap.get(this)) return this;
      const len = dmLengthMap.get(this),
        nexts = [];
      for (let i = 0; i < len; i++) {
        const el = this[ i ].nextElementSibling;
        if (el && !nexts.includes(el)) nexts.push(el);
      }
      return new DM(nexts);
    }

    get first() {
      if (!isDM(this)) Illegal("first", "get ");
      if (dmFalsyMap.get(this)) return this;
      return new DM(this[ 0 ]);
    }

    get last() {
      if (!isDM(this)) Illegal("last", "get ");
      if (dmFalsyMap.get(this)) return this;
      const len = dmLengthMap.get(this);
      return new DM(this[ len - 1 ]);
    }

    get attr() {
      if (!isDM(this)) Illegal("attr", "get ");
      const self = this,
        attr = (name, value = Default) => {
          if (!name) return self;
          if (!isString(name)) name = String(name);
          const falsy = dmFalsyMap.get(self),
            len = dmLengthMap.get(self);
          if (value === Default) {
            if (falsy) return null;
            if (len === 1) return self[ 0 ].getAttribute(name);
            const results = new Array(len);
            for (let i = 0; i < len; i++) {
              results[ i ] = self[ i ].getAttribute(name);
            }
            return results;
          } else {
            if (falsy) return self;
            for (let i = 0; i < len; i++) {
              self[ i ].setAttribute(name, value);
            }
            return self;
          }
        },
        handler = {
          get(_, name) {
            return self.attr(name);
          },
          set(_, name, value) {
            self.attr(name, value);
            return true;
          }
        };
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy) {
        handler.has = NO;
      } else if (len === 1) {
        const names = self[ 0 ].getAttributeNames(),
          aLen = names.length;
        let attributes = {};
        for (let i = 0; i < aLen; i++) {
          attributes[ names[ i ] ] = self[ 0 ].getAttribute(names[ i ]);
        }
        handler.has = (_, name) => names.includes(name);
        handler.ownKeys = _ => names;
        handler.getOwnPropertyDescriptor = (_, name) => names.includes(name) ? Object.getOwnPropertyDescriptor(attributes, name) : Object.getOwnPropertyDescriptor(attr, name);
      }
      return new Proxy(attr, handler);
    }

    hasClass(className) {
      if (!isDM(this)) Illegal("hasClass");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy || !isString(className)) return false;
      const name = className.trim();
      for (let i = 0; i < len; i++) {
        if (this[ i ] && this[ i ].classList && this[ i ].classList.contains(name)) {
          return true;
        }
      }
      return false;
    }

    addClass(...classNames) {
      if (!isDM(this)) Illegal("addClass");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy || !classNames.length) return this;

      const names = [];
      for (let i = 0; i < classNames.length; i++) {
        const c = classNames[ i ];
        if (isString(c)) {
          const parts = c.trim().split(/\s+/);
          for (let j = 0; j < parts.length; j++) {
            if (parts[ j ]) names.push(parts[ j ]);
          }
        }
      }

      if (!names.length) return this;

      for (let i = 0; i < len; i++) {
        if (this[ i ] && this[ i ].classList) {
          this[ i ].classList.add(...names);
        }
      }
      return this;
    }

    removeClass(...classNames) {
      if (!isDM(this)) Illegal("removeClass");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy) return this;

      if (!classNames.length) {
        for (let i = 0; i < len; i++) {
          if (this[ i ]) this[ i ].className = "";
        }
        return this;
      }

      const names = [];
      for (let i = 0; i < classNames.length; i++) {
        const c = classNames[ i ];
        if (isString(c)) {
          const parts = c.trim().split(/\s+/);
          for (let j = 0; j < parts.length; j++) {
            if (parts[ j ]) names.push(parts[ j ]);
          }
        }
      }

      for (let i = 0; i < len; i++) {
        if (this[ i ] && this[ i ].classList) {
          this[ i ].classList.remove(...names);
        }
      }
      return this;
    }

    toggleClass(className, force) {
      if (!isDM(this)) Illegal("toggleClass");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy || !isString(className)) return this;
      const names = className.trim().split(/\s+/).filter(Boolean),
        cLen = names.length,
        hasForce = typeof force === "boolean";

      for (let i = 0; i < len; i++) {
        if (this[ i ] && this[ i ].classList) {
          if (hasForce) {
            for (let j = 0; j < cLen; j++) {
              this[ i ].classList.toggle(names[ j ], force);
            }
          } else {
            for (let j = 0; j < cLen; j++) {
              this[ i ].classList.toggle(names[ j ]);
            }
          }
        }
      }
      return this;
    }

    toggleAttr(attr, force) {
      const len = dmLengthMap.get(this);
      if (!len) return this;

      if (typeof attr === 'object' && attr !== null) {
        const keys = Object.keys(attr);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[ i ];
          this.toggleAttr(key, attr[ key ]);
        }

        return this;
      }

      for (let i = 0; i < len; i++) {
        const el = this[ i ],
          shouldAdd = force !== undefined ? !!force : !el.hasAttribute(attr);

        if (shouldAdd) {
          el.setAttribute(attr, '');
        } else {
          el.removeAttribute(attr);
        }
      }

      return this;
    }

    toggleClassMap(classMap) {
      const len = dmLengthMap.get(this);
      if (!len || !classMap) return this;

      for (let i = 0; i < len; i++) {
        const el = this[ i ],
          classNames = Object.keys(classMap);
        for (let i = 0; i < classNames.length; i++) {
          const className = classNames[ i ],
            force = !!classMap[ className ];
          el.classList.toggle(className, force);
        }
      }

      return this;
    }

    append(content) {
      if (!isDM(this)) Illegal("append");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy || !content) return this;
      for (let i = 0; i < len; i++) {
        const el = this[ i ];
        if (isString(content)) {
          el.insertAdjacentHTML("beforeend", content);
        } else if (isElement(content)) {
          el.appendChild(i === 0 ? content : content.cloneNode(true));
        } else if (isDM(content)) {
          for (let j = 0; j < content.length; j++) {
            const child = content[ j ];
            if (child) el.appendChild(i === 0 ? child : child.cloneNode(true));
          }
        }
      }
      return this;
    }

    prepend(content) {
      if (!isDM(this)) Illegal("prepend");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy || !content) return this;
      for (let i = 0; i < len; i++) {
        const el = this[ i ];
        if (isString(content)) {
          el.insertAdjacentHTML("afterbegin", content);
        } else if (isElement(content)) {
          el.insertBefore(i === 0 ? content : content.cloneNode(true), el.firstChild);
        } else if (isDM(content)) {
          for (let j = content.length - 1; j >= 0; j--) {
            const child = content[ j ];
            if (child) el.insertBefore(i === 0 ? child : child.cloneNode(true), el.firstChild);
          }
        }
      }
      return this;
    }

    before(content) {
      if (!isDM(this)) Illegal("before");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy || !content) return this;
      for (let i = 0; i < len; i++) {
        const el = this[ i ];
        if (!el || !el.parentNode) continue;
        if (isString(content)) {
          el.insertAdjacentHTML("beforebegin", content);
        } else if (isElement(content)) {
          el.parentNode.insertBefore(i === 0 ? content : content.cloneNode(true), el);
        } else if (isDM(content)) {
          for (let j = 0; j < content.length; j++) {
            const child = content[ j ];
            if (child) el.parentNode.insertBefore(i === 0 ? child : child.cloneNode(true), el);
          }
        }
      }
      return this;
    }

    after(content) {
      if (!isDM(this)) Illegal("after");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy || !content) return this;
      for (let i = 0; i < len; i++) {
        const el = this[ i ];
        if (!el || !el.parentNode) continue;
        if (isString(content)) {
          el.insertAdjacentHTML("afterend", content);
        } else if (isElement(content)) {
          el.parentNode.insertBefore(i === 0 ? content : content.cloneNode(true), el.nextSibling);
        } else if (isDM(content)) {
          for (let j = 0; j < content.length; j++) {
            const child = content[ j ];
            if (child) el.parentNode.insertBefore(i === 0 ? child : child.cloneNode(true), el.nextSibling);
          }
        }
      }
      return this;
    }

    val(value = Default) {
      if (!isDM(this)) Illegal("val");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);

      if (value === Default) {
        if (falsy) return null;
        if (len === 1) return getElValue(this[ 0 ]);
        const results = new Array(len);
        for (let i = 0; i < len; i++) {
          results[ i ] = getElValue(this[ i ]);
        }
        return results;
      }

      if (falsy) return this;
      for (let i = 0; i < len; i++) {
        const el = this[ i ];
        if (el && "value" in el) {
          el.value = value;
        }
      }
      return this;
    }

    data(key, value = Default) {
      if (!isDM(this)) Illegal("data");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy || !key) return value === Default ? null : this;

      if (isObject(key)) {
        for (let i = 0; i < len; i++) {
          const elData = getData(this[ i ]);
          if (!elData) continue;
          let store = elData.get("customData");
          if (!store) {
            store = new Map;
            elData.set("customData", store);
          }
          const keys = Object.keys(key),
            kLen = keys.length;
          for (let j = 0; j < kLen; j++) {
            const k = keys[ j ];
            store.set(k, key[ k ]);
          }
        }
        return this;
      }

      if (value === Default) {
        if (len === 1) return getCustomData(this[ 0 ], key);
        const results = new Array(len);
        for (let i = 0; i < len; i++) {
          results[ i ] = getCustomData(this[ i ], key);
        }
        return results;
      }

      for (let i = 0; i < len; i++) {
        const elData = getData(this[ i ]);
        if (!elData) continue;
        let store = elData.get("customData");
        if (!store) {
          store = new Map;
          elData.set("customData", store);
        }
        store.set(key, value);
      }
      return this;
    }

    wait(condition, timeout = 0) {
      if (!isDM(this)) Illegal("wait");
      if (dmFalsyMap.get(this)) return Promise.reject(new Error("Empty DM instance"));

      const el = this[ 0 ];
      return new Promise((resolve, reject) => {
        let timer = null;
        if (timeout > 0) {
          timer = setTimeout(_ => {
            cleanup();
            reject(new Error(`wait timed out after ${timeout}ms`));
          }, timeout);
        }

        const cleanup = _ => {
          if (timer) clearTimeout(timer);
        };

        if (condition === "visible" || condition === "hidden") {
          const observer = new _IntersectionObserver(([ entry ]) => {
            const isVisible = entry.isIntersecting;
            if ((condition === "visible" && isVisible) || (condition === "hidden" && !isVisible)) {
              observer.disconnect();
              cleanup();
              resolve(el);
            }
          });
          observer.observe(el);
          return;
        }

        const handler = e => {
          cleanup();
          resolve(e);
        };
        el.addEventListener(condition, handler, { once: true });
      });
    }

    cssVar(name, value = Default) {
      if (!isDM(this)) Illegal("cssVar");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy || !name) return value === Default ? null : this;

      if (isObject(name)) {
        const keys = Object.keys(name),
          kLen = keys.length;
        for (let i = 0; i < kLen; i++) {
          const k = keys[ i ],
            varName = k.startsWith("--") ? k : `--${k}`;
          for (let j = 0; j < len; j++) {
            this[ j ].style.setProperty(varName, String(name[ k ]));
          }
        }
        return this;
      }

      const formattedName = isString(name) && name.startsWith("--") ? name : `--${name}`;

      if (value === Default) {
        if (len === 1) return getCssVar(this[ 0 ], formattedName);
        const results = new Array(len);
        for (let i = 0; i < len; i++) {
          results[ i ] = getCssVar(this[ i ], formattedName);
        }
        return results;
      }

      for (let i = 0; i < len; i++) {
        this[ i ].style.setProperty(formattedName, String(value));
      }
      return this;
    }

    autoResize() {
      const len = dmLengthMap.get(this);
      if (!len) return this;

      for (let i = 0; i < len; i++) {
        const el = this[ i ];
        if (el.tagName !== "TEXTAREA") continue;

        const adjustHeight = _ => {
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        },

          data = getData(el);
        if (data && data.has("hasAutoResize")) {
          el.addEventListener("input", adjustHeight);
          data.set("hasAutoResize", true);
        }

        adjustHeight();
      }

      return this;
    }

    async copy(type = "text") {
      if (!isDM(this)) Illegal("copy");
      if (dmFalsyMap.get(this)) return false;

      const el = this[ 0 ];
      let content = "";

      if (type === "val") {
        content = this.val();
      } else if (type === "html") {
        content = el.innerHTML;
      } else {
        content = el.textContent || "";
      }

      try {
        await navigator.clipboard.writeText(content);
        return true;
      } catch (e) {
        const isFocused = d.hasFocus(),
          activeEl = d.activeElement;
        let selection = null;

        if (activeEl && ("selectionStart" in activeEl)) {
          try {
            selection = {
              start: activeEl.selectionStart,
              end: activeEl.selectionEnd,
              direction: activeEl.selectionDirection
            };
          } catch (e) { }
        }

        const textarea = d.createElement("textarea");
        textarea.value = content;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        d.body.appendChild(textarea);
        textarea.select();
        const success = d.execCommand("copy");
        d.body.removeChild(textarea);

        if (isFocused && activeEl && isFunction(activeEl.focus)) {
          activeEl.focus({ preventScroll: true });
          if (selection && isFunction(activeEl.setSelectionRange)) {
            try {
              activeEl.setSelectionRange(selection.start, selection.end, selection.direction);
            } catch (e) {
              if (activeEl.select) activeEl.select();
            }
          }
        }
        return success;
      }
    }

    insertAtCaret(content) {
      const len = dmLengthMap.get(this);
      if (!len || content == null) return this;

      for (let i = 0; i < len; i++) {
        const el = this[ i ];

        if (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && /^(text|search|url|tel|password)$/i.test(el.type))) {
          el.focus();
          const text = typeof content === "string"
            ? content
            : (content.textContent || ""),
            start = el.selectionStart,
            end = el.selectionEnd;

          if (typeof el.setRangeText === "function") {
            el.setRangeText(text, start, end, "end");
          } else {
            el.value = `${el.value.slice(0, start)}${text}${el.value.slice(end)}`
            el.selectionStart = el.selectionEnd = start + text.length;
          }
        } else if (el.isContentEditable) {
          el.focus();
          const sel = window.getSelection();
          if (!sel || !sel.rangeCount) continue;

          const range = sel.getRangeAt(0);
          range.deleteContents();

          let lastNode;
          if (typeof content === "string") {
            const temp = d.createElement("div");
            temp.innerHTML = content;
            const frag = d.createDocumentFragment();
            let child;
            while ((child = temp.firstChild)) {
              lastNode = child;
              frag.appendChild(child);
            }
            range.insertNode(frag);
          } else {
            lastNode = content.nodeType ? content : content[ 0 ];
            if (lastNode) range.insertNode(lastNode);
          }

          if (lastNode) {
            range.setStartAfter(lastNode);
            range.setEndAfter(lastNode);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }

      return this;
    }

    morph(newHTML) {
      if (!isDM(this)) Illegal("morph");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy || !isString(newHTML)) return this;

      for (let i = 0; i < len; i++) {
        const temp = d.createElement("template");
        temp.innerHTML = newHTML.trim();
        const newEl = temp.content.firstElementChild;
        if (newEl) patchNode(this[ i ], newEl);
      }
      return this;
    }

    swap(target) {
      if (!isDM(this)) Illegal("swap");
      if (dmFalsyMap.get(this) || !target) return this;

      const targetDM = isDM(target) ? target : new DM(target);
      if (dmFalsyMap.get(targetDM)) return this;

      const count = Math.min(dmLengthMap.get(this), dmLengthMap.get(targetDM));

      for (let i = 0; i < count; i++) {
        const el1 = this[ i ],
          el2 = targetDM[ i ];

        if (!el1 || !el2 || el1 === el2) continue;

        const parent1 = el1.parentNode,
          parent2 = el2.parentNode;
        if (!parent1 || !parent2) continue;

        const sibling1 = el1.nextSibling,
          sibling2 = el2.nextSibling;

        if (sibling1 === el2) {
          parent1.insertBefore(el2, el1);
        } else if (sibling2 === el1) {
          parent2.insertBefore(el1, el2);
        } else {
          parent2.insertBefore(el1, sibling2);
          parent1.insertBefore(el2, sibling1);
        }
      }

      return this;
    }

    wrap(wrapper) {
      const len = dmLengthMap.get(this);
      if (!len || !wrapper) return this;

      for (let i = 0; i < len; i++) {
        const el = this[ i ];
        if (!el || !el.parentNode) continue;

        let wrapNode = typeof wrapper === "string"
          ? domaster.parse(wrapper)
          : (i === 0
            ? (wrapper.nodeType
              ? wrapper
              : wrapper[ 0 ])
            : (wrapper.nodeType
              ? wrapper
              : wrapper[ 0 ]).cloneNode(true));

        if (!wrapNode) continue;

        let deepest = wrapNode;
        while (deepest.firstElementChild) {
          deepest = deepest.firstElementChild;
        }

        el.parentNode.insertBefore(wrapNode, el);
        deepest.appendChild(el);
      }
      return this;
    }

    wrapAll(wrapper) {
      const len = dmLengthMap.get(this);
      if (!len || !wrapper) return this;

      let wrapNode = typeof wrapper === "string"
        ? domaster.parse(wrapper)
        : (wrapper.nodeType ? wrapper : wrapper[ 0 ]);

      if (!wrapNode) return this;

      const firstEl = this[ 0 ];
      if (!firstEl || !firstEl.parentNode) return this;
      firstEl.parentNode.insertBefore(wrapNode, firstEl);

      let deepest = wrapNode;
      while (deepest.firstElementChild) {
        deepest = deepest.firstElementChild;
      }

      for (let i = 0; i < len; i++) {
        deepest.appendChild(this[ i ]);
      }

      return this;
    }

    unwrap() {
      const len = dmLengthMap.get(this);
      if (!len) return this;

      const parents = new Set;
      for (let i = 0; i < len; i++) {
        const parent = this[ i ].parentNode;
        if (parent && parent !== d.body && parent !== d.documentElement) {
          parents.add(parent);
        }
      }

      parents.forEach(parent => {
        const grandParent = parent.parentNode;
        if (!grandParent) return;

        while (parent.firstChild) {
          grandParent.insertBefore(parent.firstChild, parent);
        }

        new DM(parent).remove();
      });

      return this;
    }

    remove() {
      if (!isDM(this)) Illegal("remove");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (falsy) return this;

      for (let i = 0; i < len; i++) {
        const el = this[ i ];
        if (!el) continue;

        const descendants = el.querySelectorAll("*");
        for (let j = 0; j < descendants.length; j++) {
          cleanupElement(descendants[ j ]);
        }
        cleanupElement(el);

        el.remove();
      }
      return this;
    }

    hide(none = false) {
      if (!isDM(this)) Illegal("hide");
      const len = dmLengthMap.get(this);
      for (let i = 0, el; el = this[ i ], i < len; i++) {
        let data = getData(el);
        if (!data) {
          data = new Map;
          ElementMap.set(el, data);
        }
        if (none) {
          const currentDisplay = el.style.display || style(el).display;
          data.set("beforeShowStyle", [ "display", currentDisplay === "none" ? "" : currentDisplay ]);
          el.style.display = "none";
        } else {
          const currentVis = el.style.visibility || style(el).visibility;
          data.set("beforeShowStyle", [ "visibility", currentVis === "hidden" ? "" : currentVis ]);
          el.style.visibility = "hidden";
        }
      }
      return this;
    }

    invisible() {
      if (!isDM(this)) Illegal("invisible");
      const len = dmLengthMap.get(this);
      for (let i = 0, el; el = this[ i ], i < len; i++) {
        let data = getData(el);
        if (!data) {
          data = new Map;
          ElementMap.set(el, data);
        }
        const currentOp = el.style.opacity || style(el).opacity;
        data.set("beforeShowStyle", [ "opacity", currentOp === "0" ? "" : currentOp ]);
        el.style.opacity = "0";
      }
      return this;
    }

    show() {
      if (!isDM(this)) Illegal("show");
      const len = dmLengthMap.get(this);
      for (let i = 0, el; el = this[ i ], i < len; i++) {
        const data = getData(el);
        if (data && data.has("beforeShowStyle")) {
          const [ prop, val ] = data.get("beforeShowStyle");
          el.style[ prop ] = val;
          data.delete("beforeShowStyle");
        } else {
          const hiding = ishiding(el);
          if (!hiding) continue;
          if (hiding[ 0 ] === "display") el.style.display = getDisplay(el);
          else if (hiding[ 0 ] === "visibility") el.style.visibility = "visible";
          else if (hiding[ 0 ] === "opacity") el.style.opacity = "1";
        }
      }
      return this;
    }

    clear() {
      if (!isDM(this)) Illegal("clear");
      const len = dmLengthMap.get(this);
      for (let i = 0; i < len; i++) {
        const el = this[ i ];
        if (!el) continue;

        const descendants = el.querySelectorAll("*"),
          dLen = descendants.length;
        for (let j = 0; j < dLen; j++) {
          cleanupElement(descendants[ j ]);
        }

        el.innerHTML = "";
      }
      return this;
    }

    forEach(CallBack) {
      if (!isDM(this)) Illegal("forEach");
      const falsy = dmFalsyMap.get(this),
        len = dmLengthMap.get(this);
      if (!isFunction(CallBack) || falsy) return this;
      for (let i = 0; i < len; i++) {
        CallBack.call(this[ i ], this[ i ], i);
      }
      return this;
    }

    *[ Symbol.iterator ]() {
      const len = dmLengthMap.get(this);
      for (let i = 0; i < len; i++) {
        yield this[ i ];
      }
    }

    [ Symbol.toStringTag ] = "Domaster";
  }

  if (typeof Element.prototype.animate === "function") {
    extend("fadeIn", function fadeIn(option = Default) {
      if (!isDM(this)) Illegal("fadeIn");
      const isDef = option === Default || !isObject(option),
        len = dmLengthMap.get(this);

      for (let i = 0; i < len; i++) {
        const el = this[ i ];
        el.style.opacity = "0";

        let { from = 0, to = 1, duration = 600, direction = "up", range = "20px" } = isDef ? {} : option;
        if (isNaN(from)) from = 0;
        if (isNaN(to)) to = 1;

        let transform = "translateY(20px)",
          transformTo = "translateY(0)";

        if (!isDef) {
          if (direction === "up") {
            transform = `translateY(${range})`;
          } else if (direction === "down") {
            transform = `translateY(${range.startsWith("-") ? range.slice(1) : "-" + range})`;
          } else if (direction === "right") {
            transform = `translateX(${range.startsWith("-") ? range.slice(1) : "-" + range})`;
            transformTo = "translateX(0)";
          } else if (direction === "left") {
            transform = `translateX(${range})`;
            transformTo = "translateX(0)";
          }
        }

        const anim = el.animate(
          [
            { opacity: from, transform: transform },
            { opacity: to, transform: transformTo }
          ],
          {
            duration: duration,
            easing: "ease-out",
            fill: "forwards"
          }
        );

        anim.onfinish = _ => {
          el.style.opacity = String(to);
          el.style.transform = transformTo;
          anim.cancel();
        };
      }
      return this;
    });
    extend("fadeOut", function fadeOut(option = Default) {
      if (!isDM(this)) Illegal("fadeOut");
      const isDef = option === Default || !isObject(option),
        len = dmLengthMap.get(this);

      for (let i = 0; i < len; i++) {
        const el = this[ i ];

        let { from = 1, to = 0, duration = 600, direction = "up", range = "20px" } = isDef ? {} : option;
        if (isNaN(from)) from = 1;
        if (isNaN(to)) to = 0;

        let transform = "translateY(0)",
          transformTo = "translateY(-20px)";

        if (!isDef) {
          if (direction === "up") {
            transformTo = `translateY(${range.startsWith("-") ? range.slice(1) : "-" + range})`;
          } else if (direction === "down") {
            transformTo = `translateY(${range})`;
          } else if (direction === "right") {
            transformTo = `translateX(${range})`;
            transform = "translateX(0)";
          } else if (direction === "left") {
            transformTo = `translateX(${range.startsWith("-") ? range.slice(1) : "-" + range})`;
            transform = "translateX(0)";
          }
        }

        const anim = el.animate(
          [
            { opacity: from, transform: transform },
            { opacity: to, transform: transformTo }
          ],
          {
            duration: duration,
            easing: "ease-out",
            fill: "forwards"
          }
        );

        anim.onfinish = _ => {
          el.style.opacity = String(to);
          el.style.transform = transformTo;
          anim.cancel();
        };
      }
      return this;
    });
    extend("flip", function flip(actionFn, duration = 300) {
      const len = dmLengthMap.get(this),
        firstPositions = Array.from(this, el => el.getBoundingClientRect());

      if (typeof actionFn === "function") {
        actionFn.call(this);
      }

      for (let i = 0, el; el = this[ i ], i < len; i++) {
        const first = firstPositions[ i ],
          last = el.getBoundingClientRect(),

          deltaX = first.left - last.left,
          deltaY = first.top - last.top;

        if (deltaX !== 0 || deltaY !== 0) {
          el.animate([
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: "translate(0, 0)" }
          ], {
            duration: duration,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)"
          });
        }
      };

      return this;
    });
  } else {
    extend("fadeIn", function fadeIn(option = Default) {
      if (!isDM(this)) Illegal("fadeIn");
      const isDef = option === Default || !isObject(option),
        len = dmLengthMap.get(this);

      for (let i = 0; i < len; i++) {
        const el = this[ i ];

        let { from = 0, to = 1, duration = 600, direction = "up", range = "20px" } = isDef ? {} : option;
        if (isNaN(from)) from = 0;
        if (isNaN(to)) to = 1;

        let transform = "translateY(20px)",
          transformTo = "translateY(0)";

        if (!isDef) {
          if (direction === "up") {
            transform = `translateY(${range})`;
          } else if (direction === "down") {
            transform = `translateY(${range.startsWith("-") ? range.slice(1) : "-" + range})`;
          } else if (direction === "right") {
            transform = `translateX(${range.startsWith("-") ? range.slice(1) : "-" + range})`;
            transformTo = "translateX(0)";
          } else if (direction === "left") {
            transform = `translateX(${range})`;
            transformTo = "translateX(0)";
          }
        }

        el.style.transition = "none";
        el.style.opacity = String(from);
        el.style.transform = transform;

        // Trigger a reflow.
        void el.offsetHeight;

        el.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
        el.style.opacity = String(to);
        el.style.transform = transformTo;

        const handleTransitionEnd = e => {
          if (e.target !== el) return;
          el.style.transition = "";
          el.removeEventListener("transitionend", handleTransitionEnd);
        };
        el.addEventListener("transitionend", handleTransitionEnd);
      }
      return this;
    });
    extend("fadeOut", function fadeOut(option = Default) {
      if (!isDM(this)) Illegal("fadeOut");
      const isDef = option === Default || !isObject(option),
        len = dmLengthMap.get(this);

      for (let i = 0; i < len; i++) {
        const el = this[ i ];

        let { from = 1, to = 0, duration = 600, direction = "up", range = "20px" } = isDef ? {} : option;
        if (isNaN(from)) from = 1;
        if (isNaN(to)) to = 0;

        let transformFrom = "translateY(0)",
          transformTo = "translateY(-20px)";

        if (!isDef) {
          if (direction === "up") {
            transformTo = `translateY(${range.startsWith("-") ? range : "-" + range})`;
          } else if (direction === "down") {
            transformTo = `translateY(${range.startsWith("-") ? range.slice(1) : range})`;
          } else if (direction === "right") {
            transformFrom = "translateX(0)";
            transformTo = `translateX(${range.startsWith("-") ? range.slice(1) : range})`;
          } else if (direction === "left") {
            transformFrom = "translateX(0)";
            transformTo = `translateX(${range.startsWith("-") ? range : "-" + range})`;
          }
        }

        el.style.transition = "none";
        el.style.opacity = String(from);
        el.style.transform = transformFrom;

        // Trigger a reflow.
        void el.offsetHeight;

        el.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
        el.style.opacity = String(to);
        el.style.transform = transformTo;

        const handleTransitionEnd = e => {
          if (e.target !== el) return;
          el.style.transition = "";
          el.removeEventListener("transitionend", handleTransitionEnd);
        };
        el.addEventListener("transitionend", handleTransitionEnd);
      }
      return this;
    });
    extend("flip", function flip(actionFn, duration = 300) {
      if (!isDM(this)) Illegal("flip");
      const len = dmLengthMap.get(this),
        firstPositions = Array.from(this, el => el.getBoundingClientRect());

      if (typeof actionFn === "function") {
        actionFn.call(this);
      }

      for (let i = 0; i < len; i++) {
        const el = this[ i ],
          first = firstPositions[ i ],
          last = el.getBoundingClientRect(),
          deltaX = first.left - last.left,
          deltaY = first.top - last.top;

        if (deltaX !== 0 || deltaY !== 0) {
          el.style.transition = "none";
          el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

          //Trigger a reflow.
          void el.offsetHeight;

          el.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
          el.style.transform = "translate(0, 0)";

          const handleTransitionEnd = e => {
            if (e.target !== el || e.propertyName !== "transform") return;
            el.style.transition = "";
            el.style.transform = "";
            el.removeEventListener("transitionend", handleTransitionEnd);
          };
          el.addEventListener("transitionend", handleTransitionEnd);
        }
      }

      return this;
    });
  }

  function domaster(target = null) {
    if (target === unde || target === null) return new DM;
    if (isDM(target)) return target;
    if (isElement(target) || isList(target)) return new DM(target);
    return new DM(FindTags(String(target)));
  };

  domaster.state = function(initialData) {
    return new DMState(initialData);
  };

  domaster.component = function(name, config) {
    if (isObject(config)) {
      componentRegistry.set(name, config);
      return;
    }

    const registeredConfig = componentRegistry.get(name);
    if (!registeredConfig) throw new Error(`Component [${name}] is not registered.`);

    const instance = new DMComponent(registeredConfig);
    return instance.render();
  };

  domaster.scrollTop = function(smooth = false) {
    if (smooth) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  function* XPath(result) {
    const len = result.snapshotLength;
    for (let i = 0; i < len; i++) {
      yield result.snapshotItem(i);
    }
  }
  domaster.xPath = function(xPath) {
    try {
      var results = d.evaluate(
        xPath,
        d,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
    } catch (e) {
      return new XArray;
    }
    return XArray.from(XPath(results));
  };

  domaster.parse = function(str) {
    if (!str || !isString(str)) return null;
    const template = d.createElement("template");
    template.innerHTML = str.trim();
    const content = template.content;

    return content.childNodes.length === 0 ? null :
      content.childNodes.length === 1 ? content.firstChild.cloneNode(true) :
        content;
  };

  domaster.parseSafe = function(str) {
    if (!str || !isString(str)) return null;

    const trimmed = str.trim(),

      tagMatch = trimmed.match(/^<([a-z1-6]+)/i),
      tagName = tagMatch ? tagMatch[ 1 ].toLowerCase() : "";

    let prefix = "", suffix = "",
      depth = 0;

    if (tagName === "tr") {
      prefix = "<table><tbody>";
      suffix = "</tbody></table>";
      depth = 2;
    } else if (tagName === "td" || tagName === "th") {
      prefix = "<table><tbody><tr>";
      suffix = "</tr></tbody></table>";
      depth = 3;
    } else if ([ "tbody", "thead", "tfoot", "caption", "colgroup" ].includes(tagName)) {
      prefix = "<table>";
      suffix = "</table>";
      depth = 1;
    } else if (tagName === "option") {
      prefix = "<select>";
      suffix = "</select>";
      depth = 1;
    }

    const htmlToParse = `${prefix}${trimmed}${suffix}`,
      doc = parser.parseFromString(htmlToParse, "text/html");

    sanitizeTree(doc.body);

    let target = doc.body;
    for (let i = 0; i < depth; i++) {
      if (target.firstElementChild) {
        target = target.firstElementChild;
      }
    }

    const length = target.childNodes.length;

    if (length === 0) return null;
    if (length === 1) return target.firstChild.cloneNode(true);

    const fragment = d.createDocumentFragment();

    while (target.firstChild) {
      fragment.appendChild(target.firstChild);
    }
    return fragment;
  };

  domaster.from = function(str, safety = false) {
    if (safety) {
      return new DM(domaster.parseSafe(str));
    } else {
      return new DM(domaster.parse(str));
    }
  };

  class DMTem {
    constructor(target) {
      const el = isElement(target) ? target : FindTags(target);
      if (!el) throw new Error("The template does not exist.");
      if (isList(el)) throw new Error("There must be only one template.");
      temTargetMap.set(this, el);
      temDataMap.set(this, {});
    }

    attr(data) {
      if (!isTem(this)) Illegal("attr", "", "DMTem");
      if (!isObject(data) && !Array.isArray(data)) {
        throw new Error("Attributes must be an Object or an Array of Objects.");
      }
      temDataMap.set(this, data);
      return this;
    }

    mount(place, position = "beforeend") {
      if (!isTem(this)) Illegal("mount", "", "DMTem");
      const targetEl = resolveTemTarget(place);
      if (!targetEl) return this;

      const temEl = temTargetMap.get(this),
        data = temDataMap.get(this),
        htmlString = temEl.innerHTML;

      if (Array.isArray(data)) {
        const combinedHTML = data
          .map(item => renderTemplate(htmlString, item))
          .join("");
        targetEl.insertAdjacentHTML(position, combinedHTML);
      } else {
        const singleHTML = renderTemplate(htmlString, data);
        targetEl.insertAdjacentHTML(position, singleHTML);
      }

      return this;
    }
  }

  domaster.tem = function(target) {
    return new DMTem(target);
  }

  domaster.escape = function(str) {
    if (!isString(str)) return str;
    return str.replace(/[&<>"']/g, match => escapeMap[ match ]);
  }

  for (let i = 0; i < 26; i++) {
    const name = events[ i ];
    extend(name, function(...options) {
      if (!isDM(this)) Illegal(name);
      if (isObject(options[ 0 ])) {
        return this.event({ add: { [ name ]: options[ 0 ] } });
      } else {
        return this.event("add", name, ...options);
      }
    });
    const onceName = `once${name.slice(0, 1).toUpperCase() + name.slice(1)}`;
    extend(onceName, function(...options) {
      if (!isDM(this)) Illegal(onceName);
      if (isObject(options[ 0 ])) {
        return this.once({ add: { [ name ]: options[ 0 ] } });
      } else {
        return this.once(name, ...options);
      }
    });
  }

  domaster.prototype = DM.prototype;
  domaster.tem.prototype = DMTem.prototype;
  domaster.state.prototype = DMState.prototype;
  domaster.component.prototype = DMComponent.prototype;

  domaster.do = function(fn) {
    if (!isFunction(fn)) return;
    if (!ready) return d.addEventListener("DOMContentLoaded", _ => fn(main));
    fn(main);
  };

  domaster.defineEvent = function(name, handler) {
    if (isString(name) && isFunction(handler)) {
      uniqueEvents.set(name, handler);
    }
  };

  Object.defineProperty(domaster, "source", {
    get: _ => d.documentElement.outerHTML,
    set: NO,
    enumerable: false,
    configurable: true
  });

  const handler = {
    get(target, prop) {
      if (prop in target) return target[ prop ];
      return new DM(FindTags(prop));
    }
  };

  const main = new Proxy(domaster, handler);
  return main;
});
