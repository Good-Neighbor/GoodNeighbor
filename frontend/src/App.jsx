import './App.css';
import {Routes, Route} from 'react-router-dom';
import StartPage from './pages/StartPage.jsx'

function App(){
    return(
        <main className='main-content'>
            <Routes>
                <Route path='/' element={<StartPage />}/>
            </Routes>
        </main>
    );
}

export default App;