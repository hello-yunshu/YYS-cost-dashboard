import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

console.log(
  '%c✦ 制作：云云舒 ✦',
  'color:#6366f1;font-size:14px;font-weight:bold;padding:4px 0;'
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
