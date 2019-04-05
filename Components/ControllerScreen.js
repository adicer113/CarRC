import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  WebView,
  Dimensions,
  TouchableHighlight,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules
} from 'react-native';
import { accelerometer, gyroscope , setUpdateIntervalForType, SensorTypes } from "react-native-sensors";
//import Orientation from 'react-native-orientation';
import Orientation from 'react-native-orientation-locker';
import SpeedClock from './SpeedClock';
import Svg,{Rect, Text as SvgText} from 'react-native-svg';

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
            realSpeed: 0,
            screen: 'signals'   // aky screen je zobrazeny 'signals' || 'camera'
        }

        this.minSpeed = 0;
        this.maxSpeed = 120;
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

    renderCameraView = () => {

        if(this.props.connectionType == 'ble')
            return (<Text>NOT SUPPORTED IN BLE MODE</Text>);

        return (<WebView source={{uri: 'https://youtu.be/Um-Zj_RR8P8'}} style={{flex: 1}}/>);

    }

    render() {
        return (
           <View style={styles.Container}>
                <View style={styles.LeftBar}>
                    <View style={styles.ButtonsContainer}>
                        <TouchableHighlight style={styles.Button} onPress={() => this.switch_smart_lights()}>
                            <Svg height="100%" width="100%">
                                <Rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    stroke="white"
                                    strokeWidth="2"
                                    fill={this.state.smart_lights?"yellow":"#8db8ff"}
                                />
                                <SvgText
                                    fill="black"
                                    fontSize="15"
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                >Smart Lights</SvgText>
                            </Svg>
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.Button} onPress={() => this.switch_lane_assist()}>
                            <Svg height="100%" width="100%">
                                <Rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    stroke="white"
                                    strokeWidth="2"
                                    fill={this.state.lane_assist?"yellow":"#8db8ff"}
                                />
                                <SvgText
                                    fill="black"
                                    fontSize="15"
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                >Lane Assistant</SvgText>
                            </Svg>
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.Button} onPress={() => this.switch_adaptive_cruise_control()}>
                            <Svg height="100%" width="100%">
                                <Rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    stroke="white"
                                    strokeWidth="2"
                                    fill={this.state.adaptive_cruise_control?"yellow":"#8db8ff"}
                                />
                                <SvgText
                                    fill="black"
                                    fontSize="15"
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                >Cruise Control</SvgText>
                            </Svg>
                        </TouchableHighlight>
                    </View>
                    <TouchableHighlight style={styles.SpeedButton} onPress={() => this.changeSpeed(-this.speedChangeValue)}>
                        <Svg height="100%" width="100%">
                            <Rect
                                x="0"
                                y="0"
                                width="100%"
                                height="100%"
                                stroke="black"
                                strokeWidth="2"
                                fill="#5b5b5b"
                            />
                            <SvgText
                                fill="white"
                                stroke="black"
                                fontSize="70"
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                            >-</SvgText>
                        </Svg>
                    </TouchableHighlight>
                </View>
                <View style={styles.ContentContainer}>
                    <View style={styles.Content}>
                        {this.state.screen == 'signals' ?
                            (<View style={{flex: 1, flexDirection: 'column'}}>
                                <View style={styles.SpeedClockView}>
                                    <SpeedClock style={{flex: 1}} speed={this.state.realSpeed} minSpeed={this.minSpeed} maxSpeed={this.maxSpeed} />
                                </View>
                                <View style={styles.Grp}>
                                    
                                </View>
                            </View>)
                            :
                            this.renderCameraView()                            
                        }
                    </View>
                    <View style={styles.SpeedBar}>
                        <View style={{ ...styles.SpeedBarFill, width: (100/this.maxSpeed)*this.state.speed }}></View>
                    </View>
                </View>
                <View style={styles.RightBar}>
                    <View style={styles.ButtonsContainer}>
                        <TouchableHighlight style={styles.Button} onPress={() => this.props.disconnect()}>
                            <Svg height="100%" width="100%">
                                <Rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    stroke="white"
                                    strokeWidth="2"
                                    fill="#f73b3b"
                                />
                                <SvgText
                                    fill="white"
                                    fontSize="16"
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                >Disconnect</SvgText>
                            </Svg>
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.Button} onPress={() => this.setState({screen: 'signals'})}>
                            <Svg height="100%" width="100%">
                                <Rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    stroke="white"
                                    strokeWidth="2"
                                    fill="#8db8ff"
                                />
                                <SvgText
                                    fill="black"
                                    fontSize="16"
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                >Signals</SvgText>
                            </Svg>                            
                        </TouchableHighlight>
                        <TouchableHighlight style={styles.Button} onPress={() => this.setState({screen: 'camera'})}>
                            <Svg height="100%" width="100%">
                                <Rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    stroke="white"
                                    strokeWidth="2"
                                    fill="#8db8ff"
                                />
                                <SvgText
                                    fill="black"
                                    fontSize="16"
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                >Camera</SvgText>
                            </Svg>
                        </TouchableHighlight>
                    </View>
                    <TouchableHighlight style={styles.SpeedButton} onPress={() => this.changeSpeed(this.speedChangeValue)}>
                        <Svg height="100%" width="100%">
                            <Rect
                                x="0"
                                y="0"
                                width="100%"
                                height="100%"
                                stroke="black"
                                strokeWidth="2"
                                fill="#5b5b5b"
                            />
                            <SvgText
                                fill="white"
                                stroke="black"
                                fontSize="70"
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                            >+</SvgText>
                        </Svg>
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
        backgroundColor: '#5b5b5b',
        padding: 5
    },    
    SpeedBarFill: {
        height: "100%",
        backgroundColor: '#8db8ff'
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