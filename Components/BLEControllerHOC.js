import React, { Component } from 'react';
import { stringToBytes } from 'convert-string';

export function BLEControllerHOC(ControllerComp) {
  
    return class BLEController extends Component{

    static navigationOptions = {
        header: null
    }

    constructor(props) {
        super(props)
        const {navigation} = this.props;
        this.BleManager = navigation.state.params.BleManager;
        this.bleManagerEmitter = navigation.state.params.bleManagerEmitter;
        this.peripheral = navigation.state.params.peripheral;
        this.dataServiceUUID = 'a52dc58d-1854-48a8-a387-9ffe4a9da7be';
        this.dataCharacteristicUUID = 'fa38c504-2240-4b76-adb8-053efa3a3b58';

        this.state = {
            writing: false
        }

        this.functions = {
            sendData: this.sendData,
            getData: this.startNotifications,
            disconnect: this.disconnect
        }

        this.setStateFunc = null;
        this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
    }

    componentDidMount() {
        this.updateChrcHandler = this.bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );
    }

    componentWillUnmount() {
        console.log("BLE_CONTROLLER will unmount!");
        this.stopNotifications();
        this.BleManager.disconnect(this.peripheral.id); // disconnect peripheral
        this.updateChrcHandler.remove();
    }

    disconnect = () => {
        this.props.navigation.pop(); // pop controllerScreen from navigation stack
        this.props.navigation.pop(); // pop bleScanScreen from navigation stack
    }

    stopNotifications = () => {
        this.BleManager.stopNotification(this.peripheral.id, this.dataServiceUUID, this.dataCharacteristicUUID);
    }

    startNotifications = (setStateFunc) => {
        this.setStateFunc = setStateFunc;

        // nastavime notifikacie
        this.BleManager.retrieveServices(this.peripheral.id).then((peripheralInfo) => {

            setTimeout(() => {
                this.BleManager.startNotification(this.peripheral.id, this.dataServiceUUID, this.dataCharacteristicUUID).then(() => {
                    console.log('Started notification on ' + this.peripheral.id);
                }).catch((error) => {
                    console.log('Notification error: ', error);
                });
            }, 100);

        }).catch((error) => {
            console.log('Retrieve services error: ', error);
        });

    }

    stringFromArray(data) {
        let count = data.length;
        let str = "";
    
        for(var index = 0; index < count; index += 1)
            str += String.fromCharCode(data[index]);
    
        return str;
    }

    handleUpdateValueForCharacteristic(data) {
        
        console.log('Received data (BLE): '+ this.stringFromArray(data.value));

        // parse data
        let dataStr = this.stringFromArray(data.value);
        let res = dataStr.split("l");
        let smart_lights = parseInt(res[1]);
        res = res[0].split("t");
        let adapt_cruise_cont = parseInt(res[1]);
        res = res[0].split("a");
        let lane_assist = parseInt(res[1]);
        res = res[0].split("s");
        let spd = parseInt(res[1]);
        let wheelRot = parseInt(res[0]);

        this.setStateFunc({real_speed: spd, real_lane_assist: lane_assist, real_adaptive_cruise_control: adapt_cruise_cont, real_smart_lights: smart_lights});

    }

    sendData = (wheelRotation, speed, laneAssistant, adaptiveCruiseControl, smartLights) => {
        
        let dataSTR = wheelRotation + "s" + speed + "a" + laneAssistant + "t" + adaptiveCruiseControl + "l" + smartLights;
        
        if(!this.state.writing) {

            this.setState({writing: true});

            setTimeout(() => {

                this.BleManager.retrieveServices(this.peripheral.id).then((peripheralInfo) => {
                
                    setTimeout(() => {
                        this.BleManager.write(this.peripheral.id, this.dataServiceUUID, this.dataCharacteristicUUID, stringToBytes(dataSTR)).then(() => {
                        
                            console.log('Write - ' + stringToBytes(dataSTR));
                            this.setState({writing: false});

                        }).catch((error) => {
                            console.log('Writing error: ', error);
                            this.setState({writing: false});
                        });
                    }, 50);

                }).catch((error) => {
                    console.log('Retrieve services error: ', error);
                });

            }, 50);

        }
        else {
            console.log("Already writing!");
        }

    }

    render() {
        return <ControllerComp sendDataInterval={200} connectionType="ble" {...this.props} {...this.functions}/>
    }

  }

}