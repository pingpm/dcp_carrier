<template>
  <view class="page pickup-page">
    <view class="form-header">
      <view class="form-header-title">车辆提车确认</view>
      <view class="form-header-desc">请上传真实验车影像，并填写必要备注作为交接凭证。</view>
    </view>

    <!-- Media uploads -->
    <view class="section">
      <carrier-image-uploader
        v-model="mediaFiles"
        title="验车影像资料"
        :tip="mediaLimitTip"
        usage-scene="PICKUP_INSPECTION"
        :max-count="mediaMaxCount"
        add-text="添加图片"
        required
        compact
        :example-src="pickupExampleImage"
        @uploading-change="uploading = $event"
      />
      <!-- #ifdef H5 -->
      <button class="secondary-btn dev-upload-btn" :loading="uploading" @click="useDevPickupPhotos">
        使用测试提车照片
      </button>
      <!-- #endif -->
    </view>

    <!-- Basic Info -->
    <view class="section">
      <view class="section-title">提车备注</view>

      <view class="field">
        <text class="label">备注说明</text>
        <textarea
          class="textarea"
          v-model="remark"
          placeholder="可在此备注车辆表面已有划痕等交接异常说明"
          placeholder-style="color:#9ca3af"
        />
      </view>
    </view>

    <!-- Fixed Footer -->
    <view class="fixed-footer">
      <button class="primary-btn animate-btn" :loading="submitting" @click="submit">
        确认提车并起运
      </button>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import CarrierImageUploader from '../../components/carrier-image-uploader/carrier-image-uploader.vue';
import { api, requireLogin } from '../../utils/api.js';

export default {
  mixins: [miniappLoginPageMixin],
  components: {
    CarrierImageUploader,
  },
  data() {
    return {
      orderId: '',
      checkingDriver: false,
      remark: '',
      mediaFiles: [],
      pickupExampleImage: '',
      mediaMinCount: 1,
      mediaMaxCount: 9,
      uploading: false,
      submitting: false,
    };
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId;
    this.loadExampleImages();
    this.loadMediaLimits();
    this.ensurePickupDriver();
  },
  computed: {
    mediaLimitTip() {
      return `请上传${this.mediaMinCount}-${this.mediaMaxCount}张现场验车照片（需包含车辆四周外表）`;
    },
  },
  methods: {
    async loadExampleImages() {
      try {
        const data = await api.exampleImageConfigs();
        const item = (data.items || []).find(
          (config) => config.urlKey === 'carrier_pickup_photo_example_url',
        );
        this.pickupExampleImage = item?.enabled && item?.url ? item.url : '';
      } catch (error) {
        this.pickupExampleImage = '';
      }
    },
    async loadMediaLimits() {
      try {
        const data = await api.carrierOrderMediaLimits();
        const pickup = data.pickup || {};
        this.mediaMinCount = Number(pickup.minCount) || 1;
        this.mediaMaxCount = Number(pickup.maxCount) || 9;
      } catch (error) {
        this.mediaMinCount = 1;
        this.mediaMaxCount = 9;
      }
    },
    async ensurePickupDriver() {
      if (!this.orderId || this.checkingDriver) return;
      this.checkingDriver = true;
      try {
        const data = await api.orderDetail(this.orderId);
        const pickupDriver = data.order?.driverInfo;
        if (!pickupDriver?.driverName || !pickupDriver?.driverPhone) {
          uni.showModal({
            title: '请先设置提车司机',
            content: '确认提车前必须先设置提车司机。您可以立即设置，也可以稍后再操作。',
            confirmText: '去设置',
            cancelText: '稍后',
            confirmColor: '#1677ff',
            success: (res) => {
              if (res.confirm) {
                uni.redirectTo({
                  url: `/pages/order/driver-form?orderId=${this.orderId}&driverType=PICKUP`,
                });
              } else {
                if (getCurrentPages().length > 1) {
                  uni.navigateBack();
                } else {
                  uni.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` });
                }
              }
            },
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.checkingDriver = false;
      }
    },
    async useDevPickupPhotos() {
      if (this.uploading) return;
      this.uploading = true;
      try {
        const files = await Promise.all([
          api.importDevTestFile('test/carrier/pick_up_photo1.png', 'IMAGE'),
          api.importDevTestFile('test/carrier/pick_up_photo2.png', 'IMAGE'),
        ]);
        this.mediaFiles.push(
          ...files.map((file) => ({ fileId: file.fileId, fileUrl: file.fileUrl })),
        );
      } finally {
        this.uploading = false;
      }
    },
    validate() {
      if (this.mediaFiles.length < this.mediaMinCount) {
        uni.showToast({ title: `请至少上传${this.mediaMinCount}张验车图片`, icon: 'none' });
        return false;
      }
      if (this.mediaFiles.length > this.mediaMaxCount) {
        uni.showToast({ title: `最多上传${this.mediaMaxCount}张验车图片`, icon: 'none' });
        return false;
      }
      return true;
    },
    async submit() {
      if (!this.validate()) return;
      this.submitting = true;
      try {
        const payload = {
          mediaFileIds: this.mediaFiles.map((f) => f.fileId),
          remark: this.remark,
        };
        await api.pickup(this.orderId, payload);
        uni.showToast({ title: '提车确认成功', icon: 'success' });
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
.pickup-page {
  padding: 30rpx 30rpx calc(150rpx + env(safe-area-inset-bottom));
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

.dev-upload-btn {
  margin-top: 20rpx;
  width: 100%;
}
</style>
