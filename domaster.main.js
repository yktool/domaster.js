/* domaster.main.js ver.0.0.0 create by dai_fuku optimized */
!function(global, DM){
  "use strict";
  const targetGlobal = global || globalThis;
  if(!targetGlobal) throw new Error("Require document");
  targetGlobal.domaster = targetGlobal.DM = DM();
}(typeof window !== "undefined" ? window : globalThis, function(){
  "use strict";

  const obj = Object.prototype,
      style = getComputedStyle;

  let ready = document.readyState !== "loading";
  if (!ready) {
    document.addEventListener("DOMContentLoaded", function(){ ready = true; });
  }

  function isElement(target) {
    if (!target || target.nodeType !== 1) return false;
    let doc = target.ownerDocument ,
        win = (doc && doc.defaultView) || window;
    return target instanceof win.Element;
  }
  function isList(target){
    return target instanceof HTMLCollection || target instanceof NodeList;
  }
  function isDM(target){
    return target instanceof DM;
  }
  function isTem(target){
    return target instanceof DMTem;
  }
  function isObject(target){
    return obj.toString.call(target) === "[object Object]";
  }
  function isString(target){
    return typeof target === "string";
  }
  function isNumber(target){
    return typeof target === "number";
  }
  function isFunction(target){
    return typeof target === "function";
  }
  function hasOwn(target,prop){
    return obj.hasOwnProperty.call(target,prop);
  }

  const Default = Symbol("default");

  class XArray extends Array {
    constructor(){
      super(...arguments);
    }
    DM(){
      return new DM(this);
    }
  }

  function FindTags(target){
    const firstChar = target.charCodeAt(0);
    if (firstChar === 36) { // '$'
      return document.getElementById(target.slice(1));
    } else if (firstChar === 95) { // '_'
      return document.getElementsByClassName(target.slice(1));
    }
    const elements = document.querySelectorAll(target);
    return elements.length === 1 ? elements[0] : elements;
  }

  const ElementMap = new Map();
  
  function getData(target){
    return ElementMap.get(target);
  }

  const BlockElements = "html body article aside footer header hgroup main nav search section h1 h2 h3 h4 h5 h6 p blockquote pre address div figure figcaption hr ul ol dl dt dd form fieldset legend details summary dialog".split(" ");
  const InlineElements = "a span strong em b i small mark del ins code kbd samp var abbr cite q time data dfn bdo bdi ruby rt rp sub sup label wbr s u".split(" ");
  const InlineBlockElements = "button input select textarea meter progress img video audio canvas iframe embed object".split(" ");
  const NoneElements = "head title meta link style script template".split(" ");
  const OtherElements = new Map([
    ["li","list-item"],
    ["table" ,"table"],
    ["caption","table-caption"],
    ["thead" ,"table-header-group"],
    ["tbody" ,"table-row-group"],
    ["tfoot" ,"table-footer-group"],
    ["tr" ,"table-row"],
    ["td" ,"table-cell"],
    ["th" ,"table-cell"],
    ["colgroup","table-column-group"],
    ["col" ,"table-column-group"],
    ["ruby","ruby"],
    ["rt" ,"ruby-text"]
  ]);

  function getDisplay(el){
    const Tag = el.tagName.toLowerCase();
    if(BlockElements.includes(Tag)) return "block";
    if(InlineElements.includes(Tag)) return "inline";
    if(InlineBlockElements.includes(Tag)) return "inline-block";
    if(NoneElements.includes(Tag)) return "none";
    if(OtherElements.has(Tag)) return OtherElements.get(Tag);
    return "block";
  }

  function ishiding(el){
    const styles = getComputedStyle(el);
    return styles.visibility === "hidden" ? ["visibility","hidden"]:
           styles.opacity === "0" ? ["opacity","0"] :
           styles.display === "none" ? ["display","none"] :
           false;
  }

  const uniqueEvents = new Map([
    ["scrollIn", function(fn, target, controller, {margin, type, limit }, data) {
      const eventList = getData(target).get("events").get("scrollIn");
      const { signal } = controller;
      let count = 0;
      let isInView = false;

      if(isNumber(margin)){
       margin = String(margin) + (isString(type) ? type : "px");
      }

      const options = {
        root: null,
        rootMargin: `0px 0px ${margin || "-150px"}`,
        threshold: 0
      };

      const observer = new IntersectionObserver(function(entries){
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          if (!isInView) {
            isInView = true;
            fn();
            count++;
            if (limit && count >= limit) {
              const idx = eventList.indexOf(data);
              if (idx !== -1) eventList.splice(idx, 1);
              controller.abort();
            }
          }
        } else {
          isInView = false;
        }
      }, options);

      observer.observe(target);

      signal.addEventListener("abort", function(){
        observer.disconnect();
      });
    }]
  ]);

  function SetEvent(type, target, { fn, name }, unique) {
    const len = target.length;
    for (let i = 0; i < len; i++) {
      const el = target[i];
      if (!el) continue;
      
      let data = ElementMap.get(el);
      if (!data) {
        data = new Map();
        ElementMap.set(el, data);
      }
      
      let events = data.get("events");
      if (!events) {
        events = new Map();
        data.set("events", events);
      }

      let eventList = events.get(type);
      if (!eventList) {
        eventList = [];
        events.set(type, eventList);
      }

      const controller = new AbortController();
      const Edata = { fn, name, Controller: controller };
      eventList.push(Edata);

      if(uniqueEvents.has(type)){
        const uniqueEventSet = uniqueEvents.get(type);
        uniqueEventSet(fn.bind(el), el, controller , unique || {}, Edata);
      } else {
        el.addEventListener(type, fn.bind(el), { signal: controller.signal });
      }
    }
  }

  function RemoveEvent(type, target, targetName) {
    const len = target.length;
    for (let i = 0; i < len; i++) {
      const data = ElementMap.get(target[i]);
      if (!data) continue;
      const events = data.get("events");
      if (!events) continue;
      const eventList = events.get(type);
      if (!eventList) continue;

      const remaining = eventList.filter(function(e){
        if (!targetName || e.name === targetName) {
          e.Controller.abort();
          return false;
        }
        return true;
      });
      events.set(type, remaining);
    }
  }

  function RemoveEventByEvent(target, name) {
    const data = getData(target);
    if (!data) return;
    const events = data.get("events");
    if (!events) return;

    const eventList = events.get(name);
    if (!eventList) return;

    const len = eventList.length;
    for (let i = 0; i < len; i++) {
      eventList[i].Controller.abort();
    }
    events.set(name, []);
  }

  function cleanupElement(target) {
    const data = getData(target);
    if (!data) return;

    const events = data.get("events");
    if (events) {
      events.forEach((eventList) => {
        for (let i = 0; i < eventList.length; i++) {
          if (eventList[i].Controller) {
            eventList[i].Controller.abort();
          }
        }
      });
    }

    const resizeObserver = data.get("resizeObserver");
    if (resizeObserver) {
      resizeObserver.disconnect();
    }

    ElementMap.delete(target);
  }

  function Illegal(prop, type=""){
    throw new TypeError(`Method ${type}DM.prototype.${prop} called on incompatible receiver #<DM>`);
  }

  /* --- DMState (リアクティブ状態管理クラス) --- */
  class DMState {
    #data;
    #listeners = new Map();

    constructor(initialData = {}) {
      const self = this;
      this.#data = new Proxy({ ...initialData }, {
        set(target, prop, value) {
          const oldValue = target[prop];
          if (oldValue !== value) {
            target[prop] = value;
            self.#notify(prop, value, oldValue);
          }
          return true;
        },
        get(target, prop) {
          return target[prop];
        }
      });
    }

    get data() {
      return this.#data;
    }

    subscribe(key, callback) {
      if (!this.#listeners.has(key)) {
        this.#listeners.set(key, new Set());
      }
      this.#listeners.get(key).add(callback);
      return () => this.#listeners.get(key).delete(callback);
    }

    #notify(key, newValue, oldValue) {
      if (this.#listeners.has(key)) {
        this.#listeners.get(key).forEach((fn) => fn(newValue, oldValue));
      }
      if (this.#listeners.has("*")) {
        this.#listeners.get("*").forEach((fn) => fn(key, newValue, oldValue));
      }
    }
  }

  /* --- DMComponent (コンポーネント管理クラス) --- */
  class DMComponent {
    #config;
    #state;
    #element = null;
    #unsub = null;

    constructor(config) {
      this.#config = config;
      const initialState = isFunction(config.state) ? config.state() : (config.state || {});
      this.#state = new DMState(initialState);
    }

    get state() {
      return this.#state.data;
    }

    render() {
      const html = this.#config.template(this.#state.data);
      
      if (!this.#element) {
        this.#element = domaster.parseSafe(html);
        if (this.#element instanceof DocumentFragment) {
          const wrapper = document.createElement("div");
          wrapper.appendChild(this.#element);
          this.#element = wrapper;
        }

        this.#bindEvents();
        
        this.#unsub = this.#state.subscribe("*", () => {
          const nextHTML = this.#config.template(this.#state.data);
          new DM(this.#element).morph(nextHTML);
          if (isFunction(this.#config.updated)) {
            this.#config.updated(this.#element, this.#state.data);
          }
        });

        if (isFunction(this.#config.mounted)) {
          setTimeout(() => this.#config.mounted(this.#element, this.#state.data), 0);
        }
      } else {
        new DM(this.#element).morph(html);
      }

      return this.#element;
    }

    #bindEvents() {
      if (!isObject(this.#config.events)) return;
      const dmEl = new DM(this.#element);

      Object.keys(this.#config.events).forEach((key) => {
        const spaceIdx = key.indexOf(" ");
        const eventType = spaceIdx !== -1 ? key.slice(0, spaceIdx) : key;
        const selector = spaceIdx !== -1 ? key.slice(spaceIdx + 1) : "*";
        const handler = this.#config.events[key];

        dmEl.event.on(eventType, selector, (e) => {
          handler.call(this, e, this.#state.data);
        });
      });
    }

    destroy() {
      if (this.#unsub) this.#unsub();
      if (this.#element) new DM(this.#element).remove();
    }
  }

  const componentRegistry = new Map();

  class DM {
    #All = Default;
    #length = 0;
    #falsy = false;
    #Elements = new XArray();

    constructor(BaseElement){
      if(isString(BaseElement)){
        BaseElement = FindTags(BaseElement);
      }
      const len = BaseElement ? BaseElement.length : 0;
      if(!BaseElement || len === 0) {
        this.#falsy = true;
        return;
      }
      
      let elementsSource = BaseElement;
      if((isList(BaseElement) || Array.isArray(BaseElement)) && !(len > 1)){
        elementsSource = BaseElement[0];
      }

      if(len > 1) {
        this.#All = BaseElement;
        this.#length = len;
        this.#Elements = new XArray(len);

        for (let i = 0; i < len; i++) {
          const el = BaseElement[i];
          this[i] = el;
          this.#Elements[i] = el;

          let data = ElementMap.get(el);
          if(!data) {
            data = new Map();
            ElementMap.set(el, data);
          }
          let parentList = data.get("parent");
          if(!parentList) {
            parentList = [];
            data.set("parent", parentList);
          }
          if(!parentList.includes(BaseElement)) parentList.push(BaseElement);
        }
      } else {
        const el = elementsSource.nodeType ? elementsSource : BaseElement;
        this[0] = el;
        this.#length = 1;
        this.#Elements.push(el);
        if(!ElementMap.has(el)) ElementMap.set(el, new Map());
      }
    }

    get length(){
      if(!isDM(this)) Illegal("length","get ");
      return this.#length;
    }

    get Elements(){
      if(!isDM(this)) Illegal("Elements","get ");
      return this.#Elements;
    }

    n(index = 0){
      if(!isDM(this)) Illegal("n");
      const targetIndex = index >= 0 ? index : this.#length + index;
      return new DM(this[targetIndex]);
    }

    get odd(){
      if(!isDM(this)) Illegal("odd", "get ");
      if(this.#falsy || this.#length === 1) return this;
      const odd = [];
      for (let i = 0; i < this.#length; i += 2){
        odd.push(this[i]);
      }
      return new DM(odd);
    }

    get even(){
      if(!isDM(this)) Illegal("even", "get ");
      if(this.#falsy) return this;
      if(this.#length === 1) return new DM(null);
      const even = [];
      for (let i = 1; i < this.#length; i += 2){
        even.push(this[i]);
      }
      return new DM(even);
    }

    nth(n){
      if(!isDM(this)) Illegal("nth");
      if(!n || n <= 0) return this;
      const nth = [];
      for (let i = n - 1; i < this.#length; i += n){
        nth.push(this[i]);
      }
      return new DM(nth);
    }

    get event(){
      if(!isDM(this)) Illegal("event", "get ");
      
      const self = this;

      const createDelegatedHandler = (selector, fn) => {
        return function(e) {
          const targetElement = e.target.closest(selector);
          if (targetElement && this.contains(targetElement)) {
            fn.call(targetElement, e, targetElement);
          }
        };
      };

      const removeAll = function(){
        if(self.#falsy) return self;
        
        const clearTargetEvents = function(targetElement) {
          const target = getData(targetElement);
          if(!target) return;
          const events = target.get("events");
          if(!events) return;
          events.forEach(function(eventList, eventName) {
            for (let i = 0; i < eventList.length; i++) {
              eventList[i].Controller.abort();
            }
            events.set(eventName, []);
          });
        };

        if(self.#All !== Default){
          ElementMap.forEach(function(value, key){
            const parents = value.get("parent");
            if(parents && parents.includes(self.#All)){
              clearTargetEvents(key);
            }
          });
        }

        if(self.#length === 1){
          clearTargetEvents(self[0]);
        }
        
        return self;
      };

      function eventFn(option){
        if(self.#falsy) return self;

        if (arguments[0] === "on" && arguments.length >= 4) {
          const type = arguments[1];
          const selector = arguments[2];
          const fn = arguments[3];
          const name = arguments[4] || fn.name;
          const delegatedHandler = createDelegatedHandler(selector, fn);
          return self.event("add", type, delegatedHandler, name);
        }

        if (arguments[0] === "off") {
          const type = arguments[1];
          const name = arguments[2];
          if (name) {
            RemoveEvent(type, self, name);
          } else if (type) {
            for (let i = 0; i < self.#length; i++) {
              RemoveEventByEvent(self[i], type);
            }
          }
          return self;
        }

        if(!isObject(option)){
          const options = arguments;
          if(options[0] === "remove" && options.length === 2){
            option = { remove: options[1] };
          } else {
            option = {
              [options[0]]: {
                [options[1]]: {
                  fn: options[2],
                  name: options[3]
                }
              }
            };
            if(options.length > 4 && uniqueEvents.has(options[1]) && isObject(options[4])) {
              option[options[0]][options[1]].data = options[4];
            }
          }
        }

        if(option.add && isObject(option.add)){
          const addKeys = Object.keys(option.add);
          const addLen = addKeys.length;
          for (let i = 0; i < addLen; i++){
            const eventName = addKeys[i];
            const data = option.add[eventName],
                  arg = [eventName, self, data];
            if(hasOwn(data,"data") && uniqueEvents.has(eventName)) {
              arg.push(data.data);
            }
            Reflect.apply(SetEvent,null,arg);
          }
        }

        if(option.remove){
          if(isObject(option.remove)){
            const removeKeys = Object.keys(option.remove);
            const removeLen = removeKeys.length;
            for (let i = 0; i < removeLen; i++){
              const eventName = removeKeys[i];
              RemoveEvent(eventName, self, option.remove[eventName].name);
            }
          } else if(isString(option.remove)){
            for (let i = 0; i < self.#length; i++){
              RemoveEventByEvent(self[i], option.remove);
            }
          } else if(Array.isArray(option.remove)){
            const types = option.remove;
            for (let i = 0; i < types.length; i++) {
              const type = types[i];
              for (let j = 0; j < self.#length; j++){
                RemoveEventByEvent(self[j], type);
              }
            }
          }
        }
        return self;
      }

      eventFn.on = function(type, selector, fn, name) {
        if (!isString(type) || !isString(selector) || !isFunction(fn)) return self;
        const delegatedHandler = createDelegatedHandler(selector, fn);
        return self.event("add", type, delegatedHandler, name || fn.name);
      };

      eventFn.off = function(type, name) {
        if (!isString(type)) return self;
        if (name) {
          RemoveEvent(type, self, name);
        } else {
          for (let i = 0; i < self.#length; i++) {
            RemoveEventByEvent(self[i], type);
          }
        }
        return self;
      };

      eventFn._removeAll = removeAll;
      return new Proxy(eventFn, {
        get(target, prop){
          if(Reflect.has(target, prop)) return Reflect.get(target, prop);
        },
        set(_, EventName, EventFunction){
          if(typeof EventFunction !== "function") return true;
          self.event({
            add: {
              [EventName]: {
                fn: EventFunction,
                name: EventFunction.name
              }
            }
          });
          return true;
        }
      });
    }

    clickOutside(fn) {
      if (!isDM(this)) Illegal("clickOutside");
      if (this.#falsy || !isFunction(fn)) return this;

      const handler = (e) => {
        for (let i = 0; i < this.#length; i++) {
          if (this[i] && !this[i].contains(e.target)) {
            fn.call(this[i], e);
          }
        }
      };

      document.addEventListener("pointerdown", handler);
      const elData = getData(this[0]);
      if (elData) {
        let events = elData.get("events") || new Map();
        elData.set("events", events);
      }
      return this;
    }

    observeResize(fn) {
      if (!isDM(this)) Illegal("observeResize");
      if (this.#falsy || !isFunction(fn)) return this;

      for (let i = 0; i < this.#length; i++) {
        const el = this[i];
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
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
      if (value === Default) {
        if (this.#falsy) return null;
        return this.#length === 1 ? this[0].textContent : this.#Elements.map(el => el.textContent);
      }
      if (this.#falsy) return this;
      for (let i = 0; i < this.#length; i++) {
        this[i].textContent = value;
      }
      return this;
    }

    html(value = Default) {
      if (!isDM(this)) Illegal("html");
      if (value === Default) {
        if (this.#falsy) return null;
        return this.#length === 1 ? this[0].innerHTML : this.#Elements.map(el => el.innerHTML);
      }
      if (this.#falsy) return this;
      for (let i = 0; i < this.#length; i++) {
        this[i].innerHTML = value;
      }
      return this;
    }

    scrollToSelf(options = { behavior: "smooth", block: "start" }) {
      if (!isDM(this)) Illegal("scrollToSelf");
      if (this.#falsy) return this;
      this[0].scrollIntoView(options);
      return this;
    }

    bind(stateInstance, keyOrFn, targetAttr = "text") {
      if (!isDM(this) || !(stateInstance instanceof DMState)) return this;

      if (isFunction(keyOrFn)) {
        const update = () => keyOrFn.call(this, stateInstance.data);
        stateInstance.subscribe("*", update);
        update();
        return this;
      }

      const key = String(keyOrFn);
      const updateDOM = (val) => {
        const value = val ?? "";
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
      updateDOM(stateInstance.data[key]);

      if (targetAttr === "val") {
        this.event.on("input", "input, textarea, select", function() {
          stateInstance.data[key] = this.value;
        });
      }

      return this;
    }

    style(){
      if(!isDM(this)) Illegal("style");
      if(this.#falsy) return this;
      if(isObject(arguments[0])){
        const styles = arguments[0],
                keys = Object.keys(styles),
              length = keys.length;
        for (let i = 0 , prop , value; prop = keys[i] , value = styles[prop] , i < length ; i++) {
          for (let j = 0, len = this.#length , el; el = this[j] , j < len ; j++) {
            el.style[prop] = value;
          }
        }
      }
      return this;
    }

    get child(){
      if(!isDM(this)) Illegal("child", "get ");
      if(this.#falsy) return [];
      const len = this.#length;
      if(len > 1){
        const child = new Array(len);
        for (let i = 0; i < len; i++){
          const children = this[i].children;
          child[i] = children && children.length ? new DM(children) : new DM(null);
        }
        return child;
      } else {
        return [new DM(this[0].children)];
      }
    }

    get parent() {
      if (!isDM(this)) Illegal("parent", "get ");
      if (this.#falsy) return new DM(null);
      const parents = [];
      for (let i = 0; i < this.#length; i++) {
        const p = this[i].parentElement;
        if (p && !parents.includes(p)) parents.push(p);
      }
      return new DM(parents);
    }

    closest(selector) {
      if (!isDM(this)) Illegal("closest");
      if (this.#falsy || !isString(selector)) return new DM(null);
      const matches = [];
      for (let i = 0; i < this.#length; i++) {
        const el = this[i].closest(selector);
        if (el && !matches.includes(el)) matches.push(el);
      }
      return new DM(matches);
    }

    siblings(selector) {
      if (!isDM(this)) Illegal("siblings");
      if (this.#falsy) return new DM(null);
      const sibs = [];
      for (let i = 0; i < this.#length; i++) {
        const parent = this[i].parentElement;
        if (!parent) continue;
        const children = parent.children;
        for (let j = 0; j < children.length; j++) {
          const child = children[j];
          if (child !== this[i] && !sibs.includes(child)) {
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
      if (this.#falsy) return new DM(null);
      const prevs = [];
      for (let i = 0; i < this.#length; i++) {
        const el = this[i].previousElementSibling;
        if (el && !prevs.includes(el)) prevs.push(el);
      }
      return new DM(prevs);
    }

    get next() {
      if (!isDM(this)) Illegal("next", "get ");
      if (this.#falsy) return new DM(null);
      const nexts = [];
      for (let i = 0; i < this.#length; i++) {
        const el = this[i].nextElementSibling;
        if (el && !nexts.includes(el)) nexts.push(el);
      }
      return new DM(nexts);
    }

    get attr(){
      if(!isDM(this)) Illegal("attr","get ");
      const self = this;
      function attr(name,value = Default){
        if(!name) return self;
        if(!isString(name)) name = String(name);
        if(value === Default){
          if(self.#falsy) return null;
          const len = self.#length;
          if(len === 1) return self[0].getAttribute(name);
          const results = new Array(len);
          for(let i = 0; i < len; i++){
            results[i] = self[i].getAttribute(name);
          }
          return results;
        } else {
          if(self.#falsy) return self;
          const len = self.#length;
          for(let i = 0 ; i < len ; i++){
            self[i].setAttribute(name,value);
          }
          return self;
        }
      }
      const handler = {
        get(_,name){
          return self.attr(name);
        },
        set(_,name,value){
          self.attr(name,value);
          return true;
        }
      };
      if(this.#falsy){
        handler.has = function(){ return false; };
      } else if(this.#length === 1){
        handler.has = function(_,name){ return self[0].hasAttribute(name); };
      }
      return new Proxy(attr,handler);
    }

    hasClass(className) {
      if (!isDM(this)) Illegal("hasClass");
      if (this.#falsy || !isString(className)) return false;
      const name = className.trim();
      for (let i = 0; i < this.#length; i++) {
        if (this[i] && this[i].classList && this[i].classList.contains(name)) {
          return true;
        }
      }
      return false;
    }

    addClass(...classNames) {
      if (!isDM(this)) Illegal("addClass");
      if (this.#falsy || !classNames.length) return this;
      const names = classNames
        .flatMap((c) => (isString(c) ? c.trim().split(/\s+/) : []))
        .filter(Boolean);
      if (!names.length) return this;

      for (let i = 0; i < this.#length; i++) {
        if (this[i] && this[i].classList) {
          this[i].classList.add(...names);
        }
      }
      return this;
    }

    removeClass(...classNames) {
      if (!isDM(this)) Illegal("removeClass");
      if (this.#falsy) return this;
    
      if (!classNames.length) {
        for (let i = 0; i < this.#length; i++) {
          if (this[i]) this[i].className = "";
        }
        return this;
      }

      const names = classNames
        .flatMap((c) => (isString(c) ? c.trim().split(/\s+/) : []))
        .filter(Boolean);

      for (let i = 0; i < this.#length; i++) {
        if (this[i] && this[i].classList) {
          this[i].classList.remove(...names);
        }
      }
      return this;
    }

    toggleClass(className, force) {
      if (!isDM(this)) Illegal("toggleClass");
      if (this.#falsy || !isString(className)) return this;
      const names = className.trim().split(/\s+/).filter(Boolean);
      const hasForce = typeof force === "boolean";

      for (let i = 0; i < this.#length; i++) {
        if (this[i] && this[i].classList) {
          names.forEach((name) => {
            if (hasForce) {
              this[i].classList.toggle(name, force);
            } else {
              this[i].classList.toggle(name);
            }
          });
        }
      }
      return this;
    }

    append(content) {
      if (!isDM(this)) Illegal("append");
      if (this.#falsy || !content) return this;
      for (let i = 0; i < this.#length; i++) {
        const el = this[i];
        if (isString(content)) {
          el.insertAdjacentHTML("beforeend", content);
        } else if (isElement(content)) {
          el.appendChild(i === 0 ? content : content.cloneNode(true));
        } else if (isDM(content)) {
          for (let j = 0; j < content.length; j++) {
            const child = content[j];
            if (child) el.appendChild(i === 0 ? child : child.cloneNode(true));
          }
        }
      }
      return this;
    }

    prepend(content) {
      if (!isDM(this)) Illegal("prepend");
      if (this.#falsy || !content) return this;
      for (let i = 0; i < this.#length; i++) {
        const el = this[i];
        if (isString(content)) {
          el.insertAdjacentHTML("afterbegin", content);
        } else if (isElement(content)) {
          el.insertBefore(i === 0 ? content : content.cloneNode(true), el.firstChild);
        } else if (isDM(content)) {
          for (let j = content.length - 1; j >= 0; j--) {
            const child = content[j];
            if (child) el.insertBefore(i === 0 ? child : child.cloneNode(true), el.firstChild);
          }
        }
      }
      return this;
    }

    before(content) {
      if (!isDM(this)) Illegal("before");
      if (this.#falsy || !content) return this;
      for (let i = 0; i < this.#length; i++) {
        const el = this[i];
        if (!el || !el.parentNode) continue;
        if (isString(content)) {
          el.insertAdjacentHTML("beforebegin", content);
        } else if (isElement(content)) {
          el.parentNode.insertBefore(i === 0 ? content : content.cloneNode(true), el);
        } else if (isDM(content)) {
          for (let j = 0; j < content.length; j++) {
            const child = content[j];
            if (child) el.parentNode.insertBefore(i === 0 ? child : child.cloneNode(true), el);
          }
        }
      }
      return this;
    }

    after(content) {
      if (!isDM(this)) Illegal("after");
      if (this.#falsy || !content) return this;
      for (let i = 0; i < this.#length; i++) {
        const el = this[i];
        if (!el || !el.parentNode) continue;
        if (isString(content)) {
          el.insertAdjacentHTML("afterend", content);
        } else if (isElement(content)) {
          el.parentNode.insertBefore(i === 0 ? content : content.cloneNode(true), el.nextSibling);
        } else if (isDM(content)) {
          for (let j = 0; j < content.length; j++) {
            const child = content[j];
            if (child) el.parentNode.insertBefore(i === 0 ? child : child.cloneNode(true), el.nextSibling);
          }
        }
      }
      return this;
    }

    val(value = Default) {
      if (!isDM(this)) Illegal("val");
    
      if (value === Default) {
        if (this.#falsy) return null;
        const getValue = (el) => {
          if (!el) return "";
          if (el.tagName === "SELECT" && el.multiple) {
            return Array.from(el.selectedOptions).map((opt) => opt.value);
          }
          return el.value !== undefined ? el.value : "";
        };

        if (this.#length === 1) return getValue(this[0]);
        const results = new Array(this.#length);
        for (let i = 0; i < this.#length; i++) {
          results[i] = getValue(this[i]);
        }
        return results;
      }

      if (this.#falsy) return this;
      for (let i = 0; i < this.#length; i++) {
        const el = this[i];
        if (el && "value" in el) {
          el.value = value;
        }
      }
      return this;
    }

    data(key, value = Default) {
      if (!isDM(this)) Illegal("data");
      if (this.#falsy || !key) return value === Default ? null : this;

      if (isObject(key)) {
        for (let i = 0; i < this.#length; i++) {
          const elData = getData(this[i]);
          if (!elData) continue;
          let store = elData.get("customData");
          if (!store) {
            store = new Map();
            elData.set("customData", store);
          }
          Object.keys(key).forEach((k) => store.set(k, key[k]));
        }
        return this;
      }

      if (value === Default) {
        const getCustomData = (el) => {
          const elData = getData(el);
          const store = elData ? elData.get("customData") : null;
          if (store && store.has(key)) return store.get(key);
          return el.dataset ? el.dataset[key] : undefined;
        };

        if (this.#length === 1) return getCustomData(this[0]);
        const results = new Array(this.#length);
        for (let i = 0; i < this.#length; i++) {
          results[i] = getCustomData(this[i]);
        }
        return results;
      }

      for (let i = 0; i < this.#length; i++) {
        const elData = getData(this[i]);
        if (!elData) continue;
        let store = elData.get("customData");
        if (!store) {
          store = new Map();
          elData.set("customData", store);
        }
        store.set(key, value);
      }
      return this;
    }

    wait(condition, timeout = 0) {
      if (!isDM(this)) Illegal("wait");
      if (this.#falsy) return Promise.reject(new Error("Empty DM instance"));

      const el = this[0];
      return new Promise((resolve, reject) => {
        let timer = null;
        if (timeout > 0) {
          timer = setTimeout(() => {
            cleanup();
            reject(new Error(`wait timed out after ${timeout}ms`));
          }, timeout);
        }

        const cleanup = () => {
          if (timer) clearTimeout(timer);
        };

        if (condition === "visible" || condition === "hidden") {
          const observer = new IntersectionObserver(([entry]) => {
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

        const handler = (e) => {
          cleanup();
          resolve(e);
        };
        el.addEventListener(condition, handler, { once: true });
      });
    }

    cssVar(name, value = Default) {
      if (!isDM(this)) Illegal("cssVar");
      if (this.#falsy || !name) return value === Default ? null : this;

      if (isObject(name)) {
        Object.keys(name).forEach((k) => {
          const varName = k.startsWith("--") ? k : `--${k}`;
          for (let i = 0; i < this.#length; i++) {
            this[i].style.setProperty(varName, String(name[k]));
          }
        });
        return this;
      }

      const formattedName = isString(name) && name.startsWith("--") ? name : `--${name}`;

      if (value === Default) {
        const getVar = (el) => style(el).getPropertyValue(formattedName).trim();
        if (this.#length === 1) return getVar(this[0]);
        const results = new Array(this.#length);
        for (let i = 0; i < this.#length; i++) {
          results[i] = getVar(this[i]);
        }
        return results;
      }

      for (let i = 0; i < this.#length; i++) {
        this[i].style.setProperty(formattedName, String(value));
      }
      return this;
    }

    async copy(type = "text") {
      if (!isDM(this)) Illegal("copy");
      if (this.#falsy) return false;

      const el = this[0];
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
        const textarea = document.createElement("textarea");
        textarea.value = content;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        return success;
      }
    }

    morph(newHTML) {
      if (!isDM(this)) Illegal("morph");
      if (this.#falsy || !isString(newHTML)) return this;

      const patch = (oldNode, newNode) => {
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
          const oldAttrs = Array.from(oldNode.attributes);
          const newAttrs = Array.from(newNode.attributes);

          oldAttrs.forEach((attr) => {
            if (!newNode.hasAttribute(attr.name)) {
              oldNode.removeAttribute(attr.name);
            }
          });

          newAttrs.forEach((attr) => {
            if (oldNode.getAttribute(attr.name) !== attr.value) {
              oldNode.setAttribute(attr.name, attr.value);
            }
          });

          if ("value" in oldNode && oldNode.value !== newNode.value && document.activeElement !== oldNode) {
            oldNode.value = newNode.value;
          }

          const oldChildren = Array.from(oldNode.childNodes);
          const newChildren = Array.from(newNode.childNodes);
          const max = Math.max(oldChildren.length, newChildren.length);

          for (let i = 0; i < max; i++) {
            if (!oldChildren[i]) {
              oldNode.appendChild(newChildren[i].cloneNode(true));
            } else if (!newChildren[i]) {
              cleanupElement(oldChildren[i]);
              oldChildren[i].remove();
            } else {
              patch(oldChildren[i], newChildren[i]);
            }
          }
        }
      };

      for (let i = 0; i < this.#length; i++) {
        const temp = document.createElement("template");
        temp.innerHTML = newHTML.trim();
        const newEl = temp.content.firstElementChild;
        if (newEl) patch(this[i], newEl);
      }
      return this;
    }

    remove() {
      if (!isDM(this)) Illegal("remove");
      if (this.#falsy) return this;

      for (let i = 0; i < this.#length; i++) {
        const el = this[i];
        if (!el) continue;

        const descendants = el.querySelectorAll("*");
        for (let j = 0; j < descendants.length; j++) {
          cleanupElement(descendants[j]);
        }
        cleanupElement(el);

        el.remove();
      }
      return this;
    }

    hide(none = false){
      if(!isDM(this)) Illegal("hide");
      const len = this.#length;
      if(none){
        for (let i = 0 , el ; el = this[i] , i < len ; i++) {
          getData(el).set("beforeShowStyle",["display", style(el).display || getDisplay(el)]);
          el.style.display = "none";
        }
      } else {
        for (let i = 0 , el ; el = this[i] , i < len ; i++) {
          getData(el).set("beforeShowStyle",["visibility", style(el).visibility || "visible"]);
          el.style.visibility = "hidden";
        }
      }
      return this;
    }

    visible(){
      if(!isDM(this)) Illegal("visible");
      const len = this.#length;
      for (let i = 0 , el ; el = this[i] , i < len ; i++) {
        getData(el).set("beforeShowStyle",["opacity", style(el).opacity || "1"]);
        el.style.opacity = "0";
      }
      return this;
    }

    show(){
      if(!isDM(this)) Illegal("show");
      const len = this.#length;
      for (let i = 0 , el ; el = this[i] , i < len ; i++) {
        const hiding = ishiding(el);
        if(!hiding) continue;
        const data = getData(el);
        if(data.has("beforeShowStyle")) {
          const beforeShowStyle = data.get("beforeShowStyle");
          el.style[beforeShowStyle[0]] = beforeShowStyle[1];
        } else {
          if (hiding[0] === "display") el.style.display = getDisplay(el);
          else if (hiding[0] === "visibility") el.style.visibility = "visible";
          else if (hiding[0] === "opacity") el.style.opacity = "1";
        }
      }
      return this;
    }

    clear(){
      if (!isDM(this)) Illegal("clear");
      const len = this.#length;
      for (let i = 0 ; i < len ; i++){
        const el = this[i];
        if (!el) continue;

        const descendants = el.querySelectorAll("*");
        const dLen = descendants.length;
        for (let j = 0; j < dLen; j++) {
          cleanupElement(descendants[j]);
        }

        el.innerHTML = "";
      }
      return this;
    }

    fadeIn(option = Default) {
      if (!isDM(this)) Illegal("fadeIn");
      const isDef = option === Default || !isObject(option);
      const len = this.#length;

      for (let i = 0; i < len; i++) {
        const el = this[i];
        el.style.opacity = "0";

        let { from = 0, to = 1, duration = 600, direction = "up", range = "20px" } = isDef ? {} : option;
        if (isNaN(from)) from = 0;
        if (isNaN(to)) to = 1;

        let transform = "translateY(20px)";
        let transformTo = "translateY(0)";

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

        anim.onfinish = () => {
          el.style.opacity = String(to);
          el.style.transform = transformTo;
          anim.cancel();
        };
      }
      return this;
    }

    fadeOut(option = Default) {
      if (!isDM(this)) Illegal("fadeOut");
      const isDef = option === Default || !isObject(option);
      const len = this.#length;

      for (let i = 0; i < len; i++) {
        const el = this[i];

        let { from = 1, to = 0, duration = 600, direction = "up", range = "20px" } = isDef ? {} : option;
        if (isNaN(from)) from = 1;
        if (isNaN(to)) to = 0;

        let transform = "translateY(0)";
        let transformTo = "translateY(-20px)";

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

        anim.onfinish = () => {
          el.style.opacity = String(to);
          el.style.transform = transformTo;
          anim.cancel();
        };
      }
      return this;
    }

    forEach(CallBack){
      if(!isDM(this)) Illegal("forEach");
      const len = this.#length;
      if(isFunction(CallBack)) {
        for (let i = 0; i < len; i++){
          CallBack.call(this[i], this[i], i);
        }
      }
      return this;
    }

    *[Symbol.iterator](){
      const len = this.#length;
      for (let i = 0; i < len; i++){
        yield this[i];
      }
    }
    
    [Symbol.toStringTag] = "Domaster";
  }

  function domaster(target = null){
    if(target === undefined || target === null) return new DM();
    if(isDM(target)) return target;
    if(isElement(target) || isList(target)) return new DM(target);
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

  domaster.scrollTop = function(smooth = false){
    if(smooth){
      window.scrollTo({
        top:0,
        behavior:"smooth"
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  function* XPath(result){
    const len = result.snapshotLength;
    for (let i = 0; i < len ; i++) {
       yield result.snapshotItem(i);
    }
  }
  domaster.xPath = function(xPath){
    try {
      var results = document.evaluate(
        xPath,
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
    } catch(e) {
      return new XArray();
    }
    return XArray.from(XPath(results));
  };

  domaster.parse = function(str){
    if (!str || typeof str !== "string") return null;
    const template = document.createElement("template");
    template.innerHTML = str.trim();
    const content = template.content;

    if (content.childNodes.length === 0) return null;
    if (content.childNodes.length === 1) return content.firstChild.cloneNode(true);
    return content;
  };

  function sanitizeTree(root) {
    const dangerousTags = root.querySelectorAll("script, iframe, object, embed, style");
    for (let i = 0; i < dangerousTags.length; i++) {
      dangerousTags[i].remove();
    }

    const allElements = root.querySelectorAll("*");
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const attrs = el.attributes;

      for (let j = attrs.length - 1; j >= 0; j--) {
        const attr = attrs[j];
        const name = attr.name.toLowerCase();
        const val = attr.value.trim().toLowerCase();

        if (name.startsWith("on")) {
          el.removeAttribute(attr.name);
        } else if ((name === "href" || name === "src" || name === "action") && val.startsWith("javascript:")) {
          el.removeAttribute(attr.name);
        }
      }
    }
  }

  domaster.parseSafe = function(str) {
    if (!str || typeof str !== "string") return null;

    const trimmed = str.trim();

    const tagMatch = trimmed.match(/^<([a-z1-6]+)/i);
    const tagName = tagMatch ? tagMatch[1].toLowerCase() : "";

    let prefix = "";
    let suffix = "";
    let depth = 0;

    if (tagName === "tr") {
      prefix = "<table><tbody>";
      suffix = "</tbody></table>";
      depth = 2;
    } else if (tagName === "td" || tagName === "th") {
      prefix = "<table><tbody><tr>";
      suffix = "</tr></tbody></table>";
      depth = 3;
    } else if (["tbody", "thead", "tfoot", "caption", "colgroup"].includes(tagName)) {
      prefix = "<table>";
      suffix = "</table>";
      depth = 1;
    } else if (tagName === "option") {
      prefix = "<select>";
      suffix = "</select>";
      depth = 1;
    }

    const parser = new DOMParser();
    const htmlToParse = `${prefix}${trimmed}${suffix}`;
    const doc = parser.parseFromString(htmlToParse, "text/html");

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

    const fragment = document.createDocumentFragment();

    while (target.firstChild) {
      fragment.appendChild(target.firstChild);
    }
    return fragment;
  };

  domaster.from = function(str,safety = false){
    if(safety){
      return new DM(domaster.parseSafe(str));
    } else {
      return new DM(domaster.parse(str));
    }
  };

  function renderTemplate(htmlString, data) {
    const regex = /\{\{\s*(\w+)\s*\}\}/g;

    return htmlString.replace(regex,function(match, key){
      if (match.startsWith('"')) {
        return match;
      }
      return data[key] !== undefined ? data[key] : match;
    });
  }

  class DMTem {
    #tem;
    #data = {};

    constructor(target) {
      const el = isElement(target) ? target : FindTags(target);
      if (!el) throw new Error("The template does not exist.");
      if (isList(el)) throw new Error("There must be only one template.");
      this.#tem = el;
    }

    attr(data) {
      if (!isTem(this)) throw new TypeError("Method DMTem.prototype.attr called on incompatible receiver #<DMTem>");
      if (!isObject(data) && !Array.isArray(data)) {
        throw new Error("Attributes must be an Object or an Array of Objects.");
      }
      this.#data = data;
      return this;
    }

    #resolveTarget(place) {
      if (isElement(place)) return place;
      if (isDM(place) && place.length > 0) return place[0];
      if (isString(place)) {
        const el = FindTags(place);
        return isList(el) ? el[0] : el;
      }
      return null;
    }

    mount(place, position = "beforeend") {
      const targetEl = this.#resolveTarget(place);
      if (!targetEl) return this;

      const htmlString = this.#tem.innerHTML;

      if (Array.isArray(this.#data)) {
        const combinedHTML = this.#data
          .map(item => renderTemplate(htmlString, item))
          .join("");
        targetEl.insertAdjacentHTML(position, combinedHTML);
      } else {
        const singleHTML = renderTemplate(htmlString, this.#data);
        targetEl.insertAdjacentHTML(position, singleHTML);
      }

      return this;
    }
  }

  domaster.tem = function(target){
    return new DMTem(target);
  }

  const escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };

  domaster.escape = function(str){
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, match => escapeMap[match]);
  }

  domaster.prototype = DM.prototype;
  domaster.tem.prototype = DMTem.prototype;

  domaster.do = function(fn){
    if (!isFunction(fn)) return;
    if (ready) return void fn(main);
    document.addEventListener("DOMContentLoaded",function(){
      fn(main);
    });
  };

  const handler = {
    get(target, prop){
      if(Reflect.has(target, prop)) return Reflect.get(target, prop);
      return new DM(FindTags(prop));
    }
  };
  const main = new Proxy(domaster, handler);
  return main;
});