<template>
  <div class="micro-parts-right" v-if="$parent.rowSpan >= 24">
    <img src="@/components/Dnd/assets/todobg.png" alt="" width="400" height="248" />
  </div>
</template>

<script>
export default {};
</script>

<style scoped lang="less">
.micro-parts-right {
  padding-top: 48px;
  // padding-top: 38px;
  // display: flex;
  // flex: 1 0;
  // justify-content: center;
  // align-items: flex-start;
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  text-align: center;
  > img {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
