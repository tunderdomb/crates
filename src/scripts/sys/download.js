!function ( f ){
  f(window, document, sistem)
}(function (win, doc, sis){
  function buildBlob( data, mime ){
    mime = mime || defaultMime
    if( Blob ) return new Blob([data], {type: mime})
    var builder = new BlobBuilder()
    builder.append(data)
    return builder.getBlob(mime || defaultMime)
  }

  var download = function(  ){}
    , downloadAttribute = "download" in document.createElement('a')
    , BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder
    , URL = window.URL || window.webkitURL || window.mozURL || window.msURL
    , defaultMime = "application/octet-stream"
    , defaultName = "download.bin"
    , browserMimes = [
      "image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/bmp", "image/x-windows-bmp", "image/webp",
      "audio/wav", "audio/mpeg", "audio/webm", "audio/ogg",
      "video/mpeg", "video/webm", "video/ogg",
      "text/plain", "text/html", "text/xml",
      "application/xhtml+xml", "application/json"
    ]

  if ( (Blob || BlobBuilder) && window.saveAs ) download = function ( data, name, mime ){
    if ( window.saveAs ) window.saveAs(buildBlob(data, mime), name || defaultName)
  }
  else if ( (Blob || BlobBuilder)  && URL ) download =  function ( data, name, mime ){
    var url = URL.createObjectURL(buildBlob(data, mime))

    mime = mime || defaultMime

    if ( downloadAttribute ) {
      var link = document.createElement("a")
        , event = document.createEvent("MouseEvents")
      event.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null)
      link.href = url
      link.download = name
      link.dispatchEvent(event)
    }
    else{
      mime = ~browserMimes.indexOf(mime.split(";")[0]) ? defaultMime : mime
      window.open(url, "_blank", "")
    }
    setTimeout(function(  ){
      URL.revokeObjectURL(url)
    }, 100)
  }

  /**
   * initiates a download
   * data: String
   * name: String the name of the file to download
   * mime: String the mime type of the file
   * */
  sis.download = function( data, name, mime ){
    return download(data, name, mime)
  }
});