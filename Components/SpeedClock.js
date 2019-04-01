import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageBackground
} from 'react-native';

export default class SpeedClock extends Component {

    constructor() {
        super();
        this.state = {
            speed: 0
        }
    }

    render() {
        return (
            <ImageBackground source={require('../assets/img/speedClock.png')} style={styles.bgImage} resizeMode='contain'>
                
            </ImageBackground>
        );
    }

}

const styles = StyleSheet.create({
   bgImage: {
       flex: 1,
       width: '100%', 
       height: '100%'
    }
});