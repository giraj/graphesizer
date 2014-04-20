"use strict"

class Sidebar
    constructor: (@el, @width, @hidden=true) ->
        @signals = []
        @el.style.width = @width + "px"
        @signalList = document.createElement('ul')
        @el.appendChild(@signalList)
            .className = "sidebar-signal-list"
        if @hidden
            @hide()
        else
            @show()

    bindButton: (@button) ->
        @button.innerHTML = if @hidden then ">>" else "<<"
        @button.addEventListener('click', (event) =>
            @toggle()
        )

    toggle: () ->
        @hidden = not @hidden
        @button.innerHTML = if @hidden then ">>" else "<<"
        if @hidden
            @hide()
        else
            @show()

    show: () ->
        @el.style.left = 0 + "px"
        @

    hide: () ->
        @el.style.left = (55 - @width) + "px"
        @

    add: (signal) ->
        @signals.push(signal)
        @signalList.appendChild(@makeEntry(signal))

    makeEntry: (signal) ->
        entry = document.createElement('li')
        title = document.createTextNode(signal.fn)

        toggles = document.createElement('div')
        toggles.style.background = signal.color
        txt = document.createTextNode('')
        toggles.appendChild(txt)

        entry.appendChild(title)
        entry.appendChild(toggles)
            .className = 'sidebar-signal-toggle'
        entry.className = 'sidebar-signal'
        entry


    render: () ->
        for signal in @signals
            do (signal) =>
                @signalList.appendChild(@makeEntry(signal))
        @


module.exports = Sidebar