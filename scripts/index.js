var index = (function () {
  'use strict';

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = _getPrototypeOf(object);
      if (object === null) break;
    }

    return object;
  }

  function _get(target, property, receiver) {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      _get = Reflect.get;
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);

        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);

        if (desc.get) {
          return desc.get.call(receiver);
        }

        return desc.value;
      };
    }

    return _get(target, property, receiver || target);
  }

  function _toArray(arr) {
    return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }

  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];

    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }

    return (hint === "string" ? String : Number)(input);
  }

  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");

    return typeof key === "symbol" ? key : String(key);
  }

  function _decorate(decorators, factory, superClass, mixins) {
    var api = _getDecoratorsApi();

    if (mixins) {
      for (var i = 0; i < mixins.length; i++) {
        api = mixins[i](api);
      }
    }

    var r = factory(function initialize(O) {
      api.initializeInstanceElements(O, decorated.elements);
    }, superClass);
    var decorated = api.decorateClass(_coalesceClassElements(r.d.map(_createElementDescriptor)), decorators);
    api.initializeClassElements(r.F, decorated.elements);
    return api.runClassFinishers(r.F, decorated.finishers);
  }

  function _getDecoratorsApi() {
    _getDecoratorsApi = function () {
      return api;
    };

    var api = {
      elementsDefinitionOrder: [["method"], ["field"]],
      initializeInstanceElements: function (O, elements) {
        ["method", "field"].forEach(function (kind) {
          elements.forEach(function (element) {
            if (element.kind === kind && element.placement === "own") {
              this.defineClassElement(O, element);
            }
          }, this);
        }, this);
      },
      initializeClassElements: function (F, elements) {
        var proto = F.prototype;
        ["method", "field"].forEach(function (kind) {
          elements.forEach(function (element) {
            var placement = element.placement;

            if (element.kind === kind && (placement === "static" || placement === "prototype")) {
              var receiver = placement === "static" ? F : proto;
              this.defineClassElement(receiver, element);
            }
          }, this);
        }, this);
      },
      defineClassElement: function (receiver, element) {
        var descriptor = element.descriptor;

        if (element.kind === "field") {
          var initializer = element.initializer;
          descriptor = {
            enumerable: descriptor.enumerable,
            writable: descriptor.writable,
            configurable: descriptor.configurable,
            value: initializer === void 0 ? void 0 : initializer.call(receiver)
          };
        }

        Object.defineProperty(receiver, element.key, descriptor);
      },
      decorateClass: function (elements, decorators) {
        var newElements = [];
        var finishers = [];
        var placements = {
          static: [],
          prototype: [],
          own: []
        };
        elements.forEach(function (element) {
          this.addElementPlacement(element, placements);
        }, this);
        elements.forEach(function (element) {
          if (!_hasDecorators(element)) return newElements.push(element);
          var elementFinishersExtras = this.decorateElement(element, placements);
          newElements.push(elementFinishersExtras.element);
          newElements.push.apply(newElements, elementFinishersExtras.extras);
          finishers.push.apply(finishers, elementFinishersExtras.finishers);
        }, this);

        if (!decorators) {
          return {
            elements: newElements,
            finishers: finishers
          };
        }

        var result = this.decorateConstructor(newElements, decorators);
        finishers.push.apply(finishers, result.finishers);
        result.finishers = finishers;
        return result;
      },
      addElementPlacement: function (element, placements, silent) {
        var keys = placements[element.placement];

        if (!silent && keys.indexOf(element.key) !== -1) {
          throw new TypeError("Duplicated element (" + element.key + ")");
        }

        keys.push(element.key);
      },
      decorateElement: function (element, placements) {
        var extras = [];
        var finishers = [];

        for (var decorators = element.decorators, i = decorators.length - 1; i >= 0; i--) {
          var keys = placements[element.placement];
          keys.splice(keys.indexOf(element.key), 1);
          var elementObject = this.fromElementDescriptor(element);
          var elementFinisherExtras = this.toElementFinisherExtras((0, decorators[i])(elementObject) || elementObject);
          element = elementFinisherExtras.element;
          this.addElementPlacement(element, placements);

          if (elementFinisherExtras.finisher) {
            finishers.push(elementFinisherExtras.finisher);
          }

          var newExtras = elementFinisherExtras.extras;

          if (newExtras) {
            for (var j = 0; j < newExtras.length; j++) {
              this.addElementPlacement(newExtras[j], placements);
            }

            extras.push.apply(extras, newExtras);
          }
        }

        return {
          element: element,
          finishers: finishers,
          extras: extras
        };
      },
      decorateConstructor: function (elements, decorators) {
        var finishers = [];

        for (var i = decorators.length - 1; i >= 0; i--) {
          var obj = this.fromClassDescriptor(elements);
          var elementsAndFinisher = this.toClassDescriptor((0, decorators[i])(obj) || obj);

          if (elementsAndFinisher.finisher !== undefined) {
            finishers.push(elementsAndFinisher.finisher);
          }

          if (elementsAndFinisher.elements !== undefined) {
            elements = elementsAndFinisher.elements;

            for (var j = 0; j < elements.length - 1; j++) {
              for (var k = j + 1; k < elements.length; k++) {
                if (elements[j].key === elements[k].key && elements[j].placement === elements[k].placement) {
                  throw new TypeError("Duplicated element (" + elements[j].key + ")");
                }
              }
            }
          }
        }

        return {
          elements: elements,
          finishers: finishers
        };
      },
      fromElementDescriptor: function (element) {
        var obj = {
          kind: element.kind,
          key: element.key,
          placement: element.placement,
          descriptor: element.descriptor
        };
        var desc = {
          value: "Descriptor",
          configurable: true
        };
        Object.defineProperty(obj, Symbol.toStringTag, desc);
        if (element.kind === "field") obj.initializer = element.initializer;
        return obj;
      },
      toElementDescriptors: function (elementObjects) {
        if (elementObjects === undefined) return;
        return _toArray(elementObjects).map(function (elementObject) {
          var element = this.toElementDescriptor(elementObject);
          this.disallowProperty(elementObject, "finisher", "An element descriptor");
          this.disallowProperty(elementObject, "extras", "An element descriptor");
          return element;
        }, this);
      },
      toElementDescriptor: function (elementObject) {
        var kind = String(elementObject.kind);

        if (kind !== "method" && kind !== "field") {
          throw new TypeError('An element descriptor\'s .kind property must be either "method" or' + ' "field", but a decorator created an element descriptor with' + ' .kind "' + kind + '"');
        }

        var key = _toPropertyKey(elementObject.key);

        var placement = String(elementObject.placement);

        if (placement !== "static" && placement !== "prototype" && placement !== "own") {
          throw new TypeError('An element descriptor\'s .placement property must be one of "static",' + ' "prototype" or "own", but a decorator created an element descriptor' + ' with .placement "' + placement + '"');
        }

        var descriptor = elementObject.descriptor;
        this.disallowProperty(elementObject, "elements", "An element descriptor");
        var element = {
          kind: kind,
          key: key,
          placement: placement,
          descriptor: Object.assign({}, descriptor)
        };

        if (kind !== "field") {
          this.disallowProperty(elementObject, "initializer", "A method descriptor");
        } else {
          this.disallowProperty(descriptor, "get", "The property descriptor of a field descriptor");
          this.disallowProperty(descriptor, "set", "The property descriptor of a field descriptor");
          this.disallowProperty(descriptor, "value", "The property descriptor of a field descriptor");
          element.initializer = elementObject.initializer;
        }

        return element;
      },
      toElementFinisherExtras: function (elementObject) {
        var element = this.toElementDescriptor(elementObject);

        var finisher = _optionalCallableProperty(elementObject, "finisher");

        var extras = this.toElementDescriptors(elementObject.extras);
        return {
          element: element,
          finisher: finisher,
          extras: extras
        };
      },
      fromClassDescriptor: function (elements) {
        var obj = {
          kind: "class",
          elements: elements.map(this.fromElementDescriptor, this)
        };
        var desc = {
          value: "Descriptor",
          configurable: true
        };
        Object.defineProperty(obj, Symbol.toStringTag, desc);
        return obj;
      },
      toClassDescriptor: function (obj) {
        var kind = String(obj.kind);

        if (kind !== "class") {
          throw new TypeError('A class descriptor\'s .kind property must be "class", but a decorator' + ' created a class descriptor with .kind "' + kind + '"');
        }

        this.disallowProperty(obj, "key", "A class descriptor");
        this.disallowProperty(obj, "placement", "A class descriptor");
        this.disallowProperty(obj, "descriptor", "A class descriptor");
        this.disallowProperty(obj, "initializer", "A class descriptor");
        this.disallowProperty(obj, "extras", "A class descriptor");

        var finisher = _optionalCallableProperty(obj, "finisher");

        var elements = this.toElementDescriptors(obj.elements);
        return {
          elements: elements,
          finisher: finisher
        };
      },
      runClassFinishers: function (constructor, finishers) {
        for (var i = 0; i < finishers.length; i++) {
          var newConstructor = (0, finishers[i])(constructor);

          if (newConstructor !== undefined) {
            if (typeof newConstructor !== "function") {
              throw new TypeError("Finishers must return a constructor.");
            }

            constructor = newConstructor;
          }
        }

        return constructor;
      },
      disallowProperty: function (obj, name, objectType) {
        if (obj[name] !== undefined) {
          throw new TypeError(objectType + " can't have a ." + name + " property.");
        }
      }
    };
    return api;
  }

  function _createElementDescriptor(def) {
    var key = _toPropertyKey(def.key);

    var descriptor;

    if (def.kind === "method") {
      descriptor = {
        value: def.value,
        writable: true,
        configurable: true,
        enumerable: false
      };
    } else if (def.kind === "get") {
      descriptor = {
        get: def.value,
        configurable: true,
        enumerable: false
      };
    } else if (def.kind === "set") {
      descriptor = {
        set: def.value,
        configurable: true,
        enumerable: false
      };
    } else if (def.kind === "field") {
      descriptor = {
        configurable: true,
        writable: true,
        enumerable: true
      };
    }

    var element = {
      kind: def.kind === "field" ? "field" : "method",
      key: key,
      placement: def.static ? "static" : def.kind === "field" ? "own" : "prototype",
      descriptor: descriptor
    };
    if (def.decorators) element.decorators = def.decorators;
    if (def.kind === "field") element.initializer = def.value;
    return element;
  }

  function _coalesceGetterSetter(element, other) {
    if (element.descriptor.get !== undefined) {
      other.descriptor.get = element.descriptor.get;
    } else {
      other.descriptor.set = element.descriptor.set;
    }
  }

  function _coalesceClassElements(elements) {
    var newElements = [];

    var isSameElement = function (other) {
      return other.kind === "method" && other.key === element.key && other.placement === element.placement;
    };

    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      var other;

      if (element.kind === "method" && (other = newElements.find(isSameElement))) {
        if (_isDataDescriptor(element.descriptor) || _isDataDescriptor(other.descriptor)) {
          if (_hasDecorators(element) || _hasDecorators(other)) {
            throw new ReferenceError("Duplicated methods (" + element.key + ") can't be decorated.");
          }

          other.descriptor = element.descriptor;
        } else {
          if (_hasDecorators(element)) {
            if (_hasDecorators(other)) {
              throw new ReferenceError("Decorators can't be placed on different accessors with for " + "the same property (" + element.key + ").");
            }

            other.decorators = element.decorators;
          }

          _coalesceGetterSetter(element, other);
        }
      } else {
        newElements.push(element);
      }
    }

    return newElements;
  }

  function _hasDecorators(element) {
    return element.decorators && element.decorators.length;
  }

  function _isDataDescriptor(desc) {
    return desc !== undefined && !(desc.value === undefined && desc.writable === undefined);
  }

  function _optionalCallableProperty(obj, name) {
    var value = obj[name];

    if (value !== undefined && typeof value !== "function") {
      throw new TypeError("Expected '" + name + "' to be a function");
    }

    return value;
  }

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  const directives = new WeakMap();
  const isDirective = (o) => {
      return typeof o === 'function' && directives.has(o);
  };

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  /**
   * True if the custom elements polyfill is in use.
   */
  const isCEPolyfill = window.customElements !== undefined &&
      window.customElements.polyfillWrapFlushCallback !==
          undefined;
  /**
   * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
   * `container`.
   */
  const removeNodes = (container, start, end = null) => {
      while (start !== end) {
          const n = start.nextSibling;
          container.removeChild(start);
          start = n;
      }
  };

  /**
   * @license
   * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  /**
   * A sentinel value that signals that a value was handled by a directive and
   * should not be written to the DOM.
   */
  const noChange = {};
  /**
   * A sentinel value that signals a NodePart to fully clear its content.
   */
  const nothing = {};

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  /**
   * An expression marker with embedded unique key to avoid collision with
   * possible text in templates.
   */
  const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
  /**
   * An expression marker used text-positions, multi-binding attributes, and
   * attributes with markup-like text values.
   */
  const nodeMarker = `<!--${marker}-->`;
  const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
  /**
   * Suffix appended to all bound attribute names.
   */
  const boundAttributeSuffix = '$lit$';
  /**
   * An updateable Template that tracks the location of dynamic parts.
   */
  class Template {
      constructor(result, element) {
          this.parts = [];
          this.element = element;
          const nodesToRemove = [];
          const stack = [];
          // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
          const walker = document.createTreeWalker(element.content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
          // Keeps track of the last index associated with a part. We try to delete
          // unnecessary nodes, but we never want to associate two different parts
          // to the same index. They must have a constant node between.
          let lastPartIndex = 0;
          let index = -1;
          let partIndex = 0;
          const { strings, values: { length } } = result;
          while (partIndex < length) {
              const node = walker.nextNode();
              if (node === null) {
                  // We've exhausted the content inside a nested template element.
                  // Because we still have parts (the outer for-loop), we know:
                  // - There is a template in the stack
                  // - The walker will find a nextNode outside the template
                  walker.currentNode = stack.pop();
                  continue;
              }
              index++;
              if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                  if (node.hasAttributes()) {
                      const attributes = node.attributes;
                      const { length } = attributes;
                      // Per
                      // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                      // attributes are not guaranteed to be returned in document order.
                      // In particular, Edge/IE can return them out of order, so we cannot
                      // assume a correspondence between part index and attribute index.
                      let count = 0;
                      for (let i = 0; i < length; i++) {
                          if (endsWith(attributes[i].name, boundAttributeSuffix)) {
                              count++;
                          }
                      }
                      while (count-- > 0) {
                          // Get the template literal section leading up to the first
                          // expression in this attribute
                          const stringForPart = strings[partIndex];
                          // Find the attribute name
                          const name = lastAttributeNameRegex.exec(stringForPart)[2];
                          // Find the corresponding attribute
                          // All bound attributes have had a suffix added in
                          // TemplateResult#getHTML to opt out of special attribute
                          // handling. To look up the attribute value we also need to add
                          // the suffix.
                          const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                          const attributeValue = node.getAttribute(attributeLookupName);
                          node.removeAttribute(attributeLookupName);
                          const statics = attributeValue.split(markerRegex);
                          this.parts.push({ type: 'attribute', index, name, strings: statics });
                          partIndex += statics.length - 1;
                      }
                  }
                  if (node.tagName === 'TEMPLATE') {
                      stack.push(node);
                      walker.currentNode = node.content;
                  }
              }
              else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                  const data = node.data;
                  if (data.indexOf(marker) >= 0) {
                      const parent = node.parentNode;
                      const strings = data.split(markerRegex);
                      const lastIndex = strings.length - 1;
                      // Generate a new text node for each literal section
                      // These nodes are also used as the markers for node parts
                      for (let i = 0; i < lastIndex; i++) {
                          let insert;
                          let s = strings[i];
                          if (s === '') {
                              insert = createMarker();
                          }
                          else {
                              const match = lastAttributeNameRegex.exec(s);
                              if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                                  s = s.slice(0, match.index) + match[1] +
                                      match[2].slice(0, -boundAttributeSuffix.length) + match[3];
                              }
                              insert = document.createTextNode(s);
                          }
                          parent.insertBefore(insert, node);
                          this.parts.push({ type: 'node', index: ++index });
                      }
                      // If there's no text, we must insert a comment to mark our place.
                      // Else, we can trust it will stick around after cloning.
                      if (strings[lastIndex] === '') {
                          parent.insertBefore(createMarker(), node);
                          nodesToRemove.push(node);
                      }
                      else {
                          node.data = strings[lastIndex];
                      }
                      // We have a part for each match found
                      partIndex += lastIndex;
                  }
              }
              else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                  if (node.data === marker) {
                      const parent = node.parentNode;
                      // Add a new marker node to be the startNode of the Part if any of
                      // the following are true:
                      //  * We don't have a previousSibling
                      //  * The previousSibling is already the start of a previous part
                      if (node.previousSibling === null || index === lastPartIndex) {
                          index++;
                          parent.insertBefore(createMarker(), node);
                      }
                      lastPartIndex = index;
                      this.parts.push({ type: 'node', index });
                      // If we don't have a nextSibling, keep this node so we have an end.
                      // Else, we can remove it to save future costs.
                      if (node.nextSibling === null) {
                          node.data = '';
                      }
                      else {
                          nodesToRemove.push(node);
                          index--;
                      }
                      partIndex++;
                  }
                  else {
                      let i = -1;
                      while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                          // Comment node has a binding marker inside, make an inactive part
                          // The binding won't work, but subsequent bindings will
                          // TODO (justinfagnani): consider whether it's even worth it to
                          // make bindings in comments work
                          this.parts.push({ type: 'node', index: -1 });
                          partIndex++;
                      }
                  }
              }
          }
          // Remove text binding nodes after the walk to not disturb the TreeWalker
          for (const n of nodesToRemove) {
              n.parentNode.removeChild(n);
          }
      }
  }
  const endsWith = (str, suffix) => {
      const index = str.length - suffix.length;
      return index >= 0 && str.slice(index) === suffix;
  };
  const isTemplatePartActive = (part) => part.index !== -1;
  // Allows `document.createComment('')` to be renamed for a
  // small manual size-savings.
  const createMarker = () => document.createComment('');
  /**
   * This regex extracts the attribute name preceding an attribute-position
   * expression. It does this by matching the syntax allowed for attributes
   * against the string literal directly preceding the expression, assuming that
   * the expression is in an attribute-value position.
   *
   * See attributes in the HTML spec:
   * https://www.w3.org/TR/html5/syntax.html#elements-attributes
   *
   * " \x09\x0a\x0c\x0d" are HTML space characters:
   * https://www.w3.org/TR/html5/infrastructure.html#space-characters
   *
   * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
   * space character except " ".
   *
   * So an attribute is:
   *  * The name: any character except a control character, space character, ('),
   *    ("), ">", "=", or "/"
   *  * Followed by zero or more space characters
   *  * Followed by "="
   *  * Followed by zero or more space characters
   *  * Followed by:
   *    * Any character except space, ('), ("), "<", ">", "=", (`), or
   *    * (") then any non-("), or
   *    * (') then any non-(')
   */
  const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  /**
   * An instance of a `Template` that can be attached to the DOM and updated
   * with new values.
   */
  class TemplateInstance {
      constructor(template, processor, options) {
          this.__parts = [];
          this.template = template;
          this.processor = processor;
          this.options = options;
      }
      update(values) {
          let i = 0;
          for (const part of this.__parts) {
              if (part !== undefined) {
                  part.setValue(values[i]);
              }
              i++;
          }
          for (const part of this.__parts) {
              if (part !== undefined) {
                  part.commit();
              }
          }
      }
      _clone() {
          // There are a number of steps in the lifecycle of a template instance's
          // DOM fragment:
          //  1. Clone - create the instance fragment
          //  2. Adopt - adopt into the main document
          //  3. Process - find part markers and create parts
          //  4. Upgrade - upgrade custom elements
          //  5. Update - set node, attribute, property, etc., values
          //  6. Connect - connect to the document. Optional and outside of this
          //     method.
          //
          // We have a few constraints on the ordering of these steps:
          //  * We need to upgrade before updating, so that property values will pass
          //    through any property setters.
          //  * We would like to process before upgrading so that we're sure that the
          //    cloned fragment is inert and not disturbed by self-modifying DOM.
          //  * We want custom elements to upgrade even in disconnected fragments.
          //
          // Given these constraints, with full custom elements support we would
          // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
          //
          // But Safari dooes not implement CustomElementRegistry#upgrade, so we
          // can not implement that order and still have upgrade-before-update and
          // upgrade disconnected fragments. So we instead sacrifice the
          // process-before-upgrade constraint, since in Custom Elements v1 elements
          // must not modify their light DOM in the constructor. We still have issues
          // when co-existing with CEv0 elements like Polymer 1, and with polyfills
          // that don't strictly adhere to the no-modification rule because shadow
          // DOM, which may be created in the constructor, is emulated by being placed
          // in the light DOM.
          //
          // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
          // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
          // in one step.
          //
          // The Custom Elements v1 polyfill supports upgrade(), so the order when
          // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
          // Connect.
          const fragment = isCEPolyfill ?
              this.template.element.content.cloneNode(true) :
              document.importNode(this.template.element.content, true);
          const stack = [];
          const parts = this.template.parts;
          // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
          const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
          let partIndex = 0;
          let nodeIndex = 0;
          let part;
          let node = walker.nextNode();
          // Loop through all the nodes and parts of a template
          while (partIndex < parts.length) {
              part = parts[partIndex];
              if (!isTemplatePartActive(part)) {
                  this.__parts.push(undefined);
                  partIndex++;
                  continue;
              }
              // Progress the tree walker until we find our next part's node.
              // Note that multiple parts may share the same node (attribute parts
              // on a single element), so this loop may not run at all.
              while (nodeIndex < part.index) {
                  nodeIndex++;
                  if (node.nodeName === 'TEMPLATE') {
                      stack.push(node);
                      walker.currentNode = node.content;
                  }
                  if ((node = walker.nextNode()) === null) {
                      // We've exhausted the content inside a nested template element.
                      // Because we still have parts (the outer for-loop), we know:
                      // - There is a template in the stack
                      // - The walker will find a nextNode outside the template
                      walker.currentNode = stack.pop();
                      node = walker.nextNode();
                  }
              }
              // We've arrived at our part's node.
              if (part.type === 'node') {
                  const part = this.processor.handleTextExpression(this.options);
                  part.insertAfterNode(node.previousSibling);
                  this.__parts.push(part);
              }
              else {
                  this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
              }
              partIndex++;
          }
          if (isCEPolyfill) {
              document.adoptNode(fragment);
              customElements.upgrade(fragment);
          }
          return fragment;
      }
  }

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  const commentMarker = ` ${marker} `;
  /**
   * The return type of `html`, which holds a Template and the values from
   * interpolated expressions.
   */
  class TemplateResult {
      constructor(strings, values, type, processor) {
          this.strings = strings;
          this.values = values;
          this.type = type;
          this.processor = processor;
      }
      /**
       * Returns a string of HTML used to create a `<template>` element.
       */
      getHTML() {
          const l = this.strings.length - 1;
          let html = '';
          let isCommentBinding = false;
          for (let i = 0; i < l; i++) {
              const s = this.strings[i];
              // For each binding we want to determine the kind of marker to insert
              // into the template source before it's parsed by the browser's HTML
              // parser. The marker type is based on whether the expression is in an
              // attribute, text, or comment poisition.
              //   * For node-position bindings we insert a comment with the marker
              //     sentinel as its text content, like <!--{{lit-guid}}-->.
              //   * For attribute bindings we insert just the marker sentinel for the
              //     first binding, so that we support unquoted attribute bindings.
              //     Subsequent bindings can use a comment marker because multi-binding
              //     attributes must be quoted.
              //   * For comment bindings we insert just the marker sentinel so we don't
              //     close the comment.
              //
              // The following code scans the template source, but is *not* an HTML
              // parser. We don't need to track the tree structure of the HTML, only
              // whether a binding is inside a comment, and if not, if it appears to be
              // the first binding in an attribute.
              const commentOpen = s.lastIndexOf('<!--');
              // We're in comment position if we have a comment open with no following
              // comment close. Because <-- can appear in an attribute value there can
              // be false positives.
              isCommentBinding = (commentOpen > -1 || isCommentBinding) &&
                  s.indexOf('-->', commentOpen + 1) === -1;
              // Check to see if we have an attribute-like sequence preceeding the
              // expression. This can match "name=value" like structures in text,
              // comments, and attribute values, so there can be false-positives.
              const attributeMatch = lastAttributeNameRegex.exec(s);
              if (attributeMatch === null) {
                  // We're only in this branch if we don't have a attribute-like
                  // preceeding sequence. For comments, this guards against unusual
                  // attribute values like <div foo="<!--${'bar'}">. Cases like
                  // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
                  // below.
                  html += s + (isCommentBinding ? commentMarker : nodeMarker);
              }
              else {
                  // For attributes we use just a marker sentinel, and also append a
                  // $lit$ suffix to the name to opt-out of attribute-specific parsing
                  // that IE and Edge do for style and certain SVG attributes.
                  html += s.substr(0, attributeMatch.index) + attributeMatch[1] +
                      attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] +
                      marker;
              }
          }
          html += this.strings[l];
          return html;
      }
      getTemplateElement() {
          const template = document.createElement('template');
          template.innerHTML = this.getHTML();
          return template;
      }
  }

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  const isPrimitive = (value) => {
      return (value === null ||
          !(typeof value === 'object' || typeof value === 'function'));
  };
  const isIterable = (value) => {
      return Array.isArray(value) ||
          // tslint:disable-next-line:no-any
          !!(value && value[Symbol.iterator]);
  };
  /**
   * Writes attribute values to the DOM for a group of AttributeParts bound to a
   * single attibute. The value is only set once even if there are multiple parts
   * for an attribute.
   */
  class AttributeCommitter {
      constructor(element, name, strings) {
          this.dirty = true;
          this.element = element;
          this.name = name;
          this.strings = strings;
          this.parts = [];
          for (let i = 0; i < strings.length - 1; i++) {
              this.parts[i] = this._createPart();
          }
      }
      /**
       * Creates a single part. Override this to create a differnt type of part.
       */
      _createPart() {
          return new AttributePart(this);
      }
      _getValue() {
          const strings = this.strings;
          const l = strings.length - 1;
          let text = '';
          for (let i = 0; i < l; i++) {
              text += strings[i];
              const part = this.parts[i];
              if (part !== undefined) {
                  const v = part.value;
                  if (isPrimitive(v) || !isIterable(v)) {
                      text += typeof v === 'string' ? v : String(v);
                  }
                  else {
                      for (const t of v) {
                          text += typeof t === 'string' ? t : String(t);
                      }
                  }
              }
          }
          text += strings[l];
          return text;
      }
      commit() {
          if (this.dirty) {
              this.dirty = false;
              this.element.setAttribute(this.name, this._getValue());
          }
      }
  }
  /**
   * A Part that controls all or part of an attribute value.
   */
  class AttributePart {
      constructor(committer) {
          this.value = undefined;
          this.committer = committer;
      }
      setValue(value) {
          if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
              this.value = value;
              // If the value is a not a directive, dirty the committer so that it'll
              // call setAttribute. If the value is a directive, it'll dirty the
              // committer if it calls setValue().
              if (!isDirective(value)) {
                  this.committer.dirty = true;
              }
          }
      }
      commit() {
          while (isDirective(this.value)) {
              const directive = this.value;
              this.value = noChange;
              directive(this);
          }
          if (this.value === noChange) {
              return;
          }
          this.committer.commit();
      }
  }
  /**
   * A Part that controls a location within a Node tree. Like a Range, NodePart
   * has start and end locations and can set and update the Nodes between those
   * locations.
   *
   * NodeParts support several value types: primitives, Nodes, TemplateResults,
   * as well as arrays and iterables of those types.
   */
  class NodePart {
      constructor(options) {
          this.value = undefined;
          this.__pendingValue = undefined;
          this.options = options;
      }
      /**
       * Appends this part into a container.
       *
       * This part must be empty, as its contents are not automatically moved.
       */
      appendInto(container) {
          this.startNode = container.appendChild(createMarker());
          this.endNode = container.appendChild(createMarker());
      }
      /**
       * Inserts this part after the `ref` node (between `ref` and `ref`'s next
       * sibling). Both `ref` and its next sibling must be static, unchanging nodes
       * such as those that appear in a literal section of a template.
       *
       * This part must be empty, as its contents are not automatically moved.
       */
      insertAfterNode(ref) {
          this.startNode = ref;
          this.endNode = ref.nextSibling;
      }
      /**
       * Appends this part into a parent part.
       *
       * This part must be empty, as its contents are not automatically moved.
       */
      appendIntoPart(part) {
          part.__insert(this.startNode = createMarker());
          part.__insert(this.endNode = createMarker());
      }
      /**
       * Inserts this part after the `ref` part.
       *
       * This part must be empty, as its contents are not automatically moved.
       */
      insertAfterPart(ref) {
          ref.__insert(this.startNode = createMarker());
          this.endNode = ref.endNode;
          ref.endNode = this.startNode;
      }
      setValue(value) {
          this.__pendingValue = value;
      }
      commit() {
          while (isDirective(this.__pendingValue)) {
              const directive = this.__pendingValue;
              this.__pendingValue = noChange;
              directive(this);
          }
          const value = this.__pendingValue;
          if (value === noChange) {
              return;
          }
          if (isPrimitive(value)) {
              if (value !== this.value) {
                  this.__commitText(value);
              }
          }
          else if (value instanceof TemplateResult) {
              this.__commitTemplateResult(value);
          }
          else if (value instanceof Node) {
              this.__commitNode(value);
          }
          else if (isIterable(value)) {
              this.__commitIterable(value);
          }
          else if (value === nothing) {
              this.value = nothing;
              this.clear();
          }
          else {
              // Fallback, will render the string representation
              this.__commitText(value);
          }
      }
      __insert(node) {
          this.endNode.parentNode.insertBefore(node, this.endNode);
      }
      __commitNode(value) {
          if (this.value === value) {
              return;
          }
          this.clear();
          this.__insert(value);
          this.value = value;
      }
      __commitText(value) {
          const node = this.startNode.nextSibling;
          value = value == null ? '' : value;
          // If `value` isn't already a string, we explicitly convert it here in case
          // it can't be implicitly converted - i.e. it's a symbol.
          const valueAsString = typeof value === 'string' ? value : String(value);
          if (node === this.endNode.previousSibling &&
              node.nodeType === 3 /* Node.TEXT_NODE */) {
              // If we only have a single text node between the markers, we can just
              // set its value, rather than replacing it.
              // TODO(justinfagnani): Can we just check if this.value is primitive?
              node.data = valueAsString;
          }
          else {
              this.__commitNode(document.createTextNode(valueAsString));
          }
          this.value = value;
      }
      __commitTemplateResult(value) {
          const template = this.options.templateFactory(value);
          if (this.value instanceof TemplateInstance &&
              this.value.template === template) {
              this.value.update(value.values);
          }
          else {
              // Make sure we propagate the template processor from the TemplateResult
              // so that we use its syntax extension, etc. The template factory comes
              // from the render function options so that it can control template
              // caching and preprocessing.
              const instance = new TemplateInstance(template, value.processor, this.options);
              const fragment = instance._clone();
              instance.update(value.values);
              this.__commitNode(fragment);
              this.value = instance;
          }
      }
      __commitIterable(value) {
          // For an Iterable, we create a new InstancePart per item, then set its
          // value to the item. This is a little bit of overhead for every item in
          // an Iterable, but it lets us recurse easily and efficiently update Arrays
          // of TemplateResults that will be commonly returned from expressions like:
          // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
          // If _value is an array, then the previous render was of an
          // iterable and _value will contain the NodeParts from the previous
          // render. If _value is not an array, clear this part and make a new
          // array for NodeParts.
          if (!Array.isArray(this.value)) {
              this.value = [];
              this.clear();
          }
          // Lets us keep track of how many items we stamped so we can clear leftover
          // items from a previous render
          const itemParts = this.value;
          let partIndex = 0;
          let itemPart;
          for (const item of value) {
              // Try to reuse an existing part
              itemPart = itemParts[partIndex];
              // If no existing part, create a new one
              if (itemPart === undefined) {
                  itemPart = new NodePart(this.options);
                  itemParts.push(itemPart);
                  if (partIndex === 0) {
                      itemPart.appendIntoPart(this);
                  }
                  else {
                      itemPart.insertAfterPart(itemParts[partIndex - 1]);
                  }
              }
              itemPart.setValue(item);
              itemPart.commit();
              partIndex++;
          }
          if (partIndex < itemParts.length) {
              // Truncate the parts array so _value reflects the current state
              itemParts.length = partIndex;
              this.clear(itemPart && itemPart.endNode);
          }
      }
      clear(startNode = this.startNode) {
          removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
      }
  }
  /**
   * Implements a boolean attribute, roughly as defined in the HTML
   * specification.
   *
   * If the value is truthy, then the attribute is present with a value of
   * ''. If the value is falsey, the attribute is removed.
   */
  class BooleanAttributePart {
      constructor(element, name, strings) {
          this.value = undefined;
          this.__pendingValue = undefined;
          if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
              throw new Error('Boolean attributes can only contain a single expression');
          }
          this.element = element;
          this.name = name;
          this.strings = strings;
      }
      setValue(value) {
          this.__pendingValue = value;
      }
      commit() {
          while (isDirective(this.__pendingValue)) {
              const directive = this.__pendingValue;
              this.__pendingValue = noChange;
              directive(this);
          }
          if (this.__pendingValue === noChange) {
              return;
          }
          const value = !!this.__pendingValue;
          if (this.value !== value) {
              if (value) {
                  this.element.setAttribute(this.name, '');
              }
              else {
                  this.element.removeAttribute(this.name);
              }
              this.value = value;
          }
          this.__pendingValue = noChange;
      }
  }
  /**
   * Sets attribute values for PropertyParts, so that the value is only set once
   * even if there are multiple parts for a property.
   *
   * If an expression controls the whole property value, then the value is simply
   * assigned to the property under control. If there are string literals or
   * multiple expressions, then the strings are expressions are interpolated into
   * a string first.
   */
  class PropertyCommitter extends AttributeCommitter {
      constructor(element, name, strings) {
          super(element, name, strings);
          this.single =
              (strings.length === 2 && strings[0] === '' && strings[1] === '');
      }
      _createPart() {
          return new PropertyPart(this);
      }
      _getValue() {
          if (this.single) {
              return this.parts[0].value;
          }
          return super._getValue();
      }
      commit() {
          if (this.dirty) {
              this.dirty = false;
              // tslint:disable-next-line:no-any
              this.element[this.name] = this._getValue();
          }
      }
  }
  class PropertyPart extends AttributePart {
  }
  // Detect event listener options support. If the `capture` property is read
  // from the options object, then options are supported. If not, then the thrid
  // argument to add/removeEventListener is interpreted as the boolean capture
  // value so we should only pass the `capture` property.
  let eventOptionsSupported = false;
  try {
      const options = {
          get capture() {
              eventOptionsSupported = true;
              return false;
          }
      };
      // tslint:disable-next-line:no-any
      window.addEventListener('test', options, options);
      // tslint:disable-next-line:no-any
      window.removeEventListener('test', options, options);
  }
  catch (_e) {
  }
  class EventPart {
      constructor(element, eventName, eventContext) {
          this.value = undefined;
          this.__pendingValue = undefined;
          this.element = element;
          this.eventName = eventName;
          this.eventContext = eventContext;
          this.__boundHandleEvent = (e) => this.handleEvent(e);
      }
      setValue(value) {
          this.__pendingValue = value;
      }
      commit() {
          while (isDirective(this.__pendingValue)) {
              const directive = this.__pendingValue;
              this.__pendingValue = noChange;
              directive(this);
          }
          if (this.__pendingValue === noChange) {
              return;
          }
          const newListener = this.__pendingValue;
          const oldListener = this.value;
          const shouldRemoveListener = newListener == null ||
              oldListener != null &&
                  (newListener.capture !== oldListener.capture ||
                      newListener.once !== oldListener.once ||
                      newListener.passive !== oldListener.passive);
          const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
          if (shouldRemoveListener) {
              this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
          }
          if (shouldAddListener) {
              this.__options = getOptions(newListener);
              this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
          }
          this.value = newListener;
          this.__pendingValue = noChange;
      }
      handleEvent(event) {
          if (typeof this.value === 'function') {
              this.value.call(this.eventContext || this.element, event);
          }
          else {
              this.value.handleEvent(event);
          }
      }
  }
  // We copy options because of the inconsistent behavior of browsers when reading
  // the third argument of add/removeEventListener. IE11 doesn't support options
  // at all. Chrome 41 only reads `capture` if the argument is an object.
  const getOptions = (o) => o &&
      (eventOptionsSupported ?
          { capture: o.capture, passive: o.passive, once: o.once } :
          o.capture);

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  /**
   * Creates Parts when a template is instantiated.
   */
  class DefaultTemplateProcessor {
      /**
       * Create parts for an attribute-position binding, given the event, attribute
       * name, and string literals.
       *
       * @param element The element containing the binding
       * @param name  The attribute name
       * @param strings The string literals. There are always at least two strings,
       *   event for fully-controlled bindings with a single expression.
       */
      handleAttributeExpressions(element, name, strings, options) {
          const prefix = name[0];
          if (prefix === '.') {
              const committer = new PropertyCommitter(element, name.slice(1), strings);
              return committer.parts;
          }
          if (prefix === '@') {
              return [new EventPart(element, name.slice(1), options.eventContext)];
          }
          if (prefix === '?') {
              return [new BooleanAttributePart(element, name.slice(1), strings)];
          }
          const committer = new AttributeCommitter(element, name, strings);
          return committer.parts;
      }
      /**
       * Create parts for a text-position binding.
       * @param templateFactory
       */
      handleTextExpression(options) {
          return new NodePart(options);
      }
  }
  const defaultTemplateProcessor = new DefaultTemplateProcessor();

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  /**
   * The default TemplateFactory which caches Templates keyed on
   * result.type and result.strings.
   */
  function templateFactory(result) {
      let templateCache = templateCaches.get(result.type);
      if (templateCache === undefined) {
          templateCache = {
              stringsArray: new WeakMap(),
              keyString: new Map()
          };
          templateCaches.set(result.type, templateCache);
      }
      let template = templateCache.stringsArray.get(result.strings);
      if (template !== undefined) {
          return template;
      }
      // If the TemplateStringsArray is new, generate a key from the strings
      // This key is shared between all templates with identical content
      const key = result.strings.join(marker);
      // Check if we already have a Template for this key
      template = templateCache.keyString.get(key);
      if (template === undefined) {
          // If we have not seen this key before, create a new Template
          template = new Template(result, result.getTemplateElement());
          // Cache the Template for this key
          templateCache.keyString.set(key, template);
      }
      // Cache all future queries for this TemplateStringsArray
      templateCache.stringsArray.set(result.strings, template);
      return template;
  }
  const templateCaches = new Map();

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  const parts = new WeakMap();
  /**
   * Renders a template result or other value to a container.
   *
   * To update a container with new values, reevaluate the template literal and
   * call `render` with the new result.
   *
   * @param result Any value renderable by NodePart - typically a TemplateResult
   *     created by evaluating a template tag like `html` or `svg`.
   * @param container A DOM parent to render to. The entire contents are either
   *     replaced, or efficiently updated if the same result type was previous
   *     rendered there.
   * @param options RenderOptions for the entire render tree rendered to this
   *     container. Render options must *not* change between renders to the same
   *     container, as those changes will not effect previously rendered DOM.
   */
  const render = (result, container, options) => {
      let part = parts.get(container);
      if (part === undefined) {
          removeNodes(container, container.firstChild);
          parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
          part.appendInto(container);
      }
      part.setValue(result);
      part.commit();
  };

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  // IMPORTANT: do not change the property name or the assignment expression.
  // This line will be used in regexes to search for lit-html usage.
  // TODO(justinfagnani): inject version number at build time
  (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.1.2');
  /**
   * Interprets a template literal as an HTML template that can efficiently
   * render to and update a container.
   */
  const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  const walkerNodeFilter = 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */;
  /**
   * Removes the list of nodes from a Template safely. In addition to removing
   * nodes from the Template, the Template part indices are updated to match
   * the mutated Template DOM.
   *
   * As the template is walked the removal state is tracked and
   * part indices are adjusted as needed.
   *
   * div
   *   div#1 (remove) <-- start removing (removing node is div#1)
   *     div
   *       div#2 (remove)  <-- continue removing (removing node is still div#1)
   *         div
   * div <-- stop removing since previous sibling is the removing node (div#1,
   * removed 4 nodes)
   */
  function removeNodesFromTemplate(template, nodesToRemove) {
      const { element: { content }, parts } = template;
      const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
      let partIndex = nextActiveIndexInTemplateParts(parts);
      let part = parts[partIndex];
      let nodeIndex = -1;
      let removeCount = 0;
      const nodesToRemoveInTemplate = [];
      let currentRemovingNode = null;
      while (walker.nextNode()) {
          nodeIndex++;
          const node = walker.currentNode;
          // End removal if stepped past the removing node
          if (node.previousSibling === currentRemovingNode) {
              currentRemovingNode = null;
          }
          // A node to remove was found in the template
          if (nodesToRemove.has(node)) {
              nodesToRemoveInTemplate.push(node);
              // Track node we're removing
              if (currentRemovingNode === null) {
                  currentRemovingNode = node;
              }
          }
          // When removing, increment count by which to adjust subsequent part indices
          if (currentRemovingNode !== null) {
              removeCount++;
          }
          while (part !== undefined && part.index === nodeIndex) {
              // If part is in a removed node deactivate it by setting index to -1 or
              // adjust the index as needed.
              part.index = currentRemovingNode !== null ? -1 : part.index - removeCount;
              // go to the next active part.
              partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
              part = parts[partIndex];
          }
      }
      nodesToRemoveInTemplate.forEach((n) => n.parentNode.removeChild(n));
  }
  const countNodes = (node) => {
      let count = (node.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */) ? 0 : 1;
      const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);
      while (walker.nextNode()) {
          count++;
      }
      return count;
  };
  const nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
      for (let i = startIndex + 1; i < parts.length; i++) {
          const part = parts[i];
          if (isTemplatePartActive(part)) {
              return i;
          }
      }
      return -1;
  };
  /**
   * Inserts the given node into the Template, optionally before the given
   * refNode. In addition to inserting the node into the Template, the Template
   * part indices are updated to match the mutated Template DOM.
   */
  function insertNodeIntoTemplate(template, node, refNode = null) {
      const { element: { content }, parts } = template;
      // If there's no refNode, then put node at end of template.
      // No part indices need to be shifted in this case.
      if (refNode === null || refNode === undefined) {
          content.appendChild(node);
          return;
      }
      const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
      let partIndex = nextActiveIndexInTemplateParts(parts);
      let insertCount = 0;
      let walkerIndex = -1;
      while (walker.nextNode()) {
          walkerIndex++;
          const walkerNode = walker.currentNode;
          if (walkerNode === refNode) {
              insertCount = countNodes(node);
              refNode.parentNode.insertBefore(node, refNode);
          }
          while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
              // If we've inserted the node, simply adjust all subsequent parts
              if (insertCount > 0) {
                  while (partIndex !== -1) {
                      parts[partIndex].index += insertCount;
                      partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                  }
                  return;
              }
              partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
          }
      }
  }

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  // Get a key to lookup in `templateCaches`.
  const getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;
  let compatibleShadyCSSVersion = true;
  if (typeof window.ShadyCSS === 'undefined') {
      compatibleShadyCSSVersion = false;
  }
  else if (typeof window.ShadyCSS.prepareTemplateDom === 'undefined') {
      console.warn(`Incompatible ShadyCSS version detected. ` +
          `Please update to at least @webcomponents/webcomponentsjs@2.0.2 and ` +
          `@webcomponents/shadycss@1.3.1.`);
      compatibleShadyCSSVersion = false;
  }
  /**
   * Template factory which scopes template DOM using ShadyCSS.
   * @param scopeName {string}
   */
  const shadyTemplateFactory = (scopeName) => (result) => {
      const cacheKey = getTemplateCacheKey(result.type, scopeName);
      let templateCache = templateCaches.get(cacheKey);
      if (templateCache === undefined) {
          templateCache = {
              stringsArray: new WeakMap(),
              keyString: new Map()
          };
          templateCaches.set(cacheKey, templateCache);
      }
      let template = templateCache.stringsArray.get(result.strings);
      if (template !== undefined) {
          return template;
      }
      const key = result.strings.join(marker);
      template = templateCache.keyString.get(key);
      if (template === undefined) {
          const element = result.getTemplateElement();
          if (compatibleShadyCSSVersion) {
              window.ShadyCSS.prepareTemplateDom(element, scopeName);
          }
          template = new Template(result, element);
          templateCache.keyString.set(key, template);
      }
      templateCache.stringsArray.set(result.strings, template);
      return template;
  };
  const TEMPLATE_TYPES = ['html', 'svg'];
  /**
   * Removes all style elements from Templates for the given scopeName.
   */
  const removeStylesFromLitTemplates = (scopeName) => {
      TEMPLATE_TYPES.forEach((type) => {
          const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));
          if (templates !== undefined) {
              templates.keyString.forEach((template) => {
                  const { element: { content } } = template;
                  // IE 11 doesn't support the iterable param Set constructor
                  const styles = new Set();
                  Array.from(content.querySelectorAll('style')).forEach((s) => {
                      styles.add(s);
                  });
                  removeNodesFromTemplate(template, styles);
              });
          }
      });
  };
  const shadyRenderSet = new Set();
  /**
   * For the given scope name, ensures that ShadyCSS style scoping is performed.
   * This is done just once per scope name so the fragment and template cannot
   * be modified.
   * (1) extracts styles from the rendered fragment and hands them to ShadyCSS
   * to be scoped and appended to the document
   * (2) removes style elements from all lit-html Templates for this scope name.
   *
   * Note, <style> elements can only be placed into templates for the
   * initial rendering of the scope. If <style> elements are included in templates
   * dynamically rendered to the scope (after the first scope render), they will
   * not be scoped and the <style> will be left in the template and rendered
   * output.
   */
  const prepareTemplateStyles = (scopeName, renderedDOM, template) => {
      shadyRenderSet.add(scopeName);
      // If `renderedDOM` is stamped from a Template, then we need to edit that
      // Template's underlying template element. Otherwise, we create one here
      // to give to ShadyCSS, which still requires one while scoping.
      const templateElement = !!template ? template.element : document.createElement('template');
      // Move styles out of rendered DOM and store.
      const styles = renderedDOM.querySelectorAll('style');
      const { length } = styles;
      // If there are no styles, skip unnecessary work
      if (length === 0) {
          // Ensure prepareTemplateStyles is called to support adding
          // styles via `prepareAdoptedCssText` since that requires that
          // `prepareTemplateStyles` is called.
          //
          // ShadyCSS will only update styles containing @apply in the template
          // given to `prepareTemplateStyles`. If no lit Template was given,
          // ShadyCSS will not be able to update uses of @apply in any relevant
          // template. However, this is not a problem because we only create the
          // template for the purpose of supporting `prepareAdoptedCssText`,
          // which doesn't support @apply at all.
          window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
          return;
      }
      const condensedStyle = document.createElement('style');
      // Collect styles into a single style. This helps us make sure ShadyCSS
      // manipulations will not prevent us from being able to fix up template
      // part indices.
      // NOTE: collecting styles is inefficient for browsers but ShadyCSS
      // currently does this anyway. When it does not, this should be changed.
      for (let i = 0; i < length; i++) {
          const style = styles[i];
          style.parentNode.removeChild(style);
          condensedStyle.textContent += style.textContent;
      }
      // Remove styles from nested templates in this scope.
      removeStylesFromLitTemplates(scopeName);
      // And then put the condensed style into the "root" template passed in as
      // `template`.
      const content = templateElement.content;
      if (!!template) {
          insertNodeIntoTemplate(template, condensedStyle, content.firstChild);
      }
      else {
          content.insertBefore(condensedStyle, content.firstChild);
      }
      // Note, it's important that ShadyCSS gets the template that `lit-html`
      // will actually render so that it can update the style inside when
      // needed (e.g. @apply native Shadow DOM case).
      window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
      const style = content.querySelector('style');
      if (window.ShadyCSS.nativeShadow && style !== null) {
          // When in native Shadow DOM, ensure the style created by ShadyCSS is
          // included in initially rendered output (`renderedDOM`).
          renderedDOM.insertBefore(style.cloneNode(true), renderedDOM.firstChild);
      }
      else if (!!template) {
          // When no style is left in the template, parts will be broken as a
          // result. To fix this, we put back the style node ShadyCSS removed
          // and then tell lit to remove that node from the template.
          // There can be no style in the template in 2 cases (1) when Shady DOM
          // is in use, ShadyCSS removes all styles, (2) when native Shadow DOM
          // is in use ShadyCSS removes the style if it contains no content.
          // NOTE, ShadyCSS creates its own style so we can safely add/remove
          // `condensedStyle` here.
          content.insertBefore(condensedStyle, content.firstChild);
          const removes = new Set();
          removes.add(condensedStyle);
          removeNodesFromTemplate(template, removes);
      }
  };
  /**
   * Extension to the standard `render` method which supports rendering
   * to ShadowRoots when the ShadyDOM (https://github.com/webcomponents/shadydom)
   * and ShadyCSS (https://github.com/webcomponents/shadycss) polyfills are used
   * or when the webcomponentsjs
   * (https://github.com/webcomponents/webcomponentsjs) polyfill is used.
   *
   * Adds a `scopeName` option which is used to scope element DOM and stylesheets
   * when native ShadowDOM is unavailable. The `scopeName` will be added to
   * the class attribute of all rendered DOM. In addition, any style elements will
   * be automatically re-written with this `scopeName` selector and moved out
   * of the rendered DOM and into the document `<head>`.
   *
   * It is common to use this render method in conjunction with a custom element
   * which renders a shadowRoot. When this is done, typically the element's
   * `localName` should be used as the `scopeName`.
   *
   * In addition to DOM scoping, ShadyCSS also supports a basic shim for css
   * custom properties (needed only on older browsers like IE11) and a shim for
   * a deprecated feature called `@apply` that supports applying a set of css
   * custom properties to a given location.
   *
   * Usage considerations:
   *
   * * Part values in `<style>` elements are only applied the first time a given
   * `scopeName` renders. Subsequent changes to parts in style elements will have
   * no effect. Because of this, parts in style elements should only be used for
   * values that will never change, for example parts that set scope-wide theme
   * values or parts which render shared style elements.
   *
   * * Note, due to a limitation of the ShadyDOM polyfill, rendering in a
   * custom element's `constructor` is not supported. Instead rendering should
   * either done asynchronously, for example at microtask timing (for example
   * `Promise.resolve()`), or be deferred until the first time the element's
   * `connectedCallback` runs.
   *
   * Usage considerations when using shimmed custom properties or `@apply`:
   *
   * * Whenever any dynamic changes are made which affect
   * css custom properties, `ShadyCSS.styleElement(element)` must be called
   * to update the element. There are two cases when this is needed:
   * (1) the element is connected to a new parent, (2) a class is added to the
   * element that causes it to match different custom properties.
   * To address the first case when rendering a custom element, `styleElement`
   * should be called in the element's `connectedCallback`.
   *
   * * Shimmed custom properties may only be defined either for an entire
   * shadowRoot (for example, in a `:host` rule) or via a rule that directly
   * matches an element with a shadowRoot. In other words, instead of flowing from
   * parent to child as do native css custom properties, shimmed custom properties
   * flow only from shadowRoots to nested shadowRoots.
   *
   * * When using `@apply` mixing css shorthand property names with
   * non-shorthand names (for example `border` and `border-width`) is not
   * supported.
   */
  const render$1 = (result, container, options) => {
      if (!options || typeof options !== 'object' || !options.scopeName) {
          throw new Error('The `scopeName` option is required.');
      }
      const scopeName = options.scopeName;
      const hasRendered = parts.has(container);
      const needsScoping = compatibleShadyCSSVersion &&
          container.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */ &&
          !!container.host;
      // Handle first render to a scope specially...
      const firstScopeRender = needsScoping && !shadyRenderSet.has(scopeName);
      // On first scope render, render into a fragment; this cannot be a single
      // fragment that is reused since nested renders can occur synchronously.
      const renderContainer = firstScopeRender ? document.createDocumentFragment() : container;
      render(result, renderContainer, Object.assign({ templateFactory: shadyTemplateFactory(scopeName) }, options));
      // When performing first scope render,
      // (1) We've rendered into a fragment so that there's a chance to
      // `prepareTemplateStyles` before sub-elements hit the DOM
      // (which might cause them to render based on a common pattern of
      // rendering in a custom element's `connectedCallback`);
      // (2) Scope the template with ShadyCSS one time only for this scope.
      // (3) Render the fragment into the container and make sure the
      // container knows its `part` is the one we just rendered. This ensures
      // DOM will be re-used on subsequent renders.
      if (firstScopeRender) {
          const part = parts.get(renderContainer);
          parts.delete(renderContainer);
          // ShadyCSS might have style sheets (e.g. from `prepareAdoptedCssText`)
          // that should apply to `renderContainer` even if the rendered value is
          // not a TemplateInstance. However, it will only insert scoped styles
          // into the document if `prepareTemplateStyles` has already been called
          // for the given scope name.
          const template = part.value instanceof TemplateInstance ?
              part.value.template :
              undefined;
          prepareTemplateStyles(scopeName, renderContainer, template);
          removeNodes(container, container.firstChild);
          container.appendChild(renderContainer);
          parts.set(container, part);
      }
      // After elements have hit the DOM, update styling if this is the
      // initial render to this container.
      // This is needed whenever dynamic changes are made so it would be
      // safest to do every render; however, this would regress performance
      // so we leave it up to the user to call `ShadyCSS.styleElement`
      // for dynamic changes.
      if (!hasRendered && needsScoping) {
          window.ShadyCSS.styleElement(container.host);
      }
  };

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var _a;
  /**
   * When using Closure Compiler, JSCompiler_renameProperty(property, object) is
   * replaced at compile time by the munged name for object[property]. We cannot
   * alias this function, so we have to use a small shim that has the same
   * behavior when not compiling.
   */
  window.JSCompiler_renameProperty =
      (prop, _obj) => prop;
  const defaultConverter = {
      toAttribute(value, type) {
          switch (type) {
              case Boolean:
                  return value ? '' : null;
              case Object:
              case Array:
                  // if the value is `null` or `undefined` pass this through
                  // to allow removing/no change behavior.
                  return value == null ? value : JSON.stringify(value);
          }
          return value;
      },
      fromAttribute(value, type) {
          switch (type) {
              case Boolean:
                  return value !== null;
              case Number:
                  return value === null ? null : Number(value);
              case Object:
              case Array:
                  return JSON.parse(value);
          }
          return value;
      }
  };
  /**
   * Change function that returns true if `value` is different from `oldValue`.
   * This method is used as the default for a property's `hasChanged` function.
   */
  const notEqual = (value, old) => {
      // This ensures (old==NaN, value==NaN) always returns false
      return old !== value && (old === old || value === value);
  };
  const defaultPropertyDeclaration = {
      attribute: true,
      type: String,
      converter: defaultConverter,
      reflect: false,
      hasChanged: notEqual
  };
  const microtaskPromise = Promise.resolve(true);
  const STATE_HAS_UPDATED = 1;
  const STATE_UPDATE_REQUESTED = 1 << 2;
  const STATE_IS_REFLECTING_TO_ATTRIBUTE = 1 << 3;
  const STATE_IS_REFLECTING_TO_PROPERTY = 1 << 4;
  const STATE_HAS_CONNECTED = 1 << 5;
  /**
   * The Closure JS Compiler doesn't currently have good support for static
   * property semantics where "this" is dynamic (e.g.
   * https://github.com/google/closure-compiler/issues/3177 and others) so we use
   * this hack to bypass any rewriting by the compiler.
   */
  const finalized = 'finalized';
  /**
   * Base element class which manages element properties and attributes. When
   * properties change, the `update` method is asynchronously called. This method
   * should be supplied by subclassers to render updates as desired.
   */
  class UpdatingElement extends HTMLElement {
      constructor() {
          super();
          this._updateState = 0;
          this._instanceProperties = undefined;
          this._updatePromise = microtaskPromise;
          this._hasConnectedResolver = undefined;
          /**
           * Map with keys for any properties that have changed since the last
           * update cycle with previous values.
           */
          this._changedProperties = new Map();
          /**
           * Map with keys of properties that should be reflected when updated.
           */
          this._reflectingProperties = undefined;
          this.initialize();
      }
      /**
       * Returns a list of attributes corresponding to the registered properties.
       * @nocollapse
       */
      static get observedAttributes() {
          // note: piggy backing on this to ensure we're finalized.
          this.finalize();
          const attributes = [];
          // Use forEach so this works even if for/of loops are compiled to for loops
          // expecting arrays
          this._classProperties.forEach((v, p) => {
              const attr = this._attributeNameForProperty(p, v);
              if (attr !== undefined) {
                  this._attributeToPropertyMap.set(attr, p);
                  attributes.push(attr);
              }
          });
          return attributes;
      }
      /**
       * Ensures the private `_classProperties` property metadata is created.
       * In addition to `finalize` this is also called in `createProperty` to
       * ensure the `@property` decorator can add property metadata.
       */
      /** @nocollapse */
      static _ensureClassProperties() {
          // ensure private storage for property declarations.
          if (!this.hasOwnProperty(JSCompiler_renameProperty('_classProperties', this))) {
              this._classProperties = new Map();
              // NOTE: Workaround IE11 not supporting Map constructor argument.
              const superProperties = Object.getPrototypeOf(this)._classProperties;
              if (superProperties !== undefined) {
                  superProperties.forEach((v, k) => this._classProperties.set(k, v));
              }
          }
      }
      /**
       * Creates a property accessor on the element prototype if one does not exist.
       * The property setter calls the property's `hasChanged` property option
       * or uses a strict identity check to determine whether or not to request
       * an update.
       * @nocollapse
       */
      static createProperty(name, options = defaultPropertyDeclaration) {
          // Note, since this can be called by the `@property` decorator which
          // is called before `finalize`, we ensure storage exists for property
          // metadata.
          this._ensureClassProperties();
          this._classProperties.set(name, options);
          // Do not generate an accessor if the prototype already has one, since
          // it would be lost otherwise and that would never be the user's intention;
          // Instead, we expect users to call `requestUpdate` themselves from
          // user-defined accessors. Note that if the super has an accessor we will
          // still overwrite it
          if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
              return;
          }
          const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
          Object.defineProperty(this.prototype, name, {
              // tslint:disable-next-line:no-any no symbol in index
              get() {
                  return this[key];
              },
              set(value) {
                  const oldValue = this[name];
                  this[key] = value;
                  this._requestUpdate(name, oldValue);
              },
              configurable: true,
              enumerable: true
          });
      }
      /**
       * Creates property accessors for registered properties and ensures
       * any superclasses are also finalized.
       * @nocollapse
       */
      static finalize() {
          // finalize any superclasses
          const superCtor = Object.getPrototypeOf(this);
          if (!superCtor.hasOwnProperty(finalized)) {
              superCtor.finalize();
          }
          this[finalized] = true;
          this._ensureClassProperties();
          // initialize Map populated in observedAttributes
          this._attributeToPropertyMap = new Map();
          // make any properties
          // Note, only process "own" properties since this element will inherit
          // any properties defined on the superClass, and finalization ensures
          // the entire prototype chain is finalized.
          if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
              const props = this.properties;
              // support symbols in properties (IE11 does not support this)
              const propKeys = [
                  ...Object.getOwnPropertyNames(props),
                  ...(typeof Object.getOwnPropertySymbols === 'function') ?
                      Object.getOwnPropertySymbols(props) :
                      []
              ];
              // This for/of is ok because propKeys is an array
              for (const p of propKeys) {
                  // note, use of `any` is due to TypeSript lack of support for symbol in
                  // index types
                  // tslint:disable-next-line:no-any no symbol in index
                  this.createProperty(p, props[p]);
              }
          }
      }
      /**
       * Returns the property name for the given attribute `name`.
       * @nocollapse
       */
      static _attributeNameForProperty(name, options) {
          const attribute = options.attribute;
          return attribute === false ?
              undefined :
              (typeof attribute === 'string' ?
                  attribute :
                  (typeof name === 'string' ? name.toLowerCase() : undefined));
      }
      /**
       * Returns true if a property should request an update.
       * Called when a property value is set and uses the `hasChanged`
       * option for the property if present or a strict identity check.
       * @nocollapse
       */
      static _valueHasChanged(value, old, hasChanged = notEqual) {
          return hasChanged(value, old);
      }
      /**
       * Returns the property value for the given attribute value.
       * Called via the `attributeChangedCallback` and uses the property's
       * `converter` or `converter.fromAttribute` property option.
       * @nocollapse
       */
      static _propertyValueFromAttribute(value, options) {
          const type = options.type;
          const converter = options.converter || defaultConverter;
          const fromAttribute = (typeof converter === 'function' ? converter : converter.fromAttribute);
          return fromAttribute ? fromAttribute(value, type) : value;
      }
      /**
       * Returns the attribute value for the given property value. If this
       * returns undefined, the property will *not* be reflected to an attribute.
       * If this returns null, the attribute will be removed, otherwise the
       * attribute will be set to the value.
       * This uses the property's `reflect` and `type.toAttribute` property options.
       * @nocollapse
       */
      static _propertyValueToAttribute(value, options) {
          if (options.reflect === undefined) {
              return;
          }
          const type = options.type;
          const converter = options.converter;
          const toAttribute = converter && converter.toAttribute ||
              defaultConverter.toAttribute;
          return toAttribute(value, type);
      }
      /**
       * Performs element initialization. By default captures any pre-set values for
       * registered properties.
       */
      initialize() {
          this._saveInstanceProperties();
          // ensures first update will be caught by an early access of
          // `updateComplete`
          this._requestUpdate();
      }
      /**
       * Fixes any properties set on the instance before upgrade time.
       * Otherwise these would shadow the accessor and break these properties.
       * The properties are stored in a Map which is played back after the
       * constructor runs. Note, on very old versions of Safari (<=9) or Chrome
       * (<=41), properties created for native platform properties like (`id` or
       * `name`) may not have default values set in the element constructor. On
       * these browsers native properties appear on instances and therefore their
       * default value will overwrite any element default (e.g. if the element sets
       * this.id = 'id' in the constructor, the 'id' will become '' since this is
       * the native platform default).
       */
      _saveInstanceProperties() {
          // Use forEach so this works even if for/of loops are compiled to for loops
          // expecting arrays
          this.constructor
              ._classProperties.forEach((_v, p) => {
              if (this.hasOwnProperty(p)) {
                  const value = this[p];
                  delete this[p];
                  if (!this._instanceProperties) {
                      this._instanceProperties = new Map();
                  }
                  this._instanceProperties.set(p, value);
              }
          });
      }
      /**
       * Applies previously saved instance properties.
       */
      _applyInstanceProperties() {
          // Use forEach so this works even if for/of loops are compiled to for loops
          // expecting arrays
          // tslint:disable-next-line:no-any
          this._instanceProperties.forEach((v, p) => this[p] = v);
          this._instanceProperties = undefined;
      }
      connectedCallback() {
          this._updateState = this._updateState | STATE_HAS_CONNECTED;
          // Ensure first connection completes an update. Updates cannot complete
          // before connection and if one is pending connection the
          // `_hasConnectionResolver` will exist. If so, resolve it to complete the
          // update, otherwise requestUpdate.
          if (this._hasConnectedResolver) {
              this._hasConnectedResolver();
              this._hasConnectedResolver = undefined;
          }
      }
      /**
       * Allows for `super.disconnectedCallback()` in extensions while
       * reserving the possibility of making non-breaking feature additions
       * when disconnecting at some point in the future.
       */
      disconnectedCallback() {
      }
      /**
       * Synchronizes property values when attributes change.
       */
      attributeChangedCallback(name, old, value) {
          if (old !== value) {
              this._attributeToProperty(name, value);
          }
      }
      _propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
          const ctor = this.constructor;
          const attr = ctor._attributeNameForProperty(name, options);
          if (attr !== undefined) {
              const attrValue = ctor._propertyValueToAttribute(value, options);
              // an undefined value does not change the attribute.
              if (attrValue === undefined) {
                  return;
              }
              // Track if the property is being reflected to avoid
              // setting the property again via `attributeChangedCallback`. Note:
              // 1. this takes advantage of the fact that the callback is synchronous.
              // 2. will behave incorrectly if multiple attributes are in the reaction
              // stack at time of calling. However, since we process attributes
              // in `update` this should not be possible (or an extreme corner case
              // that we'd like to discover).
              // mark state reflecting
              this._updateState = this._updateState | STATE_IS_REFLECTING_TO_ATTRIBUTE;
              if (attrValue == null) {
                  this.removeAttribute(attr);
              }
              else {
                  this.setAttribute(attr, attrValue);
              }
              // mark state not reflecting
              this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_ATTRIBUTE;
          }
      }
      _attributeToProperty(name, value) {
          // Use tracking info to avoid deserializing attribute value if it was
          // just set from a property setter.
          if (this._updateState & STATE_IS_REFLECTING_TO_ATTRIBUTE) {
              return;
          }
          const ctor = this.constructor;
          const propName = ctor._attributeToPropertyMap.get(name);
          if (propName !== undefined) {
              const options = ctor._classProperties.get(propName) || defaultPropertyDeclaration;
              // mark state reflecting
              this._updateState = this._updateState | STATE_IS_REFLECTING_TO_PROPERTY;
              this[propName] =
                  // tslint:disable-next-line:no-any
                  ctor._propertyValueFromAttribute(value, options);
              // mark state not reflecting
              this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_PROPERTY;
          }
      }
      /**
       * This private version of `requestUpdate` does not access or return the
       * `updateComplete` promise. This promise can be overridden and is therefore
       * not free to access.
       */
      _requestUpdate(name, oldValue) {
          let shouldRequestUpdate = true;
          // If we have a property key, perform property update steps.
          if (name !== undefined) {
              const ctor = this.constructor;
              const options = ctor._classProperties.get(name) || defaultPropertyDeclaration;
              if (ctor._valueHasChanged(this[name], oldValue, options.hasChanged)) {
                  if (!this._changedProperties.has(name)) {
                      this._changedProperties.set(name, oldValue);
                  }
                  // Add to reflecting properties set.
                  // Note, it's important that every change has a chance to add the
                  // property to `_reflectingProperties`. This ensures setting
                  // attribute + property reflects correctly.
                  if (options.reflect === true &&
                      !(this._updateState & STATE_IS_REFLECTING_TO_PROPERTY)) {
                      if (this._reflectingProperties === undefined) {
                          this._reflectingProperties = new Map();
                      }
                      this._reflectingProperties.set(name, options);
                  }
              }
              else {
                  // Abort the request if the property should not be considered changed.
                  shouldRequestUpdate = false;
              }
          }
          if (!this._hasRequestedUpdate && shouldRequestUpdate) {
              this._enqueueUpdate();
          }
      }
      /**
       * Requests an update which is processed asynchronously. This should
       * be called when an element should update based on some state not triggered
       * by setting a property. In this case, pass no arguments. It should also be
       * called when manually implementing a property setter. In this case, pass the
       * property `name` and `oldValue` to ensure that any configured property
       * options are honored. Returns the `updateComplete` Promise which is resolved
       * when the update completes.
       *
       * @param name {PropertyKey} (optional) name of requesting property
       * @param oldValue {any} (optional) old value of requesting property
       * @returns {Promise} A Promise that is resolved when the update completes.
       */
      requestUpdate(name, oldValue) {
          this._requestUpdate(name, oldValue);
          return this.updateComplete;
      }
      /**
       * Sets up the element to asynchronously update.
       */
      async _enqueueUpdate() {
          // Mark state updating...
          this._updateState = this._updateState | STATE_UPDATE_REQUESTED;
          let resolve;
          let reject;
          const previousUpdatePromise = this._updatePromise;
          this._updatePromise = new Promise((res, rej) => {
              resolve = res;
              reject = rej;
          });
          try {
              // Ensure any previous update has resolved before updating.
              // This `await` also ensures that property changes are batched.
              await previousUpdatePromise;
          }
          catch (e) {
              // Ignore any previous errors. We only care that the previous cycle is
              // done. Any error should have been handled in the previous update.
          }
          // Make sure the element has connected before updating.
          if (!this._hasConnected) {
              await new Promise((res) => this._hasConnectedResolver = res);
          }
          try {
              const result = this.performUpdate();
              // If `performUpdate` returns a Promise, we await it. This is done to
              // enable coordinating updates with a scheduler. Note, the result is
              // checked to avoid delaying an additional microtask unless we need to.
              if (result != null) {
                  await result;
              }
          }
          catch (e) {
              reject(e);
          }
          resolve(!this._hasRequestedUpdate);
      }
      get _hasConnected() {
          return (this._updateState & STATE_HAS_CONNECTED);
      }
      get _hasRequestedUpdate() {
          return (this._updateState & STATE_UPDATE_REQUESTED);
      }
      get hasUpdated() {
          return (this._updateState & STATE_HAS_UPDATED);
      }
      /**
       * Performs an element update. Note, if an exception is thrown during the
       * update, `firstUpdated` and `updated` will not be called.
       *
       * You can override this method to change the timing of updates. If this
       * method is overridden, `super.performUpdate()` must be called.
       *
       * For instance, to schedule updates to occur just before the next frame:
       *
       * ```
       * protected async performUpdate(): Promise<unknown> {
       *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
       *   super.performUpdate();
       * }
       * ```
       */
      performUpdate() {
          // Mixin instance properties once, if they exist.
          if (this._instanceProperties) {
              this._applyInstanceProperties();
          }
          let shouldUpdate = false;
          const changedProperties = this._changedProperties;
          try {
              shouldUpdate = this.shouldUpdate(changedProperties);
              if (shouldUpdate) {
                  this.update(changedProperties);
              }
          }
          catch (e) {
              // Prevent `firstUpdated` and `updated` from running when there's an
              // update exception.
              shouldUpdate = false;
              throw e;
          }
          finally {
              // Ensure element can accept additional updates after an exception.
              this._markUpdated();
          }
          if (shouldUpdate) {
              if (!(this._updateState & STATE_HAS_UPDATED)) {
                  this._updateState = this._updateState | STATE_HAS_UPDATED;
                  this.firstUpdated(changedProperties);
              }
              this.updated(changedProperties);
          }
      }
      _markUpdated() {
          this._changedProperties = new Map();
          this._updateState = this._updateState & ~STATE_UPDATE_REQUESTED;
      }
      /**
       * Returns a Promise that resolves when the element has completed updating.
       * The Promise value is a boolean that is `true` if the element completed the
       * update without triggering another update. The Promise result is `false` if
       * a property was set inside `updated()`. If the Promise is rejected, an
       * exception was thrown during the update.
       *
       * To await additional asynchronous work, override the `_getUpdateComplete`
       * method. For example, it is sometimes useful to await a rendered element
       * before fulfilling this Promise. To do this, first await
       * `super._getUpdateComplete()`, then any subsequent state.
       *
       * @returns {Promise} The Promise returns a boolean that indicates if the
       * update resolved without triggering another update.
       */
      get updateComplete() {
          return this._getUpdateComplete();
      }
      /**
       * Override point for the `updateComplete` promise.
       *
       * It is not safe to override the `updateComplete` getter directly due to a
       * limitation in TypeScript which means it is not possible to call a
       * superclass getter (e.g. `super.updateComplete.then(...)`) when the target
       * language is ES5 (https://github.com/microsoft/TypeScript/issues/338).
       * This method should be overridden instead. For example:
       *
       *   class MyElement extends LitElement {
       *     async _getUpdateComplete() {
       *       await super._getUpdateComplete();
       *       await this._myChild.updateComplete;
       *     }
       *   }
       */
      _getUpdateComplete() {
          return this._updatePromise;
      }
      /**
       * Controls whether or not `update` should be called when the element requests
       * an update. By default, this method always returns `true`, but this can be
       * customized to control when to update.
       *
       * * @param _changedProperties Map of changed properties with old values
       */
      shouldUpdate(_changedProperties) {
          return true;
      }
      /**
       * Updates the element. This method reflects property values to attributes.
       * It can be overridden to render and keep updated element DOM.
       * Setting properties inside this method will *not* trigger
       * another update.
       *
       * * @param _changedProperties Map of changed properties with old values
       */
      update(_changedProperties) {
          if (this._reflectingProperties !== undefined &&
              this._reflectingProperties.size > 0) {
              // Use forEach so this works even if for/of loops are compiled to for
              // loops expecting arrays
              this._reflectingProperties.forEach((v, k) => this._propertyToAttribute(k, this[k], v));
              this._reflectingProperties = undefined;
          }
      }
      /**
       * Invoked whenever the element is updated. Implement to perform
       * post-updating tasks via DOM APIs, for example, focusing an element.
       *
       * Setting properties inside this method will trigger the element to update
       * again after this update cycle completes.
       *
       * * @param _changedProperties Map of changed properties with old values
       */
      updated(_changedProperties) {
      }
      /**
       * Invoked when the element is first updated. Implement to perform one time
       * work on the element after update.
       *
       * Setting properties inside this method will trigger the element to update
       * again after this update cycle completes.
       *
       * * @param _changedProperties Map of changed properties with old values
       */
      firstUpdated(_changedProperties) {
      }
  }
  _a = finalized;
  /**
   * Marks class as having finished creating properties.
   */
  UpdatingElement[_a] = true;

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  const legacyCustomElement = (tagName, clazz) => {
      window.customElements.define(tagName, clazz);
      // Cast as any because TS doesn't recognize the return type as being a
      // subtype of the decorated class when clazz is typed as
      // `Constructor<HTMLElement>` for some reason.
      // `Constructor<HTMLElement>` is helpful to make sure the decorator is
      // applied to elements however.
      // tslint:disable-next-line:no-any
      return clazz;
  };
  const standardCustomElement = (tagName, descriptor) => {
      const { kind, elements } = descriptor;
      return {
          kind,
          elements,
          // This callback is called once the class is otherwise fully defined
          finisher(clazz) {
              window.customElements.define(tagName, clazz);
          }
      };
  };
  /**
   * Class decorator factory that defines the decorated class as a custom element.
   *
   * @param tagName the name of the custom element to define
   */
  const customElement = (tagName) => (classOrDescriptor) => (typeof classOrDescriptor === 'function') ?
      legacyCustomElement(tagName, classOrDescriptor) :
      standardCustomElement(tagName, classOrDescriptor);
  const standardProperty = (options, element) => {
      // When decorating an accessor, pass it through and add property metadata.
      // Note, the `hasOwnProperty` check in `createProperty` ensures we don't
      // stomp over the user's accessor.
      if (element.kind === 'method' && element.descriptor &&
          !('value' in element.descriptor)) {
          return Object.assign({}, element, { finisher(clazz) {
                  clazz.createProperty(element.key, options);
              } });
      }
      else {
          // createProperty() takes care of defining the property, but we still
          // must return some kind of descriptor, so return a descriptor for an
          // unused prototype field. The finisher calls createProperty().
          return {
              kind: 'field',
              key: Symbol(),
              placement: 'own',
              descriptor: {},
              // When @babel/plugin-proposal-decorators implements initializers,
              // do this instead of the initializer below. See:
              // https://github.com/babel/babel/issues/9260 extras: [
              //   {
              //     kind: 'initializer',
              //     placement: 'own',
              //     initializer: descriptor.initializer,
              //   }
              // ],
              initializer() {
                  if (typeof element.initializer === 'function') {
                      this[element.key] = element.initializer.call(this);
                  }
              },
              finisher(clazz) {
                  clazz.createProperty(element.key, options);
              }
          };
      }
  };
  const legacyProperty = (options, proto, name) => {
      proto.constructor
          .createProperty(name, options);
  };
  /**
   * A property decorator which creates a LitElement property which reflects a
   * corresponding attribute value. A `PropertyDeclaration` may optionally be
   * supplied to configure property features.
   *
   * @ExportDecoratedItems
   */
  function property(options) {
      // tslint:disable-next-line:no-any decorator
      return (protoOrDescriptor, name) => (name !== undefined) ?
          legacyProperty(options, protoOrDescriptor, name) :
          standardProperty(options, protoOrDescriptor);
  }

  /**
  @license
  Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
  This code may only be used under the BSD style license found at
  http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
  http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
  found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
  part of the polymer project is also subject to an additional IP rights grant
  found at http://polymer.github.io/PATENTS.txt
  */
  const supportsAdoptingStyleSheets = ('adoptedStyleSheets' in Document.prototype) &&
      ('replace' in CSSStyleSheet.prototype);
  const constructionToken = Symbol();
  class CSSResult {
      constructor(cssText, safeToken) {
          if (safeToken !== constructionToken) {
              throw new Error('CSSResult is not constructable. Use `unsafeCSS` or `css` instead.');
          }
          this.cssText = cssText;
      }
      // Note, this is a getter so that it's lazy. In practice, this means
      // stylesheets are not created until the first element instance is made.
      get styleSheet() {
          if (this._styleSheet === undefined) {
              // Note, if `adoptedStyleSheets` is supported then we assume CSSStyleSheet
              // is constructable.
              if (supportsAdoptingStyleSheets) {
                  this._styleSheet = new CSSStyleSheet();
                  this._styleSheet.replaceSync(this.cssText);
              }
              else {
                  this._styleSheet = null;
              }
          }
          return this._styleSheet;
      }
      toString() {
          return this.cssText;
      }
  }
  const textFromCSSResult = (value) => {
      if (value instanceof CSSResult) {
          return value.cssText;
      }
      else if (typeof value === 'number') {
          return value;
      }
      else {
          throw new Error(`Value passed to 'css' function must be a 'css' function result: ${value}. Use 'unsafeCSS' to pass non-literal values, but
            take care to ensure page security.`);
      }
  };
  /**
   * Template tag which which can be used with LitElement's `style` property to
   * set element styles. For security reasons, only literal string values may be
   * used. To incorporate non-literal values `unsafeCSS` may be used inside a
   * template string part.
   */
  const css = (strings, ...values) => {
      const cssText = values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
      return new CSSResult(cssText, constructionToken);
  };

  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  // IMPORTANT: do not change the property name or the assignment expression.
  // This line will be used in regexes to search for LitElement usage.
  // TODO(justinfagnani): inject version number at build time
  (window['litElementVersions'] || (window['litElementVersions'] = []))
      .push('2.2.1');
  /**
   * Minimal implementation of Array.prototype.flat
   * @param arr the array to flatten
   * @param result the accumlated result
   */
  function arrayFlat(styles, result = []) {
      for (let i = 0, length = styles.length; i < length; i++) {
          const value = styles[i];
          if (Array.isArray(value)) {
              arrayFlat(value, result);
          }
          else {
              result.push(value);
          }
      }
      return result;
  }
  /** Deeply flattens styles array. Uses native flat if available. */
  const flattenStyles = (styles) => styles.flat ? styles.flat(Infinity) : arrayFlat(styles);
  class LitElement extends UpdatingElement {
      /** @nocollapse */
      static finalize() {
          // The Closure JS Compiler does not always preserve the correct "this"
          // when calling static super methods (b/137460243), so explicitly bind.
          super.finalize.call(this);
          // Prepare styling that is stamped at first render time. Styling
          // is built from user provided `styles` or is inherited from the superclass.
          this._styles =
              this.hasOwnProperty(JSCompiler_renameProperty('styles', this)) ?
                  this._getUniqueStyles() :
                  this._styles || [];
      }
      /** @nocollapse */
      static _getUniqueStyles() {
          // Take care not to call `this.styles` multiple times since this generates
          // new CSSResults each time.
          // TODO(sorvell): Since we do not cache CSSResults by input, any
          // shared styles will generate new stylesheet objects, which is wasteful.
          // This should be addressed when a browser ships constructable
          // stylesheets.
          const userStyles = this.styles;
          const styles = [];
          if (Array.isArray(userStyles)) {
              const flatStyles = flattenStyles(userStyles);
              // As a performance optimization to avoid duplicated styling that can
              // occur especially when composing via subclassing, de-duplicate styles
              // preserving the last item in the list. The last item is kept to
              // try to preserve cascade order with the assumption that it's most
              // important that last added styles override previous styles.
              const styleSet = flatStyles.reduceRight((set, s) => {
                  set.add(s);
                  // on IE set.add does not return the set.
                  return set;
              }, new Set());
              // Array.from does not work on Set in IE
              styleSet.forEach((v) => styles.unshift(v));
          }
          else if (userStyles) {
              styles.push(userStyles);
          }
          return styles;
      }
      /**
       * Performs element initialization. By default this calls `createRenderRoot`
       * to create the element `renderRoot` node and captures any pre-set values for
       * registered properties.
       */
      initialize() {
          super.initialize();
          this.renderRoot =
              this.createRenderRoot();
          // Note, if renderRoot is not a shadowRoot, styles would/could apply to the
          // element's getRootNode(). While this could be done, we're choosing not to
          // support this now since it would require different logic around de-duping.
          if (window.ShadowRoot && this.renderRoot instanceof window.ShadowRoot) {
              this.adoptStyles();
          }
      }
      /**
       * Returns the node into which the element should render and by default
       * creates and returns an open shadowRoot. Implement to customize where the
       * element's DOM is rendered. For example, to render into the element's
       * childNodes, return `this`.
       * @returns {Element|DocumentFragment} Returns a node into which to render.
       */
      createRenderRoot() {
          return this.attachShadow({ mode: 'open' });
      }
      /**
       * Applies styling to the element shadowRoot using the `static get styles`
       * property. Styling will apply using `shadowRoot.adoptedStyleSheets` where
       * available and will fallback otherwise. When Shadow DOM is polyfilled,
       * ShadyCSS scopes styles and adds them to the document. When Shadow DOM
       * is available but `adoptedStyleSheets` is not, styles are appended to the
       * end of the `shadowRoot` to [mimic spec
       * behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
       */
      adoptStyles() {
          const styles = this.constructor._styles;
          if (styles.length === 0) {
              return;
          }
          // There are three separate cases here based on Shadow DOM support.
          // (1) shadowRoot polyfilled: use ShadyCSS
          // (2) shadowRoot.adoptedStyleSheets available: use it.
          // (3) shadowRoot.adoptedStyleSheets polyfilled: append styles after
          // rendering
          if (window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow) {
              window.ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map((s) => s.cssText), this.localName);
          }
          else if (supportsAdoptingStyleSheets) {
              this.renderRoot.adoptedStyleSheets =
                  styles.map((s) => s.styleSheet);
          }
          else {
              // This must be done after rendering so the actual style insertion is done
              // in `update`.
              this._needsShimAdoptedStyleSheets = true;
          }
      }
      connectedCallback() {
          super.connectedCallback();
          // Note, first update/render handles styleElement so we only call this if
          // connected after first update.
          if (this.hasUpdated && window.ShadyCSS !== undefined) {
              window.ShadyCSS.styleElement(this);
          }
      }
      /**
       * Updates the element. This method reflects property values to attributes
       * and calls `render` to render DOM via lit-html. Setting properties inside
       * this method will *not* trigger another update.
       * * @param _changedProperties Map of changed properties with old values
       */
      update(changedProperties) {
          super.update(changedProperties);
          const templateResult = this.render();
          if (templateResult instanceof TemplateResult) {
              this.constructor
                  .render(templateResult, this.renderRoot, { scopeName: this.localName, eventContext: this });
          }
          // When native Shadow DOM is used but adoptedStyles are not supported,
          // insert styling after rendering to ensure adoptedStyles have highest
          // priority.
          if (this._needsShimAdoptedStyleSheets) {
              this._needsShimAdoptedStyleSheets = false;
              this.constructor._styles.forEach((s) => {
                  const style = document.createElement('style');
                  style.textContent = s.cssText;
                  this.renderRoot.appendChild(style);
              });
          }
      }
      /**
       * Invoked on each update to perform rendering tasks. This method must return
       * a lit-html TemplateResult. Setting properties inside this method will *not*
       * trigger the element to update.
       */
      render() {
      }
  }
  /**
   * Ensure this class is marked as `finalized` as an optimization ensuring
   * it will not needlessly try to `finalize`.
   *
   * Note this property name is a string to prevent breaking Closure JS Compiler
   * optimizations. See updating-element.ts for more information.
   */
  LitElement['finalized'] = true;
  /**
   * Render method used to render the lit-html TemplateResult to the element's
   * DOM.
   * @param {TemplateResult} Template to render.
   * @param {Element|DocumentFragment} Node into which to render.
   * @param {String} Element name.
   * @nocollapse
   */
  LitElement.render = render$1;

  let PageContent = _decorate([customElement('page-content')], function (_initialize, _LitElement) {
    class PageContent extends _LitElement {
      constructor(...args) {
        super(...args);

        _initialize(this);
      }

    }

    return {
      F: PageContent,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
      /** Component styling **/
      :host {
        display: block;
        margin: 0 auto;
        padding: 0 12px;
        max-width: 1024px;
      }

      @media only screen and (max-width: 900px) {
        :host {
          padding: 0;
        }
      }
    `;
        }
      }, {
        kind: "method",
        key: "render",
        value: function render() {
          return html`
      <slot></slot>
    `;
        }
      }]
    };
  }, LitElement);

  let SharedNavigation = _decorate([customElement('shared-nav')], function (_initialize, _LitElement) {
    class SharedNavigation extends _LitElement {
      constructor() {
        super();

        _initialize(this);

        this._mobileActive = false;
      }

    }

    return {
      F: SharedNavigation,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
            /** Colors and variables **/
            :host {
            }
            @media (prefers-color-scheme: dark) {
                :host {
                }
            }

            /** Component styling **/
            :host {
            }

            :host .nav-container a {
                color: var(--link-font-color);
                text-decoration: none;
            }
            :host .nav-container a:hover {
                color: var(--link-font-color-hover);
            }

            :host .nav-container {
                display: flex;
                gap: 8px;
                margin-top: 8px;
                background: var(--g-background-color);
            }

            :host .nav-item {
                font-size: 16px;
                font-weight: 600;
                padding: 10px 16px;
            }
            :host .nav-item:hover {
                background-color: var(--g-background-extra2-color);
            }

            :host .nav-toggler {
                display: none;
                background-image: url('hamburger.svg');
                background-repeat: no-repeat;
                background-position: center;
                cursor: pointer;
                position: absolute;
                top: 0;
                left: 0;
                width: 48px;
                height: 48px;
            }
            :host .nav-toggler:hover {
                background-color: var(--g-background-extra2-color);
            }

            @media only screen and (max-width: 640px) {
                :host .nav-container {
                    display: none;
                    flex-direction: column;
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    padding-top: 40px;
                    padding-bottom: 12px;
                }
                :host .nav-container.nav-active {
                    display: flex;
                }

                :host .nav-toggler {
                    display: block;
                }
            }
        `;
        }
      }, {
        kind: "method",
        key: "_onMobileToggled",
        value: function _onMobileToggled() {
          this._mobileActive = !this._mobileActive;
          this.requestUpdate();
        }
      }, {
        kind: "method",
        key: "render",
        value: function render() {
          const containerClassList = ["nav-container"];

          if (this._mobileActive) {
            containerClassList.push("nav-active");
          }

          return html`
            <div class="${containerClassList.join(" ")}">
                <a href="https://godotengine.github.io/doc-status/" target="_blank" class="nav-item">
                    ClassRef Status
                </a>
                <a href="https://godot-proposals-viewer.github.io/" target="_blank" class="nav-item">
                    Proposal Viewer
                </a>
                <a href="https://godotengine.github.io/godot-team-reports/" target="_blank" class="nav-item">
                    Team Reports
                </a>
                <a href="https://godotengine.github.io/godot-prs-by-file/" target="_blank" class="nav-item">
                    PRs by File
                </a>
                <a href="https://godotengine.github.io/godot-commit-artifacts/" target="_blank" class="nav-item">
                    Commit Artifacts
                </a>
            </div>
            <div
                class="nav-toggler"
                @click="${this._onMobileToggled}"
            ></div>
        `;
        }
      }]
    };
  }, LitElement);

  let IndexHeader = _decorate([customElement('gr-index-entry')], function (_initialize, _LitElement) {
    class IndexHeader extends _LitElement {
      constructor() {
        super(); // Auto-refresh about once a minute so that the relative time of generation is always actual.

        _initialize(this);

        this._refreshTimeout = setTimeout(this._refresh.bind(this), 60 * 1000);
      }

    }

    return {
      F: IndexHeader,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {
            --header-meta-color: #98a5b8;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --header-meta-color: #515c6c;
            }
          }

          /** Component styling **/
          :host {
          }

          :host .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          :host .header-metadata {
            color: var(--header-meta-color);
            text-align: right;
          }
          :host .header-metadata a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host .header-metadata a:hover {
            color: var(--link-font-color-hover);
          }

          @media only screen and (max-width: 900px) {
            :host .header {
              flex-wrap: wrap;
              text-align: center;
            }
            :host .header-title,
            :host .header-metadata {
              width: 100%;
            }
            :host .header-metadata {
              padding-bottom: 12px;
              text-align: center;
            }
          }
        `;
        }
      }, {
        kind: "field",
        decorators: [property({
          type: Date
        })],
        key: "generated_at",

        value() {
          return null;
        }

      }, {
        kind: "method",
        key: "_refresh",
        value: function _refresh() {
          this.requestUpdate(); // Continue updating.

          this._refreshTimeout = setTimeout(this._refresh.bind(this), 60 * 1000);
        }
      }, {
        kind: "method",
        key: "render",
        value: function render() {
          let generatedAt = "";
          let generatedRel = "";

          if (this.generated_at) {
            generatedAt = greports.format.formatTimestamp(this.generated_at);
            let timeValue = (Date.now() - this.generated_at) / (1000 * 60);
            let timeUnit = "minute";

            if (timeValue < 1) {
              generatedRel = "just now";
            } else {
              if (timeValue > 60) {
                timeValue = timeValue / 60;
                timeUnit = "hour";
              }

              generatedRel = greports.format.formatTimespan(-Math.round(timeValue), timeUnit);
            }
          }

          return html`
            <div class="header">
                <h1 class="header-title">
                    Godot Interactive Changelog
                </h1>
                <div class="header-metadata">
                    ${this.generated_at ? html`
                        <span title="${generatedAt}">
                            data generated ${generatedRel}
                        </span>
                    ` : ''}
                    <br/>
                    <a
                            href="https://github.com/godotengine/godot-interactive-changelog"
                            target="_blank"
                    >
                        contribute on GitHub
                    </a>
                </div>
            </div>
        `;
        }
      }]
    };
  }, LitElement);

  let IndexDescription = _decorate([customElement('gr-index-description')], function (_initialize, _LitElement) {
    class IndexDescription extends _LitElement {
      constructor(...args) {
        super(...args);

        _initialize(this);
      }

    }

    return {
      F: IndexDescription,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {
          }
          @media (prefers-color-scheme: dark) {
            :host {
            }
          }

          /** Component styling **/
          :host {
            line-height: 22px;
          }

          :host .header-description {
            display: flex;
            align-items: flex-end;
            color: var(--dimmed-font-color);
          }

          :host .header-description-column {
            flex: 2;
          }
          :host .header-description-column.header-extra-links {
            flex: 1;
            text-align: right;
          }

          :host .header-description a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host .header-description a:hover {
            color: var(--link-font-color-hover);
          }

          :host hr {
            border: none;
            border-top: 1px solid var(--g-background-extra-color);
            width: 30%;
          }

          @media only screen and (max-width: 900px) {
            :host .header-description {
              padding: 0 8px;
              flex-direction: column;
            }

            :host .header-description-column {
              width: 100%;
            }
            :host .header-description-column.header-extra-links {
              text-align: center;
              padding-top: 12px;
            }
          }
        `;
        }
      }, {
        kind: "field",
        decorators: [property({
          type: Date
        })],
        key: "generated_at",

        value() {
          return null;
        }

      }, {
        kind: "method",
        key: "render",
        value: function render() {
          return html`
            <div class="header-description">
                <div class="header-description-column">
                    This page lists comprehensive changelogs for each release of Godot,
                    including developer previews (alphas, betas, RCs).
                    <br>
                    You can browse changes related to every release by commit, by PR, or
                    by author.
                </div>
                <div class="header-description-column header-extra-links">
                </div>
            </div>
        `;
        }
      }]
    };
  }, LitElement);

  let VersionItem = _decorate([customElement('gr-version-item')], function (_initialize, _LitElement) {
    class VersionItem extends _LitElement {
      constructor(...args) {
        super(...args);

        _initialize(this);
      }

    }

    return {
      F: VersionItem,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {
            --tab-hover-background-color: rgba(0, 0, 0, 0.14);
            --tab-active-background-color: #d6e6ff;
            --tab-active-border-color: #397adf;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --tab-hover-background-color: rgba(255, 255, 255, 0.14);
              --tab-active-background-color: #283446;
              --tab-active-border-color: #5394f9;
            }
          }

          /** Component styling **/
          :host {
            max-width: 200px;
          }

          :host .version-item {
            border-left: 5px solid transparent;
            color: var(--g-font-color);
            cursor: pointer;
            display: flex;
            flex-direction: row;
            gap: 6px;
            padding: 6px 16px 6px 4px;
            align-items: center;
          }
          :host .version-item:hover {
            background-color: var(--tab-hover-background-color);
          }
          :host .version-item--active {
            background-color: var(--tab-active-background-color);
            border-left: 5px solid var(--tab-active-border-color);
          }

          :host .version-item--sub {
            padding: 4px 16px 4px 20px;
          }

          :host .version-icon {
            display: none;
          }

          :host .version-icon--main {
            background-image: url('dropdown.svg');
            background-size: 20px 20px;
            background-position: 50% 50%;
            background-repeat: no-repeat;
            border-radius: 2px;
            display: inline-block;
            width: 22px;
            height: 22px;
            min-width: 22px;
            transform: rotate(-90deg);
            transition: transform .2s;
          }

          :host .version-item--expanded .version-icon--main {
            transform: rotate(0deg);
          }

          @media (prefers-color-scheme: light) {
            :host .version-icon--main {
              filter: invert(1);
            }
          }

          :host .version-title {
            font-size: 15px;
            white-space: nowrap;
            overflow: hidden;
          }

          :host .version-item--major .version-title,
          :host .version-item--minor .version-title {
            font-weight: 600;
            color: var(--tab-active-border-color);
          }

          :host .version-pull-count {
            color: var(--dimmed-font-color);
            flex-grow: 1;
            font-size: 15px;
            text-align: right;
          }
          :host .version-pull-count--hot {
            color: var(--g-font-color);
            font-weight: 700;
          }

          @keyframes loader-rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          :host .version-loader {
            background-image: url('loader.svg');
            background-size: 20px 20px;
            background-position: 50% 50%;
            background-repeat: no-repeat;
            border-radius: 2px;
            display: inline-block;
            width: 20px;
            height: 20px;
            min-width: 20px;
            animation-name: loader-rotate;
            animation-duration: 1.25s;
            animation-timing-function: steps(8);
            animation-iteration-count: infinite;
          }

          @media (prefers-color-scheme: light) {
            :host .version-loader {
              filter: invert(1);
            }
          }

          @media only screen and (max-width: 900px) {
            :host .version-item {
              padding: 10px 20px 10px 8px;
            }

            :host .version-item--sub {
              padding: 8px 20px 8px 24px;
            }

            :host .version-title,
            :host .version-pull-count {
              font-size: 18px;
            }
          }
        `;
        }
      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "path",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String,
          reflect: true
        })],
        key: "name",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String,
          reflect: true
        })],
        key: "type",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String,
          reflect: true
        })],
        key: "flavor",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Boolean,
          reflect: true
        })],
        key: "active",

        value() {
          return false;
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Boolean,
          reflect: true
        })],
        key: "expanded",

        value() {
          return false;
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Boolean,
          reflect: true
        })],
        key: "loading",

        value() {
          return false;
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Number
        })],
        key: "pull_count",

        value() {
          return 0;
        }

      }, {
        kind: "method",
        key: "_onIconClicked",
        value: function _onIconClicked(event) {
          event.preventDefault();
          event.stopPropagation();
          this.dispatchEvent(greports.util.createEvent("iconclick"), {});
        }
      }, {
        kind: "method",
        key: "render",
        value: function render() {
          const classList = ["version-item", "version-item--" + this.type, "version-item--" + this.flavor];

          if (this.active) {
            classList.push("version-item--active");
          }

          if (this.expanded) {
            classList.push("version-item--expanded");
          }

          const iconClassList = ["version-icon", "version-icon--" + this.type];
          const countClassList = ["version-pull-count"];

          if (this.pull_count > 200) {
            countClassList.push("version-pull-count--hot");
          }

          return html`
            <div
              class="${classList.join(" ")}"
              title="${this.path}"
            >
                <div
                  class="${iconClassList.join(" ")}"
                  title="${this.type === "main" ? "Show intermediate changelogs" : ""}"
                  @click="${this._onIconClicked}"
                ></div>
                <span class="version-title">
                    ${this.name}
                </span>

                <span
                  class="${countClassList.join(" ")}"
                  title="${this.loading ? "" : `${this.pull_count} changes since last release.`}"
                >
                    ${this.loading ? "" : this.pull_count}
                </span>

                ${this.loading ? html`
                  <div class="version-loader"></div>
                ` : null}
            </div>
        `;
        }
      }]
    };
  }, LitElement);

  let VersionList = _decorate([customElement('gr-version-list')], function (_initialize, _LitElement) {
    class VersionList extends _LitElement {
      constructor() {
        super();

        _initialize(this);
      }

    }

    return {
      F: VersionList,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {
            --versions-background-color: #fcfcfa;
            --versions-border-color: #515c6c;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --versions-background-color: #0d1117;
              --versions-border-color: #515c6c;
            }
          }

          /** Component styling **/
          :host {
            position: relative;
          }

          :host .version-list {
            background-color: var(--versions-background-color);
            border-right: 2px solid var(--versions-border-color);
            width: 200px;
            min-height: 216px;
          }

          :host .version-list-sub {
            background-color: rgba(0, 0, 0, 0.08);
            filter: saturate(0.35) brightness(1.0);
            padding: 4px 0 4px 12px;
          }
          @media (prefers-color-scheme: dark) {
            :host .version-list-sub {
              background-color: rgba(255, 255, 255, 0.08);
              filter: saturate(0.15) brightness(1.1);
            }
          }

          @media only screen and (max-width: 900px) {
            :host {
              width: 100%
            }

            :host .version-list {
              width: 100% !important;
            }
          }
        `;
        }
      }, {
        kind: "field",
        decorators: [property({
          type: Array
        })],
        key: "versions",

        value() {
          return [];
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Array
        })],
        key: "loadingVersions",

        value() {
          return [];
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Array
        })],
        key: "toggledVersions",

        value() {
          return [];
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "selectedVersion",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "selectedRelease",

        value() {
          return "";
        }

      }, {
        kind: "method",
        key: "_toggleEntry",
        value: function _toggleEntry(versionType, versionName, failOnMatch) {
          if (versionType === "main") {
            const entryIndex = this.toggledVersions.indexOf(versionName);

            if (entryIndex >= 0) {
              if (!failOnMatch) {
                this.toggledVersions.splice(entryIndex, 1);
              }
            } else {
              this.toggledVersions.push(versionName);
            }

            this.requestUpdate();
          }
        }
      }, {
        kind: "method",
        key: "_onItemClicked",
        value: function _onItemClicked(versionType, versionName, releaseName) {
          //this._toggleEntry(versionType, versionName, true);
          this.dispatchEvent(greports.util.createEvent("versionclick", {
            "type": versionType,
            "version": versionName,
            "release": releaseName
          }));
        }
      }, {
        kind: "method",
        key: "_onItemIconClicked",
        value: function _onItemIconClicked(versionType, versionName, releaseName) {
          this._toggleEntry(versionType, versionName, false);

          if (versionType === "sub") {
            this.dispatchEvent(greports.util.createEvent("versionclick", {
              "type": versionType,
              "version": versionName,
              "release": releaseName
            }));
          }
        }
      }, {
        kind: "method",
        key: "update",
        value: function update(changedProperties) {
          // Check if the version list was set, this should only happen once.
          if (changedProperties.size > 0) {
            const oldVersions = changedProperties.get("versions"); // When this happens, we should unfold the selected version,
            // because it came from the URL slug.

            if (typeof oldVersions === "undefined" && typeof this.versions !== "undefined") {
              this._toggleEntry("main", this.selectedVersion);
            }
          }

          _get(_getPrototypeOf(VersionList.prototype), "update", this).call(this, changedProperties);
        }
      }, {
        kind: "method",
        key: "render",
        value: function render() {
          return html`
            <div class="version-list">
                ${this.versions.map(item => {
          let versionFlavor = "patch";
          let versionBits = item.name.split(".");

          if (versionBits.length === 2) {
            versionFlavor = versionBits[1] === "0" ? "major" : "minor";
          }

          return html`
                        <div class="version-list-main">
                            <gr-version-item
                                .name="${item.name}"
                                .type="${"main"}"
                                .flavor="${versionFlavor}"
                                .pull_count="${item.commit_log.length}"
                                ?active="${this.selectedVersion === item.name}"
                                ?expanded="${this.toggledVersions.includes(item.name)}"
                                ?loading="${this.loadingVersions.includes(item.name)}"
                                @click="${this._onItemClicked.bind(this, "main", item.name, "")}"
                                @iconclick="${this._onItemIconClicked.bind(this, "main", item.name, "")}"
                            ></gr-version-item>

                            ${this.toggledVersions.includes(item.name) ? html`
                                <div class="version-list-sub">
                                    ${item.releases.map(release => {
            return html`
                                            <gr-version-item
                                                .name="${release.name}"
                                                .type="${"sub"}"
                                                .flavor="${"preview"}"
                                                .pull_count="${release.commit_log.length}"
                                                ?active="${this.selectedVersion === item.name && this.selectedRelease === release.name}"
                                                @click="${this._onItemClicked.bind(this, "sub", item.name, release.name)}"
                                                @iconclick="${this._onItemIconClicked.bind(this, "sub", item.name, release.name)}"
                                            ></gr-version-item>
                                        `;
          })}
                                </div>
                              ` : null}
                        </div>
                    `;
        })}
            </div>
        `;
        }
      }]
    };
  }, LitElement);

  let ChangesToolbar = _decorate([customElement('gr-changes-toolbar')], function (_initialize, _LitElement) {
    class ChangesToolbar extends _LitElement {
      constructor(...args) {
        super(...args);

        _initialize(this);
      }

    }

    return {
      F: ChangesToolbar,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {
            --changes-toolbar-color: #9bbaed;
            --changes-toolbar-color-hover: #2862cd;
            --changes-toolbar-color-active: #2054b5;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --changes-toolbar-color: #222c3d;
              --changes-toolbar-color-hover: #5b87de;
              --changes-toolbar-color-active: #6b9aea;
            }
          }

          /** Component styling **/
          :host {
          }

          :host a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host a:hover {
            color: var(--link-font-color-hover);
          }

          :host .version-changes-toolbar {
            background: var(--changes-toolbar-color);
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 6px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          :host .changes-version {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 13px;
          }

          :host .changes-title {
            color: var(--g-font-color);
            display: inline-block;
            font-size: 20px;
            font-weight: 600;
            line-height: 24px;
            margin-top: 6px;
            margin-bottom: 12px;
            word-break: break-word;
            flex-grow: 1;
          }

          :host .changes-title-links {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }

          :host .changes-stats {
            display: flex;
            flex-direction: row;
            gap: 20px;
          }

          :host .changes-count {
            display: flex;
            flex-direction: row;
            gap: 6px;
            cursor: pointer;
            font-size: 15px;
          }
          :host .changes-count strong {
            font-size: 18px;
          }
          :host .changes-count-label {
            color: var(--dimmed-font-color);
          }

          :host .changes-count:hover {
            color: var(--changes-toolbar-color-hover);
          }
          :host .changes-count:hover .changes-count-label {
            color: var(--link-font-color-hover);
          }

          :host .changes-count--active {
            border-bottom: 2px solid var(--changes-toolbar-color-active);
            color: var(--changes-toolbar-color-active);
          }
          :host .changes-count--active .changes-count-label {
            color: var(--link-font-color-inactive);
          }

          :host .changes-release-notes {
            background-image: url('release-notes.svg');
            background-size: 20px 20px;
            background-position: 50% 50%;
            background-repeat: no-repeat;
            border-radius: 2px;
            display: inline-block;
            width: 24px;
            height: 24px;
            filter: brightness(0.85);
          }

          @media (prefers-color-scheme: light) {
            :host .changes-release-notes {
                filter: invert(1);
            }
          }

          @media only screen and (max-width: 900px) {
            :host .changes-count {
              font-size: 17px;
              justify-content: center;
              width: 100%;
            }
            :host .changes-count strong {
              font-size: 20px;
            }
          }

          @media only screen and (max-width: 640px) {
            :host .changes-version {
                flex-direction: column;
                align-items: flex-start;
                gap: 6px;
                margin-bottom: 10px;
            }

            :host .changes-title-links {
                flex-direction: row;
                justify-content: space-between;
                width: 100%;
            }
          }
        `;
        }
      }, {
        kind: "field",
        decorators: [property({
          type: Number
        })],
        key: "pull_count",

        value() {
          return 0;
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Number
        })],
        key: "commit_count",

        value() {
          return 0;
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Number
        })],
        key: "author_count",

        value() {
          return 0;
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "repository",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "version_name",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "release_name",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "version_ref",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "version_from_ref",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "version_article",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "current_mode",

        value() {
          return "";
        }

      }, {
        kind: "method",
        key: "_shortenRef",
        value: function _shortenRef(ref) {
          if (ref.indexOf(".") >= 0) {
            // This is a qualified version tag, don't shorten.
            return ref;
          }

          return ref.substring(0, 9);
        }
      }, {
        kind: "method",
        key: "_onModeClicked",
        value: function _onModeClicked(mode) {
          if (mode === this.current_mode) {
            return;
          }

          this.dispatchEvent(greports.util.createEvent("modechange", {
            "mode": mode
          }));
        }
      }, {
        kind: "method",
        key: "render",
        value: function render() {
          return html`
            <div class="version-changes-toolbar">
                <div class="changes-version">
                    <span class="changes-title">
                        Changelog for ${this.version_name}${this.release_name !== "" ? `-${this.release_name}` : ""}
                    </span>

                    <div class="changes-title-links">
                        <span>
                            commits:
                            <a
                                href="https://github.com/${this.repository}/compare/${this.version_from_ref}...${this.version_ref}"
                                target="_blank"
                                title="Open the commit list on GitHub"
                            >
                                ${this._shortenRef(this.version_from_ref)}...${this._shortenRef(this.version_ref)}
                            </a>
                        </span>

                        ${this.version_article !== "" ? html`
                            <a
                                href="${this.version_article}"
                                target="_blank"
                                title="Open the release article on the official blog"
                            >
                                Read article
                            </a>
                        ` : null}
                    </div>
                </div>

                <div class="changes-stats">
                    <div
                        class="changes-count ${this.current_mode === "commits" ? "changes-count--active" : ""}"
                        @click="${this._onModeClicked.bind(this, "commits")}"
                    >
                        <strong>${this.commit_count}</strong>
                        <span class="changes-count-label">
                            ${this.commit_count === 1 ? "commit" : "commits"}
                        </span>
                    </div>
                    <div
                        class="changes-count ${this.current_mode === "pulls" ? "changes-count--active" : ""}"
                        @click="${this._onModeClicked.bind(this, "pulls")}"
                    >
                        <strong>${this.pull_count}</strong>
                        <span class="changes-count-label">
                            ${this.pull_count === 1 ? "pull-request" : "pull-requests"}
                        </span>
                    </div>
                    <div
                        class="changes-count ${this.current_mode === "authors" ? "changes-count--active" : ""}"
                        @click="${this._onModeClicked.bind(this, "authors")}"
                    >
                        <strong>${this.author_count}</strong>
                        <span class="changes-count-label">
                            ${this.author_count === 1 ? "contributor" : "contributors"}
                        </span>
                    </div>

                    <div style="flex-grow:1"></div>

                    <div
                        class="changes-count ${this.current_mode === "release-notes" ? "changes-count--active" : ""}"
                        title="Show changes in the form of release notes"
                        @click="${this._onModeClicked.bind(this, "release-notes")}"
                    >
                        <span class="changes-release-notes"></span>
                    </div>
                </div>
            </div>
        `;
        }
      }]
    };
  }, LitElement);

  let ChangeItemAuthor = _decorate([customElement('gr-change-author')], function (_initialize, _LitElement) {
    class ChangeItemAuthor extends _LitElement {
      constructor(...args) {
        super(...args);

        _initialize(this);
      }

    }

    return {
      F: ChangeItemAuthor,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {
            --star-font-color: #ffcc31;
            --ghost-font-color: #738b99;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --star-font-color: #e0c537;
              --ghost-font-color: #495d68;
            }
          }

          /** Component styling **/
          :host {
          }

          :host a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host a:hover {
            color: var(--link-font-color-hover);
          }

          :host .item-author {
            display: inline-flex;
            flex-direction: row;
            gap: 6px;
            align-items: center;
            vertical-align: bottom;
            padding-left: 6px;
          }
          :host .item-author--hot:before {
            content: "★";
            color: var(--star-font-color);
          }
          :host .item-author--ghost {
            color: var(--ghost-font-color);
            font-weight: 600;
          }

          :host .item-author-avatar {
            background-size: cover;
            border-radius: 2px;
            display: inline-block;
            width: 16px;
            height: 16px;
          }

          @media only screen and (max-width: 900px) {
            :host {
            }
          }
        `;
        }
      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "id",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String,
          reflect: true
        })],
        key: "user",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "avatar",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Boolean
        })],
        key: "is_hot",

        value() {
          return false;
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "url",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "url_title",

        value() {
          return '';
        }

      }, {
        kind: "method",
        key: "render",
        value: function render() {
          const authorClassList = ["item-author"];

          if (this.is_hot) ;

          if (this.id === "") {
            authorClassList.push("item-author--ghost");
          }

          return html`
            <a
                class="${authorClassList.join(" ")}"
                href="${this.url}"
                target="_blank"
                title="${this.url_title}"
            >
                <span
                    class="item-author-avatar"
                    style="background-image: url('${this.avatar}')"
                ></span>
                ${this.user}
            </a>
        `;
        }
      }]
    };
  }, LitElement);

  let ChangeItemLabel = _decorate([customElement('gr-change-label')], function (_initialize, _LitElement) {
    class ChangeItemLabel extends _LitElement {
      constructor(...args) {
        super(...args);

        _initialize(this);
      }

    }

    return {
      F: ChangeItemLabel,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {

          }

          @media (prefers-color-scheme: dark) {
            :host {

            }
          }

          /** Component styling **/
          :host {

          }

          :host .item-labels {
            display: flex;
            flex-flow: row wrap;
            padding: 4px 0;
          }

          :host .item-label {
            padding-right: 8px;
          }
          :host .item-label-dot {
            border-radius: 4px;
            box-shadow: rgb(0 0 0 / 28%) 0 0 3px 0;
            display: inline-block;
            width: 8px;
            height: 8px;
            filter: brightness(0.75);
          }
          :host .item-label-name {
            padding-left: 3px;
          }

          @media only screen and (max-width: 900px) {
            :host .item-labels {
              width: 100%;
              justify-content: space-between;
            }
          }
        `;
        }
      }, {
        kind: "field",
        decorators: [property({
          type: String,
          reflect: true
        })],
        key: "name",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "color",

        value() {
          return '';
        }

      }, {
        kind: "method",
        key: "render",
        value: function render() {
          return html`
        <span class="item-label">
            <span
                class="item-label-dot"
                style="background-color: ${this.color}"
            ></span>
            <span class="item-label-name">
                ${this.name}
            </span>
        </span>
    `;
        }
      }]
    };
  }, LitElement);

  let PullRequestItem = _decorate([customElement('gr-pull-item')], function (_initialize, _LitElement) {
    class PullRequestItem extends _LitElement {
      constructor(...args) {
        super(...args);

        _initialize(this);
      }

    }

    return {
      F: PullRequestItem,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {
            --item-border-color: #fcfcfa;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --item-border-color: #0d1117;
            }
          }

          /** Component styling **/
          :host {
            border-bottom: 3px solid var(--item-border-color);
            display: block;
            padding: 14px 12px 20px 12px;
          }

          :host a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host a:hover {
            color: var(--link-font-color-hover);
          }

          :host .item-title {
            display: inline-block;
            font-size: 20px;
            margin-top: 6px;
            margin-bottom: 12px;
          }
          :host .item-title-name {
            color: var(--g-font-color);
            line-height: 24px;
            word-break: break-word;
          }

          :host .item-meta {
            color: var(--dimmed-font-color);
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            gap: 16px;
            font-size: 13px;
          }

          :host .item-links {
            display: flex;
            flex-direction: column;
            gap: 2px;
            text-align: right;
          }

          :host .item-authors {
          }

          @media only screen and (max-width: 900px) {
            :host {
              padding: 14px 0 20px 0;
            }
          }

          @media only screen and (max-width: 640px) {
            :host .item-container {
                padding: 0 10px;
            }

            :host .item-meta {
              flex-direction: column;
            }

            :host .item-links {
                text-align: left;
            }
          }
        `;
        }
      }, {
        kind: "field",
        decorators: [property({
          type: String,
          reflect: true
        })],
        key: "id",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "cherrypick_id",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "title",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Array
        })],
        key: "authors",

        value() {
          return [];
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "url",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "created_at",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "updated_at",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Array
        })],
        key: "labels",

        value() {
          return [];
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "repository",

        value() {
          return '';
        }

      }, {
        kind: "method",
        key: "render",
        value: function render() {
          // Some labels aren't useful in this context; hide them.
          let filteredLabels = [];
          this.labels.forEach(item => {
            if (item.name.startsWith("cherrypick:")) {
              return;
            }

            filteredLabels.push(item);
          });
          return html`
            <div class="item-container">
                <div class="item-title">
                    <span class="item-title-name">${this.title}</span>
                </div>

                <div class="item-meta">
                    <div class="item-labels">
                        ${filteredLabels.map(item => {
          return html`
                                <gr-change-label
                                    .name="${item.name}"
                                    .color="${item.color}"
                                ></gr-change-label>
                            `;
        })}
                    </div>

                    <div class="item-links">
                        <div class="item-authors">
                            <span>by </span>
                            ${this.authors.map(author => {
          return html`
                                    <gr-change-author
                                        .id="${author.id}"
                                        .user="${author.user}"
                                        .avatar="${author.avatar}"
                                        .is_hot="${author.pull_count > 12}"

                                        .url="${`https://github.com/${this.repository}/pulls/${author.user}`}"
                                        .url_title="${`Open all PRs by ${author.user}`}"
                                    ></gr-change-author>
                                `;
        })}
                        </div>

                        <div>
                            <span>submitted as </span>
                            <a
                                href="${this.url}"
                                target="_blank"
                                title="Open PR #${this.id} on GitHub"
                            >
                                GH-${this.id}
                            </a>

                            ${this.cherrypick_id !== "" ? html`
                                <span> · </span>
                                <span>cherry-picked in </span>
                                <a
                                    href="https://github.com/${this.repository}/pull/${this.cherrypick_id}"
                                    target="_blank"
                                    title="Open PR #${this.cherrypick_id} on GitHub"
                                >
                                    GH-${this.cherrypick_id}
                                </a>
                            ` : null}
                        </div>
                    </div>
                </div>
            </div>
        `;
        }
      }]
    };
  }, LitElement);

  let CommitItem = _decorate([customElement('gr-commit-item')], function (_initialize, _LitElement) {
    class CommitItem extends _LitElement {
      constructor(...args) {
        super(...args);

        _initialize(this);
      }

    }

    return {
      F: CommitItem,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {
            --item-border-color: #fcfcfa;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --item-border-color: #0d1117;
            }
          }

          /** Component styling **/
          :host {
            border-bottom: 3px solid var(--item-border-color);
            display: block;
            padding: 14px 12px 20px 12px;
          }

          :host a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host a:hover {
            color: var(--link-font-color-hover);
          }

          :host .item-title {
            display: inline-block;
            font-size: 20px;
            margin-top: 6px;
            margin-bottom: 12px;
          }
          :host .item-title-name {
            color: var(--g-font-color);
            line-height: 24px;
            word-break: break-word;
          }

          :host .item-meta {
            color: var(--dimmed-font-color);
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            gap: 16px;
            font-size: 13px;
          }

          :host .item-links {
            display: flex;
            flex-direction: column;
            gap: 2px;
            text-align: right;
          }

          :host .item-authors {
          }

          @media only screen and (max-width: 900px) {
            :host {
              padding: 14px 0 20px 0;
            }
          }

          @media only screen and (max-width: 640px) {
            :host .item-container {
                padding: 0 10px;
            }

            :host .item-meta {
              flex-direction: column;
            }

            :host .item-links {
                text-align: left;
            }
          }
        `;
        }
      }, {
        kind: "field",
        decorators: [property({
          type: String,
          reflect: true
        })],
        key: "hash",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "cherrypick_hash",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "title",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Array
        })],
        key: "authors",

        value() {
          return [];
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "repository",

        value() {
          return '';
        }

      }, {
        kind: "method",
        key: "render",
        value: function render() {
          return html`
            <div class="item-container">
                <div class="item-title">
                    <span class="item-title-name">${this.title}</span>
                </div>

                <div class="item-meta">
                    <div>
                        <div class="item-authors">
                            <span>by </span>
                            ${this.authors.map(author => {
          return html`
                                    <gr-change-author
                                        .id="${author.id}"
                                        .user="${author.user}"
                                        .avatar="${author.avatar}"
                                        .is_hot="${author.commit_count > 12}"

                                        .url="${`https://github.com/${this.repository}/commits/?author=${author.user}`}"
                                        .url_title="${`Open all commits by ${author.user}`}"
                                    ></gr-change-author>
                                `;
        })}
                        </div>
                    </div>

                    <div class="item-links">
                        <div>
                            <span>committed in </span>
                            <a
                                href="https://github.com/${this.repository}/commit/${this.hash}"
                                target="_blank"
                                title="Open commit #${this.hash} on GitHub"
                            >
                                ${this.hash.substring(0, 9)}
                            </a>

                            ${this.cherrypick_hash !== "" ? html`
                                <span> · </span>
                                <span>cherry-picked in </span>
                                <a
                                    href="https://github.com/${this.repository}/commit/${this.cherrypick_hash}"
                                    target="_blank"
                                    title="Open commit #${this.cherrypick_hash} on GitHub"
                                >
                                    ${this.cherrypick_hash.substring(0, 9)}
                                </a>
                            ` : null}
                        </div>
                    </div>
                </div>
            </div>
        `;
        }
      }]
    };
  }, LitElement);

  const SHORTLIST_ITEMS = 20;

  let AuthorItem = _decorate([customElement('gr-author-item')], function (_initialize, _LitElement) {
    class AuthorItem extends _LitElement {
      constructor() {
        super();

        _initialize(this);

        this._changesMode = "commits";
        this._changesFull = false;
      }

    }

    return {
      F: AuthorItem,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {
            --item-border-color: #fcfcfa;
            --changes-type-color-hover: #2862cd;
            --changes-type-color-active: #2054b5;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --item-border-color: #0d1117;
              --changes-type-color-hover: #5b87de;
              --changes-type-color-active: #6b9aea;
            }
          }

          /** Component styling **/
          :host {
            border-bottom: 3px solid var(--item-border-color);
            display: block;
            padding: 14px 12px 20px 12px;
          }

          :host a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host a:hover {
            color: var(--link-font-color-hover);
          }

          :host .item-title {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 20px;
            margin-top: 6px;
            margin-bottom: 12px;
          }
          :host .item-title-name {
            color: var(--g-font-color);
            line-height: 24px;
            word-break: break-word;
          }

          :host .item-title-avatar {
            background-size: cover;
            border-radius: 4px;
            display: inline-block;
            width: 20px;
            height: 20px;
          }

          :host .item-meta {
            color: var(--dimmed-font-color);
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            gap: 16px;
            font-size: 13px;
          }

          :host .item-changes-types {
            display: flex;
            flex-direction: row;
            gap: 16px;
          }

          :host .item-changes-type {
            color: var(--light-font-color);
            cursor: pointer;
            font-weight: 600;
          }
          :host .item-changes-type:hover {
            color: var(--link-font-color-hover);
          }
          :host .item-changes-type.item-changes--active {
            color: var(--changes-type-color-active);
            text-decoration: underline;
          }
          :host .item-changes-type.item-changes--active:hover {
            color: var(--changes-type-color-hover);
          }

          :host .item-changes-list {
            display: none;
          }
          :host .item-changes-list.item-changes--active {
            display: block;
          }

          :host .item-changes-list ul {
            padding-left: 20px;
          }

          :host .item-changes-more {
            cursor: pointer;
            color: var(--link-font-color-inactive);
          }
          :host .item-changes-more:hover {
            color: var(--link-font-color-hover);
          }

          :host .item-links {
            display: flex;
            flex-direction: column;
            gap: 2px;
            text-align: right;
            white-space: nowrap;
          }

          @media only screen and (max-width: 900px) {
            :host {
              padding: 14px 0 20px 0;
            }
          }

          @media only screen and (max-width: 640px) {
            :host .item-container {
                padding: 0 10px;
            }

            :host .item-meta {
              flex-direction: column;
            }

            :host .item-links {
                text-align: left;
            }
          }
        `;
        }
      }, {
        kind: "field",
        decorators: [property({
          type: String,
          reflect: true
        })],
        key: "id",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "user",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "avatar",

        value() {
          return '';
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Array
        })],
        key: "commits",

        value() {
          return [];
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Array
        })],
        key: "pulls",

        value() {
          return [];
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "repository",

        value() {
          return '';
        }

      }, {
        kind: "method",
        key: "_onModeClicked",
        value: function _onModeClicked(type) {
          if (type === this._changesMode) {
            return;
          }

          this._changesMode = type;
          this.requestUpdate();
        }
      }, {
        kind: "method",
        key: "_onMoreClicked",
        value: function _onMoreClicked() {
          this._changesFull = !this._changesFull;
          this.requestUpdate();
        }
      }, {
        kind: "method",
        key: "render",
        value: function render() {
          let commitList = this.commits;
          let pullList = this.pulls;

          if (!this._changesFull) {
            commitList = this.commits.slice(0, SHORTLIST_ITEMS);
            pullList = this.pulls.slice(0, SHORTLIST_ITEMS);
          }

          return html`
            <div class="item-container">
                <div class="item-title">
                    <span
                        class="item-title-avatar"
                        style="background-image: url('${this.avatar}')"
                    ></span>
                    <span class="item-title-name">${this.user}</span>
                </div>

                <div class="item-meta">
                    <div class="item-changes">
                        <div class="item-changes-types">
                            <span
                                class="item-changes-type ${this._changesMode === "commits" ? "item-changes--active" : ""}"
                                @click="${this._onModeClicked.bind(this, "commits")}"
                            >
                                ${this.commits.length} ${this.commits.length === 1 ? "commit" : "commits"}
                            </span>
                            <span
                                class="item-changes-type ${this._changesMode === "pulls" ? "item-changes--active" : ""}"
                                @click="${this._onModeClicked.bind(this, "pulls")}"
                            >
                                ${this.pulls.length} ${this.pulls.length === 1 ? "PR" : "PRs"}
                            </span>
                        </div>

                        <div class="item-changes-list ${this._changesMode === "commits" ? "item-changes--active" : ""}">
                            <ul>
                                ${commitList.map(item => {
          return html`
                                        <li>
                                            <code>
                                                [<a
                                                    class="item-changes-link"
                                                    href="https://github.com/${this.repository}/commit/${item.hash}"
                                                    target="_blank"
                                                >${item.hash.substring(0, 9)}</a>]
                                            </code>
                                            <span>
                                                ${item.summary}
                                            </span>
                                        </li>
                                    `;
        })}
                            </ul>
                            ${this.commits.length > SHORTLIST_ITEMS ? html`
                                <span
                                    class="item-changes-more"
                                    @click="${this._onMoreClicked}"
                                >
                                    ${this._changesFull ? "Show less" : "Show more"}
                                </span>
                            ` : null}
                        </div>

                        <div class="item-changes-list ${this._changesMode === "pulls" ? "item-changes--active" : ""}">
                            <ul>
                                ${pullList.map(item => {
          return html`
                                        <li>
                                            <span>
                                                ${item.title}
                                            </span>
                                            <code>
                                                (<a
                                                    class="item-changes-link"
                                                    href="https://github.com/${this.repository}/pull/${item.public_id}"
                                                    target="_blank"
                                                >GH-${item.public_id}</a>)
                                            </code>
                                        </li>
                                    `;
        })}
                            </ul>
                            ${this.pulls.length > SHORTLIST_ITEMS ? html`
                                <span
                                    class="item-changes-more"
                                    @click="${this._onMoreClicked}"
                                >
                                    ${this._changesFull ? "Show less" : "Show more"}
                                </span>
                            ` : null}
                        </div>
                    </div>

                    <div class="item-links">
                        <div>
                            <span>${this.user} </span>
                            <a
                                href="https://github.com/${this.user}"
                                target="_blank"
                                title="Open ${this.user}'s GitHub profile"
                            >
                                on GitHub
                            </a>
                        </div>
                        <div>
                            <a
                                href="https://github.com/${this.repository}/commits/?author=${this.user}"
                                target="_blank"
                                title="Open all commits by ${this.user}"
                            >
                                all commits
                            </a>
                            <span> · </span>
                            <a
                                href="https://github.com/${this.repository}/pulls/${this.user}"
                                target="_blank"
                                title="Open all PRs by ${this.user}"
                            >
                                all PRs
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }
      }]
    };
  }, LitElement);

  let ReleaseNotesItem = _decorate([customElement('gr-release-notes')], function (_initialize, _LitElement) {
    class ReleaseNotesItem extends _LitElement {
      constructor() {
        super();

        _initialize(this);

        this._viewMode = "pretty";
        this._groupMode = "grouped";
        this._sortedNotes = [];
        this._groupedNotes = [];
        this._copiableUnifiedText = "";
        this._copiableGroupedText = "";
        this._copyStatus = "idle";
      }

    }

    return {
      F: ReleaseNotesItem,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {
            --item-border-color: #fcfcfa;
            --changes-type-color-hover: #2862cd;
            --changes-type-color-active: #2054b5;
            --copy-status-color-success: #69be00;
            --copy-status-color-failure: #f53e13;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --item-border-color: #0d1117;
              --changes-type-color-hover: #5b87de;
              --changes-type-color-active: #6b9aea;
              --copy-status-color-success: #74cb23;
              --copy-status-color-failure: #e34c28;
            }
          }

          /** Component styling **/
          :host {
            border-bottom: 3px solid var(--item-border-color);
            display: block;
            padding: 14px 12px 20px 12px;
          }

          :host a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host a:hover {
            color: var(--link-font-color-hover);
          }

          :host .item-changes-types {
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            gap: 14px;
          }

          :host .item-changes-type {
            color: var(--light-font-color);
            cursor: pointer;
            font-weight: 600;
          }
          :host .item-changes-type:hover {
            color: var(--link-font-color-hover);
          }
          :host .item-changes-type.item-changes--active {
            color: var(--changes-type-color-active);
            text-decoration: underline;
          }
          :host .item-changes-type.item-changes--active:hover {
            color: var(--changes-type-color-hover);
          }

          @keyframes status-change-success {
            from {
              color: var(--copy-status-color-success);
            }
            to {
              color: var(--light-font-color);
            }
          }

          @keyframes status-change-failure {
            from {
              color: var(--copy-status-color-failure);
            }
            to {
              color: var(--light-font-color);
            }
          }

          :host .item-changes-status--success {
            animation-name: status-change-success;
            animation-duration: 2.5s;
            animation-timing-function: cubic-bezier(0, 0, 1, -0.1);
          }
          :host .item-changes-status--failure {
            animation-name: status-change-failure;
            animation-duration: 2.5s;
            animation-timing-function: cubic-bezier(0, 0, 1, -0.1);
          }

          :host .item-changes-list {
            display: none;
            line-height: 24px;
          }
          :host .item-changes-list.item-changes--active {
            display: block;
          }

          :host .item-changes-list ul {
            padding-left: 20px;
          }

          :host .item-changes-markdown {
            display: none;
            background: var(--g-background-color);
            border-radius: 4px 4px;
            font-size: 14px;
            margin-top: 12px;
            padding: 12px 16px;
          }
          :host .item-changes-markdown.item-changes--active {
            display: block;
          }

          :host .item-change-group {
            font-weight: 600;
          }

          @media only screen and (max-width: 900px) {
            :host {
              padding: 14px 0 20px 0;
            }
          }

          @media only screen and (max-width: 640px) {
            :host .item-container {
                padding: 0 10px;
            }
          }
        `;
        }
      }, {
        kind: "field",
        decorators: [property({
          type: Array
        })],
        key: "pulls",

        value() {
          return [];
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "repository",

        value() {
          return '';
        }

      }, {
        kind: "method",
        key: "_onViewModeClicked",
        value: function _onViewModeClicked(type) {
          if (type === this._viewMode) {
            return;
          }

          this._viewMode = type;
          this.requestUpdate();
        }
      }, {
        kind: "method",
        key: "_onGroupModeClicked",
        value: function _onGroupModeClicked(type) {
          if (type === this._groupMode) {
            return;
          }

          this._groupMode = type;
          this.requestUpdate();
        }
      }, {
        kind: "method",
        key: "_onCopyClicked",
        value: function _onCopyClicked() {
          this._copyStatus = "idle";
          this.requestUpdate();
          const copiableText = this._groupMode === "grouped" ? this._copiableGroupedText : this._copiableUnifiedText;
          navigator.clipboard.writeText(copiableText).then(res => {
            this._copyStatus = "success";
            this.requestUpdate();
          }).catch(err => {
            console.error("Copying failed: " + err);
            this._copyStatus = "failure";
            this.requestUpdate();
          });
        }
      }, {
        kind: "method",
        key: "_updateNotes",
        value: function _updateNotes() {
          this._sortedNotes = [];
          this._groupedNotes = [];
          this._copiableUnifiedText = "";
          this._copiableGroupedText = "";
          let groupedNotes = {};
          this.pulls.forEach(pull => {
            // Store under the determined group.
            if (typeof groupedNotes[pull.group_name] === "undefined") {
              groupedNotes[pull.group_name] = [];
            }

            groupedNotes[pull.group_name].push(pull);
          });
          const groupNames = Object.keys(groupedNotes);
          groupNames.sort((a, b) => {
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            return 0;
          });
          groupNames.forEach(group => {
            const pulls = groupedNotes[group];
            pulls.sort((a, b) => {
              if (a.public_id > b.public_id) return 1;
              if (a.public_id < b.public_id) return -1;
              return 0;
            });

            if (this._copiableGroupedText !== "") {
              this._copiableGroupedText += "\n";
            }

            this._copiableGroupedText += `#### ${group}\n\n`;
            let groupItems = [];
            pulls.forEach(pull => {
              const item = {
                "group": group,
                "title": pull.title,
                "public_id": pull.public_id
              };

              this._sortedNotes.push(item);

              groupItems.push(item);
              this._copiableUnifiedText += `- ${group}: ${pull.title} ([GH-${pull.public_id}](https://github.com/${this.repository}/pull/${pull.public_id})).\n`;
              this._copiableGroupedText += `- ${pull.title} ([GH-${pull.public_id}](https://github.com/${this.repository}/pull/${pull.public_id})).\n`;
            });

            this._groupedNotes.push({
              "name": group,
              "pulls": groupItems
            });
          });
        }
      }, {
        kind: "method",
        key: "update",
        value: function update(changedProperties) {
          // Only recalculate when class properties change; skip for manual updates.
          if (changedProperties.size > 0) {
            this._updateNotes();
          }

          _get(_getPrototypeOf(ReleaseNotesItem.prototype), "update", this).call(this, changedProperties);
        }
      }, {
        kind: "method",
        key: "_renderUnifiedItem",
        value: function _renderUnifiedItem(viewMode, item) {
          return viewMode === "pretty" ? html`
            <li>
                <span class="item-change-group">
                    ${item.group}:
                </span>
                <span>
                    ${item.title}
                </span>
                <code>
                    (<a
                        class="item-changes-link"
                        href="https://github.com/${this.repository}/pull/${item.public_id}"
                        target="_blank"
                    >GH-${item.public_id}</a>).
                </code>
            </li>
        ` : html`
            - ${item.group}: ${item.title} ([GH-${item.public_id}](https://github.com/${this.repository}/pull/${item.public_id})).
            <br>
        `;
        }
      }, {
        kind: "method",
        key: "_renderGroupedItem",
        value: function _renderGroupedItem(viewMode, item) {
          return viewMode === "pretty" ? html`
            <li>
                <span>
                    ${item.title}
                </span>
                <code>
                    (<a
                        class="item-changes-link"
                        href="https://github.com/${this.repository}/pull/${item.public_id}"
                        target="_blank"
                    >GH-${item.public_id}</a>).
                </code>
            </li>
        ` : html`
            - ${item.title} ([GH-${item.public_id}](https://github.com/${this.repository}/pull/${item.public_id})).
            <br>
        `;
        }
      }, {
        kind: "method",
        key: "render",
        value: function render() {
          return html`
            <div class="item-container">
                <div class="item-changes">
                    <div class="item-changes-types">
                        <span
                            class="item-changes-type ${this._viewMode === "pretty" ? "item-changes--active" : ""}"
                            @click="${this._onViewModeClicked.bind(this, "pretty")}"
                        >
                            pretty
                        </span>
                        <span
                            class="item-changes-type ${this._viewMode === "markdown" ? "item-changes--active" : ""}"
                            @click="${this._onViewModeClicked.bind(this, "markdown")}"
                        >
                            markdown
                        </span>
                        |
                        <span
                            class="item-changes-type ${this._groupMode === "unified" ? "item-changes--active" : ""}"
                            @click="${this._onGroupModeClicked.bind(this, "unified")}"
                        >
                            unified
                        </span>
                        <span
                            class="item-changes-type ${this._groupMode === "grouped" ? "item-changes--active" : ""}"
                            @click="${this._onGroupModeClicked.bind(this, "grouped")}"
                        >
                            grouped
                        </span>
                        |
                        <span
                            class="item-changes-type item-changes-status--${this._copyStatus}"
                            @click="${this._onCopyClicked.bind(this)}"
                        >
                            copy active
                        </span>
                    </div>

                    <div class="item-changes-list ${this._viewMode === "pretty" ? "item-changes--active" : ""}"">
                        ${this._groupMode === "grouped" ? html`
                            ${this._groupedNotes.map(groupItem => {
          return html`
                                  <h4>${groupItem.name}</h4>
                                  <ul>
                                      ${groupItem.pulls.map(item => {
            return this._renderGroupedItem("pretty", item);
          })}
                                  </ul>
                              `;
        })}
                        ` : html`
                            <ul>
                                ${this._sortedNotes.map(item => {
          return this._renderUnifiedItem("pretty", item);
        })}
                            </ul>
                        `}
                    </div>

                    <div class="item-changes-markdown ${this._viewMode === "markdown" ? "item-changes--active" : ""}"">
                        <code id="item-release-notes">
                            ${this._groupMode === "grouped" ? html`
                                ${this._groupedNotes.map((groupItem, index) => {
          return html`
                                      ${index > 0 ? html`<br>` : ""}
                                      #### ${groupItem.name}
                                      <br><br>

                                      ${groupItem.pulls.map(item => {
            return this._renderGroupedItem("markdown", item);
          })}
                                    `;
        })}
                            ` : html`
                                ${this._sortedNotes.map(item => {
          return this._renderUnifiedItem("markdown", item);
        })}
                            `}
                        </code>
                    </div>
                </div>
            </div>
        `;
        }
      }]
    };
  }, LitElement);

  const SHORTLIST_ITEMS$1 = 600;

  let ChangesList = _decorate([customElement('gr-changes-list')], function (_initialize, _LitElement) {
    class ChangesList extends _LitElement {
      constructor() {
        super(); // TODO: Pending a design rework that would make this few properly default.

        _initialize(this);

        this._viewMode = "release-notes";
        this._viewFull = false;
        this._active_log = [];
        this._version_ref = "";
        this._version_from_ref = "";
        this._version_article = "";
        this._filtered_commits = [];
        this._filtered_pulls = [];
        this._filtered_authors = [];
      }

    }

    return {
      F: ChangesList,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {
            --item-border-color: #fcfcfa;
            --changes-background-color: #e5edf8;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --item-border-color: #0d1117;
              --changes-background-color: #191d23;
            }
          }

          /** Component styling **/
          :host {
            flex-grow: 1;
          }

          :host .version-changes {
            background-color: var(--changes-background-color);
            border-radius: 0 4px 4px 0;
            padding: 8px 12px;
            max-width: 760px;
          }
          @media only screen and (max-width: 900px) {
            :host .version-changes {
              padding: 8px;
              max-width: 95%;
              margin: 0px auto;
            }
          }

          :host .version-changes-empty,
          :host .version-changes-more {
            color: var(--g-font-color);
            display: inline-block;
            font-size: 20px;
            line-height: 24px;
            margin-top: 6px;
            margin-bottom: 12px;
            padding: 14px 12px;
            word-break: break-word;
          }

          :host .version-changes-more {
            border-bottom: 3px solid var(--item-border-color);
            color: var(--dimmed-font-color);
            font-size: 15px;
          }

          :host .version-changes-action {
            cursor: pointer;
            color: var(--link-font-color);
          }
          :host .version-changes-action:hover {
            color: var(--link-font-color-hover);
          }
        `;
        }
      }, {
        kind: "field",
        decorators: [property({
          type: Object
        })],
        key: "version",

        value() {
          return {};
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Object
        })],
        key: "authors",

        value() {
          return {};
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Object
        })],
        key: "commits",

        value() {
          return {};
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Object
        })],
        key: "pulls",

        value() {
          return {};
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "selectedRepository",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "selectedVersion",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: String
        })],
        key: "selectedRelease",

        value() {
          return "";
        }

      }, {
        kind: "field",
        decorators: [property({
          type: Boolean,
          reflect: true
        })],
        key: "loading",

        value() {
          return false;
        }

      }, {
        kind: "method",
        key: "_updateActiveLog",
        value: function _updateActiveLog() {
          this._active_log = [];

          if (this._selectedVersion === "") {
            return;
          } // Default to the main log of the version.


          this._active_log = this.version.commit_log || [];
          this._version_ref = this.version.ref || "";
          this._version_from_ref = this.version.from_ref || "";
          this._version_article = this.version.article || ""; // But if we're in a specific release, find its log.

          if (this.selectedRelease !== "" && typeof this.version.releases !== "undefined") {
            for (let release of this.version.releases) {
              if (release.name === this.selectedRelease) {
                this._active_log = release.commit_log || [];
                this._version_ref = release.ref || "";
                this._version_from_ref = release.from_ref || "";
                this._version_article = release.article || "";
                break;
              }
            }
          }
        }
      }, {
        kind: "method",
        key: "_updateLists",
        value: function _updateLists() {
          this._filtered_commits = [];
          this._filtered_pulls = [];
          this._filtered_authors = [];

          this._active_log.forEach(commitHash => {
            if (typeof this.commits[commitHash] === "undefined") {
              return; // This is not good.
            }

            const commit = this.commits[commitHash];
            let originalCommit = commit;

            if (commit.is_cherrypick && typeof this.commits[commit.cherrypick_hash] !== "undefined") {
              originalCommit = this.commits[commit.cherrypick_hash];
            }

            this._appendCommit(commit, originalCommit);

            let pull = null;
            let originalPull = null;

            if (commit.pull !== "" && typeof this.pulls[commit.pull] !== "undefined") {
              pull = this.pulls[commit.pull];
              originalPull = pull;
            }

            if (originalCommit.pull !== "" && typeof this.pulls[originalCommit.pull] !== "undefined") {
              originalPull = this.pulls[originalCommit.pull];
            }

            this._appendPull(pull, originalPull);
          });

          this._filtered_authors.sort((a, b) => {
            // Sort by contributions first (DESC).
            if (a.commits.length > b.commits.length) return -1;
            if (a.commits.length < b.commits.length) return 1; // Then sort by name (ASC).

            if (a.author.user.toLowerCase() > b.author.user.toLowerCase()) return 1;
            if (a.author.user.toLowerCase() < b.author.user.toLowerCase()) return -1;
            return 0;
          });
        }
      }, {
        kind: "method",
        key: "_appendCommit",
        value: function _appendCommit(commit, originalCommit) {
          const filteredCommit = {
            "commit": null,
            "cherrypick_commit": null,
            "authors": []
          };

          if (commit !== originalCommit) {
            filteredCommit.commit = originalCommit;
            filteredCommit.cherrypick_commit = commit;
          } else {
            filteredCommit.commit = commit;
          }

          const authorIds = this._findCommitAuthors([commit.hash, originalCommit.hash]);

          filteredCommit.authors = this._getAuthors(authorIds);

          this._filtered_commits.push(filteredCommit);

          this._appendAuthors(filteredCommit.authors, filteredCommit.commit);
        }
      }, {
        kind: "method",
        key: "_appendPull",
        value: function _appendPull(pull, originalPull) {
          if (!pull && !originalPull) {
            return;
          }

          const existing = this._filtered_pulls.find(item => {
            return item.pull === originalPull;
          });

          if (typeof existing !== "undefined") {
            return;
          }

          const filteredPull = {
            "pull": null,
            "cherrypick_pull": null,
            "authors": []
          };

          if (pull !== originalPull) {
            filteredPull.pull = originalPull;
            filteredPull.cherrypick_pull = pull;
          } else {
            filteredPull.pull = pull;
          }

          let authorIds = this._findCommitAuthors(originalPull.commits);

          if (authorIds.indexOf(originalPull.authored_by) < 0) {
            authorIds.push(originalPull.authored_by);
          }

          filteredPull.authors = this._getAuthors(authorIds);

          this._filtered_pulls.push(filteredPull);

          this._appendAuthors(filteredPull.authors, null, filteredPull.pull);
        }
      }, {
        kind: "method",
        key: "_appendAuthors",
        value: function _appendAuthors(authors, commit = null, pull = null) {
          authors.forEach(item => {
            this._appendAuthor(item, commit, pull);
          });
        }
      }, {
        kind: "method",
        key: "_appendAuthor",
        value: function _appendAuthor(author, commit = null, pull = null) {
          let existing = this._filtered_authors.find(item => {
            return item.author === author;
          });

          if (typeof existing === "undefined") {
            const filteredAuthor = {
              "author": author,
              "commits": [],
              "pulls": []
            };

            this._filtered_authors.push(filteredAuthor);

            existing = filteredAuthor;
          }

          if (commit) {
            existing.commits.push(commit);
          }

          if (pull && existing.pulls.indexOf(pull) < 0) {
            existing.pulls.push(pull);
          }
        }
      }, {
        kind: "method",
        key: "_findCommitAuthors",
        value: function _findCommitAuthors(commits) {
          let authorIds = [];
          commits.forEach(commitHash => {
            if (typeof this.commits[commitHash] === "undefined") {
              return;
            }

            const commit = this.commits[commitHash];
            commit.authored_by.forEach(authoredBy => {
              if (authorIds.indexOf(authoredBy) < 0) {
                authorIds.push(authoredBy);
              }
            });
          });
          return authorIds;
        }
      }, {
        kind: "method",
        key: "_getAuthors",
        value: function _getAuthors(authorIds) {
          let authors = [];
          authorIds.forEach(authoredBy => {
            if (typeof this.authors[authoredBy] !== "undefined") {
              authors.push(this.authors[authoredBy]);
            }
          });
          return authors;
        }
      }, {
        kind: "method",
        key: "_onModeChanged",
        value: function _onModeChanged(event) {
          if (this._viewMode === event.detail.mode) {
            return;
          }

          this._viewMode = event.detail.mode;
          this.requestUpdate();
        }
      }, {
        kind: "method",
        key: "_onMoreClicked",
        value: function _onMoreClicked() {
          this._viewFull = !this._viewFull;
          this.requestUpdate();
        }
      }, {
        kind: "method",
        key: "update",
        value: function update(changedProperties) {
          // Only recalculate when class properties change; skip for manual updates.
          if (changedProperties.size > 0) {
            this._viewFull = false;

            this._updateActiveLog();

            this._updateLists();
          }

          _get(_getPrototypeOf(ChangesList.prototype), "update", this).call(this, changedProperties);
        }
      }, {
        kind: "method",
        key: "render",
        value: function render() {
          if (this.selectedVersion === "") {
            return html``;
          }

          if (this.loading) {
            return html`
                <span class="version-changes-empty">Loading changes...</span>
            `;
          }

          let commitList = this._filtered_commits;
          let pullList = this._filtered_pulls;
          let authorList = this._filtered_authors;

          if (!this._viewFull) {
            commitList = this._filtered_commits.slice(0, SHORTLIST_ITEMS$1);
            pullList = this._filtered_pulls.slice(0, SHORTLIST_ITEMS$1);
          }

          return html`
            <div class="version-changes">
                <gr-changes-toolbar
                    .pull_count="${this._filtered_pulls.length}"
                    .commit_count="${this._filtered_commits.length}"
                    .author_count="${this._filtered_authors.length}"
                    .repository="${this.selectedRepository}"

                    .version_name="${this.selectedVersion}"
                    .release_name="${this.selectedRelease}"
                    .version_ref="${this._version_ref}"
                    .version_from_ref="${this._version_from_ref}"
                    .version_article="${this._version_article}"

                    .current_mode="${this._viewMode}"
                    @modechange="${this._onModeChanged}"
                ></gr-changes-toolbar>


                ${this._viewMode === "pulls" && this._filtered_pulls.length === 0 ? html`
                    <span class="version-changes-empty">
                        This version contains no new changes.
                    </span>
                ` : null}

                ${this._viewMode === "commits" && this._filtered_commits.length === 0 ? html`
                    <span class="version-changes-empty">
                        This version contains no new commits.
                    </span>
                ` : null}

                ${this._viewMode === "authors" && this._filtered_authors.length === 0 ? html`
                    <span class="version-changes-empty">
                        This version contains no contributors.
                    </span>
                ` : null}


                ${!this._viewFull && this._viewMode === "pulls" && this._filtered_pulls.length > SHORTLIST_ITEMS$1 ? html`
                    <span class="version-changes-more">
                        This version contains too many changes to display immediately.
                        <span class="version-changes-action" @click="${this._onMoreClicked}">
                            Click here to expand the list
                        </span>.
                    </span>
                ` : null}

                ${!this._viewFull && this._viewMode === "commits" && this._filtered_commits.length > SHORTLIST_ITEMS$1 ? html`
                    <span class="version-changes-more">
                        This version contains too many commits to display immediately.
                        <span class="version-changes-action" @click="${this._onMoreClicked}">
                            Click here to expand the list
                        </span>.
                    </span>
                ` : null}


                ${this._viewMode === "pulls" ? pullList.map(item => {
          const pull = item.pull;
          const cherrypick_pull = item.cherrypick_pull;
          return html`
                        <gr-pull-item
                            .id="${pull.public_id}"
                            .cherrypick_id="${cherrypick_pull ? cherrypick_pull.public_id : ""}"
                            .title="${pull.title}"
                            .authors="${item.authors}"
                            .url="${pull.url}"
                            .created_at="${pull.created_at}"
                            .updated_at="${pull.updated_at}"
                            .labels="${pull.labels}"
                            .repository="${this.selectedRepository}"
                        />
                    `;
        }) : null}

                ${this._viewMode === "commits" ? commitList.map(item => {
          const commit = item.commit;
          const cherrypick_commit = item.cherrypick_commit;
          return html`
                        <gr-commit-item
                            .hash="${commit.hash}"
                            .cherrypick_hash="${cherrypick_commit ? cherrypick_commit.hash : ""}"
                            .title="${commit.summary}"
                            .authors="${item.authors}"
                            .repository="${this.selectedRepository}"
                        />
                    `;
        }) : null}

                ${this._viewMode === "authors" ? authorList.map(item => {
          const author = item.author;
          return html`
                        <gr-author-item
                            .id="${author.id}"
                            .user="${author.user}"
                            .avatar="${author.avatar}"
                            .commits="${item.commits}"
                            .pulls="${item.pulls}"
                            .repository="${this.selectedRepository}"
                        />
                    `;
        }) : null}

                ${this._viewMode === "release-notes" ? html`
                    <gr-release-notes
                        .pulls="${this._filtered_pulls.map(item => item.pull)}"
                        .repository="${this.selectedRepository}"
                    ></gr-release-notes>
                ` : null}
            </div>
        `;
        }
      }]
    };
  }, LitElement);

  let EntryComponent = _decorate([customElement('entry-component')], function (_initialize, _LitElement) {
    class EntryComponent extends _LitElement {
      constructor() {
        super();

        _initialize(this);

        this._entryRequested = false;
        this._isLoading = true;
        this._loadingVersions = [];
        this._versions = [];
        this._versionData = {};
        this._selectedRepository = "godotengine/godot";
        this._selectedVersion = "";
        this._selectedRelease = "";

        this._restoreUserPreferences();

        this._requestData();
      }

    }

    return {
      F: EntryComponent,
      d: [{
        kind: "get",
        static: true,
        key: "styles",
        value: function styles() {
          return css`
          /** Colors and variables **/
          :host {
          }
          @media (prefers-color-scheme: dark) {
            :host {
            }
          }

          /** Component styling **/
          :host {
          }

          :host .versions {
            display: flex;
            padding: 24px 0;
          }

          @media only screen and (max-width: 900px) {
            :host .versions {
              flex-wrap: wrap;
            }
          }
        `;
        }
      }, {
        kind: "method",
        key: "performUpdate",
        value: function performUpdate() {
          this._requestData();

          _get(_getPrototypeOf(EntryComponent.prototype), "performUpdate", this).call(this);
        }
      }, {
        kind: "method",
        key: "_restoreUserPreferences",
        value: function _restoreUserPreferences() {
          const userPreferences = greports.util.getLocalPreferences(); // ...
        }
      }, {
        kind: "method",
        key: "_saveUserPreferences",
        value: function _saveUserPreferences() {
          const currentPreferences = {// ...
          };
          greports.util.setLocalPreferences(currentPreferences);
        }
      }, {
        kind: "method",
        key: "_requestData",
        value: async function _requestData() {
          if (this._entryRequested) {
            return;
          }

          this._entryRequested = true;
          this._isLoading = true;
          const data = await greports.api.getVersionList(this._selectedRepository);

          if (data) {
            this._versions = data;
            let releaseNames = {};

            this._versions.forEach(version => {
              releaseNames[version.name] = [];
              version.commit_log = [];
              version.releases.forEach(release => {
                release.commit_log = [];
                releaseNames[version.name].push(release.name);
              });
            });

            const requested_slug = greports.util.getHistoryHash();

            if (requested_slug !== "") {
              const slug_bits = requested_slug.split("-");

              if (slug_bits[0] !== "" && typeof releaseNames[slug_bits[0]] !== "undefined") {
                this._selectedVersion = slug_bits[0];

                if (slug_bits.length > 1 && releaseNames[slug_bits[0]].indexOf(slug_bits[1]) >= 0) {
                  this._selectedRelease = slug_bits[1];
                } else {
                  this._selectedRelease = "";
                }
              }
            }
          } else {
            this._versions = [];
          }

          this._isLoading = false;
          this.requestUpdate();

          this._versions.forEach(version => {
            this._requestVersionData(version);
          });
        }
      }, {
        kind: "method",
        key: "_requestVersionData",
        value: async function _requestVersionData(version) {
          // Start loading, show the indicator.
          this._loadingVersions.push(version.name);

          const versionData = await greports.api.getVersionData(this._selectedRepository, version.name);

          if (versionData) {
            versionData.config = version;
            this._versionData[version.name] = versionData; // Calculate number of changes for the version, and each if its releases.

            const [...commitLog] = versionData.log;
            commitLog.reverse(); // We need to filter out all merge commits for display and the count.

            version.commit_log = [];
            commitLog.forEach(commitHash => {
              const commit = versionData.commits[commitHash];

              if (commit.is_merge) {
                return; // Continue.
              }

              version.commit_log.push(commitHash);
            });
            version.releases.forEach(release => {
              release.commit_log = [];

              if (typeof versionData.release_logs[release.name] === "undefined") {
                return; // Continue. This is a bug though.
              }

              const [...releaseLog] = versionData.release_logs[release.name];
              releaseLog.reverse();
              releaseLog.forEach(commitHash => {
                const commit = versionData.commits[commitHash];

                if (commit.is_merge) {
                  return; // Continue.
                }

                release.commit_log.push(commitHash);
              });
            });
          } // Finish loading, hide the indicator.


          const index = this._loadingVersions.indexOf(version.name);

          this._loadingVersions.splice(index, 1);

          this.requestUpdate();
        }
      }, {
        kind: "method",
        key: "_onVersionClicked",
        value: function _onVersionClicked(event) {
          this._selectedVersion = event.detail.version;
          this._selectedRelease = event.detail.release;
          this.requestUpdate();
          let versionString = event.detail.version;

          if (event.detail.release !== "") {
            versionString += `-${event.detail.release}`;
          }

          greports.util.setHistoryHash(versionString);
          window.scrollTo(0, 0);
        }
      }, {
        kind: "method",
        key: "render",
        value: function render() {
          // Dereferencing to ensure it triggers an update.
          const [...versions] = this._versions;
          const [...loadingVersions] = this._loadingVersions;
          let version = {};
          let authors = {};
          let commits = {};
          let pulls = {};

          if (this._selectedVersion !== "" && typeof this._versionData[this._selectedVersion] !== "undefined") {
            const versionData = this._versionData[this._selectedVersion];
            version = versionData.config;
            authors = versionData.authors;
            commits = versionData.commits;
            pulls = versionData.pulls;
          }

          return html`
            <page-content>
                <shared-nav></shared-nav>
                <gr-index-entry></gr-index-entry>
                <gr-index-description></gr-index-description>

                ${this._isLoading ? html`
                    <h3>Loading...</h3>
                ` : html`
                    <div class="versions">
                        <gr-version-list
                            .versions="${versions}"
                            .loadingVersions="${loadingVersions}"
                            .selectedVersion="${this._selectedVersion}"
                            .selectedRelease="${this._selectedRelease}"
                            @versionclick="${this._onVersionClicked}"
                        ></gr-version-list>

                        ${this._selectedVersion !== "" ? html`
                            <gr-changes-list
                                .version=${version}
                                .authors="${authors}"
                                .commits="${commits}"
                                .pulls="${pulls}"

                                .selectedRepository="${this._selectedRepository}"
                                .selectedVersion="${this._selectedVersion}"
                                .selectedRelease="${this._selectedRelease}"
                                ?loading="${loadingVersions.indexOf(this._selectedVersion) >= 0}"
                            ></gr-changes-list>
                        ` : null}
                    </div>
                `}
            </page-content>
        `;
        }
      }]
    };
  }, LitElement);

  return EntryComponent;

}());
