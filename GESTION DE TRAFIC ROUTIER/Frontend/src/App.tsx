import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Report from './pages/Report';
import Stats from './pages/Stats';
import Welcome from './pages/Welcome';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import PolicePanel from './pages/PolicePanel';
import UserPanel from './pages/UserPanel';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Welcome />} />
          <Route path="welcome" element={<Navigate to="/" replace />} />
          <Route path="map" element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="report" element={<Report />} />
          <Route path="stats" element={<Stats />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="police" element={<PolicePanel />} />
          <Route path="dashboard" element={<UserPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
