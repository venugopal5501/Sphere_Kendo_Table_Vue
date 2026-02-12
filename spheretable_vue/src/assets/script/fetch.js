import 'core-js/stable';
import 'regenerator-runtime/runtime';

import axios from 'axios';

axios.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.transformRequest = [(data) => data];
  }
  return config;
});

const parseResponse = (response) => {
  if (response === undefined || response.data === undefined) {
    return response;
  } else {
    const data = response.data;
    try {
      const parsed = JSON.parse(data);
      return parsed;
    } catch (e) {
      return data;
    }
  }
};

/**
 * @summary Fetch data from an API endpoint
 * @param {String} endpoint - The API endpoint for the request
 * @param {Object} params - The parameters for the query string
 */
export const fetch = async (endpoint, params) => {
  const response = await axios.get(endpoint, { params });
  return parseResponse(response);
};

/**
 * @summary Post data to an API endpoint
 * @param {String} endpoint - The API endpoint for the request
 * @param {Object} body - The body for the POST request
 */
export const post = async (endpoint, body) => {
  const response = await axios.post(endpoint, body);
  return parseResponse(response);
};

/**
 * @summary Update data to an API endpoint
 * @param {String} endpoint - The API endpoint for the request
 * @param {Object} body - The body for the PUT request
 */
export const put = async (endpoint, body = undefined, params) => {
  const response = await axios.put(endpoint, body, { params: params });
  return parseResponse(response);
};

/**
 * @summary Delete data to an API endpoint
 * @param {String} endpoint - The API endpoint for the request
 * @param {Object} body - The body for the Delete request
 */
export const sendDelete = async (endpoint, params) => {
  const response = await axios.delete(endpoint, { params });
  return parseResponse(response);
};

/**
 * @summary Update data to an API endpoint
 * @param {String} endpoint - The API endpoint for the request
 * @param {Object} body - The body for the POST request
 */
export const patch = async (endpoint, body) => {
  const response = await axios.patch(endpoint, body);
  return parseResponse(response);
};
