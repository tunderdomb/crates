!function ( f ){
  window.crates = f({})
}(function( crates ){
  crates.hud = {}
  crates.sys = {}
  crates.file = {}
  crates.image = {}
  crates.path = {}
  crates.local = {}
  crates.storage = {}
  crates.remote = {}
  crates.dom = {}
  crates.templates = {}
  crates.roles = {}
  crates.animation = {}
  crates.collections = {}
  crates.graphics = {}
  crates.util = {
    undoStack: {}
  }

  var modules = {}
  function notifyWaitingModules( name, loadedModule ){
    var m
    for( m in modules ){
      if( !m.loaded ) m.onModuleLoaded(name, loadedModule)
    }
    for( m in modules ){
      if( !m.loaded ) m.run()
    }
  }
  function Module( name, run ){
    this.name = name
    this.loaded = false
    this.imports = []
    this.toLoad = 0
    this.run = function(  ){
      if ( this.isReadyToRun() ) {
        modules[name] = typeof run == "function" ? run(this.imports) : run
        this.loaded = true
        notifyWaitingModules()
      }
    }
  }
  Module.prototype = {
    isReadyToRun: function(  ){
      return !this.loaded && this.toLoad == 0
    },
    onModuleLoaded: function( name, def ){
      if( !~this.imports.indexOf(name) ) return
      this.imports[this.imports.indexOf(name)] = def
      --this.toLoad
    },
    require: function( imports ){
      this.imports = imports
      return this
    }
  }

  crates.module = function( name, run ){
    if( modules[name] !== undefined ) throw new Error("Module "+name+" already exists!")
    return new Module(name, run)
  }
  crates.module("asd", function(  ){

  }).require([]).run()
  return crates
});