!function ( f ){
  crates.sys = f(window, document, {})
}(function ( win, doc, sys ){

  function noop(){}

  function extend( o, e ){
    for( var prop in e ){
      o[prop] = e[prop]
    }
    return o
  }

  var KB = 1024
    , MB = 1024 * KB
    , GB = 1024 * MB
    , TB = 1024 * GB

  sys.extend = function( o ){
    extend(sys, o)
  }

  sys.KB = KB
  sys.MB = MB
  sys.GB = GB
  sys.TB = TB

  sys.space = {
    /** converts a value from a unit to another
     * the unit is assumed to be in bytes, if not provided
     * */
    convert: function( bytes, toUnit, fromUnit ){
      bytes = bytes/(fromUnit||1)
    },
    /**
     * calculates the dynamic representation of a storage unit according to unit tiers
     * if precision if given, the return value will be rounded according to it
     * */
    dynamic: function( bytes, precision ){
      precision = precision || 1
      return bytes > TB ? ((bytes / TB) * precision >> 0) / precision + "TB"
        : bytes > GB ? ((bytes / GB) * precision >> 0) / precision + "GB"
        : bytes > MB ? ((bytes / MB) * precision >> 0) / precision + "MB"
        : bytes > KB ? ((bytes / KB) * precision >> 0) / precision + "KB"
        : bytes + "B"
    }
  }

  sys.file = {
    readAsText: function ( file, done ){
      var reader = new FileReader()
      reader.onloadend = function ( e ){
        reader.onloadend = null
        done(this.result)
      }
      reader.readAsText(file)
    },
    readAsArrayBuffer: function ( file, done ){
      var reader = new FileReader()
      reader.onloadend = function ( e ){
        reader.onloadend = null
        done(this.result)
      }
      reader.readAsArrayBuffer(file)
    },
    readAsBinaryString: function ( file, done ){
      var reader = new FileReader()
      reader.onloadend = function ( e ){
        reader.onloadend = null
        done(this.result)
      }
      reader.readAsBinaryString(file)
    },
    readAsDataURL: function ( file, done ){
      var reader = new FileReader()
      reader.onloadend = function ( e ){
        reader.onloadend = null
        done(this.result)
      }
      reader.readAsDataURL(file)
    },
    readAsJSON: function( file, done ){
      var reader = new FileReader()
      reader.onloadend = function ( e ){
        reader.onloadend = null
        var result
        try {
          result = JSON.parse(this.result)
        }
        catch ( e ) {
          done(null, e)
          return
        }
        done(result)
      }
      reader.readAsText(file)
    }
  }

  sys.path = {
    concat: function (  ){
      var path = arguments[0].toString().replace(/\/$/, "")
      for ( var i = 0, l = arguments.length; ++i < l; ) {
        path += "/" + arguments[i].toString().replace(/^\/|\/$/g, "")
      }
      return path
    },
    getDir: function( path ){
      return path.replace(/^(\/?.*)\/.*?$/, "$1")
    },
    getFileName: function( path ){
      return path.replace(/^(?:.*\/)?(.+)\..+$/, "$1")
    },
    getParentDir: function( path ){
      return path.replace(/^(?:.*\/)?(.+)\..+$/, "$1")
    },
    replaceDir: function( path, newPath ){
      return path.replace(/(?:^.*\/|^)(.*?\.\w+)$/, newPath.replace(/\/$/, "") + "/$1")
    },
    renameFile: function( path, newName ){
      return path.replace(/(^.*\/|^).*(\.\w+)/, "$1" + newName + "$2")
    },
    stripExtension: function( path ){
      return path.replace(/^(.+)(\.\w+)$/, "$1")
    }
  }

  sys.extend({
    isImage: function( pathOrFile ){
      return typeof pathOrFile == "string"
        ? /\.(jpe?g|png|gif)$/i.test(pathOrFile)
        : /image.*/.test(pathOrFile.type)
    },
    isAudio: function( pathOrFile ){
      return typeof pathOrFile == "string"
        ? /\.(jpe?g|png|gif)$/i.test(pathOrFile)
        : /image.*/.test(pathOrFile.type)
    },
    isVideo: function( pathOrFile ){
      return typeof pathOrFile == "string"
        ? /\.(jpe?g|png|gif)$/i.test(pathOrFile)
        : /image.*/.test(pathOrFile.type)
    }
  })

  /**
   * converts data URL to Blob of a specified type
   * */
  sys.datURLtoBlob = function ( dataURL, type ){
    var binary = atob(dataURL.split(",")[1])
      , i = -1, l = binary.length
      , array = new Array(l)
    type = type && {type: type} || {}
    while ( ++i < l ) {
      array[i] = binary.charCodeAt(i)
    }
    return new Blob([new Uint8Array(array)], type)
  }

  /**
   * converts imageData (from a Canvas) to Blob
   * */
  sys.imageDataToBlob = function ( imageData ){
    var canvas = doc.createElement("canvas").getContext("2d")
    canvas.canvas.width = imageData.width
    canvas.canvas.height = imageData.height
    canvas.putImageData(imageData, 0, 0)
    return sys.datURLtoBlob(canvas.canvas.toDataURL(imageData.type), imageData.type)
  }

  /**
   * resizes an Image to the given dimensions keeping the aspect ratio
   * */
  sys.resizeImage = function ( sourceImage, maxWidth, maxHeight, done ){
    var canvas = doc.createElement("canvas")
      , context = canvas.getContext("2d")
      , img = new Image()
      , width, height, ret
      , src, urlSrc

    function resize(){
      width = img.width
      height = img.height
      if ( width > height ) {
        if ( width > maxWidth ) {
          height *= maxWidth / width
          width = maxWidth
        }
      }
      else {
        if ( height > maxHeight ) {
          width *= maxHeight / height
          height = maxHeight
        }
      }
      canvas.width = width
      canvas.height = height
      context.drawImage(img, 0, 0, width, height)
      done(ret)
    }

    ret = {
      dataURL: function (){
        return canvas.toDataURL(sourceImage.type)
      },
      blob: function (){
        return sys.datURLtoBlob(canvas.toDataURL(sourceImage.type), sourceImage.type)
      }
    }
    if ( sourceImage instanceof Image ) {
      img = sourceImage
      resize()
    }
    else {
      if ( typeof sourceImage == "string" ) {
        src = sourceImage
      }
      else if ( sourceImage instanceof Blob ) {
        urlSrc = win.URL.createObjectURL(sourceImage)
      }
      img.onload = resize
      img.src = src || urlSrc
      urlSrc && win.URL.revokeObjectURL(urlSrc)
    }
    return ret
  }

  /**
   * iterates over async tasks and provides an all finished callback
   * each task has to call a progress method to advance the process
   * taskArray: Array
   * process: function(taskArray[i], function progress, i)
   * done: function
   * throttle: Number in millisecs to throttle each tasks execution
   * */
  sys.batch = function batch( taskArray, process, done, throttle ){
    function progress( err, errData ){
      err === false && errData && failed.push(errData)
      ++loaded == toLoad && done && done()
    }

    var i, toLoad = 0, loaded = 0
      , failed = []
      , obj

    if ( !("length" in taskArray) ) {
      obj = taskArray
      taskArray = []
      for ( i in obj ) taskArray.push(obj[i]);
      obj = null
    }

    toLoad = taskArray.length
    i = -1

    if ( !toLoad ) return done && done()

    if ( throttle ) {
      while ( ++i < toLoad ) {
        setTimeout((function ( i ){
          return function ( task ){
            process(task, progress, i)
          }
        }(i)), throttle)
      }
    }
    else while ( ++i < toLoad ) {
      if ( process(taskArray[i], progress, i) === false ) {
        failed.push(taskArray[i])
      }
    }

    return failed
  }

  return sys
});