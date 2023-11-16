<template>
  <div class="setting-container">
    <div class="setting-text">
      <el-button type="primary" size="small" @click="connectVscode" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'Setting',
  computed: {
    ...mapGetters([
      'name'
    ])
  }
};
</script>

<style lang="scss" scoped>
.setting {
  &-container {
    margin: 30px;
  }
  &-text {
    font-size: 30px;
    line-height: 46px;
    margin-top: 2em;
    text-align: center;
  }
}
</style>
