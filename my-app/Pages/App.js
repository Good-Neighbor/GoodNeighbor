import './App.css';

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./MainPage";
import SignIn from "./SignIn";
import Listings from "./Listings";
import CreateListing from "./CreateListing";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/create" element={<CreateListing />} />
      </Routes>
    </Router>
  );
}

export default App;
