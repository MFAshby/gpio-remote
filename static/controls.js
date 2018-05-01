var loc = window.location
var websocketLocation = "ws://" + loc.host + "/ws"

var ws = new WebSocket(websocketLocation)
ws.onmessage = function(event) {
    // Update the state of controls from data the pi sends us
    console.log(event.data)
}

class Command {
    constructor(Pin, Mode, State) {
        this.Pin = Pin
        this.Mode = Mode
        this.State = State
    }
}

ws.onopen = function () {
    var cmd = new Command(1, "output", "high")
    ws.send(JSON.stringify(cmd))
}

// Link controls to functions to send commands