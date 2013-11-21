!function ( f ){
  f(crates.hud)
}(function ( hud ){

  var views = {}
    , VIEW_ATTR = hud.VIEW_ATTR
    , COMPONENT_ATTR = hud.COMPONENT_ATTR
    , NAME_ATTR = hud.NAME_ATTR
    , eventProperties = hud.events
    , FILTER_PICK = hud.FILTER_PICK
    , FILTER_SKIP = hud.FILTER_SKIP
    , FILTER_IGNORE = hud.FILTER_IGNORE
    , filterElements = hud.filterElements
    , dataset = hud.dataset

  function addListener( element, type, cb, context ){
    debugger
    element.addEventListener(type, function ( e ){
      cb.call(context || this, e)
    }, false)
  }

  function applyDataset( el, set ){
    for ( var data in set ) {
      dataset(el, data, set[data])
    }
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
          else if ( prop in element && typeof element[prop] != "function" ) {
            var temp = element[prop]
            // some attributes can't be set with assignment
            // in this case the assigned value is ignored so we set it with setAttribute()
            element[prop] = component[prop]
            if ( element[prop] === temp && element.setAttribute ) element.setAttribute(prop, component[prop])
          }
          else if ( prop != "element" && element.setAttribute ) element.setAttribute(prop, component[prop])
        }
    }
    return element
  }

  /**
   * Just a shortcut
   * */
  function createView( name, el ){
    return views[name] != undefined ? views[name](el) : null
  }

  /**
   * renders view components. Sub views first, then own components.
   * Attaches subviews to the view object if they have a name on their node.
   *
   * */
  function renderComponents( el, view ){
    filterElements(el, function ( node ){
      var name, subview, component

      // render sub views first so their components won't get confused to first level ones
      if ( node.hasAttribute(VIEW_ATTR) ) {
        name = node.getAttribute(NAME_ATTR)
        subview = createView(node)
        if( name ) view[name] = subview
        return FILTER_IGNORE
      }
      // render view components
      name = node.getAttribute(COMPONENT_ATTR)
      if ( name && view[name] != undefined ) {
        if ( view[name].length ) {
          var l = view[name].length
          while ( l--> 0 ) {
            component = renderComponent(node, view[name][l], view)
          }
        }
        else {
          component = renderComponent(node, view[name], view)
        }
        view[name] = component
        return FILTER_SKIP
      }
      return FILTER_SKIP
    }, true)
  }

  /**
   * View
   * */
  function View( el ){
    if ( !arguments.length ) return
    if ( !(el instanceof Element) ) throw new Error("Not an element! "+el)
    this.element = el
    renderComponent(el, this, this)
    renderComponents(el, this)
  }

  /**
   * Copies prototype members when extending a view
   * */
  function extendComponents( obj, ext ){
    var val
    for ( var prop in ext ) {
      val = ext[prop]
      if ( obj[prop] != undefined ) {
        val = obj[prop].length ? obj[prop].concat(val) : [obj[prop], val]
      }
      obj[prop] = val
    }
    return obj
  }

  /**
   *  Registers a view on the global view cache with the given name
   *  Returns a wrapper that instantiates a view object and returns it
   * */
  function registerView( name, base, onCreate, proto ){
    function View(){
      var i = -1
        , l = onCreate.base.length
      while ( ++i < l ) {
        onCreate.base[i].apply(this, arguments)
      }
      onCreate.apply(this, arguments)
    }

    function create(){
      return new (Function.prototype.bind.apply(View, [null].concat([].slice.call(arguments))))()
    }

    View.prototype = {}
    onCreate.base = base.base ? base.base.concat(base) : [base]
    base.proto && extendComponents(View.prototype, base.proto)
    proto && extendComponents(View.prototype, proto)
    onCreate.proto = View.prototype
    if ( name ) views[name] = create
    return create
  }

  View.extend = function ( name, viewBlueprint ){
    var onCreate = viewBlueprint.onCreate
    delete viewBlueprint.onCreate
    var viewCreator = registerView(name, View, onCreate, viewBlueprint)
    viewCreator.extend = function ( name, extension ){
      var eOnCreate = extension.onCreate
      delete extension.onCreate
      return registerView(name, onCreate, eOnCreate, extension)
    }
    return viewCreator
  }

  hud.View = View

  hud.getView = function( name ){
    return views[name]
  }

});