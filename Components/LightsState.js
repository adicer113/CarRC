import React, { Component } from 'react';
import Svg,{Path} from 'react-native-svg';

export default class LigthsState extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        if(this.props.lightsON) {
            return (
                <Svg height="100" width="100">
                    <Path
                        d="M 50 75 A 43 24 0 1 1 50 25 L 50 25 Q 62 50 50 75 "
                        fill="yellow"
                    />
                    <Path
                        d="M 68 28 L 88 18 "
                        fill="none"
                        stroke="yellow"
                        strokeWidth="3"
                    />
                    <Path
                        d="M 72 50 L 95 50 "
                        fill="none"
                        stroke="yellow"
                        strokeWidth="3"
                    />
                    <Path
                        d="M 68 72 L 88 82 "
                        fill="none"
                        stroke="yellow"
                        strokeWidth="3"
                    />
                </Svg>
            );
        }
        else {
            return (
                <Svg height="100" width="100">
                    <Path
                        d="M 50 75 A 43 24 0 1 1 50 25 L 50 25 Q 62 50 50 75 "
                        fill="white"
                    />
                </Svg>
            );
        }
    }

}