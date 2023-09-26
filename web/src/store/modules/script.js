const state = {
  list: [],
  idMap: new Map(),
};

const mutations = {
  UPDATE_LIST: (state, list) => {
    state.list = list || [];
    state.idMap.clear();
    state.list.forEach(script => {
      state.idMap.set(script.script_id, script);
    });
  },
};

const actions = {
  updateList({
    commit
  }, list) {
    commit('UPDATE_LIST', list);
  },
};

const getters = {
  scripts: state => state.list,
  scriptById: state => (id) => state.idMap.get(id),
  scriptByName: state => (name) => {
    return state.list.find(script => script.script_name === name);
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};
