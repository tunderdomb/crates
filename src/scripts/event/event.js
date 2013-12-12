!function ( f ){
  crates.event = f({})
}(function( event ){
  /**
   * EventStation
   * */
  function EventStation(){}
  EventStation.prototype = {
    on: function ( event, listener ){
      this.events = this.events || {}
      if ( typeof event != "string" ) {
        var e
        if ( event.length ) while ( e = event.shift() ) {
          this.on(e, listener)
        }
        return
      }
      this.events[event] = this.events[event] || []
      if ( !~this.events[event].indexOf(listener) ) {
        this.events[event].push(listener)
      }
      return this
    },
    off: function ( event, listener ){
      var i
      if ( !this.events || !this.events[event] ) return
      i = this.events[event].indexOf(listener)
      if ( !~i ) return
      this.events[event].splice(i, 1)
    },
    broadcast: function ( event, message ){
      if ( !this.events || !this.events[event] ) return
      var i = -1
        , events = this.events[event]
        , l
        , remove
      message = [].slice.call(arguments, 1)
      while ( ++i < events.length ) {
        l = events.length
        remove = events[i].apply(undefined, message) === false
        if ( remove ) {
          if ( l == events.length ) events.splice(i--, 1)
          else --i
        }
        else if ( l != events.length ) --i
      }
    },
    broadcastUnsafe: function ( type, message ){
      if ( !this.events || !this.events[type] ) return
      var i = -1
        , events = this.events[type]
        , l = events.length
      message = [].slice.call(arguments, 1)
      while ( ++i < l ) {
        if ( events[i].apply(undefined, message) === false ) return
      }
    },
    /**
     * Return true to remove digested history entry
     * false to unsubscribe.
     * The callback context is either true or false.
     * True indicates the last history entry.
     * */
    subscribeHistory: function( event, listener ){
      if( !this.historyListeners )
        this.historyListeners = {}
      if( !this.historyListeners[event] ) this.historyListeners[event] = []
      this.historyListeners[event].push(listener)
      this.broadcastHistory(event)
    },
    /**
     * Registering a history event allows future listeners to catch up with messages
     * History events can be removed by listeners at will.
     * This mechanism allows tasks to be registered, and to be executed
     * in a later time. Implementing callback should note that they may never be called.
     * If a task is removed from the history by an executor, the callbacks registered after it won't receive it.
     * Registering a history event also triggers a notification rundown.
     * */
    registerHistory: function( event, message ){
      if ( !this.eventHistory ) this.eventHistory = {}
      if( !this.eventHistory[event] ) this.eventHistory[event] = []
      message = [].slice.call(arguments, 1)
      this.eventHistory[event].push(message)
      this.broadcastHistory(event)
    },
    /**
     * Triggers a history rundown and notifies callbacks about every history event.
     * This should not be used, use registerHistory() instead.
     * */
    broadcastHistory: function( event ){
      if( !this.historyListeners
        || !this.historyListeners[event]
        || !this.eventHistory
        || !this.eventHistory[event] ) return
      var i = -1, j
        , history = this.eventHistory[event]
        , listeners = this.historyListeners[event]
        , h = history.length, l = listeners.length
        , resolvedOrUnsubscribe
      if( !h || !l ) return
      while ( ++i < l ) {
        j = -1
        while ( ++j < h ) {
          resolvedOrUnsubscribe = listeners[i].apply(j+1<h, history[j])
          if( resolvedOrUnsubscribe  === true ){
            history.splice(j, 1)
            --j
            --h
            if( !h ) return
          }
          else if( resolvedOrUnsubscribe === false ) {
            listeners.splice(i, 1)
            --i
            --l
            if( !l ) return
          }
        }
      }
    },
    report: function ( eventType ){
      return this.events[eventType] && this.events[eventType].length
    },
    emptyEvents: function (){
      this.events = {}
    }
  }

  event.EventStation = EventStation
  return event
});