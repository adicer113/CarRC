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
  AppState,
  Dimensions,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import Orientation from 'react-native-orientation';
import Toast, {DURATION} from 'react-native-easy-toast'

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default class BleScanScreen extends Component {

    static navigationOptions = {
        header: null
    }

    constructor() {

        super()
        this.state = {  
            scanning: false,        // scanning peripherals
            peripherals: new Map(),
            appState: '',
            connecting: false
        }

        this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
        this.handleStopScan = this.handleStopScan.bind(this);
        //this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
        this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
        this.handleAppStateChange = this.handleAppStateChange.bind(this);

    }

    componentDidMount() {

        AppState.addEventListener('change', this.handleAppStateChange);

        // start BLE Manager
        BleManager.start({showAlert: true, forceLegacy: true});
        this.startScan(); // start scanning

        // add listeners
        this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
        this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
        this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
        //this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );

        // check permissions
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

        // lock orientation
        Orientation.lockToLandscapeLeft();

    }

    componentWillUnmount() {
        console.log("BLE_SCAN_SCREEN will unmount!");

        // remove listeners
        this.handlerDiscover.remove();
        this.handlerStop.remove();
        this.handlerDisconnect.remove();
        //this.handlerUpdate.remove();

        if(this.state.scanning) {
            BleManager.stopScan().then(() => {
                this.handleStopScan();
            });
        }

    }

    handleAppStateChange(nextAppState) {
        if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
            console.log('App has come to the foreground!')
            BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
                console.log('Connected peripherals: ' + peripheralsArray.length);
            });
        }
        this.setState({appState: nextAppState});
    }

    handleDisconnectedPeripheral(data) {
        let peripherals = this.state.peripherals;
        let peripheral = peripherals.get(data.peripheral);
        if (peripheral) {
          peripheral.connected = false;
          peripherals.set(peripheral.id, peripheral);
          this.setState({peripherals});
        }
        console.log('Disconnected from ' + data.peripheral);
      }

    handleDiscoverPeripheral(peripheral) {
        var peripherals = this.state.peripherals;
        if (!peripherals.has(peripheral.id)){
            console.log('Got ble peripheral --> ', peripheral);
            peripherals.set(peripheral.id, peripheral);
            this.setState({ peripherals })
        }
    }

    handleUpdateValueForCharacteristic(data) {
        console.log('OLD *** Received data: ' + data.value);
    }

    handleStopScan() {
        console.log('Scan is stopped');
        this.setState({ scanning: false });
    }

    startScan() {

        if (!this.state.scanning) {
            this.setState({peripherals: new Map()});
            BleManager.scan([], 20, true).then((results) => {
                console.log('Scanning...');
                this.setState({scanning:true});
            });
        }

    }

    connectToPeripheral(peripheral) {

        // ak sa uz niekde nepripaja
        if (!this.state.connecting) {

            this.setState({connecting: true});

            if(peripheral) {
                
                if (!peripheral.connected) {

                    BleManager.connect(peripheral.id).then(() => {
                        let peripherals = this.state.peripherals;
                        let p = peripherals.get(peripheral.id);
                        if (p) {
                            p.connected = true;
                            peripherals.set(peripheral.id, p);
                            this.setState({peripherals});
                        }
                        console.log('Connected to ' + peripheral.id);
                        this.setState({connecting: false});
                        this.props.navigation.navigate('BleController', { BleManager, bleManagerEmitter, peripheral });

                    }).catch((error) => {
                        this.setState({connecting: false});
                        this.refs.toast.show('Connection failed!');
                        console.log('Connection error', error);
                    });
                }

                BleManager.stopScan().then(() => {
                    this.handleStopScan();
                });

            }

        }

    }
    

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
        //borderWidth: 3,
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