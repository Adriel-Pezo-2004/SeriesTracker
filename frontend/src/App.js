import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import SeriesTracker from './components/SeriesTracker/SeriesTracker'; 
import PageTitle from './components/PageTitle/PageTitle';
import Login from './components/Users/Login/Login';
import Register from './components/Users/Register/Register';
import Header from './components/Common/Header/Header';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="App-content">
          <Routes>
            <Route path="/" element={
                <>
                  <PageTitle title="Buscar - Series Tracker" />
                  <SeriesTracker />
                </>
              } />
              <Route path="/login" element={
                <>
                  <PageTitle title="Login - Series Tracker" />
                  <Login />
                </>
              } />
              <Route path="/registro" element={
                <>
                  <PageTitle title="Registrate - Series Tracker" />
                  <Register />
                </>
              } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;