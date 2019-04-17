import React, { Component } from 'react';

export function WifiControllerHOC(ControllerComp) {
  
    return class WifiController extends Component {

    static navigationOptions = {
        header: null
    }

    constructor(props) {
        super(props)
        const {navigation} = this.props;
        this.socket = navigation.state.params.socketIO;
        this.functions = {
            sendData: this.sendData,
            getData: this.getData,
            disconnect: this.disconnect
        }
    }

    componentWillUnmount() {
        console.log("WIFI_CONTROLLER will unmount!");
        this.socket.disconnect();
    }

    getData = (setStateFunc) => {

        this.socket.on('data', (data) => {
            
            console.log("Received data (WiFi): " + data);
        
            // parse data
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

            setStateFunc({real_wheelRot: wheelRot, real_speed: spd, real_lights_on: lights_on, real_lane_assist: lane_assist, real_adaptive_cruise_control: adapt_cruise_cont, real_smart_lights: smart_lights});
        
        });
    
    }

    sendData = (wheelRotation, speed, lightsON, laneAssistant, adaptiveCruiseControl, smartLights) => {
        let data = wheelRotation + "s" + speed + "l" + lightsON + "la" + laneAssistant + "ac" + adaptiveCruiseControl + "sl" + smartLights;
        this.socket.emit('data', data);
    }

    disconnect = () => {
        this.socket.disconnect();
        this.props.navigation.pop(); // pop controllerScreen from navigation stack
    }

    render() {
        return <ControllerComp sendDataInterval={100} connectionType="wifi" ip={this.props.navigation.state.params.ip} {...this.props} {...this.functions}/>
    }
  }

}