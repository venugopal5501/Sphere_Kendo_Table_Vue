import axios from 'axios';
import Vue from 'vue';

const apiBaseAddress = 'http://localhost:59909/api/'

const statuses = {
  pending: 'PENDING',
  success: 'SUCCESS',
  error: 'ERROR',
};
const getEndpoint = (url) => {
  if (url.includes(apiBaseAddress)) {
    url = url.replace(apiBaseAddress, '');
  }
  return url.split('?')[0];
};

let axiosRequestStatus = {};
let axiosInterceptors = {};

const handlers = {
  /**
   * Runs before a request is sent
   * @param {object} config The config object from Axios
   */
  requestSend: (config) => {
    config.url = `${apiBaseAddress}${config.url}`;

    const endpoint = getEndpoint(config.url);
    Vue.set(axiosRequestStatus, endpoint, statuses.pending);
    if (axiosInterceptors[endpoint]) {
      axiosInterceptors[endpoint].forEach((e) => e.onLoad(config));
    }
    return config;
  },
  /**
   * Runs when a request fails to send (not when it returns an error)
   * @param {object} error The error object from Axios
   */
  requestError: (error) => {
    const endpoint = getEndpoint(error.config.url);
    Vue.set(axiosRequestStatus, endpoint, statuses.error);
    if (axiosInterceptors[endpoint]) {
      axiosInterceptors[endpoint].forEach((e) => e.onError(error));
    }
    return Promise.reject(error);
  },
  /**
   * Runs when a response has a 2xx response code
   * @param {object} response The response object from Axios
   */
  // eslint-disable-next-line complexity
  responseSuccess: (response) => {
    const endpoint = getEndpoint(response.config.url);
    Vue.set(axiosRequestStatus, endpoint, statuses.success);
    if (axiosInterceptors[endpoint]) {
      axiosInterceptors[endpoint].forEach((e) => e.onSuccess(response));
    }
    return response;
  },
  /**
   * Runs when a response has a non-2xx response code
   * @param {object} error The error object from Axios
   */
  // eslint-disable-next-line complexity
  responseError: (error) => {
    // If License Error (402) redirect to Invalid License page
    if (error.response.status === 402) {
      // Ignore 402's on Admin/Licensing and InvalidLicense pages
      if (
        window.location.href.endsWith('Admin/#/Licensing') ||
        window.location.href.endsWith('InvalidLicense#/')
      ) {
        return;
      }
      // perform redirect
      window.location.href = `${apiBaseAddress}/InvalidLicense#`;
      return error.response.data;
    } else if (error.response.status === 500) {
      // parse out the error from the api response
      if (
        error.response.data &&
        error.response.data.hasOwnProperty('Success') &&
        !error.response.data.Success &&
        error.response.data.hasOwnProperty('Errors')
      ) {
        error.message = error.response.data.Errors[0].Message;
      }
    }
    const endpoint = getEndpoint(error.config.url);
    Vue.set(axiosRequestStatus, endpoint, statuses.error);
    if (axiosInterceptors[endpoint]) {
      axiosInterceptors[endpoint].forEach((e) => e.onError(error));
    }
    return Promise.reject(error);
  },
};

export default {
  install(Vue) {
    axios.interceptors.request.use(handlers.requestSend, handlers.requestError);
    axios.interceptors.response.use(
      handlers.responseSuccess,
      handlers.responseError
    );
    // add headers
    axios.defaults.headers = {
      'Content-Type': 'application/json',
      Pragma: 'no-cache', //disable IE cache
    };
    Vue.mixin({
      data() {
        return {
          axiosRequestStatus,
          axiosInterceptors,
        };
      },
      computed: {},
      methods: {
        registerEndpointInterceptor(endpoint, onLoad, onSuccess, onError) {
          if (this.axiosInterceptors[endpoint] === undefined) {
            Vue.set(axiosInterceptors, endpoint, []);
          }
          this.axiosInterceptors[endpoint].push({
            onLoad,
            onSuccess,
            onError,
          });
        },
      },
    });
  },
};
