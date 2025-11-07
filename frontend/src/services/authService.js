import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthService {
  async login(email, password) {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    if (response.data.success && response.data.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
      this.setAuthToken(response.data.data.token);
    }

    return response.data;
  }

  async register(username, email, password) {
    const response = await axios.post(`${API_URL}/auth/register`, {
      username,
      email,
      password,
    });

    if (response.data.success && response.data.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
      this.setAuthToken(response.data.data.token);
    }

    return response.data;
  }

  logout() {
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      this.setAuthToken(userData.token);
      return userData;
    }
    return null;
  }

  setAuthToken(token) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  getToken() {
    const user = this.getCurrentUser();
    return user ? user.token : null;
  }
}

export default new AuthService();
