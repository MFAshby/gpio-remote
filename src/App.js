import React, { Component } from 'react';
import './App.css';

// Pins are array of objects with Mode & State,
// pin number is just hte index inthe array

// Commands should be send with Pin, Mode & State 

class PinStateTable extends Component {
  render() {
    var trs = []
    this.props.pins.forEach((pin, ix) => {
      trs.push(
      <tr key={ix}>
        <td>{ix}</td>
        <td>{pin.Mode}</td>
        <td>{pin.State}</td>
      </tr>)
    })

    return (
      <table className="PinStateTable">
        <thead>
          <tr>
            <th>Pin</th>
            <th>Mode</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {trs}
        </tbody>
      </table>
    )
  }
}

var Directions = {
  up: "up",
  upleft: "upleft",
  upright: "upright",
  left: "left",
  right: "right",
  down: "down",
  downleft: "downleft",
  downright: "downright",
  none: ""
}

function pC(pin, mode, state) {
  return {
    Pin: pin,
    Mode: mode, 
    State: state
  }
}

// Make these a setting
var m1e = 16
var m1f = 18
var m1b = 22
var m2e = 19
var m2f = 23
var m2b = 21

function calculateCommands(direction) {
  if (direction === Directions.none) {
    return [ pC(m1e, "output", "low"), 
             pC(m2e, "output", "low"),
             pC(m1f, "output", "low"),
             pC(m1b, "output", "low"),
             pC(m2f, "output", "low"),
             pC(m2b, "output", "low")]
  } else if (direction === Directions.up) {
    return [ pC(m1e, "output", "high"), 
             pC(m2e, "output", "high"),
             pC(m1f, "output", "high"),
             pC(m2f, "output", "high"),
             pC(m1b, "output", "low"),
             pC(m2b, "output", "low")]
  } else if (direction === Directions.down) {
    return [ pC(m1e, "output", "high"), 
             pC(m2e, "output", "high"),
             pC(m1f, "output", "low"),
             pC(m2f, "output", "low"),
             pC(m1b, "output", "high"),
             pC(m2b, "output", "high")]
  } else if (direction === Directions.left) {
    return [ pC(m1e, "output", "high"), 
             pC(m2e, "output", "high"),
             pC(m1f, "output", "low"),
             pC(m2f, "output", "high"),
             pC(m1b, "output", "high"),
             pC(m2b, "output", "low")]
  } else if (direction === Directions.right) {
    return [ pC(m1e, "output", "high"), 
             pC(m2e, "output", "high"),
             pC(m1f, "output", "high"),
             pC(m2f, "output", "low"),
             pC(m1b, "output", "low"),
             pC(m2b, "output", "high")]
  }

  console.log("Couldn't calculate pin settings for direction " + direction)
  return []
}

function calculateDirection(pins) {
  if (pins.length < 24) {
    console.log("Pins not initialized, can't calculate direction")
    return Directions.none
  }
  var motor1enabled = pins[m1e].State === "high"
  var motor1forward = pins[m1f].State === "high"
  var motor1backward = pins[m1b].State === "high"
  var motor2enabled = pins[m2e].State === "high"
  var motor2forward = pins[m2f].State === "high"
  var motor2backward = pins[m2b].State === "high"

  if (!motor1enabled && !motor2enabled) {
    return Directions.none
  }
  else if (motor1enabled && !motor2enabled) {
    if (motor1forward) {
      return Directions.upright
    } else if (motor1backward) {
      return Directions.downright
    }
  } 
  else if (!motor1enabled && motor2enabled) {
    if (motor2forward) {
      return Directions.upleft
    } else if (motor2backward) {
      return Directions.downleft
    }
  }
  else if (motor1enabled && motor2enabled) {
    if (motor1forward && motor2forward) {
      return Directions.up
    } else if (motor1backward && motor2backward) {
      return Directions.down
    } else if (motor1forward && motor2backward) {
      return Directions.right
    } else if (motor1backward && motor2forward) {
      return Directions.left
    }
  }
  console.log("Failed to work out robot direction!")
  console.log(pins)
  return Directions.none
}

class Arrow extends Component {
  render() {
    var className = `Arrow ${this.props.direction} ${this.props.active ? "active": ""}`
    return (
      <div className={className}
        onMouseOver={this.props.onActivate}
        onMouseOut={this.props.onDeactivate}
        onTouchStart={this.props.onActivate}
        onTouchEnd={this.props.onDeactivate}/>
    )
  }
}

class ArrowControls extends Component {
  constructor(props) {
    super(props)
    this.changeDirection = this.changeDirection.bind(this)
  }

  changeDirection(newDirection) {
    var cmds = calculateCommands(newDirection)
    cmds.forEach((cmd) => this.props.sendCommand(cmd))
  }
  
  render() {
    var activeDirection = calculateDirection(this.props.pins)
    return (
      <table>
        <tbody>
          <tr>
            <td></td>
            <td><Arrow 
              direction={Directions.up} 
              active={activeDirection === Directions.up}
              onActivate={() => this.changeDirection(Directions.up)}
              onDeactivate={() => this.changeDirection(Directions.none)}
              /></td>
            <td></td>
          </tr>
          <tr>
            <td><Arrow
              direction={Directions.left} 
              active={activeDirection === Directions.left}
              onActivate={() => this.changeDirection(Directions.left)}
              onDeactivate={() => this.changeDirection(Directions.none)}
              /></td>
            <td></td>
            <td><Arrow 
              direction={Directions.right} 
              active={activeDirection === Directions.right}
              onActivate={() => this.changeDirection(Directions.right)}
              onDeactivate={() => this.changeDirection(Directions.none)}
              /></td>
          </tr>
          <tr>
            <td></td>
            <td><Arrow 
              direction={Directions.down} 
              active={activeDirection === Directions.down}
              onActivate={() => this.changeDirection(Directions.down)}
              onDeactivate={() => this.changeDirection(Directions.none)}
              /></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pins: [],
    }

    // var websocketLocation = "ws://" + loc.host + "/ws"
    var websocketLocation = "ws://shinypi:8080/ws"
    this.ws = new WebSocket(websocketLocation)
    this.ws.onmessage = ({data}) => {
      this.setState({pins: JSON.parse(data)})
    }

    this.sendCommand = this.sendCommand.bind(this)
  }

  sendCommand(cmd) {
    this.ws.send(JSON.stringify(cmd))
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Raspberry Pi GPIO remote</h1>
        </header>
        <PinStateTable pins={this.state.pins}/>
        <ArrowControls pins={this.state.pins} sendCommand={this.sendCommand}/>
      </div>
    );
  }
}

export default App;
