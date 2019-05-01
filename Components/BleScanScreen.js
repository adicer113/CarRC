import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  ListView,
  ScrollView,
  AppState
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import Orientation from 'react-native-orientation-locker';
import Toast, {DURATION} from 'react-native-easy-toast'

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

// BLE Manager
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default class BleScanScreen extends Component {

    // nastavenie navigacie
    static navigationOptions = {
        header: null
    }

    // konstruktor
    constructor(props) {

        super(props)
        this.state = {  
            scanning: false,        // stav skenovania zariadneni
            peripherals: new Map(), // mapa najdenych zariadeni
            appState: '',           // stav aplikacie
            connecting: false       // stav pripajania na zariadenie
        }

        // bind metod pre spracovanie akcii BLE
        this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
        this.handleStopScan = this.handleStopScan.bind(this);
        this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
        this.handleAppStateChange = this.handleAppStateChange.bind(this);

    }

    // React lifecycle metoda volana hned po tom ako je komponent nasadeny
    componentDidMount() {

        AppState.addEventListener('change', this.handleAppStateChange); // pridanie listeneru pre zmenu stavu aplikacie

        BleManager.start({showAlert: true, forceLegacy: true}); // spustenie BLE Managera
        this.startScan(); // sken zariadeni

        // nastavenie listenerov
        this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
        this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
        this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );

        // kontrola permissions
        if (Platform.OS === 'android' && Platform.Version >= 23) {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                if (result) {
                    console.log("Permission is OK");
                } else {
                PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                    if (result) {
                        console.log("User accept");
                    } else {
                        console.log("User refuse");
                    }
                });
                }
            });
        }

        Orientation.lockToLandscapeLeft();  // zamknutie orientacie na Landscape left

    }

    // React lifecycle metoda volana pred odstranenim komponentu z DOM
    componentWillUnmount() {

        console.log("BLE_SCAN_SCREEN will unmount!");

        // odstranenie listenerov
        this.handlerDiscover.remove();
        this.handlerStop.remove();
        this.handlerDisconnect.remove();

        // ak prebieha sken zariadeni tak ho vypneme
        if(this.state.scanning) {
            BleManager.stopScan().then(() => {
                this.handleStopScan();
            });
        }

    }

    // spracovanie zmeny stavu aplikacie
    handleAppStateChange(nextAppState) {
        if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
            console.log('App has come to the foreground!')
            BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
                console.log('Connected peripherals: ' + peripheralsArray.length);
            });
        }
        this.setState({appState: nextAppState});
    }

    // spracovanie akcie odpojenia od zariadenia
    handleDisconnectedPeripheral(data) {
        
        // ziskanie daneho zariadenia zo state.peripherals
        let peripherals = this.state.peripherals;
        let peripheral = peripherals.get(data.peripheral);
        
        if (peripheral) {
            peripheral.connected = false;   // zmenime stav daneho zariadenia na nepripojene
            peripherals.set(peripheral.id, peripheral); // zmenime dany prvok v mape
            this.setState({peripherals});   // aktualizujeme peripherals v state objekte
        }

        console.log('Disconnected from ' + data.peripheral); // vypis

    }

    // spracovanie najdenia noveho zariadenia
    handleDiscoverPeripheral(peripheral) {

        var peripherals = this.state.peripherals;

        // ak toto zariadnie este nie je v mape najdenych zariadeni
        if (!peripherals.has(peripheral.id)){
            console.log('Got ble peripheral --> ', peripheral);
            peripherals.set(peripheral.id, peripheral); // pridame ho 
            this.setState({ peripherals });  // aktualizujeme stav
        }

    }

    // spracovanie zastavenia skenu zariadeni
    handleStopScan() {
        console.log('Scan is stopped');
        this.setState({ scanning: false }); // stav skenovania FALSE
    }

    // metoda pre skenovanie zariadeni
    startScan() {

        // ak neprebieha skenovanie zariadeni
        if (!this.state.scanning) {
            
            this.setState({peripherals: new Map()});    // nastavime najdene zariadenia na prazdu mapu
            
            // spustime sken zariadeni, s trvanim 20 sekund
            BleManager.scan([], 20, true).then((results) => {
                console.log('Scanning...');
                this.setState({scanning: true}); // nastavime stav skenovania na TRUE
            });
        }

    }

    // metoda pre pripojenie sa na zariadenie
    connectToPeripheral(peripheral) {

        // ak neprebieha proces pripajania na nejake zariadenie
        if (!this.state.connecting) {

            this.setState({connecting: true}); // natavime stav pripajania na TRUE

            if(peripheral) {
                
                // ak uz nie sme pripojeny k tomuto zariadeniu
                if (!peripheral.connected) {

                    // spustime pripajanie
                    BleManager.connect(peripheral.id).then(() => {
                        
                        // ziskame dane zariadenie z mapy najdenych zariadeni
                        let peripherals = this.state.peripherals;
                        let p = peripherals.get(peripheral.id);

                        if (p) {
                            p.connected = true; // nastavime stav na pripojeny
                            peripherals.set(peripheral.id, p);  // aktualizujeme mapu zariadeni
                            this.setState({peripherals});   // aktualizujeme stav
                        }

                        console.log('Connected to ' + peripheral.id);
                        this.setState({connecting: false}); // stav procesu pripajania nastavime na FALSE
                        this.props.navigation.navigate('BleController', { BleManager, bleManagerEmitter, peripheral }); // prejdeme na aktivitu "BleController"

                    }).catch((error) => {
                        this.setState({connecting: false});     // stav procesu pripajania nastavime na FALSE
                        this.refs.toast.show('Connection failed!'); // toast "Connection failed!"
                        console.log('Connection error', error);
                    });
                }

                // zastavime sken zariadeni
                BleManager.stopScan().then(() => {
                    this.handleStopScan();
                });

            }

        }

    }
    
    // metoda volana pri vykreslovani komponentu
    render() {
    
        const list = Array.from(this.state.peripherals.values());
        const dataSource = ds.cloneWithRows(list);
    
        return (
          <View style={styles.Container}>       
            <View>
                <Text style={{...styles.GlowText, fontSize: 20}}>Scan peripherals</Text>
            </View>  
            <ScrollView style={styles.ScrollView}>
              {(list.length == 0) &&
                <View>
                  <Text style={{textAlign:'center', fontSize: 18, color: 'black'}}>No peripherals</Text>
                </View>
              }
              <ListView enableEmptySections={true} dataSource={dataSource}
                renderRow={(item) => {
                  return (
                    <TouchableHighlight style={styles.ItemButton} onPress={() => this.connectToPeripheral(item) }>
                      <View>
                        <Text style={{fontWeight: 'bold'}}>{item.name}</Text>
                        <Text>{item.id}</Text>
                      </View>
                    </TouchableHighlight>
                  );
                }}
              />
            </ScrollView>
            <View style={styles.ScanButtonContainer}>
                {(!this.state.scanning && !this.state.connecting) &&
                    <TouchableHighlight style={styles.ScanButton} onPress={() => this.startScan() }>
                        <Text style={{color: 'white', fontSize: 18 }}>Scan</Text>
                    </TouchableHighlight>
                }
                {(this.state.scanning) &&
                    <Text style={{...styles.GlowText, fontSize: 20}}> Scanning... </Text>
                }
                {(this.state.connecting) &&
                    <Text style={{...styles.GlowText, fontSize: 20}}> Connecting... </Text>
                }
            </View>
            <Toast ref="toast"/>
          </View>
        );
      }
    }
    
// styly
const styles = StyleSheet.create({
    Container: {
        flex: 1,
        backgroundColor: '#242425',
        padding: 5,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
    },
    GlowText: {
        color: '#8db8ff',
        textShadowColor: 'rgba(224, 236, 255, 1)',
        textShadowRadius: 15
    },
    ScrollView: {
        flex: 0.8,
        width: '100%',
        backgroundColor: '#eaeaed',
        borderRadius: 3,
        padding: 5,
        margin: 5
    },
    ItemButton: {
        height: 50,
        backgroundColor: '#8db8ff',
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 2
    },
    ScanButtonContainer: {
        flex: 0.2,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5
    },
    ScanButton: {
        flex: 1,
        width: '100%',
        backgroundColor: '#4a4a4c',
        borderColor: '#8db8ff',
        borderWidth: 3,
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center'
    }
});
