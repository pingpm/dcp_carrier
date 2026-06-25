<template>
  <view class="page handover-page">
    <view class="form-header">
      <view class="form-header-title">车辆送达交车确认</view>
      <view class="form-header-desc"
        >车辆已安全运抵目的地？请上传车商签收凭证/交车照片，并填写必要备注。</view
      >
    </view>

    <!-- Media uploads -->
    <view class="section">
      <carrier-image-uploader
        v-model="photoFiles"
        title="交车凭证照片"
        :tip="photoLimitTip"
        usage-scene="HANDOVER_PHOTO"
        :max-count="photoMaxCount"
        add-text="添加图片"
        required
        compact
        :example-src="handoverExampleImage"
        @uploading-change="uploading = $event"
      />
      <!-- #ifdef H5 -->
      <button
        class="secondary-btn dev-upload-btn"
        :loading="uploading"
        @click="useDevHandoverPhotos"
      >
        使用测试交车照片
      </button>
      <!-- #endif -->
    </view>

    <!-- Basic Info -->
    <view class="section">
      <view class="section-title">交车备注</view>

      <view class="field">
        <text class="label">备注说明</text>
        <textarea
          class="textarea"
          v-model="remark"
          placeholder="可备注车商当面验收完好、钥匙已交收等具体细节"
          placeholder-style="color:#9ca3af"
        />
      </view>
    </view>

    <!-- Fixed Footer -->
    <view class="fixed-footer">
      <button class="primary-btn animate-btn" :loading="submitting" @click="submit">
        确认交车送达并通知车商
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
      remark: '',
      photoFiles: [],
      handoverExampleImage: '',
      photoMinCount: 1,
      photoMaxCount: 9,
      uploading: false,
      submitting: false,
    };
  },
  onLoad(options) {
    if (!requireLogin()) return;
    this.orderId = options.orderId;
    this.loadExampleImages();
    this.loadMediaLimits();
  },
  computed: {
    photoLimitTip() {
      return `请上传${this.photoMinCount}-${this.photoMaxCount}张交收完好的现场照片或纸质签收单照片`;
    },
  },
  methods: {
    async loadExampleImages() {
      try {
        const data = await api.exampleImageConfigs();
        const item = (data.items || []).find(
          (config) => config.urlKey === 'carrier_handover_photo_example_url',
        );
        this.handoverExampleImage = item?.enabled && item?.url ? item.url : '';
      } catch (error) {
        this.handoverExampleImage = '';
      }
    },
    async loadMediaLimits() {
      try {
        const data = await api.carrierOrderMediaLimits();
        const handover = data.handover || {};
        this.photoMinCount = Number(handover.minCount) || 1;
        this.photoMaxCount = Number(handover.maxCount) || 9;
      } catch (error) {
        this.photoMinCount = 1;
        this.photoMaxCount = 9;
      }
    },
    async useDevHandoverPhotos() {
      if (this.uploading) return;
      this.uploading = true;
      try {
        const files = await Promise.all([
          api.importDevTestFile('test/carrier/delivery_photo1.png', 'IMAGE'),
          api.importDevTestFile('test/carrier/delivery_photo2.png', 'IMAGE'),
        ]);
        this.photoFiles.push(
          ...files.map((file) => ({ fileId: file.fileId, fileUrl: file.fileUrl })),
        );
      } finally {
        this.uploading = false;
      }
    },
    validate() {
      if (this.photoFiles.length < this.photoMinCount) {
        uni.showToast({ title: `请至少上传${this.photoMinCount}张交收签收照片凭证`, icon: 'none' });
        return false;
      }
      if (this.photoFiles.length > this.photoMaxCount) {
        uni.showToast({ title: `最多上传${this.photoMaxCount}张交收签收照片凭证`, icon: 'none' });
        return false;
      }
      return true;
    },
    async submit() {
      if (!this.validate()) return;
      this.submitting = true;
      try {
        const payload = {
          photoFileIds: this.photoFiles.map((f) => f.fileId),
          remark: this.remark,
        };
        await api.handover(this.orderId, payload);
        uni.showToast({ title: '交车送达提交成功', icon: 'success' });
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
.handover-page {
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
