import React, { Component } from 'react';
import './App.css';

var Directions = {
  up: "up",
  // upleft: "upleft",
  // upright: "upright",
  left: "left",
  right: "right",
  down: "down",
  // downleft: "downleft",
  // downright: "downright",
  none: "none"
}

// Motor 1 pins (enable, forward, backward)
function MotorConfig(m1e = 16, m1f = 18, m1b = 22, m2e = 19, m2f = 23, m2b = 21) {
  return {
    m1e: m1e, 
    m1f: m1f, 
    m1b: m1b,
    m2e: m2e,
    m2f: m2f, 
    m2b: m2b
  }
}

function PinState(Pin, Mode, State) {
  return {
    Pin:  Pin,
    Mode: Mode,
    State: State
  }
}

function DirectionPinState(config = MotorConfig(), direction = "none"){
  switch (direction) {
    case Directions.up:
    return [PinState(config.m1e, "output", "high"), 
            PinState(config.m2e, "output", "high"),
            PinState(config.m1f, "output", "high"),
            PinState(config.m2f, "output", "high"),
            PinState(config.m1b, "output", "low"),
            PinState(config.m2b, "output", "low")]
    case Directions.left: 
    return[ PinState(config.m1e, "output", "high"), 
            PinState(config.m2e, "output", "high"),
            PinState(config.m1f, "output", "low"),
            PinState(config.m2f, "output", "high"),
            PinState(config.m1b, "output", "high"),
            PinState(config.m2b, "output", "low")]
    case Directions.right:
    return [PinState(config.m1e, "output", "high"), 
            PinState(config.m2e, "output", "high"),
            PinState(config.m1f, "output", "high"),
            PinState(config.m2f, "output", "low"),
            PinState(config.m1b, "output", "low"),
            PinState(config.m2b, "output", "high")]
    case Directions.down:
    return [PinState(config.m1e, "output", "high"), 
            PinState(config.m2e, "output", "high"),
            PinState(config.m1f, "output", "low"),
            PinState(config.m2f, "output", "low"),
            PinState(config.m1b, "output", "high"),
            PinState(config.m2b, "output", "high")]
    case Directions.none:
    return [PinState(config.m1e, "output", "low"), 
            PinState(config.m2e, "output", "low"),
            PinState(config.m1f, "output", "low"),
            PinState(config.m1b, "output", "low"),
            PinState(config.m2f, "output", "low"),
            PinState(config.m2b, "output", "low")]
  }
}

function comparePinStates(actual = [], expected = []) {
  for (var i=0; i<expected.length; i++) {
    var pinState = expected[i]
    var actualPin = actual[pinState.Pin]
    if (!actualPin) {
      return false
    }

    if (actualPin.Mode !== pinState.Mode) {
      return false
    }

    if (actualPin.State !== pinState.State) {
      return false
    }
  }

  return true
}

function calculateDirection(pins, config) {
  for (var direction in Directions) {
    var pinState = DirectionPinState(config, direction)
    if (comparePinStates(pins, pinState)) {
      return direction
    }
  }
  return Directions.none
}

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
    var newPinStates = DirectionPinState(this.props.motorConfig, newDirection)
    newPinStates.forEach((newPinState) => this.props.sendCommand(newPinState))
  }
  
  render() {
    var activeDirection = calculateDirection(this.props.pins, this.props.motorConfig)
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

class ConfigComponent extends Component {
  constructor(props) {
    super(props)
    this.onChangeField = this.onChangeField.bind(this)
  }

  onChangeField(event, field) {
    var newConfig = {...this.props.motorConfig}
    newConfig[field] = parseInt(event.target.value)
    this.props.setConfig(newConfig)
  }

  render() {
    return (
      <div>
        <table>
          <tbody>
            <tr>
              <td><label htmlFor="m1e">Motor 1 enable pin</label></td>
              <td><input type="number" id="m1e" value={this.props.motorConfig.m1e} onChange={(event) => this.onChangeField(event, "m1e")}/></td>
            </tr><tr>
              <td><label htmlFor="m1f">Motor 1 forward pin</label></td>
              <td><input type="number" id="m1f" value={this.props.motorConfig.m1f} onChange={(event) => this.onChangeField(event, "m1f")}/></td>
            </tr><tr>
              <td><label htmlFor="m1b">Motor 1 backward pin</label></td>
              <td><input type="number" id="m1b" value={this.props.motorConfig.m1b} onChange={(event) => this.onChangeField(event, "m1b")}/></td>
            </tr><tr>
              <td><label htmlFor="m2e">Motor 2 enable pin</label></td>
              <td><input type="number" id="m2e" value={this.props.motorConfig.m2e} onChange={(event) => this.onChangeField(event, "m2e")}/></td>
            </tr><tr>
              <td><label htmlFor="m2f">Motor 2 forward pin</label></td>
              <td><input type="number" id="m2f" value={this.props.motorConfig.m2f} onChange={(event) => this.onChangeField(event, "m2f")}/></td>
            </tr><tr>
              <td><label htmlFor  ="m2b">Motor 2 backward pin</label></td>
              <td><input type="number" id="m2b" value={this.props.motorConfig.m2b} onChange={(event) => this.onChangeField(event, "m2b")}/></td>
            </tr>
          </tbody>
        </table>
      </div>)
  }
}

const configKey = "motorConfig"
class App extends Component {
  constructor(props) {
    super(props)

    this.pinDataReceived = this.pinDataReceived.bind(this)
    this.sendCommand = this.sendCommand.bind(this)
    this.setConfig = this.setConfig.bind(this)

    var motorConfig
    try {
      motorConfig = JSON.parse(localStorage.getItem(configKey))
    } catch (e) {
      motorConfig = MotorConfig()
    }
    this.state = {
      pins: [],
      motorConfig: motorConfig
    }

    var websocketLocation = "ws://" + window.location.host + "/ws"
    // var websocketLocation = "ws://shinypi:8080/ws"
    this.ws = new WebSocket(websocketLocation)
    this.ws.onmessage = this.pinDataReceived
  }

  pinDataReceived({data}) {
    this.setState({
      pins: JSON.parse(data)
    })
  }

  sendCommand(cmd) {
    this.ws.send(JSON.stringify(cmd))
  }

  setConfig(config) {
    localStorage.setItem(configKey, JSON.stringify(config))
    this.setState({
      motorConfig: config
    })
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Raspberry Pi GPIO remote</h1>
        </header>
        <PinStateTable pins={this.state.pins}/>
        <ArrowControls motorConfig={this.state.motorConfig} pins={this.state.pins} sendCommand={this.sendCommand}/>
        <ConfigComponent motorConfig={this.state.motorConfig} setConfig={this.setConfig}/>
      </div>
    );
  }
}

export default App;
