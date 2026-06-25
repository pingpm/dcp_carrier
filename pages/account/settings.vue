<template>
  <view class="page settings-page">
    <view class="section settings-list-card">
      <view class="setting-row">
        <text class="setting-lbl">当前版本</text>
        <text class="setting-val font-mono">v1.2.0</text>
      </view>
    </view>

    <view class="logout-container" v-if="isLoggedIn">
      <button class="logout-btn" @click="logout">退出当前登录</button>
    </view>
  </view>
</template>

<script>
import { clearSession, getSession } from '../../utils/api.js';

export default {
  data() {
    return {
      isLoggedIn: false,
    };
  },
  onShow() {
    this.isLoggedIn = !!getSession();
  },
  methods: {
    logout() {
      uni.showModal({
        title: '退出登录',
        content: '确定要退出当前账号吗？',
        confirmColor: '#1677ff',
        success: (res) => {
          if (res.confirm) {
            clearSession();
            uni.showToast({
              title: '已退出登录',
              icon: 'success',
            });
            setTimeout(() => {
              uni.switchTab({ url: '/pages/home/index' });
            }, 600);
          }
        },
      });
    },
  },
};
</script>

<style>
.settings-page {
  padding: 30rpx;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.settings-list-card {
  margin-top: 20rpx;
  padding: 10rpx 30rpx;
  border-radius: 16rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 0;
  font-size: 28rpx;
}

.setting-lbl {
  color: #111827;
  font-weight: bold;
}

.setting-val {
  color: #9ca3af;
  font-weight: 600;
}

.logout-container {
  margin-top: 60rpx;
  padding: 0 10rpx;
}

.logout-btn {
  width: 100%;
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  font-size: 28rpx;
  color: #dc2626;
  border: 1.5rpx solid #fca5a5;
  background: #ffffff;
  font-weight: 800;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.05);
}

.logout-btn:active {
  background: #fef2f2;
}
</style>
