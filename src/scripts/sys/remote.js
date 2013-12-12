!function ( f ){
  crates.remote = f(window, document, {})
}(function (win, doc, remote){

  function ajax( options ){
    var http =  new XMLHttpRequest()
      , done = options.done || options.load
      , error = options.error
      , progress = options.progress
      , async = options.async == undefined ? true : !!options.async

    if( done ) http.addEventListener("load", function( e ){
      done(http.response, http, e)
    }, false)
    if( error ) http.addEventListener("error", error, false)
    if( progress ) http.addEventListener("progress", progress, false)

    http.open(options.method, options.url, async)
    if( options.mime ) http.overrideMimeType(options.mime)
    if( options.responseType ) http.responseType = options.responseType
    http.send(options.data)
  }
  remote.http = {
    get: function( options ){
      var args
      if( typeof options == "string" ){
        args = [].slice.call(arguments)
        options = {
          done: args.pop(),
          url: args.pop()
        }
      }
      options.method = "GET"
      return ajax(options)
    },
    post: function( options ){
      var args
      if( typeof options == "string" ){
        args = [].slice.call(arguments)
        options = {
          done: args.pop(),
          url: args.pop()
        }
      }
      options.method = "POST"
      return ajax(options)
    }
  }

  return remote
});