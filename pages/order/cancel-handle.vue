<template>
  <view class="page cancel-handle-page">
    <view class="form-header">
      <view class="form-header-title">处理取消协商申请</view>
      <view class="form-header-desc">车商客户已对该订单发起取消协商申请，请审核处理。</view>
    </view>

    <!-- Request Details Card -->
    <view class="section request-card" v-if="activeRequest">
      <view class="request-meta">
        <text class="req-label">发起时间:</text>
        <text class="req-value">{{ dateText(activeRequest.createdAt) }}</text>
      </view>
      <view class="request-reason-block">
        <text class="label">车商取消原因:</text>
        <view class="reason-text-box">
          {{ activeRequest.reason || '未提供具体原因' }}
        </view>
      </view>
    </view>

    <!-- Form block: handle remark -->
    <view class="section">
      <view class="section-title">处理意见</view>
      <view class="field">
        <textarea
          class="textarea remark-textarea"
          v-model="remark"
          placeholder="可填写同意或拒绝的具体理由/说明..."
          placeholder-style="color:#9ca3af"
          maxlength="150"
        />
        <view class="word-counter">{{ remark.length }} / 150 字</view>
      </view>
    </view>

    <!-- Fixed Footer -->
    <view class="fixed-footer button-row">
      <button
        class="danger-btn flex-1 animate-btn"
        :loading="submitting"
        @click="handle('REJECTED')"
      >
        拒绝取消申请
      </button>
      <button
        class="primary-btn flex-1 animate-btn"
        :loading="submitting"
        @click="handle('APPROVED')"
      >
        同意取消订单
      </button>
    </view>
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';
import { dateText } from '../../utils/format.js';

export default {
  data() {
    return {
      orderId: '',
      activeRequest: null,
      remark: '',
      submitting: false,
    };
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId;
    this.loadRequest();
  },
  methods: {
    dateText,
    async loadRequest() {
      try {
        const res = await api.cancelLogs(this.orderId);
        const logs = res.items || [];
        // Find the latest 'REQUEST' log entry
        const requestLog = [...logs].reverse().find((l) => l.actionType === 'REQUEST');
        if (requestLog) {
          this.activeRequest = requestLog;
        } else {
          uni.showToast({ title: '未找到待处理的取消申请', icon: 'none' });
          setTimeout(() => uni.navigateBack(), 1000);
        }
      } catch (err) {
        console.error(err);
      }
    },
    async handle(result) {
      if (result === 'REJECTED' && !this.remark.trim()) {
        uni.showToast({ title: '拒绝取消时，请填写处理意见', icon: 'none' });
        return;
      }

      const confirmMsg =
        result === 'APPROVED'
          ? '确认同意取消订单吗？同意后订单将被关闭并结算。'
          : '确认拒绝取消订单吗？拒绝后订单将恢复正常承运履约。';

      uni.showModal({
        title: '操作确认',
        content: confirmMsg,
        confirmColor: result === 'APPROVED' ? '#1677ff' : '#dc2626',
        success: async (mRes) => {
          if (mRes.confirm) {
            this.submitting = true;
            try {
              await api.handleCancelRequest(
                this.orderId,
                this.activeRequest.cancelRequestId,
                result,
                this.remark,
              );
              uni.showToast({ title: '处理完成', icon: 'success' });
              setTimeout(() => {
                uni.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` });
              }, 800);
            } catch (err) {
              console.error(err);
            } finally {
              this.submitting = false;
            }
          }
        },
      });
    },
  },
};
</script>

<style>
.cancel-handle-page {
  padding: 30rpx;
  padding-bottom: calc(150rpx + env(safe-area-inset-bottom));
}

.form-header {
  margin-bottom: 36rpx;
  padding: 0 10rpx;
}

.form-header-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #111827;
}

.form-header-desc {
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 10rpx;
  line-height: 1.5;
}

.request-card {
  padding: 36rpx;
  border-left: 8rpx solid #1677ff;
}

.request-meta {
  display: flex;
  gap: 16rpx;
  font-size: 26rpx;
  color: #4b5563;
  margin-bottom: 20rpx;
}

.req-label {
  color: #9ca3af;
}

.req-value {
  font-weight: bold;
}

.request-reason-block {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.reason-text-box {
  background-color: #f9fafb;
  border: 1rpx solid #e5e7eb;
  padding: 20rpx 24rpx;
  border-radius: var(--radius-md);
  font-size: 26rpx;
  color: #111827;
  line-height: 1.5;
}

.remark-textarea {
  font-size: 28rpx;
  line-height: 1.6;
  border-color: var(--border-color);
  min-height: 150rpx;
}

.word-counter {
  text-align: right;
  font-size: 20rpx;
  color: var(--text-weak);
  margin-top: 10rpx;
  padding-right: 10rpx;
}

.button-row {
  display: flex;
  gap: 20rpx;
}
</style>
