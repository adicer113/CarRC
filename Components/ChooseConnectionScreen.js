import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableHighlight,
  TextInput,
  Image
} from 'react-native';
import Orientation from 'react-native-orientation';
import io from 'socket.io-client';
import Toast, {DURATION} from 'react-native-easy-toast'

export default class ChooseConnectionScreen extends Component {

    static navigationOptions = {
        header: null
    }

    constructor(props) {

        super(props)
        this.state = {
            ip: "192.168.1.21",
            IPmodalVisible: false,
            connecting: false,
        }
    }

    componentDidMount() {
        Orientation.lockToLandscapeLeft();  // lock orientation
    }

    componentWillUnmount() {
        console.log("CHOOSE_CONNECTION_SCREEN will unmount!");
    }

    setIPModalVisibility(visibility) {
        this.setState({IPmodalVisible: visibility});  
    }

    connectThroughWifi() {
        
        let socketIO = io("http://"+this.state.ip+":9000", {transports: ['websocket']});
        this.setState({connecting: true});
        console.log("connecting to http://"+this.state.ip+":9000 ... ");

        socketIO.on('connection_successful', () => {
            this.props.navigation.navigate('WifiController', {socketIO});
            this.setState({connecting: false});
        });

        // ak neprijde zo servera potvrdenie pripojenia do 5s.. vypise hlasku "Connection failed"
        setTimeout(() => {

            if(this.state.connecting) {
                this.setState({connecting: false});
                socketIO.disconnect();
                this.refs.toast.show('Connection failed!');
                console.log("Connection failed!");
            }

        }, 5000);

        this.setIPModalVisibility(false);

    }

    render() {
        return (
            <View style={styles.AppContainer}>
                <View>
                    <Text style={{...styles.GlowText, fontSize: 30}}>CARRC</Text>
                </View>
                <Text style={{...styles.GlowText, fontSize: 25}}> Choose connection type </Text>
                <View style={styles.ConnectionButtonsContainer}> 
                    <TouchableHighlight style={styles.ConnectionButton} onPress={() => this.props.navigation.navigate('BleScan')}>
                        <Image source={require('../assets/img/ble_button.png')} style={{width: '100%', height: '100%'}}></Image>
                    </TouchableHighlight>
                    <TouchableHighlight style={styles.ConnectionButton} onPress={() => this.setIPModalVisibility(true) }>
                        <Image source={require('../assets/img/wifi_button.png')} style={{width: '100%', height: '100%'}}></Image>
                    </TouchableHighlight>
                </View>
                <Modal
                style = {styles.IPModalContainer}
                animationType="slide"
                transparent={false}
                visible={this.state.IPmodalVisible}
                onRequestClose={() => {  this.setIPModalVisibility(false) }}>
                    <View style={styles.IPModalView}>
                        <View style={styles.IPModalInputContainer}>
                            <Text style={{...styles.GlowText, fontSize: 25}}>
                                Connect to IP:
                            </Text>
                            <TextInput style={styles.IPModalTextInput} onChangeText={(ip) => this.setState({ip})} value={this.state.ip}/>
                        </View>
                        <View style={styles.IPModalButtonsContainer}>
                            <TouchableHighlight style={styles.IPModalButton} onPress={() => { this.connectThroughWifi() }}>
                                <Text style={{color: 'white', fontSize: 18 }}>Pripojiť</Text>
                            </TouchableHighlight>
                            <TouchableHighlight style={styles.IPModalButton} onPress={() => { this.setIPModalVisibility(false) }}>
                                <Text style={{color: 'white', fontSize: 18 }}>Zrušiť</Text>
                            </TouchableHighlight>
                        </View>
                    </View>
                </Modal>
                <Modal style={styles.CnctModalContainer} animationType="fade" transparent={true} visible={this.state.connecting}>
                    <View style={styles.CnctModalView}>
                        <Text>Connecting...</Text>
                    </View>
                </Modal>
                <Toast ref="toast"/>
            </View>
        );
    }

}

const styles = StyleSheet.create({
    AppContainer: {
        flex: 1,
        padding: 5,
        width: window.width,
        height: window.height,
        backgroundColor: '#242425',
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
    ConnectionButtonsContainer: {
        flex: 1,
        width: window.width,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        alignSelf: 'stretch',
        textAlign: 'center',
    },
    ConnectionButton: {
        height: 200,
        width: 200,
        borderRadius: 200,
        alignItems: 'center',
        justifyContent: 'center'
    },
    IPModalContainer:{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
    },
    IPModalView: {
        flex: 1,
        height: '100%',
        width: '100%',
        backgroundColor: '#242425',
        alignItems: 'center',
        justifyContent: 'center'
    },
    IPModalInputContainer: {
        flex: 0.5,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: 3
    },
    IPModalTextInput: {
        fontSize: 25,
        height: 80, 
        width: '80%',
        backgroundColor: '#e0ecff',
        borderColor: '#8db8ff', 
        borderWidth: 3,
        borderRadius: 3,
        textAlign: 'center'
    },
    IPModalButtonsContainer: {
        flex: 0.5,
        padding: 3,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center'
    },
    IPModalButton: {
        width: '40%',
        height: 50,
        backgroundColor: '#4a4a4c',
        borderColor: '#8db8ff',
        borderWidth: 3,
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
    },
    CnctModalContainer: {
        flex: 1,
        height: 20,
        backgroundColor: '#8db8ff',
        justifyContent: 'flex-end',
        alignItems: 'flex-end'
    },
    CnctModalView: {
        height: 35,
        backgroundColor: '#8db8ff',
        justifyContent: 'center',
        alignItems: 'center'
    }
});