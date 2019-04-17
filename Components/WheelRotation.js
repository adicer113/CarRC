import React, { Component } from 'react';
import Svg,{Path, Text as SvgText} from 'react-native-svg';

export default class SpeedClock extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Svg height="90" width="90">
                <Path
                    d="M 35 80 L 55 80 L 55 40 L 75 40 L 45 5 L 15 40 L 35 40 L 35 80 "
                    fill="red"
                    origin="45,45"
                    rotation={this.props.rotation-90}
                />
            </Svg>
        );
    }

}