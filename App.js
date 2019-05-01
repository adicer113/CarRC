import { createStackNavigator, createAppContainer } from 'react-navigation'
import ChooseConnectionScreen from "./Components/ChooseConnectionScreen";
import BleScanScreen from "./Components/BleScanScreen";
import ControllerScreen from "./Components/ControllerScreen";
import {BLEControllerHOC} from "./Components/BLEControllerHOC";
import {WifiControllerHOC} from "./Components/WifiControllerHOC";

console.disableYellowBox = true;

const AppNavigator = createStackNavigator({
    ChooseConnection: ChooseConnectionScreen,
    BleScan: BleScanScreen,
    BleController: BLEControllerHOC(ControllerScreen),
    WifiController: WifiControllerHOC(ControllerScreen)
})

const App = createAppContainer(AppNavigator);

export default App;