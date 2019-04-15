import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  WebView,
  Dimensions,
  TouchableHighlight,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules
} from 'react-native';
import { accelerometer, gyroscope , setUpdateIntervalForType, SensorTypes } from "react-native-sensors";
import Orientation from 'react-native-orientation-locker';
import SpeedClock from './SpeedClock';

export default class ControllerScreen extends Component {

    static navigationOptions = {
        header: null
    }

    constructor() {

        super();
        this.state = {
            speed: 0,
            wheelRot: 0,
            real_speed: 0,
            real_lane_assist: false,
            real_smart_lights: false,
            real_adaptive_cruise_control: false,
            screen: 'signals',   // aky screen je zobrazeny 'signals' || 'camera'
            speedBarHeight: 0
        }

        this.lane_assist = false;
        this.smart_lights = false;
        this.adaptive_cruise_control = false;
        this.minSpeed = -100;       // min rychlost
        this.maxSpeed = 100;        // max rychlost 
        this.speedChangeValue = 10; // 

        this.minTurnGyrVal = -8;    // minimalna akceptovana hodnota gyroscopu (natocenia)
        this.maxTurnGyrVal = 8;     // maximalna akceptovana hodnota gyroscopu (natocenia)
        this.minServoVal = 60;      // minimalny uhol natocenia kolies na vozidle
        this.maxServoVal = 120;     // maximalny uhol natocenia kolies na vozidle
    }

    componentDidMount() {
        Orientation.lockToLandscapeLeft();      // lock orientation
        this.props.getData(this.setStateFunc);   // start getting data from server 
        setUpdateIntervalForType(SensorTypes.accelerometer, this.props.sendDataInterval); // nastavenie intervalov ziskavania hodnot z gyroscopu
        this.getGyroscopeData();
    }

    componentWillUnmount() {
        console.log("CONTROLLER_SCREEN will unmount!");
        this.subscription.unsubscribe();    // stop getting gyroscope data
    }

    setStateFunc = (json) => {
        this.setState(json);
    }

    getGyroscopeData() {
        this.subscription = accelerometer.subscribe(({ x, y, z, timestamp }) => {
            this.setWheelRotation(y);
            this.props.sendData(this.state.wheelRot, this.state.speed, this.lane_assist | 0, this.adaptive_cruise_control | 0, this.smart_lights | 0);
        });
    }

    changeSpeed = (val) => {
        // when adaptive cruise control is active we cant control speed ***
        //if(!this.state.adaptive_cruise_control) {
            if(val > 0)
            {
                if(this.state.speed + val <= this.maxSpeed)
                    this.setState({ speed: this.state.speed + val });
            }
            else {
                if(this.state.speed + val >= this.minSpeed)
                    this.setState({ speed: this.state.speed + val });
            }
        //}
    }

    setWheelRotation = (gyrVal) => {

        // natocenie kolies mozme ovladat iba ak nie je zapnuta funkcia lane assistant
        if(!this.state.real_lane_assist) {
            
            let val = gyrVal;

            if(gyrVal < this.minTurnGyrVal) {
                val = this.minTurnGyrVal;
            }
            else if(gyrVal > this.maxTurnGyrVal) {
                val = this.maxTurnGyrVal;
            }

            let gyrValDiff = this.maxTurnGyrVal - this.minTurnGyrVal;
            let servoValDiff = this.maxServoVal - this.minServoVal;
            let ratio = servoValDiff/gyrValDiff;
            let newWhRot = (val*ratio) + this.minServoVal + (servoValDiff/2);

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

    renderSignalsView = () => {
        return (<View style={{flex: 1, flexDirection: 'column'}}>
                    <View style={styles.SpeedClockView}>
                        <SpeedClock style={{flex: 1}} speed={this.state.real_speed} minSpeed={this.minSpeed} maxSpeed={this.maxSpeed} />
                    </View>
                    <View style={styles.Grp}>
                    </View>
                </View>)
    }

    renderCameraView = () => {

        if(this.props.connectionType == 'ble')
            return (<Text style={{color: 'white', fontSize: 30}}> NOT SUPPORTED IN BLE MODE </Text>);

        //return (<WebView source={{uri: 'https://'+this.props.ip+':8081'}} style={{flex: 1}}/>);
        return (<WebView enableCache={true} source={{uri: 'https://hltv.org'}} style={{flex: 1}}/>);

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
                        <ImageBackground source={require('../assets/img/ruller.png')} style={{width: '100%', height: '100%', marginTop: -this.state.speedBarHeight}} resizeMode="stretch"></ImageBackground>
                    </View>
                </View>
                <View style={styles.RightBar}>
                    <View style={styles.ButtonsContainer}>
                        <TouchableHighlight style={{...styles.Button, backgroundColor: "#f73b3b" }} onPress={() => this.props.disconnect()}>
                            <Text style={{color: 'white', fontSize: 15}}>Disconnect</Text>
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.Button} onPress={() => this.setState({screen: 'signals'})}>
                            <Text style={{color: 'black', fontSize: 15}}>Signals</Text>                       
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.Button} onPress={() => this.setState({screen: 'camera'})}>
                            <Text style={{color: 'black', fontSize: 15}}>Camera</Text>
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
    SpeedClockView: {
        flex: 3/5,
        alignItems: 'center', 
        justifyContent: 'center'
    },
    Grp: {
        flex: 2/5,
        backgroundColor: 'grey',
        alignItems: 'center', 
        justifyContent: 'center'
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