import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import SeriesTracker from './components/SeriesTracker/SeriesTracker'; 
import PageTitle from './components/PageTitle/PageTitle';
import Login from './components/Users/Login/Login';
import Register from './components/Users/Register/Register';
import Logout from './components/Users/Logout/Logout';
import Header from './components/Common/Header/Header';
import SeriesWatch from './components/SeriesWatch/SeriesWatch';
import Profile from './components/Common/Profile/Profile';
import { AuthProvider } from './context/AuthContext';


function App() {
  return (
    <AuthProvider>
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
                <Route path="/series" element={
                  <>
                    <PageTitle title="Series - Series Tracker" />
                    <SeriesWatch />
                  </>
                } />
                <Route path="/logout" element={<Logout />} />
                <Route path="/perfil" element={
                    <>
                      <PageTitle title="Mi Perfil - Series Tracker" />
                      <Profile />
                    </>
                } />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;