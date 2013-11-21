!function( f ){
  f(crates.hud)
}( function( hud ){

  /**
   * looks for option values in the dataset object, among attributes
   * counts possible prefixed and non prefixed values too
   * @param {Element} el
   * @param {String} roleName
   * @return {Object} options
   */
  function findOptions( el, roleName ){
    var options = {}
      , defaults = roles[roleName].defaults
      , prefixed = roleName + "-"
      , prefixedData = "data-" + prefixed
    for ( var prop in defaults ) {
      if ( el.hasAttribute(prop) ) {
        options[prop] = el.getAttribute(prop)
      }
      else if ( el.hasAttribute(prefixed + prop) ) {
        options[prop] = el.getAttribute(prefixed + prop)
      }
      else if ( el.hasAttribute(prefixedData + prop) ) {
        options[prop] = el.getAttribute(prefixedData + prop)
      }
    }
    return options
  }

  function findFirst( element, filter ){
    var children = element.children || element
      , i = -1
      , l = children.length
      , ret
    while ( ++i < l ) {
      if ( ret = filter(children[i]) ) {
        return ret
      }
      if ( children[i].children.length ) {
        if ( ret = hud.filterElements(children[i].children, filter) ) {
          return ret
        }
      }
    }
  }

  var roles = {}
    , ROLE_ATTR = hud.ROLE_ATTR

  function Role( el ){
    this.element = el
  }

  /**
   * @example
   * <code>
   * Role.extend({
   *   name: "",
   *   defaults: {},
   *   create: function( element ){ ... }
   * });
   * </code>
   * */
  Role.extend = function( blueprint ){
    var name = blueprint.name
      , defaults = blueprint.defaults || {}
      , create = blueprint.create
    delete blueprint.name
    delete blueprint.defaults
    delete blueprint.create
    create.prototype = blueprint
    return roles[name] = function( el, options ){
      var role = new Role(el)
      create.apply(role, el)
      return hud.extend(role, hud.merge(defaults, options))
    }
  }

  hud.Role = Role

  hud.hasRole
  hud.findRole
  hud.getByRole = function ( el, role ){
    var xp
    if ( el.querySelector ) {
      return el.querySelector("[" + ROLE_ATTR + "*=" + role + "]")
    }
    xp = new RegExp("(?:^.*?\\s|^)" + role + "(?:\\s+.*$|$)")
    return findFirst(el, function( node ){
      if( xp.test(node.getAttribute(ROLE_ATTR) || "") && node )
        return hud.FILTER_PICK
      return hud.FILTER_SKIP
    })
  }

  hud.addRole = function( element, roleName, options ){
    if ( !roles[roleName] ) {
      return false
    }
    options = options || findOptions(element, roleName)
    // remove the applied role from the attribute, so it won't get added twice
    var role = element.getAttribute("role")
    if( role ) element.setAttribute("role", role.replace(new RegExp("(^|\\s)"+roleName+"(\\s|$)|^\\s+|\\s+$", 'g'), " ").replace(/\s+/g, ""))
    if( !element.getAttribute("role") ) element.removeAttribute("role")
    return roles[roleName](element, options)
  }

  function addRoleToOne( el ){
    var roleList = el.getAttribute(roles.ROLE_ATTR)
    if( !roleList ) return
    roleList = roleList.split(/\s+/)
    for ( var i = -1, l = roleList.length; ++i < l; ) {
      hud.addRole(el, roleList[i])
    }
  }
  function addRoleToAll( el ){

  }

  hud.applyRole = function ( el, toChildrenToo ){
    return toChildrenToo ? addRoleToAll(el) : addRoleToOne(el)
  }

} )