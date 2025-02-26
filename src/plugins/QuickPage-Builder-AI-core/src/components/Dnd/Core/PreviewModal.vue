<template>
  <iframe :src="completeTask" height="812" width="375" border="0" frameborder="no"></iframe>
</template>

<script>
export default {
  data() {
    return {
      completeTask: 'https://mobile.baidu.com',
    };
  },
};
</script>

<style scoped>
iframe {
  border-radius: 10px;
  border: 1px solid #C2DBF8;
}
</style>
