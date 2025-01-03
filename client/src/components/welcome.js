import React, { useState } from 'react';
import { useAppState } from './fakestackoverflow';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../stylesheets/Welcome.css';

export default function Welcome() {
    return (
        <div>
        <div className="banner">
            <h1>Fake Stack Overflow</h1>
        </div>
        <div className="options-container">
            <div className="option">
            <Link to="/register" className="button">Register as a new user</Link>
            </div>
            <div className="option">
            <Link to="/login" className="button">Login as an existing user</Link>
            </div>
            <div className="option">
            <Link to="/homepage" className="button">Continue as a guest user</Link>
            </div>
        </div>
        </div>
    );
}

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailid = formData.email.split('@')[0];
    if (formData.password.includes(formData.username)) { alert("Your password cannot contain your username."); return; }
    if (formData.password.includes(emailid)) {alert("Your password cannot contain your email id."); return; }
    if (formData.password !== formData.confirmPassword) {alert("Your password does not match your confirmation password."); return; }

    // Add to database
    const response = (await axios.post('http://localhost:8000/register', formData)).data;
    if (response.success === false) {
        alert(response.msg);
        return;
    }
    console.log("Created user: " + response.user.username);
    
    navigate('/login');
  };

  return (
    <>
    <div className="banner">
        <h1>Fake Stack Overflow</h1>
    </div>
    <div className="register-container">
      <h2>Register for a New Account</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="firstName">Username:</label>
          <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
        </div>
        <button type="submit" className="signup-button">Sign Up</button>
      </form>
    </div>
    </>
  );
}

export function Login() {
  const navigate = useNavigate();
  const { setUser } = useAppState();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate User
    const response = (await axios.post('http://localhost:8000/login', formData, {withCredentials : true})).data;
    if (!response.success) {
        alert(response.msg);
    } else {
        // Set User
        setUser(response.user);
        navigate('/homepage');
    }
    
  };

  return (
    <>
    <div className="banner">
        <h1>Fake Stack Overflow</h1>
    </div>
    <div className="register-container">
      <h2>Log in to your account</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required/>
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required/>
        </div>

        <button type="submit" className="signup-button">Log In</button>
      </form>
    </div>
    </>
  );
}