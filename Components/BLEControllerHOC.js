import React, { Component } from 'react';
import { stringToBytes } from 'convert-string';

export function BLEControllerHOC(ControllerComp) {
  
    return class BLEController extends Component{

        // nastavenie navigacie
        static navigationOptions = {
            header: null
        }

        // konstruktor
        constructor(props) {
            
            super(props)
            const {navigation} = this.props;    // props posielane pri prechode na tuto aktivitu
            this.BleManager = navigation.state.params.BleManager;               // BleManager
            this.bleManagerEmitter = navigation.state.params.bleManagerEmitter; // BleManagerEmitter
            this.peripheral = navigation.state.params.peripheral;               // info o zariadeni
            this.dataServiceUUID = 'a52dc58d-1854-48a8-a387-9ffe4a9da7be';      // UUID DataServisu na GATT Servery
            this.dataCharacteristicUUID = 'fa38c504-2240-4b76-adb8-053efa3a3b58'; // UUID DataCharakteristiky na GATT Servery

            this.state = {
                writing: false // stav zapisovania do charakteristiky
            }

            // funkcie posielane cez props do controllera
            this.functions = {
                sendData: this.sendData,            // funkcia na odoiselanie dat
                getData: this.startNotifications,   // funkcia na prijimanie dat
                disconnect: this.disconnect         // funkcia na odpojenie
            }

            this.setControllerStateFunc = null;     // funkcia na zmenu stavu controllera
            this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);   // bind metody na spracovanie zmeny hodnoty charakteristiky 
        
        }

        // React lifecycle metoda volana hned po tom ako je komponent nasadeny
        componentDidMount() {
            this.updateChrcHandler = this.bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );
        }

        // React lifecycle metoda volana pred odstranenim komponentu z DOM
        componentWillUnmount() {
            console.log("BLE_CONTROLLER will unmount!");
            this.stopNotifications();   // ukoncenie notifikacii charakteristiky
            this.BleManager.disconnect(this.peripheral.id); // odpojenie zariadenia
            this.updateChrcHandler.remove();    // odstranenie listenera
        }

        // metoda pre odpojenie zariadenia
        disconnect = () => {
            this.props.navigation.pop(); // pop controllerScreen from navigation stack
            this.props.navigation.pop(); // pop bleScanScreen from navigation stack
        }

        // metoda pre ukoncenie notifikacii pre charakteristiku
        stopNotifications = () => {
            this.BleManager.stopNotification(this.peripheral.id, this.dataServiceUUID, this.dataCharacteristicUUID);
        }

        // metoda pre nastavenie notifikacii pre charakteristiku
        startNotifications = (setStateFunc) => {

            this.setControllerStateFunc = setStateFunc; // ulozime odkaz na funkciu pre zmenu stavu controllera

            // ziskame servisy
            this.BleManager.retrieveServices(this.peripheral.id).then((peripheralInfo) => {

                setTimeout(() => {
                    // nastavime notifikacie
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

        // metoda na ziskanie stringu z ArrayBufferu
        stringFromArray(data) {
            let count = data.length;
            let str = "";
        
            for(var index = 0; index < count; index += 1)
                str += String.fromCharCode(data[index]);
        
            return str;
        }

        // metoda na spracovanie zmeny hodnoty charakteristiky na kt su spustene notifikacie
        handleUpdateValueForCharacteristic(data) {
            
            console.log('Received data (BLE): '+ this.stringFromArray(data.value));

            // preparsovanie dat
            let dataStr = this.stringFromArray(data.value);
            let res = dataStr.split("sl");
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
            this.setControllerStateFunc({real_wheelRot: wheelRot, real_speed: spd, real_lights_on: lights_on, real_lane_assist: lane_assist, real_adaptive_cruise_control: adapt_cruise_cont, real_smart_lights: smart_lights});

        }

        // metoda na odosielanie dat
        sendData = (wheelRotation, speed, lightsON, laneAssistant, adaptiveCruiseControl, smartLights) => {
            
            // zostavenie retazca dat podla komunikacneho protokolu
            let dataSTR = wheelRotation + "s" + speed + "l" + lightsON + "la" + laneAssistant + "ac" + adaptiveCruiseControl + "sl" + smartLights;
            
            // ak neprebieha proces zapisu na charakteristiku
            if(!this.state.writing) {

                this.setState({writing: true}); // nastavime stav zapisu na TRUE

                setTimeout(() => {

                    // ziskame servisy
                    this.BleManager.retrieveServices(this.peripheral.id).then((peripheralInfo) => {
                    
                        setTimeout(() => {
                            // zapisujeme na charakteristiku
                            this.BleManager.write(this.peripheral.id, this.dataServiceUUID, this.dataCharacteristicUUID, stringToBytes(dataSTR)).then(() => {
                                console.log('Write - ' + stringToBytes(dataSTR));
                                this.setState({writing: false}); // stav procesu zapisu FALSE
                            }).catch((error) => {
                                console.log('Writing error: ', error);
                                this.setState({writing: false}); // stav procesu zapisu FALSE
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

        // metoda pre vykreslenie komponentu
        render() {
            return <ControllerComp sendDataInterval={200} connectionType="ble" {...this.props} {...this.functions}/>
        }

  }

}