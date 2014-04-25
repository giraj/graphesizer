"use strict"

math = require('mathjs')()

Signal = require './Signal.coffee'
Audio = require './Audio.coffee'

GraphView = require './GraphView.coffee'
Graph = require './Graph.coffee'

Sidebar = require './Sidebar.coffee'
SidebarView = require './SidebarView.coffee'

class App
    constructor: (@canvas, sidebar, @samplerate) ->
        @currentSignal = null
        @signalColors = []

        @gView = new GraphView @canvas, @
        @graph = new Graph @GView

        @sidebarView = new SidebarView sidebar, @
        @sidebar = new Sidebar @sidebarView

        @audio = new Audio new webkitAudioContext(), @

        @canvas.addEventListener 'mousedown',  (event) => @mousedownHandler event
        @canvas.addEventListener 'mouseup',    (event) => @mouseupHandler event
        @canvas.addEventListener 'mousewheel', (event) => @scrollHandler event
        @canvas.addEventListener 'dblclick',   (event) => @dblclickHandler event
        @canvas.addEventListener 'mousemove',  (event) => @mousemoveHandler event

    setLineWidth: (lineWidth) -> @GView.ctx.lineWidth = lineWidth; 
    setSignalColors: (@signalColors) -> @
    nextColor: -> @signalColors[@sidebar.signals.length % @signalColors.length]

    add: (signal) ->
        signal.color = @nextColor()
        @draw signal
        @currentSignal.stop() if @currentSignal?
        @currentSignal = signal

    dblclickHandler: (event) ->
        event.preventDefault()
        if @currentSignal?
            @origoX = event.x
            @dragging = false
            @draw()
        @

    mousedownHandler: (event) ->
        event.preventDefault()
        if @currentSignal?
            @dragging = true
            if not @currentSignal.window.focused
                @startDrag event
            else
                if Math.abs(@fromX() - event.x) < Math.abs(@toX() - event.x)
                    [@currentSignal.window.to, @currentSignal.window.from] = [@currentSignal.window.from, @currentSignal.window.to]
        @

    mouseupHandler: (event) ->
        if @currentSignal?
            if @dragging
                @dragging = false
                if @currentSignal.window.to != @currentSignal.window.from
                    if @Sidebar?
                        if @Sidebar.signals.length == 0 or @Sidebar.signals[@Sidebar.signals.length-1] != @currentSignal
                            @Sidebar.add @currentSignal
                    else if @signalHistory.length == 0 or @signalHistory[@signalHistory.length-1] != @currentSignal
                        @signalHistory.push @currentSignal
                @endDrag event
            @currentSignal.play @audioCtx, @gain
        @

    scrollHandler: (event) ->
        event.preventDefault()
        if @zoom > 10
            @zoom += event.deltaY
        else if @zoom > 1
            @zoom += event.deltaY / 10
        else if @zoom >= 0
            @zoom += event.deltaY / 100
        if @zoom < 0
            @zoom = 0
        @draw()

    startDrag: (event) ->
        @currentSignal.startWindowSelection @graphXToSeconds(event.x)
        @draw()

    endDrag: (event) ->
        @currentSignal.endWindowSelection @graphXToSeconds(event.x)
        @draw()

    mousemoveHandler: (event) ->
        if @currentSignal? 
            if @dragging
                @endDrag(event)
            if @nearSelectionEdge(event.x)
                if not @currentSignal.window.focused
                    @currentSignal.window.focused = true
                    if Math.abs(@toX() - event.x) < Math.abs(@fromX() - event.x)
                        @drawSelectionEdge @toX(), @selectionEdgeFocusColor
                    else
                        @drawSelectionEdge @fromX(), @selectionEdgeFocusColor
            else if @currentSignal.window.focused
                @currentSignal.window.focused = false
                @draw()
        @

    bindInput: (@input) ->
        @input.addEventListener 'keyup', (event) => 
            if @input.value() != '' and @input.value() != null
                if not @currentSignal? or @currentSignal.fn != @input.value()
                    try @add new Signal(@input.value(), @samplerate)
                    catch e
        @


module.exports = App
