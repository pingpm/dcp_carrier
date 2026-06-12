<template>
  <view class="carrier-image-uploader" :class="{ compact, single }">
    <view class="uploader-header">
      <view class="uploader-title-wrap">
        <text class="uploader-title">
          {{ title }}<text v-if="required" class="required">*</text>
        </text>
        <text v-if="tip" class="uploader-tip">{{ tip }}</text>
      </view>
      <text v-if="showStatus" class="status-tag" :class="statusClass">
        {{ computedStatusText }}
      </text>
    </view>

    <view :class="single ? 'upload-grid-single' : 'upload-grid'">
      <view v-for="(file, index) in files" :key="file.fileId || file.fileUrl" class="upload-preview">
        <image
          :src="file.fileUrl"
          mode="aspectFill"
          class="upload-img"
          @click="previewImage(file.fileUrl)"
        />
        <view v-if="!disabled" class="upload-delete-btn" @click="deleteFile(index)">×</view>
      </view>

      <view
        v-if="canUpload"
        class="upload-card"
        :class="{ disabled: uploading }"
        @click="chooseImage"
      >
        <view class="upload-card-icon" :class="{ loading: uploading }"></view>
        <text class="upload-card-text">{{ uploadButtonText }}</text>
      </view>

      <view v-if="exampleSrc" class="example-card" @click="previewExample">
        <image :src="exampleSrc" mode="aspectFill" class="example-img" />
        <view class="example-mask">
          <text class="example-text">{{ exampleText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { uploadFile } from '../../utils/api.js';

export default {
  name: 'CarrierImageUploader',
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    title: {
      type: String,
      default: '',
    },
    tip: {
      type: String,
      default: '',
    },
    usageScene: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: 'IMAGE',
    },
    maxCount: {
      type: Number,
      default: 9,
    },
    addText: {
      type: String,
      default: '添加图片',
    },
    required: {
      type: Boolean,
      default: false,
    },
    single: {
      type: Boolean,
      default: false,
    },
    compact: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    showStatus: {
      type: Boolean,
      default: true,
    },
    statusFormat: {
      type: String,
      default: 'count',
    },
    exampleSrc: {
      type: String,
      default: '',
    },
    exampleText: {
      type: String,
      default: '查看示例',
    },
  },
  emits: ['update:modelValue', 'change', 'uploading-change'],
  data() {
    return {
      uploading: false,
    };
  },
  computed: {
    files() {
      return Array.isArray(this.modelValue) ? this.modelValue : [];
    },
    limit() {
      return this.single ? 1 : this.maxCount;
    },
    canUpload() {
      return !this.disabled && this.files.length < this.limit;
    },
    remainingCount() {
      return Math.max(this.limit - this.files.length, 0);
    },
    statusClass() {
      return this.files.length ? 'status-success' : 'status-warning';
    },
    computedStatusText() {
      if (this.statusFormat === 'single' || this.single) {
        return this.files.length ? '已上传' : '未上传';
      }
      return `${this.files.length} 张已传`;
    },
    uploadButtonText() {
      return this.uploading ? '上传中...' : this.addText;
    },
  },
  methods: {
    setUploading(value) {
      this.uploading = value;
      this.$emit('uploading-change', value);
    },
    emitFiles(files) {
      const next = files.slice(0, this.limit);
      this.$emit('update:modelValue', next);
      this.$emit('change', next);
    },
    chooseImage() {
      if (this.uploading || !this.canUpload) return;
      uni.chooseImage({
        count: this.remainingCount,
        success: async (res) => {
          const tempFilePaths = res.tempFilePaths || [];
          if (!tempFilePaths.length) return;
          this.setUploading(true);
          try {
            let nextFiles = this.single ? [] : [...this.files];
            for (const filePath of tempFilePaths) {
              if (nextFiles.length >= this.limit) break;
              const file = await uploadFile(filePath, this.fileType, this.usageScene);
              const fileObj = { fileId: file.fileId, fileUrl: file.fileUrl };
              if (this.single) {
                nextFiles = [fileObj];
              } else {
                nextFiles.push(fileObj);
              }
            }
            this.emitFiles(nextFiles);
          } catch (error) {
            // uploadFile already shows the failure message.
          } finally {
            this.setUploading(false);
          }
        },
      });
    },
    previewImage(url) {
      uni.previewImage({ urls: [url] });
    },
    previewExample() {
      if (!this.exampleSrc) return;
      uni.previewImage({ urls: [this.exampleSrc] });
    },
    deleteFile(index) {
      const nextFiles = [...this.files];
      nextFiles.splice(index, 1);
      this.emitFiles(nextFiles);
    },
  },
};
</script>

<style>
.carrier-image-uploader {
  width: 100%;
  margin-bottom: 24rpx;
}

.carrier-image-uploader.compact {
  margin-bottom: 0;
}

.uploader-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20rpx;
  margin-bottom: 16rpx;
}

.uploader-title-wrap {
  flex: 1;
  min-width: 0;
}

.uploader-title {
  display: block;
  color: var(--text-main);
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.uploader-tip {
  display: block;
  font-size: 22rpx;
  color: var(--text-weak);
  margin-top: -6rpx;
  line-height: 1.4;
}

.required {
  color: #ef4444;
  margin-left: 6rpx;
  font-weight: bold;
}

.upload-grid-single {
  width: 100%;
  margin-top: 12rpx;
}

.upload-grid-single .upload-card,
.upload-grid-single .upload-preview,
.upload-grid-single .example-card {
  width: 200rpx;
  height: 200rpx;
}

.upload-card.disabled {
  opacity: 0.6;
}

.example-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #eff6ff;
  border: 1rpx solid #bfdbfe;
}

.example-img {
  width: 100%;
  height: 100%;
}

.example-mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 42rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 64, 175, 0.78);
}

.example-text {
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 600;
}
</style>
