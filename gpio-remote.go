package main

import (
    "github.com/stianeikeland/go-rpio"
    "github.com/vharitonsky/iniflags"
    "github.com/gorilla/websocket"
    "flag"
    "log"
    "net/http"
    "encoding/json"
)

var (
    // Command line arguments
    listenAddress string
    maxPin int

    // Pins we're listening to
    pins []rpio.Pin
    modes []rpio.Mode

    // Buffers for websocket
    upgrader = websocket.Upgrader{
        ReadBufferSize: 1024,
        WriteBufferSize: 1024,
        CheckOrigin: checkOrigin,
    }
)

func checkOrigin(r *http.Request) bool {
    return true
}


// Write out the state of all pins in a nice JSON format
type PinStateJson struct {
    Mode string
    State string
}

func stateJson() ([]byte, error) {
    states := make([]PinStateJson, len(pins))

    for i, pin := range pins {
        var mode string
        var state string
        if modes[i] == rpio.Input {
            mode = "input"
        } else {
            mode = "output"
        }

        if pin.Read() == rpio.High {
            state = "high"
        } else {
            state = "low"
        }

        states[i] = PinStateJson {
            Mode: mode,
            State: state,
        }
    }
    return json.Marshal(states)
}

type Command struct {
    Pin int
    Mode string
    State string
}

func handleCommand(command []byte) error {
    var cmd Command
    err := json.Unmarshal(command, &cmd)
    if err != nil {
        return err
    }

    // Set the desired mode
    pin := pins[cmd.Pin]
    if cmd.Mode == "input" && modes[cmd.Pin] != rpio.Input {
        log.Println("Pin", cmd.Pin, "set to input")
        pin.Input()
        modes[cmd.Pin] = rpio.Input
    } else if cmd.Mode == "output" && modes[cmd.Pin] != rpio.Output {
        log.Println("Pin", cmd.Pin, "set to output")
        pin.Output()
        modes[cmd.Pin] = rpio.Output
    }

    // Set the desires state (output only)
    if modes[cmd.Pin] == rpio.Output {
        if cmd.State == "high" {
            log.Println("Pin", cmd.Pin, "set to high")
            pin.High()
        } else if cmd.State == "low" {
            log.Println("Pin", cmd.Pin, "set to low")
            pin.Low()
        }
    }

    return nil
}

// This is the main stuff, handle websocket commands in a loop & write state back
func wsHandler(w http.ResponseWriter, r *http.Request) {
    // Just upgrade straight away
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println(err)
        return
    }

    // Write out the initial state
    state, err := stateJson()
    if err != nil {
        log.Println(err)
        return
    }
    conn.WriteMessage(websocket.TextMessage, state)

    // Read commands in a loop & do them
    for {
        _, message, err := conn.ReadMessage()
        if err != nil {
            log.Println(err)
            break
        }

        err = handleCommand(message)
        if err != nil {
            log.Println(err)
            break
        }

        // Write out the state of everything back to the client
        response, err := stateJson()
        if err != nil {
            log.Println(err)
            break
        }
        conn.WriteMessage(websocket.TextMessage, response)
    }
}

func main() {
    // Read config
    flag.StringVar(&listenAddress, "listenAddress", ":8080", "The address the server listens on")
    flag.IntVar(&maxPin, "maxPin", 27, "The highest GPIO pin to use")
    iniflags.Parse()

    // Open rpio & close it later
    err := rpio.Open()
    if err != nil {
        log.Fatal(err)
    }
    defer rpio.Close()

    // Configure pins, default all to input
    top := maxPin+1
    pins = make([]rpio.Pin, top)
    modes = make([]rpio.Mode, top)
    for i := 0; i < maxPin+1; i++ {
        pins[i] = rpio.Pin(i)
        pins[i].Input()
        // Got to remember the mode ourselves, can't query it
        modes[i] = rpio.Input
    }

    // Start serving web
    http.Handle("/", http.FileServer(http.Dir("./build")))
    http.HandleFunc("/ws", wsHandler)
    log.Fatal(http.ListenAndServe(listenAddress, nil))
}
