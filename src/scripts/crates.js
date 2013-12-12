//var crates = {}
var crates = function( nudge, create ){
  var list = nudge()
  for ( var i = -1, l = list.length; ++i < l; ) {
    if( list[i] === undefined ) return
  }
  create.apply(null, nudge)
}
!function( f ){
  f(crates)
}(function( crates ){
  var modules = {}
  function notifyWaitingModules( name, loadedModule, definition ){
    var m
//    console.log("module loaded: "+name, loadedModule)
    for( m in modules ){
      if( !modules[m].loaded ) modules[m].onModuleLoaded(name, definition)
    }
    for( m in modules ){
      if( !modules[m].loaded ) modules[m].run()
    }
  }
  function getLoadedModule( name ){
    return modules[name] !== undefined && modules[name].loaded ? modules[name] : null
  }
  function checkCircularReference( mod ){
    for( m in modules ){
      if( modules[m].hasImport(mod.name) && mod.hasImport(m) ) {
        throw new Error("Circular dependency in module '"+mod+"' from '"+m+"'. It may never load.")
      }
    }
  }
  function Module( name, run ){
    this.name = name
    this.loaded = false
    this.boundArguments = []
    this.importArguments = []
    this.imports = []
    this.toLoad = 0
    this.def = null
    this.context = null
    this.run = function(  ){
      this.resolveImports()
      if ( this.isReadyToRun() ) {
        this.def = typeof run == "function" ? run.apply(this.context, this.boundArguments.concat(this.importArguments)) : run
        this.loaded = true
        notifyWaitingModules(name, this, this.def)
      }
    }
  }
  Module.prototype = {
    isReadyToRun: function(  ){
      return !this.loaded && this.toLoad == 0
    },
    onModuleLoaded: function( name, def ){
      var i = this.imports.indexOf(name)
      if( !~i || this.importArguments[i] === def ) return
      this.importArguments[i] = def
      --this.toLoad
    },
    bindArguments: function( boundArguments ){
      this.boundArguments = boundArguments || []
    },
    require: function( imports ){
      this.imports = imports || []
      this.toLoad = this.imports.length
      checkCircularReference(this)
      return this
    },
    setContext: function( context ){
      this.context = context
    },
    hasImport: function( name ){
      return !!~this.imports.indexOf(name)
    },
    resolveImports: function(  ){
      var i = -1
        , l = this.imports.length
        , name, mod
      while ( ++i < l ) {
        name = this.imports[i]
        mod = getLoadedModule(name)
        if( mod !== null ) this.onModuleLoaded(name, mod.def)
      }
    }
  }

  function registerModule( detail ){
    if( modules[detail.name] !== undefined ) throw new Error("Module "+detail.name+" already exists!")
    var mod = new Module(detail.name, detail.run)
    mod.bindArguments(detail.bind)
    mod.setContext(detail.context)
    mod.require(detail.import)
    modules[detail.name] = mod
    mod.run()
  }
  addEventListener("module", function ( e ){
    registerModule(e.detail)
  }, false)
});