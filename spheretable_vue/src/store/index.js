import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

// Hardcoded static table configurations
const staticConfig = [
  {
    key: "SimpleTable",
    name: "Simple Table",
    defaultColumns: [
      { source: "ID", order: 1, hidden: false },
      { source: "Status", order: 2, hidden: false },
    ],
    otherColumns: [],
    hiddenColumns: [],
  },
];

export default new Vuex.Store({
  state: {
    loadedFromDb: false,
    tables: [],
    promise: null,
    siteConfigValues: {
      SimpleTableMaxSize: 1000,
      ActionableTableMaxSize: 1000,
      GranularTableMaxSize: 5000,
      IdleTimeOut: 1800000,
      IdleAlertTime: 60000,
    },
  },
  mutations: {
    setAsLoaded(state) {
      state.loadedFromDb = true;
    },
    setTables(state, newTables) {
      state.tables = newTables;
    },
    setPromise(state, promise) {
      state.promise = promise;
    },
    setSiteConfigValue(state, { StandardName, Value }) {
      Vue.set(state.siteConfigValues, StandardName, Value);
    },
  },
  actions: {
    async LOAD_COLUMN_CONFIGS({ commit, state }) {
      if (state.promise) {
        return state.promise;
      }

      let promise = new Promise((resolve) => {
        const dbTables = [];
        const configTables = JSON.parse(JSON.stringify(staticConfig));

        const dbTableKeys = new Set(dbTables.map((t) => t.key));
        const configWithNoDb = configTables.filter(
          (t) => !dbTableKeys.has(t.key),
        );

        const newTables = [...dbTables, ...configWithNoDb].sort((t1, t2) => {
          const val1 = t1.name || t1.key;
          const val2 = t2.name || t2.key;
          if (val1 < val2) return -1;
          if (val1 > val2) return 1;
          return 0;
        });

        commit("setTables", newTables);
        commit("setAsLoaded");
        resolve(newTables);
      });

      commit("setPromise", promise);
      return state.promise;
    },
    async LOAD_SITE_CONFIG_VALUES({ commit }) {
      // Hardcoded mock of the API response
      const configResponse = [
        { StandardName: "SimpleTableMaxSize", Value: 1000 },
        { StandardName: "ActionableTableMaxSize", Value: 1000 },
        { StandardName: "GranularTableMaxSize", Value: 5000 },
        { StandardName: "IdleTimeOut", Value: 1800000 },
        { StandardName: "IdleAlertTime", Value: 60000 },
      ];

      // Update store values from hardcoded response
      for (let i = 0; i < configResponse.length; i++) {
        const { StandardName, Value } = configResponse[i];
        commit("setSiteConfigValue", { StandardName, Value });
      }

      return Promise.resolve();
    },
  },
  getters: {
    tableConfigsLoaded: (state) => state.loadedFromDb,
    tableConfigs: (state) => state.tables,
    simpleTableMaxLimit: (state) =>
      state.siteConfigValues["SimpleTableMaxSize"],
    actionableTableMaxLimit: (state) =>
      state.siteConfigValues["ActionableTableMaxSize"],
    granularTableMaxLimit: (state) =>
      state.siteConfigValues["GranularTableMaxSize"],
    idleTimeout: (state) => state.siteConfigValues["IdleTimeOut"],
    idleAlertTime: (state) => state.siteConfigValues["IdleAlertTime"],

    columnConfig: (state) => ({ siteConfigValues: state.siteConfigValues }),
  },
});
