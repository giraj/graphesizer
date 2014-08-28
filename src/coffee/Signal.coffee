"use strict"

math = require('mathjs')()

# MODEL
class Signal
    constructor: (@fn, @audio, @graph, @samplerate) ->
        @window = from : 0, to : 0 # units in seconds

        # a signal is dirty if it has changed since updating its audio view
        # when the audio view requests sample data from this model, we only
        # resample if the model is dirty
        @dirty = false

        @data = @_sample()
        @draw()
        @play()

    draw: -> @graph.update @ if @graph?
    play: -> @audio.update @ if @audio?

    # used by audio view to make sound
    getData: ->
        if @dirty
            @data = @_sample()
            @dirty = false
        @data
    
    _sample: ->
        if @window.from < @window.to
            start = @window.from
            end = @window.to
        else 
            start = @window.to
            end = @window.from
        nSamples = Math.floor((end - start) * @samplerate)
        samples = new Float32Array nSamples
        delta = 1 / @samplerate
        expr = math.parse(@fn).compile(math)
        scope =  x: start 
        for i in [0 .. nSamples-1]
            do =>
                scope.x += delta
                samples[i] = expr.eval scope
        samples

    update: (obj) ->
        @dirty = false if not @dirty
        for own key, val of obj
            do =>
                if val? and @[key] != val
                    @[key] = val
                    @dirty = true
        @draw(@) if @dirty

    state: ->
        fn : @fn,
        window : 
            from : @window.from,
            to   : @window.to


module.exports = Signal