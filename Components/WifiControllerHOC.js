import React, { Component } from 'react';

// funkcia HOC (Higer Ordered Component)
export function WifiControllerHOC(ControllerComp) {
  
    // vracia novy komponent
    return class WifiController extends Component {

        // nastavenie navigacie
        static navigationOptions = {
            header: null
        }

        // konstruktor
        constructor(props) {
            
            super(props)
            const {navigation} = this.props;  // props posielane pri prechode na tuto aktivitu
            this.socket = navigation.state.params.socketIO; // objekt socket.io
            
            // funkcie posielane cez props do controllera
            this.functions = {
                sendData: this.sendData,    // funkcia na odoiselanie dat
                getData: this.getData,      // funkcia na prijmanie dat
                disconnect: this.disconnect // funkcia na odpojenie
            }

        }

        // React lifecycle metoda volana pred odstranenim komponentu z DOM
        componentWillUnmount() {
            console.log("WIFI_CONTROLLER will unmount!");
            this.socket.disconnect(); // odpojenie
        }

        // metoda pre spracovanie prijatych dat
        getData = (setControllerStateFunc) => {

            this.socket.on('data', (data) => {
                
                console.log("Received data (WiFi): " + data);
            
                // rozparsovanie dat z retazca dat podla komunikacneho protokolu
                let res = data.split("sl");
                let smart_lights = parseInt(res[1]);
                res = res[0].split("ac");
                let adapt_cruise_cont = parseInt(res[1]);
                res = res[0].split("la");
                let lane_assist = parseInt(res[1]);
                res = res[0].split("l");
                let lights_on = parseInt(res[1]);
                res = res[0].split("s");
                let spd = parseInt(res[1]);
                let wheelRot = parseInt(res[0]);

                // nastavenie stavu controllera
                setControllerStateFunc({real_wheelRot: wheelRot, real_speed: spd, real_lights_on: lights_on, real_lane_assist: lane_assist, real_adaptive_cruise_control: adapt_cruise_cont, real_smart_lights: smart_lights});
            
            });
        
        }

        // metoda pre odosielanie dat
        sendData = (wheelRotation, speed, lightsON, laneAssistant, adaptiveCruiseControl, smartLights) => {
            // vytvorenie retazca dat podla komunikacneho protokolu
            let data = wheelRotation + "s" + speed + "l" + lightsON + "la" + laneAssistant + "ac" + adaptiveCruiseControl + "sl" + smartLights;
            this.socket.emit('data', data); // odoslanie dat cez socket
        }

        // metoda pre odpojenie
        disconnect = () => {
            this.socket.disconnect();
            this.props.navigation.pop(); // pop controllerScreen from navigation stack
        }

        // metoda pre vkyreslenie komponentu
        render() {
            return <ControllerComp sendDataInterval={100} connectionType="wifi" ip={this.props.navigation.state.params.ip} {...this.props} {...this.functions}/>
        }

  }

}