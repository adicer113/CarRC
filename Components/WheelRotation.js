import React, { Component } from 'react';
import Svg,{Path} from 'react-native-svg';

export default class WheelRotation extends Component {

    constructor(props) {
        super(props);
        this.minRot = -60;
        this.maxRot = 60;
    }

    render() {
        return (
            <Svg height="90" width="90">
                <Path
                    d="M 35 80 L 55 80 L 55 40 L 75 40 L 45 5 L 15 40 L 35 40 L 35 80 "
                    fill="red"
                    origin="45,45"
                    rotation={Math.round((((this.props.rotation/(100/(this.maxRot-this.minRot)))+this.minRot) * 100) / 100)}
                />
            </Svg>
        );
    }

}