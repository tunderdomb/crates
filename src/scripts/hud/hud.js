!function ( f ){
  crates.hud = f({})
}(function( hud ){

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

  function extend( object, extension ){
    for ( var property in extension ) {
      object[property] = extension[property]
    }
    return object
  }
  hud.extend = extend

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
          if( deep ) ret = ret.concat(filterElements(children[i].children, filter, deep))
          break
        case FILTER_SKIP:
          if( deep ) ret = ret.concat(filterElements(children[i].children, filter, deep))
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
  dataset.remove = function( el, prop ){
    if( el.dataset ) return delete el.dataset[prop]
    else return el.removeAttribute("data-"+prop)
  }

  hud.dataset = dataset

  return hud
});