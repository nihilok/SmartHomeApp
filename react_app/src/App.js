import {BrowserRouter as Router, Route} from "react-router-dom";
import {MenuScreen} from './components/Menu';
import {Heating} from './components/Heating';
import {Tasks} from './components/Tasks';
import {Shopping} from './components/Shopping';
import Cams from "./components/Cams";


function App() {
    return (
        <div className="app_body">
            <Router>
                <div>
                    <Route exact path="/" component={MenuScreen}/>
                    <Route path="/heating" component={Heating}/>
                    <Route path="/tasks" component={Tasks}/>
                    <Route path="/shopping" component={Shopping}/>
                    <Route path="/cam" component={Cams}/>
                    <Route path="/map" component={() => {
                        window.location.href = 'https://goo.gl/maps/SZnfFiGk2VhpDoWV9';
                        return null;
                    }}/>
                </div>
            </Router>
        </div>
    )
        ;
}

export default App;
