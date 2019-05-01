import React, { Component } from 'react';
import Svg,{Path, Text as SvgText} from 'react-native-svg';

export default class SpeedClock extends Component {

    // konstruktor
    constructor(props) {
        super(props);
        this.maxDgrs = 240; // maximalny rozsah natocenia
        this.DgrSpd = this.maxDgrs / this.props.maxSpeed;   // pocet stupnov na rychlost
    }
    
    // metoda na vykreslenie
    render() {
        return (
            <Svg height="150" width="160">
                <Path
                    d="M 35 115 A 60 60 0 1 1 125 115"
                    fill="none"
                    stroke="yellow"
                    strokeWidth="8"
                />
                <Path
                    d="M 75 78 L 80 46 L 85 78"
                    fill="red"
                    origin="80, 78"
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
                        stroke="orange"
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