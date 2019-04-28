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

    static navigationOptions = {
        header: null
    }

    constructor() {

        super();
        this.state = {
            speed: 0,
            wheelRot: 0,
            real_wheelRot: 0,
            real_speed: 0,
            real_lights_on: false,
            real_lane_assist: false,
            real_smart_lights: false,
            real_adaptive_cruise_control: false,
            screen: 'signals',   // aky screen je zobrazeny 'signals' || 'camera'
            speedBarHeight: 0,
            speedData: [{x:0, y:0}]
        }

        this.x = 0;
        this.maxNumOfValuesInGraph = 20;
        this.graphUpdateInterval = null;
        this.lights_on = false;
        this.lane_assist = false;
        this.smart_lights = false;
        this.adaptive_cruise_control = false;
        this.minSpeed = -100;       // min rychlost
        this.maxSpeed = 100;        // max rychlost 
        this.speedChangeValue = 10; //
    }

    componentDidMount() {
        Orientation.lockToLandscapeLeft();      // lock orientation
        this.props.getData(this.setStateFunc);   // start getting data from server 
        setUpdateIntervalForType(SensorTypes.accelerometer, this.props.sendDataInterval); // nastavenie intervalov ziskavania hodnot z gyroscopu
        this.getGyroscopeData();
        this.graphUpdateInterval = setInterval(this.updateGraph, 1000);
    }

    componentWillUnmount() {
        console.log("CONTROLLER_SCREEN will unmount!");
        this.subscription.unsubscribe();    // stop getting gyroscope data
        clearInterval(this.graphUpdateInterval);
    }

    updateGraph = () => {
        this.x++;

        if(this.state.speedData.length < this.maxNumOfValuesInGraph) {
            this.setState({speedData: [ ...this.state.speedData, {x: this.x, y: this.state.real_speed} ]});
        }
        else {
            let data = [...this.state.speedData];
            data.shift();
            this.setState({speedData: [ ...data, {x: this.x, y: this.state.real_speed} ]});
        }
    }

    setStateFunc = (json) => {
        this.setState(json);
    }

    getGyroscopeData() {
        this.subscription = accelerometer.subscribe(({ x, y, z, timestamp }) => {
            this.setWheelRotation(y);
            this.props.sendData(this.state.wheelRot, this.state.speed, this.lights_on | 0, this.lane_assist | 0, this.adaptive_cruise_control | 0, this.smart_lights | 0);
        });
    }

    changeSpeed = (val) => {
        if(val > 0)
        {
            if(this.state.speed + val <= this.maxSpeed)
                this.setState({ speed: this.state.speed + val });
        }
        else {
            if(this.state.speed + val >= this.minSpeed)
                this.setState({ speed: this.state.speed + val });
        }
    }

    setWheelRotation = (gyrVal) => {

        // natocenie kolies mozme ovladat iba ak nie je zapnuta funkcia lane assistant
        if(!this.state.real_lane_assist) {
            
            let val = gyrVal;

            if(gyrVal < -8) {
                val = -8;
            }
            else if(gyrVal > 8) {
                val = 8;
            }

            let newWhRot = ((val+8)*(100/16)); // hodnota z gyroscopu do percent (0-100)
            this.setState({wheelRot: Math.round((newWhRot * 100) / 100)});
        }

    }

    switch_lane_assist = () => {

        if(this.state.real_lane_assist)
            this.lane_assist = false;
        else
            this.lane_assist = true;

    }

    switch_smart_lights = () => {

        if(this.state.real_smart_lights)
            this.smart_lights = false;
        else
            this.smart_lights = true;
    
    }

    switch_adaptive_cruise_control = () => {

        if(this.state.real_adaptive_cruise_control)
            this.adaptive_cruise_control = false;
        else
            this.adaptive_cruise_control = true;

    }

    switch_lights = () => {
        if(this.state.real_lights_on)
            this.lights_on = false;
        else
            this.lights_on = true;
    }

    setScreen = () => {
        if(this.state.screen == 'signals')
            this.setState({screen: 'camera'})
        else 
            this.setState({screen: 'signals'})
    }

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

    renderCameraView = () => {

        if(this.props.connectionType == 'ble')
            return (<Text style={{color: 'white', fontSize: 30}}> NOT SUPPORTED IN BLE MODE </Text>);

        return (<WebView source={{uri: 'https://'+this.props.ip+':8081'}} style={{flex: 1}}/>);

    }

    renderSpeedBarFill = () => {

        let perc = ((100/this.maxSpeed)*Math.abs(this.state.speed))/2;
        let marginL = "50%";
        let bgColor = "#8db8ff";

        if(this.state.speed < 0) {
            marginL = (50-perc)+"%";
            bgColor = "red";
        }

        return (<View style={{ height: "100%", marginLeft: marginL, width: perc + "%", backgroundColor: bgColor }}></View>);
    }

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

// styles
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