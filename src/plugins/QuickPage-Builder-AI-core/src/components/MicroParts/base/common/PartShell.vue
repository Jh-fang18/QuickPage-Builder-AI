<script lang="jsx">
export default {
  props: {
    custom: {
      type: Boolean,
      default: false,
    },
    pictureRight: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: undefined,
    },
  },
  render() {
    const { $parent, $slots } = this;
    const { custom, pictureRight, title } = this;

    return (
      <div class="part-shell" style={$parent.rootStyle}>
        <div class="part-shell-left" style={{ width: pictureRight && $parent.rowSpan >= 24 ? '50%' : '100%' }}>
          {custom ? (
            <div class="left-custom-content">{$slots.default}</div>
          ) : (
            <div class="left-content">
              <div class="left-content-header">
                <div class="header-title">{$slots.title ? $slots.title : title}</div>
                <div class="header-facade">{$slots.facade}</div>
                <div class="header-actions">{$slots.actions}</div>
              </div>
              <div class="left-content-content">{$slots.default}</div>
            </div>
          )}
        </div>
        {pictureRight && $parent.rowSpan >= 24 && (
          <div class="part-shell-right">
            <img src={require('@/components/Dnd/assets/todobg.png')} width="400" height="248" />
          </div>
        )}
      </div>
    );
  },
};
</script>

<style scoped lang="less">
.part-shell {
  position: relative;
  padding: 16px 24px;
  background: #fff;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  border-radius: #343434;

  &-left {
    height: 100%;

    .left-custom-content {
      height: 100%;
    }

    .left-content {
      height: 100%;

      &-header {
        position: relative;
        height: 38px;

        .header-title {
          float: left;
          font-size: 16px;
          color: rgba(0, 0, 0, 0.85);
          letter-spacing: 0.44px;
        }

        .header-facade {
          display: inline-block;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
        }

        .header-actions {
          float: right;
        }
      }

      &-content {
        height: calc(100% - 38px);

        >div:only-child {
          height: 100%;
        }
      }
    }
  }

  &-right {
    position: absolute;
    top: 0;
    right: 0;
    text-align: center;
    height: 100%;
    width: 50%;

    // background: url('../../../../assets/todobg.png') no-repeat;
    // background-size: 400px 248px;
    // background-position: center 85%;
    >img {
      position: absolute;
      bottom: 44px;
      left: 50%;
      transform: translateX(-50%);
    }
  }
}
</style>
