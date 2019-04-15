import React, { Component } from 'react';
import {
  StyleSheet
} from 'react-native';
import Svg,{Path, Text as SvgText} from 'react-native-svg';

export default class SpeedClock extends Component {

    constructor(props) {
        super(props);
        this.maxDgrs = 240;
        this.DgrSpd = this.maxDgrs / this.props.maxSpeed;
    }

    render() {
        return (
            <Svg height="150" width="160">
                <Path
                    d="M 35 115 A 60 60 0 1 1 125 115"
                    fill="none"
                    stroke="yellow"
                    strokeWidth="10"
                />
                <Path
                    d="M 69 78 L 74 46 L 80 78"
                    fill="red"
                    stroke="black"
                    strokeWidth="1"
                    origin="74, 78"
                    rotation={(Math.abs(this.props.speed) * this.DgrSpd)-(this.maxDgrs/2)}
                />
                <SvgText
                    fill="red"
                    stroke="orange"
                    fontSize="28"
                    x="50%"
                    y="123"
                    textAnchor="middle">
                    {Math.abs(this.props.speed)}
                </SvgText>
                {this.props.speed < 0 &&
                    <SvgText
                        fill="red"
                        stroke="#ff907f"
                        fontSize="25"
                        x="145"
                        y="25"
                        textAnchor="middle">
                        R
                    </SvgText>
                }
            </Svg>
        );
    }

}

const styles = StyleSheet.create({
    SpeedClock: {
        flex: 1
    },
    Hand: {
        //width: 50, 
        //height: 120,
        flex: 1
    },
    SpeedValue: {
        color: 'red',
        fontSize: 30,
        textShadowColor: 'rgba(250, 73, 73, 1)',
        textShadowRadius: 15,
        marginLeft: 120,
        marginTop: -20
    }
});

/*<ImageBackground source={require('../assets/img/speedClock.png')} style={styles.SpeedClock} resizeMode='contain'>
                <Image source={require('../assets/img/SpeedClock_hand.png')} style={styles.Hand}></Image>
                <Text style={styles.SpeedValue}>{this.props.speed}</Text>
            </ImageBackground>
            
            
            M 100 114 Q 114 115 100 59 Q 86 114 100 114
            */