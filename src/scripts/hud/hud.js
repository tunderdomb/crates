!function ( f ){
  crates.hud = f(window, document, {})
}(function ( win, doc, hud ){

  var eventProperties = [
    "click", "dblclick", "mousedown", "mouseup", "mouseover", "mousemove", "mouseout",
    "contextmenu", "selectstart",
    "drag", "dragstart", "dragenter", "dragover", "dragleave", "dragend", "drop",
    "keydown", "keypress", "keyup",
    "load", "unload", "abort", "error", "resize", "scroll",
    "select", "change", "submit", "reset", "focus", "blur", "beforeeditfocus",
    "focusin", "focusout", "DOMActivate",
    "DOMSubtreeModified", "DOMNodeInserted", "DOMNodeRemoved", "DOMNodeRemovedFromDocument",
    "DOMNodeInsertedIntoDocument", "DOMAttrModified", "DOMCharacterDataModified",
    "touchstart", "touchend", "touchmove", "touchenter", "touchleave", "touchcancel",
    "cut", "copy", "paste", "beforecut", "beforecopy", "beforepaste",
    "afterupdate", "beforeupdate", "cellchange", "dataavailable", "datasetchanged", "datasetcomplete", "errorupdate",
    "rowenter", "rowexit", "rowsdelete", "rowinserted",
    "beforeprint", "afterprint", "propertychange", "filterchange", "readystatechange", "losecapture"
  ]

  var FILTER_PICK = 1
    , FILTER_SKIP = 2
    , FILTER_IGNORE = 3

  hud.FILTER_PICK = FILTER_PICK
  hud.FILTER_SKIP = FILTER_SKIP
  hud.FILTER_IGNORE = FILTER_IGNORE

  hud.VIEW_ATTR = "data-view"
  hud.COMPONENT_ATTR = "data-component"
  hud.NAME_ATTR = "data-name"
  hud.ROLE_ATTR = "role"

  hud.events = eventProperties

  function merge( defaults, options ){
    var setup = {}, setting
    options = options || {}
    for ( setting in defaults ) setup[setting] = defaults[setting];
    for ( setting in options ) setup[setting] = options[setting];
    return setup
  }

  hud.merge = merge

  /**
   * Iterates over every child node, and according to the filter function's
   * return value, it picks, skips, or ignores a node.
   * Picked nodes will be part of the return array.
   * skipped nodes not, but their child nodes will still be checked.
   * Ignored nodes won't have their child nodes iterated recursively.
   * The root element will not be checked with the filter, only its child nodes.
   * */
  function filterElements( element, filter, deep ){
    var children = element.children || element
      , i = -1
      , l = children.length
      , ret = []
    if ( !l ) return ret
    while ( ++i < l ) {
      switch ( filter(children[i]) ) {
        case FILTER_PICK:
          ret.push(children[i])
          if ( deep ) ret = ret.concat(filterElements(children[i].children, filter, deep))
          break
        case FILTER_SKIP:
          if ( deep ) ret = ret.concat(filterElements(children[i].children, filter, deep))
          break
        case FILTER_IGNORE:
          break
      }
    }
    return ret
  }

  hud.filterElements = filterElements

  function dataset( el, prop, val ){
    if ( el.dataset ) return val == undefined ? el.dataset[prop] : el.dataset[prop] = val
    return val == undefined ? el.getAttribute("data-" + prop) : el.setAttribute("data-" + prop, val)
  }

  dataset.remove = function ( el, prop ){
    if ( el.dataset ) return delete el.dataset[prop]
    else return el.removeAttribute("data-" + prop)
  }

  hud.dataset = dataset

  hud.support = {
    htmlImport: 'import' in document.createElement('link'),
    templates: 'content' in document.createElement('template')
  }

// ###################### TEMPLATES ######################

  var templates = {}
  hud.templates = templates

  function RenderedTemplate( content ){
    this.childNodes = []
    var i = -1, l = content.childNodes.length
    while ( ++i < l ) {
      this.childNodes[i] = content.childNodes[i]
    }
    this.content = content
  }

  RenderedTemplate.prototype = {
    getContent: function (){
      var frag = doc.createDocumentFragment()
      var i = -1, l = this.childNodes.length
      while ( ++i < l ) {
        frag.appendChild(this.childNodes[i])
      }
      return frag
    },
    appendTo: function ( parent ){
      parent.appendChild(this.content)
    },
    prependTo: function ( parent ){
      parent.insertBefore(this.content, parent.childNodes[0])
    },
    insertAfter: function ( el ){
      if ( el.nextSibling ) el.parentNode.insertBefore(this.content, el.nextSibling)
      else el.parentNode.appendChild(this.content)
    },
    insertBefore: function ( el ){
      el.parentNode.insertBefore(this.content, el)
    },
    replace: function ( el ){
      el.parentNode.replaceChild(this.content, el)
    }
  }

  function Template( name, el ){
    this.name = name
    this.parent = el.parentNode
    this.template = el
    this.content = el.content
    this.isFragment = el.hasAttribute("data-fragment")
  }

  Template.prototype = {
    clone: function ( onlyFirstChild ){
      return onlyFirstChild ? this.content.cloneNode(true).children[0] : this.content.cloneNode(true)
    },
    /**
     * Renders the template.
     * If the template's name matches on of the registered View's name,
     * the template is treated as a View, and an appropriate View object
     * will be returned.
     * Otherwise a RenderedTemplate object is returned,
     * and if the template contained any Views, they will be available
     * with their name as attributes on the return object.
     * */
    render: function ( view ){
      var clone = this.clone(false)
        , v = hud.views[this.name]
        , args = [].slice.call(arguments)
      if ( view && view.view && hud.views[view.view] ) {
        v = view
        args.shift()
      }
      if ( v ) {
        if ( !this.isFragment ) clone = clone.children[0]
        return v.apply(null, [clone].concat(args))
      }
      else {
        return hud.renderComponents(clone, view || {})
      }
    }
  }
  function getTemplate( id ){
    return templates[id]
  }

  hud.getTemplate = getTemplate

  function registerTemplate( el ){
    function renderTemplate(){
      return renderTemplate.template.render.apply(renderTemplate.template, arguments)
    }

    renderTemplate.template = new Template(el.id, el)
    templates[el.id] = renderTemplate
  }

  hud.filterElements(document.body, function ( node ){
    if ( node.tagName == "TEMPLATE" ) {
      registerTemplate(node)
      return hud.FILTER_IGNORE
    }
    return hud.FILTER_SKIP
  }, true)

// ###################### View ######################

  var views = {}
    , VIEW_ATTR = hud.VIEW_ATTR
    , COMPONENT_ATTR = hud.COMPONENT_ATTR
    , NAME_ATTR = hud.NAME_ATTR

  hud.views = views

  function addListener( element, type, cb, context, capture ){
    element.addEventListener(type, function ( e ){
      cb.call(context || this, e)
    }, capture||false)
  }

  function applyDataset( el, set ){
    for ( var data in set ) {
      dataset(el, data, set[data])
    }
  }

  /**
   * Just a shortcut
   * */
  function instantiateView( name, el ){
    return views[name] != undefined ? views[name].apply(null, [].slice.call(arguments, 1)) : null
  }

  /**
   * processes a component object with an element.
   * - function components gets called render time
   * - string types are considered data, and assumed that the node
   *   has a writable property (e.g. `value`, `src`, etc.) that can be assigned with it
   * - object types are iterated over.
   *     - if a member property of this object is an event name,
   *       and its value is a function, the function is added as a listener for that event
   *     - if the property is `dataset` the values if the `dataset` object are assigned
   *       to the element's dataset object
   *     - if none of these matches, but the element has an attribute with the member name,
   *       and it is not a function, it is then added as an attribute to the element
   * */
  function renderComponent( element, component, view ){
    switch ( typeof component ) {
      case "function":
        element = component.call(view, element) || element
        break
      case "string":
      case "number":
        if ( "value" in element ) element.value = component
        else if ( "src" in element ) element.src = component
        else element.textContent = component
        break
      default:
        for ( var prop in component ) {
          if ( prop == "dataset" )
            applyDataset(element, component.dataset)
          else if ( ~eventProperties.indexOf(prop.replace(/^on/, "")) && typeof component[prop] == "function" )
            addListener(element, prop.replace(/^on/, ""), component[prop], view)
          else if ( typeof component[prop] != "function" ) {
            if ( prop in element ) {
              var temp = element[prop]
              // some attributes can't be set with assignment
              // in this case the assigned value is ignored so we set it with setAttribute()
              element[prop] = component[prop]
              if ( element[prop] === temp && element.setAttribute )
                element.setAttribute(prop, component[prop])
            }
            else if ( prop in element && element.setAttribute ) {
              element.setAttribute(prop, component[prop])
            }
          }
        }
    }
    return element
  }

  /**
   * renders view components. Sub views first, then own components.
   * Attaches subviews to the view object if they have a name on their node.
   *
   * */
  function renderComponents( el, view ){
    filterElements(el, function ( node ){
      var name, viewName, component, blueprint

      // render sub views first so their components won't get confused to first level ones
      if ( viewName = node.getAttribute(VIEW_ATTR) ) {
        if ( name = node.getAttribute(NAME_ATTR) ) {
          blueprint = view[name]
        }
        else {
          console.warn("Missing name for nested View: ", node, "inside", el)
        }
        view[name] = instantiateView.apply(null, [viewName, node].concat(blueprint))
        return FILTER_IGNORE
      }
      // render view components
      name = node.getAttribute(COMPONENT_ATTR)
      if ( name ) {
        if ( view[name] != undefined ) {
          if ( (typeof view[name] != "string") && view[name].length ) {
            var l = view[name].length
              , i = -1
            while ( ++i < l ) {
              component = renderComponent(node, view[name][i], view)
            }
          }
          else {
            component = renderComponent(node, view[name], view)
          }
          view[name] = component
        }
        else {
          view[name] = node
        }
      }
      return FILTER_SKIP
    }, true)
    return view
  }

  hud.renderComponents = renderComponents

  /**
   * View
   * The main View constructor
   * It has basic functionality.
   * Firstly, it handles content resolution.
   * If the contained element is a document fragment, it always returns a copy of it.
   * It not, simply the element is returned.
   * It can be checked by the isFragment flag.
   * It also has basic support for node manipulation like appending, inserting and removing.
   * */
  function View(){}

  View.prototype = {
    element: null,
    isFragment: false,
    onCreate: null,
    onRendered: null,
    superOnCreate: null,
    superOnRendered: null,
    getContent: function (){
      if ( this.isFragment ) {
        var frag = doc.createDocumentFragment()
          , i = -1, l = this.element.length
        while ( ++i < l ) {
          frag.appendChild(this.element[i])
        }
        return frag
      }
      else return this.element
    },
    appendTo: function ( parent ){
      if ( parent instanceof View ) parent = parent.element
      parent.appendChild(this.getContent())
      return this
    },
    prependTo: function ( parent ){
      if ( parent instanceof View ) parent = parent.element
      parent.insertBefore(this.getContent(), parent.childNodes[0])
      return this
    },
    insertAfter: function ( el ){
      if ( el instanceof View ) el = el.element
      if ( el.nextSibling ) el.parentNode.insertBefore(this.getContent(), el.nextSibling)
      else el.parentNode.appendChild(this.getContent())
      return this
    },
    insertBefore: function ( el ){
      if ( el instanceof View ) el = el.element
      el.parentNode.insertBefore(this.getContent(), el)
      return this
    },
    replace: function ( el ){
      if ( el instanceof View ) el = el.element
      el.parentNode.replaceChild(this.getContent(), el)
      return this
    },
    remove: function (){
      if ( this.isFragment ) {
        var i = -1, l = this.element.length
        while ( ++i < l ) {
          if ( this.element[i].parentNode )
            this.element[i].parentNode.removeChild(this.element[i])
        }
      }
      else if ( this.element.parentNode ) {
        this.element.parentNode.removeChild(this.element)
      }
    },
    setData: function ( name, value ){
      this.element.setAttribute("data-" + name, value)
      return this
    },
    getData: function ( name ){
      return this.element.getAttribute("data-" + name)
    },
    removeData: function ( name ){
      this.element.removeAttribute("data-" + name)
      return this
    },
    on: function( el, event, callback, capture ){
      if( typeof el == "string" ){
        capture = callback
        callback = event
        event = el
        el = this.element
      }
      addListener(el, event, callback, this, capture)
    }
  }
  View.superOnCreate = []
  View.superOnRendered = []

  /**
   * Copies prototype members when extending a view
   * */
  function extendComponents( obj, ext ){
    var val
    for ( var prop in ext ) {
      val = ext[prop]
      if ( obj[prop] != undefined && typeof obj[prop] != "function" ) {
        val = obj[prop].concat
          ? obj[prop].concat(val)
          : [obj[prop], val]
      }
      obj[prop] = val
    }
    return obj
  }

  /**
   *
   * */
  function extendView( name, base, onCreate, onRendered, proto ){
    function CreateView(){
      if ( !arguments.length ) return
      return new (Function.prototype.bind.apply(V, [null].concat([].slice.call(arguments))))()
    }

    function V( el ){
//      debugger
      var args = [].slice.call(arguments, 1)
      // call onCreates
      superOnCreate(this, args)
      // render components
      if ( this.element ) {
        renderComponent(el, this.element, this)
      }
      renderComponents(el, this)
      // assign element
      if ( el instanceof DocumentFragment ) {
        this.isFragment = true
        this.element = []
        for ( var i = -1, l = el.childNodes.length; ++i < l; ) {
          this.element.push(el.childNodes[i])
        }
      }
      else {
        this.element = el
      }
      // call onRendered()
      superOnRendered(this, args)
    }

    function superOnCreate( view, args ){
      for ( var i = -1, l = CreateView.superOnCreate.length; ++i < l; ) {
        CreateView.superOnCreate[i].apply(view, args)
      }
    }

    function superOnRendered( view, args ){
      for ( var i = -1, l = CreateView.superOnRendered.length; ++i < l; ) {
        CreateView.superOnRendered[i].apply(view, args)
      }
    }

    V.prototype = new base()
    extendComponents(V.prototype, proto)
    V.prototype.constructor = onCreate
    CreateView.view = name
    CreateView.superOnCreate = base.superOnCreate.concat(onCreate||[])
    CreateView.superOnRendered = base.superOnRendered.concat(onRendered || [])
    CreateView.prototype = V.prototype
    CreateView.prototype.super = base.prototype

    if ( name ) views[name] = CreateView
    return CreateView
  }

  /**
   * CreateView
   * */
  hud.createView = function( view ){
    if( !view ) throw new Error("Invalid arguments: No arguments.")
    var name = view.name
      , onCreate = typeof view == "function" ? view : view.onCreate
      , proto = view.prototype || onCreate.prototype || {}
    name = name || onCreate.name
    if( !name ) console.warn("View has no name: %o", view)
    return extendView(name, view.extend||View, onCreate, view.onRendered, proto)
  }

  hud.View = View

  hud.getView = function ( name ){
    return views[name]
  }

  return hud
});