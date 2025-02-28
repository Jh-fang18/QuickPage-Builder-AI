import axios from 'axios'; // 导入HTTP请求库\

const http = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL, // 基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
http.interceptors.request.use(config => {
  // 在发送请求之前做些什么
  return config;
}, error => {
  // 对请求错误做些什么
  return Promise.reject(error);
});

// 响应拦截器
http.interceptors.response.use(response => {
  // 对响应数据做些什么
  return response.data;
}, error => {
  // 对响应错误做些什么
  return Promise.reject(error);
});