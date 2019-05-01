import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  WebView,
  TouchableHighlight,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules
} from 'react-native';
import { accelerometer, gyroscope , setUpdateIntervalForType, SensorTypes } from "react-native-sensors";
import Orientation from 'react-native-orientation-locker';
import {LineChart} from 'react-native-charts-wrapper';
import SpeedClock from './SpeedClock';
import WheelRotation from './WheelRotation';
import LightsState from './LightsState';
import rullerImage from '../assets/img/ruller.png';

export default class ControllerScreen extends Component {

    // nastavenie navigacie
    static navigationOptions = {
        header: null
    }

    // konstruktor
    constructor(props) {
        super(props);
        this.state = {
            speed: 0,                               // pozadovana rychlost
            wheelRot: 0,                            // pozadovane natocenie kolies
            real_wheelRot: 0,                       // realne natocenie kolies
            real_speed: 0,                          // realna rychlost
            real_lights_on: false,                  // realny stav svetiel 
            real_lane_assist: false,                // realny stav funkcie lane assistant 
            real_smart_lights: false,               // realny stav funkcie inteligentne svetla
            real_adaptive_cruise_control: false,    // realny stav funkcie adaptivny tempomat
            screen: 'signals',                      // aky screen je zobrazeny 'signals' || 'camera'
            speedBarHeight: 0,                      // vyska speedbaru
            speedData: [{x:0, y:0}]                 // data pre graf rychlosti
        }
        this.x = 0;                             // hodnota osi x v grafe
        this.maxNumOfValuesInGraph = 20;        // pocet zobrazovanych hodnot v grafe
        this.graphUpdateInterval = null;        // interval aktualizacii grafu
        this.lights_on = false;                 // stav svetiel
        this.lane_assist = false;               // stav funkcie lane assistant
        this.smart_lights = false;              // stav funkcie inteligentne svetla
        this.adaptive_cruise_control = false;   // stav funkcie adaptivny tempomat
        this.minSpeed = -100;                   // minimalna rychlost
        this.maxSpeed = 100;                    // maximalna rychlost 
        this.speedChangeValue = 10;             // hodnota o aku sa meni rychlost pri pridavani/uberani
    }

    // React lifecycle metoda volana hned po tom ako je komponent nasadeny
    componentDidMount() {
        Orientation.lockToLandscapeLeft();      // zamknutie orientacie na Landscape left
        this.props.getData(this.setStateFunc);  // spustenie funkcie pre prijimanie dat zo servera 
        this.getGyroscopeData();                // spustenie ziskavania dat z gyroskopu
        this.graphUpdateInterval = setInterval(this.updateGraph, 1000); // nastavenie intervalu aktualizacie grafu rychlosti
    }

    // React lifecycle metoda volana pred odstranenim komponentu z DOM
    componentWillUnmount() {
        console.log("CONTROLLER_SCREEN will unmount!");
        this.subscription.unsubscribe();            // ukoncenie ziskavania dat z gyroskopu
        clearInterval(this.graphUpdateInterval);    // ukoncienie aktualizacii grafu rychlosti
    }

    // medtoda sluziaca na aktualizovanie grafu rychlosti
    updateGraph = () => {
        
        this.x++; // inkrementujeme cislo na osi x (cislo merania)

        // ak je pocet dat mensi ako maximum vykreslovanych dat v grafe
        if(this.state.speedData.length < this.maxNumOfValuesInGraph) {
            this.setState({speedData: [ ...this.state.speedData, {x: this.x, y: this.state.real_speed} ]});
        }
        // inak
        else {
            let data = [...this.state.speedData];   // vytvorime kopiu pola dat
            data.shift();                           // odstranime prvy prvok (najstarsi)
            this.setState({speedData: [ ...data, {x: this.x, y: this.state.real_speed} ]}); // volzime novy prvok a aktualizujeme state
        }

    }

    // metoda pre nastavenie stavu (posielana do odvodenych komponentov ako callback funkcia)
    setStateFunc = (newState) => {
        this.setState(newState);
    }

    // metoda pre ziskanie dat z gyroskopu
    getGyroscopeData() {
        
        // poznamka: v tejto kniznici to maju pod oznacenim "accelerometer" ale maju to vymenene v skutocnosti dostavame data z gyroskopu !!!
        setUpdateIntervalForType(SensorTypes.accelerometer, this.props.sendDataInterval); // nastavenie intervalov ziskavania hodnot z gyroscopu
        
        // ziskavanie dat z gyroskopu
        this.subscription = accelerometer.subscribe(({ x, y, z, timestamp }) => {
            this.setWheelRotation(y);   // nastavenie zatocenia kolies podla natocenia smartfonu
            // volanie funkcie na odosielanie dat na server
            this.props.sendData(this.state.wheelRot, this.state.speed, this.lights_on | 0, this.lane_assist | 0, this.adaptive_cruise_control | 0, this.smart_lights | 0);
        });

    }

    // metoda pre zmenu pozadovanej rychlosti
    changeSpeed = (val) => {

        if(val > 0)
        {
            if(this.state.speed + val <= this.maxSpeed)
                this.setState({ speed: this.state.speed + val }); // nastavenie pozadovanej rychlosti
        }
        else {
            if(this.state.speed + val >= this.minSpeed)
                this.setState({ speed: this.state.speed + val }); // nastavenie pozadovanej rychlosti
        }

    }

    // metoda pre zmenu pozadovaneho natocenia kolies
    setWheelRotation = (gyrVal) => {

        // natocenie kolies mozme ovladat iba ak nie je zapnuta funkcia lane assistant
        if(!this.state.real_lane_assist) {
            
            let val = gyrVal;

            // rozsah natocenia -8 az 8
            if(gyrVal < -8)
                val = -8;        
            else if(gyrVal > 8)
                val = 8;

            let newWhRot = ((val+8)*(100/16)); // hodnota z gyroscopu do percent (0-100)
            this.setState({wheelRot: Math.round((newWhRot * 100) / 100)});  // nastavenie pozadovaneho zatocenia kolies
        }

    }

    // metoda pre zapnutie/vypnutie funkcie lane assistant
    switch_lane_assist = () => {

        if(this.state.real_lane_assist)
            this.lane_assist = false;
        else
            this.lane_assist = true;

    }

    // metoda pre zapnutie/vypnutie funkcie inteligente svetla
    switch_smart_lights = () => {

        if(this.state.real_smart_lights)
            this.smart_lights = false;
        else
            this.smart_lights = true;
    
    }

    // metoda pre zapnutie/vypnutie funkcie adaptivny tempomat
    switch_adaptive_cruise_control = () => {

        if(this.state.real_adaptive_cruise_control)
            this.adaptive_cruise_control = false;
        else
            this.adaptive_cruise_control = true;

    }

    // metoda pre zapnutie/vypnutie svetiel
    switch_lights = () => {
        if(this.state.real_lights_on)
            this.lights_on = false;
        else
            this.lights_on = true;
    }

    // metoda pre nastavenie zobrazovaneho screenu
    setScreen = () => {
        if(this.state.screen == 'signals')
            this.setState({screen: 'camera'})
        else 
            this.setState({screen: 'signals'})
    }

    // metoda pre vykreslenie zobrazenia signalov
    renderSignalsView = () => {
        return (<View style={{flex: 1, flexDirection: 'column'}}>
                    <View style={styles.SignalsView}>
                        <View style={styles.WheelRotView}>
                            <Text style={{color:'white'}}>Wheel rotation</Text>
                            <WheelRotation rotation={this.state.real_wheelRot} />
                        </View>
                        <View style={styles.SpeedClockView}>
                            <Text style={{color:'white'}}>Real speed</Text>
                            <SpeedClock style={{flex: 1}} speed={this.state.real_speed} minSpeed={this.minSpeed} maxSpeed={this.maxSpeed} />
                        </View>
                        <View style={styles.LightsView}>
                            <Text style={{color:'white'}}>Lights</Text>
                            <LightsState style={{flex:1}} lightsON={this.state.real_lights_on} />
                        </View>
                    </View>
                    <View style={styles.GraphContainer}>
                        <Text style={{color:'white'}}>Speed Graph</Text>
                        <View style={{flex: 1}}>
                            <View style={{flex:1, backgroundColor:'grey'}}>
                            <LineChart style={{flex:1}}
                                data={{dataSets:[{label: "speed", values: this.state.speedData }]}}
                            />
                            </View>
                        </View>
                    </View>
                </View>)
    }

    // metoda pre vykreslenie zobrazenia prenosu z kamery
    renderCameraView = () => {

        // ak sme v mode prepojenia cez BLE tak nie je tato funkcia dostupna
        if(this.props.connectionType == 'ble')
            return (<Text style={{color: 'white', fontSize: 25}}> NOT SUPPORTED IN BLE MODE </Text>);

        // vykreslenie WebView s adresou kde je live stream z kamery
        return (<WebView source={{uri: 'https://'+this.props.ip+':8081'}} style={{flex: 1}}/>);

    }

    // metoda pre vykreslenie speedbaru
    renderSpeedBarFill = () => {

        let perc = ((100/this.maxSpeed)*Math.abs(this.state.speed))/2; // vypocet percent
        let marginL = "50%";        // ak je (speed > 0) vykreslujeme od stredu speedbaru
        let bgColor = "#8db8ff";    // ak je (speed > 0) farba je modra

        // ak je speed < 0
        if(this.state.speed < 0) {
            marginL = (50-perc)+"%";    // vypocet odkial budeme vykreslovat
            bgColor = "red";            // farba cervena
        }

        return (<View style={{ height: "100%", marginLeft: marginL, width: perc + "%", backgroundColor: bgColor }}></View>);

    }

    // metoda pre vykreslenie komponentu
    render() {
        return (
           <View style={styles.Container}>
                <View style={styles.LeftBar}>
                    <View style={styles.ButtonsContainer}>
                        <TouchableHighlight style={{...styles.Button, backgroundColor: this.state.real_smart_lights?"yellow":"#8db8ff" }} onPress={() => this.switch_smart_lights()}>
                            <Text style={{color: 'black', fontSize: 15}}>Smart Lights</Text>
                        </TouchableHighlight>
                        <TouchableHighlight style={{...styles.Button, backgroundColor: this.state.real_lane_assist?"yellow":"#8db8ff" }} onPress={() => this.switch_lane_assist()}>
                            <Text style={{color: 'black', fontSize: 15}}>Lane Assistant</Text>
                        </TouchableHighlight>
                        <TouchableHighlight style={{...styles.Button, backgroundColor: this.state.real_adaptive_cruise_control?"yellow":"#8db8ff" }} onPress={() => this.switch_adaptive_cruise_control()}>
                            <Text style={{color: 'black', fontSize: 15}}>Cruise Control</Text>
                        </TouchableHighlight>
                    </View>
                    <TouchableHighlight style={styles.SpeedButton} onPress={() => this.changeSpeed(-this.speedChangeValue)}>
                        <Text style={{color: 'white', fontSize: 70}}>-</Text>
                    </TouchableHighlight>
                </View>
                <View style={styles.ContentContainer}>
                    <View style={styles.Content}>
                        { this.state.screen == 'signals' ? this.renderSignalsView() : this.renderCameraView() }
                    </View>
                    <View onLayout={(event) => { this.setState({speedBarHeight: event.nativeEvent.layout.height}) }}  style={styles.SpeedBar}>
                        {this.renderSpeedBarFill()}
                        <ImageBackground source={rullerImage} style={{width: '100%', height: '100%', marginTop: -this.state.speedBarHeight}} resizeMode="stretch"></ImageBackground>
                    </View>
                </View>
                <View style={styles.RightBar}>
                    <View style={styles.ButtonsContainer}>
                        <TouchableHighlight style={{...styles.Button, backgroundColor: "#f73b3b" }} onPress={() => this.props.disconnect()}>
                            <Text style={{color: 'white', fontSize: 15}}>Disconnect</Text>
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.Button} onPress={() => this.switch_lights()}>
                            <Text style={{color: 'black', fontSize: 15}}>Lights {this.state.real_lights_on?"OFF":"ON"}</Text>                       
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.Button} onPress={() => this.setScreen()}>
                            <Text style={{color: 'black', fontSize: 15}}>{this.state.screen=='signals'?"Camera":"Signals"}</Text>
                        </TouchableHighlight>
                    </View>
                    <TouchableHighlight style={styles.SpeedButton} onPress={() => this.changeSpeed(this.speedChangeValue)}>
                        <Text style={{color: 'white', fontSize: 70}}>+</Text>
                    </TouchableHighlight>
              </View>
           </View>
        );
    }

}

// styly
const styles = StyleSheet.create({
    Container: {
        flex: 1,
        backgroundColor: '#242425',
        width: window.width,
        height: window.height,
        flexDirection: 'row'
    },
    LeftBar: {
        flex: 1/6,
        flexDirection: 'column',
        backgroundColor: '#1eff83',
    },
    ContentContainer: {
        flex: 4/6,
        flexDirection: 'column',
        backgroundColor: '#242425',
    },
    Content: {
        flex: 5/6,
        flexDirection: 'column',
        padding: 5
    },
    SignalsView: {
        flex: 3/5,
        flexDirection: 'row',
        alignItems: 'center', 
        justifyContent: 'center'
    },
    WheelRotView: {
        flex: 2/7,
        alignItems: 'center', 
        justifyContent: 'center'
    },
    SpeedClockView: {
        flex: 3/7,
        alignItems: 'center', 
        justifyContent: 'center'
    },
    LightsView: {
        flex: 2/7,
        alignItems: 'center', 
        justifyContent: 'center'
    },
    GraphContainer: {
        flex: 2/5
    },
    SpeedBar: {
        flex: 1/6,
        backgroundColor: '#5b5b5b'
    },
    RightBar: {
        flex: 1/6,
        flexDirection: 'column',
        backgroundColor: '#1eff83',
    },
    ButtonsContainer: {
        flex: 2/3,
        flexDirection: 'column',
        backgroundColor: '#1eff83',
    },
    Button: { 
        flex: 1,
        backgroundColor: '#8db8ff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white'
    },
    SpeedButton: {
        flex: 1/3,
        backgroundColor: '#5b5b5b',
        borderColor: 'white', 
        borderWidth: 2,
        alignItems: 'center', 
        justifyContent: 'center'
    }
});