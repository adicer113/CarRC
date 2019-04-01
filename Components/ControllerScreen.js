import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules
} from 'react-native';
import { accelerometer, gyroscope , setUpdateIntervalForType, SensorTypes } from "react-native-sensors";
import Orientation from 'react-native-orientation';
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
            lane_assist: false,
            smart_lights: false,
            adaptive_cruise_control: false,
            realSpeed: 0
        }

        this.speedChangeValue = 10;
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
            this.setWheelRotation(Math.round((y+10) * 100) / 100);
            this.props.sendData(this.state.wheelRot, this.state.speed, this.state.lane_assist | 0, this.state.adaptive_cruise_control | 0, this.state.smart_lights | 0);
        });
    }

    changeSpeed = (val) => {
        // when adaptive cruise control is active we cant control speed ***
        if(!this.state.adaptive_cruise_control) {
            this.setState({ speed: this.state.speed + val });
        }
    }

    setWheelRotation = (val) => {
        if(!this.state.lane_assist)
            this.setState({wheelRot: val});
    }

    switch_lane_assist = () => {

        if(this.state.lane_assist)
            this.setState({lane_assist: false});
        else
            this.setState({lane_assist: true});

    }

    switch_smart_lights = () => {

        if(this.state.smart_lights)
            this.setState({smart_lights: false});
        else
            this.setState({smart_lights: true});
    
    }

    switch_adaptive_cruise_control = () => {

        if(this.state.adaptive_cruise_control)
            this.setState({adaptive_cruise_control: false});
        else
            this.setState({adaptive_cruise_control: true});

    }

    render() {

        return (
           <View style={styles.Container}>
                <View style={styles.LeftBar}>
                    <View style={styles.ButtonsContainer}>
                        <TouchableHighlight style={styles.Button} onPress={() => this.switch_smart_lights()}>
                            <Text>SmartLights</Text>
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.Button} onPress={() => this.switch_lane_assist()}>
                            <Text>LaneAssist</Text>
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.Button} onPress={() => this.switch_adaptive_cruise_control()}>
                            <Text>Tempomat</Text>
                        </TouchableHighlight>
                    </View>
                    <TouchableHighlight style={styles.SpeedButton} onPress={() => this.changeSpeed(-this.speedChangeValue)}>
                        <Text>(-)</Text>
                    </TouchableHighlight>
                </View>
                <View style={styles.ContentContainer}>
                    <View style={styles.Content}>
                        <SpeedClock/>
                        <Text>{this.state.realSpeed}</Text>
                    </View>
                    <View style={styles.SpeedBar}>
                    </View>
                </View>
                <View style={styles.RightBar}>
                    <View style={styles.ButtonsContainer}>
                        <TouchableHighlight style={styles.Button} onPress={() => this.props.disconnect()}>
                            <Text>(X)</Text>
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.Button}>
                            <Text>Camera</Text>
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.Button}>
                            <Text>Graphs</Text>
                        </TouchableHighlight>
                    </View>
                    <TouchableHighlight style={styles.SpeedButton} onPress={() => this.changeSpeed(this.speedChangeValue)}>
                        <Text>(+)</Text>
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
        backgroundColor: '#4286f4',
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
        backgroundColor: '#1effd9',
    },
    Content: {
        flex: 5/6
    },
    SpeedBar: {
        flex: 1/6,
        backgroundColor: '#e1b0fc'
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
        backgroundColor: '#2EFE2E',
        alignItems: 'center',
        justifyContent: 'center' 
    },
    SpeedButton: {
        flex: 1/3,
        backgroundColor: '#cc6dff',
        alignItems: 'center', 
        justifyContent: 'center'
    }
});