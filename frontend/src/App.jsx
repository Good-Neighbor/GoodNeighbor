import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StartPage from './pages/StartPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ListingsPage from './pages/ListingsPage';  
import CreateListings from './pages/CreateListings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/listingspage" element={<ListingsPage />} />
        <Route path="/createlistings" element={<CreateListings />} />
      </Routes>
    </Router>
  );
}

export default App;
