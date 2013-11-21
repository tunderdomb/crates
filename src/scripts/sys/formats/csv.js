!function ( f ){
  sistem.csv = f(window, document, sistem, {})
}(function (win, doc, sis, csv, undefined){

  function noop(){}

  function createValue( cellData, CONVERT_TYPES ){
    if( CONVERT_TYPES ) {
      if( /^\d+(?:[\.,]\d+)?$/.test(cellData) ) return cellData-0
      if( /^\s*false\s*$/i.test(cellData) ) return false
      if( /^\s*true\s*$/i.test(cellData) ) return true
      if( /^\s*null\s*$/i.test(cellData) ) return null
    }
    return cellData
  }

  function createRow( header, rowData, options ){
    var i = -1
      , l = header.length
      , title
      , CONVERT_TYPES = options.valueDelimiter == undefined ? csv.options.convertTypes : options.convertTypes
      , row = {}
    if( options.header === false ) {
      row = []
      while ( ++i < l ) {
        row[i] = createValue(rowData[i], CONVERT_TYPES)
      }
    }
    else while ( ++i < l ) {
      title = header[i]
      row[title] = createValue(rowData[i], CONVERT_TYPES)
    }
    return row
  }

  function parse( text, options ){
    options = options || csv.options
    var i = -1
      , l = text.length
      , header = options.header
      , width
      , ROW_SEP = options.rowDelimiter || csv.options.rowDelimiter
      , VAL_SEP = options.valueDelimiter || csv.options.valueDelimiter
      , D_QUOTE = "\""
      , S_ESCAPE = 0
      , S_VALUE = 1
      , matrix = []
      , row = []
      , valueCache = ""
      , token
      , state

    while ( ++i < l ) switch( token = text[i] ){

      // value
      case VAL_SEP:
        // value separator in escaped sequence
        if( state == S_ESCAPE ) {
          valueCache += text[++i]
          break
        }
        // a row is longer than the header
        if( row.length == width ) return new Error("Malformed CSV")

        row.push(valueCache)
        valueCache = ""
        break

      // row
      case ROW_SEP:
        // row separator in escaped sequence
        if( state == S_ESCAPE ) {
          valueCache += text[++i]
          break
        }
        // register headers
        if( !matrix.length ) {
          if( header === false ) {
            header = new Array(width = row.length)
            matrix.push(createRow(header, row, options))
          }
          else {
            header = row
            width = header.length
          }
        }
        // add row to matrix
        else {
          matrix.push(createRow(header, row, options))
        }
        row = []
        break

      // double quote
      case D_QUOTE:
        // escaping one character
        if( text[i+1] == D_QUOTE || text[i+1] == VAL_SEP ) {
          valueCache += text[++i]
        }
        else if( state == S_ESCAPE ) {
          // return to normal state
          state = S_VALUE
        }
        // enter escaping state
        else state = S_ESCAPE
        break

      // accumulate data
      default:
        valueCache += token
    }
    if( row.length ) matrix.push(createRow(header, row, options))
    return matrix
  }

  function CSV( source, options ){
    var done = noop
      , error = noop
    if( typeof source == "string" ){
      if( /^http|^\//.test(source) ){
        sistem.http.get(source, function( csvText ){
          done(parse(csvText, options))
        })
      }
      else {
        done(parse(source, options))
      }
    }
    else if( source instanceof File ){
      sis.file.readAsText(source, function( csvText ){
        var result = parse(csvText, options)
        result instanceof Error
          ? error(result)
          : done(result)
      })
    }
    this.done = function( f ){
      done = f
      return this
    }
    this.error = function( f ){
      error = f
      return this
    }
  }

  csv.options = {
    convertTypes: true,
    valueDelimiter: ",",
    rowDelimiter: "\n",
    header: null
  }

  csv.parse = function( source, options ){
    return new CSV(source, options)
  }
  csv.stringify = function( object ){

  }

  return csv
});