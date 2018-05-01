# GPIO remote

A remote control application for Raspberry Pi powered robots. 

To use:
1. Download the zip from 
`https://raw.githubusercontent.com/MFAshby/gpio-remote/master/gpio-remote.zip`
2. Extract it to your preferred location and run 'gpio-remote' executable
3. Open a web browser to your Pi's IP address at port 8080 (e.g. 192.168.1.200:8080)
4. Set the correct pins for controlling the motors.
5. Drive around & scare your dog.

To build: 
1. Install go & node & npm
`sudo apt install nodejs npm golang-go`
2. Clone the source to gpio-remote folder
`git clone https://github.com/MFAshby/gpio-remote.git`
3. Build the webpage with npm build
`cd gpio-remote`
`npm install && npm build`
4. Build the server with go build gpio-remote.go
`go build gpio-remote.go`
5. Run the server & connect via your web browser as above
`./gpio-remote`

![screenshot](./screenshot.png "screenshot")  
