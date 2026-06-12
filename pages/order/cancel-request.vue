<template>
  <view class="page cancel-request-page">
    <!-- Warn card -->
    <view class="cancel-warn-card-modern">
      <view class="warn-header-modern">
        <image class="warn-icon-modern" src="/static/icons/alert-triangle.svg" mode="aspectFit" />
        <text class="warn-title-modern">订单取消规则说明</text>
      </view>
      <view class="warn-body-modern">
        <view class="warn-item-modern" v-if="isDirect">
          <view class="warn-dot-modern"></view>
          <text class="warn-text-modern">
            该订单当前处于<text class="highlight-danger">待确认</text
            >状态，您可以直接拒绝/取消接单。此操作不需要车商同意，亦不扣除您的信息服务费。
          </text>
        </view>
        <view class="warn-item-modern" v-else>
          <view class="warn-dot-modern"></view>
          <text class="warn-text-modern">
            订单已由您<text class="highlight-danger">确认接单</text
            >。此时发起取消属于协商取消，需要车商客户审核同意。提交后订单暂停履约并变更为“取消中”，若车商拒绝，订单将恢复履约。
          </text>
        </view>
      </view>
    </view>

    <!-- Form card -->
    <view class="section">
      <view class="section-title">请填写取消原因</view>
      <view class="field">
        <textarea
          class="textarea cancel-textarea"
          v-model="cancelReason"
          maxlength="200"
          placeholder="请详细描述您需要取消/拒绝接单的具体原因，以便车商及平台快速处理..."
          placeholder-style="color:#9ca3af"
        />
        <view class="word-counter">{{ cancelReason.length }} / 200 字</view>
      </view>
    </view>

    <!-- Fixed Footer -->
    <view class="fixed-footer">
      <button
        class="danger-btn submit-cancel-btn animate-btn"
        :loading="submitting"
        @click="submit"
      >
        {{ isDirect ? '拒绝接单并取消' : '发起取消协商申请' }}
      </button>
    </view>
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';

export default {
  data() {
    return {
      orderId: '',
      cancelReason: '',
      isDirect: false,
      submitting: false,
    };
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId;
    if (options.direct === '1' || options.direct === 1) {
      this.isDirect = true;
    }
  },
  methods: {
    async submit() {
      if (!this.cancelReason.trim()) {
        uni.showToast({ title: '请输入取消原因', icon: 'none' });
        return;
      }
      this.submitting = true;
      try {
        await api.cancelOrder(this.orderId, this.cancelReason);
        uni.showToast({
          title: this.isDirect ? '订单已拒绝取消' : '取消申请已提交',
          icon: 'success',
        });
        setTimeout(() => {
          uni.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` });
        }, 800);
      } catch (err) {
        console.error(err);
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style>
.cancel-request-page {
  padding: 30rpx;
}

.cancel-warn-card-modern {
  background: var(--danger-light);
  border: 1rpx solid rgba(239, 68, 68, 0.15);
  border-radius: var(--radius-md);
  padding: 30rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.02);
}

.warn-header-modern {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.warn-icon-modern {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}

.warn-title-modern {
  font-size: 28rpx;
  font-weight: bold;
  color: var(--danger-color);
}

.warn-body-modern {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.warn-item-modern {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
}

.warn-dot-modern {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background-color: var(--danger-color);
  margin-top: 12rpx;
  flex-shrink: 0;
}

.warn-text-modern {
  font-size: 24rpx;
  color: #6b7280;
  line-height: 1.5;
}

.highlight-danger {
  font-weight: bold;
  color: var(--danger-color);
  margin: 0 4rpx;
}

.cancel-textarea {
  font-size: 28rpx;
  line-height: 1.6;
  border-color: var(--border-color);
}

.word-counter {
  text-align: right;
  font-size: 20rpx;
  color: var(--text-weak);
  margin-top: 10rpx;
  padding-right: 10rpx;
}

.submit-cancel-btn {
  width: 100%;
}
</style>
