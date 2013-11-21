!function ( f ){
  f(window, document, crates.sys)
}(function (win, doc, sis){

  function resolveNs( ns, obj ){
    ns = ns.split(".")
    var name
    while ( name = ns.shift() ) {
      obj = obj[name]
    }
    return obj
  }

  function getNameSpace( accessor ){
    var match = accessor.match(/^(\w+)(?:\.(.+?)?(?:\.(\w+))?)?$/)
      , global, key, space, root

    if ( !match ) return
    global = match[1]
    root = localStorage.getItem(global)
    if ( !root ) return
    root = JSON.parse(root)
    if( match[3] ) {
      key = match[3]
      space = resolveNs(key, root)
    }
    else {
      key = match[2]
      space = root
    }

    return {
      global: global,
      root: root,
      space: space,
      key: key
    }
  }

  sis.localStorage = {
    isSupported: true,
    get: function( accessor ){
      if ( /\./.test(accessor) ) {
        var nameSpace = getNameSpace(accessor)

        if( nameSpace ) return nameSpace.space[nameSpace.key]
      }
      else return JSON.parse(localStorage.getItem(accessor))
    },
    set: function( accessor, value ){
      if ( /\./.test(accessor) ) {
        var nameSpace = getNameSpace(accessor)
        if( !nameSpace ) return
        nameSpace.space[nameSpace.key] = value
        localStorage.setItem(nameSpace.global, JSON.stringify(nameSpace.root))
      }
      else {
        localStorage.setItem(accessor, JSON.stringify(value))
      }
      return value
    },
    remove: function( accessor ){
      if ( /\./.test(accessor) ) {
        var nameSpace = getNameSpace(accessor)
        if( !nameSpace ) return false
        delete nameSpace.space[nameSpace.key]
        localStorage.setItem(nameSpace.global, JSON.stringify(nameSpace.root))
      }
      localStorage.removeItem(accessor)
      return true
    }
  }
});