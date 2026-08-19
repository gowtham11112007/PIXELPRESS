import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import MyOrders from './pages/MyOrders';
import { useAppContext } from './context/AppContext';
import Toast from './components/Toast';

// PrivateRoute component to protect routes
function PrivateRoute({ children }) {
  const { user } = useAppContext();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <PrivateRoute>
              <MyOrders />
            </PrivateRoute>
          } 
        />
      </Routes>
      <Toast />
    </Router>
  );
}

export default App;
