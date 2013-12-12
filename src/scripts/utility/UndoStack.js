!function ( f ){
  crates.UndoStack = f()
}(function(  ){
  function Action( undo, redo ){
    this.undo = undo
    this.redo = redo
  }
  function UndoStack(  ){
    this.actions = []
    this.index = 0
  }
  UndoStack.prototype = {
    registerAction: function( undo, redo ){
      this.actions.push(new Action(undo, redo))
    },
    undo: function(  ){

    },
    redo: function(  ){

    }
  }
  return UndoStack
});