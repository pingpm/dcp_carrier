"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "CarrierImageUploader",
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: ""
    },
    tip: {
      type: String,
      default: ""
    },
    usageScene: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      default: "IMAGE"
    },
    maxCount: {
      type: Number,
      default: 9
    },
    addText: {
      type: String,
      default: "添加图片"
    },
    required: {
      type: Boolean,
      default: false
    },
    single: {
      type: Boolean,
      default: false
    },
    compact: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    showStatus: {
      type: Boolean,
      default: true
    },
    statusFormat: {
      type: String,
      default: "count"
    },
    exampleSrc: {
      type: String,
      default: ""
    },
    exampleText: {
      type: String,
      default: "查看示例"
    }
  },
  emits: ["update:modelValue", "change", "uploading-change"],
  data() {
    return {
      uploading: false
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
      return this.files.length ? "status-success" : "status-warning";
    },
    computedStatusText() {
      if (this.statusFormat === "single" || this.single) {
        return this.files.length ? "已上传" : "未上传";
      }
      return `${this.files.length} 张已传`;
    },
    uploadButtonText() {
      return this.uploading ? "上传中..." : this.addText;
    }
  },
  methods: {
    setUploading(value) {
      this.uploading = value;
      this.$emit("uploading-change", value);
    },
    emitFiles(files) {
      const next = files.slice(0, this.limit);
      this.$emit("update:modelValue", next);
      this.$emit("change", next);
    },
    chooseImage() {
      if (this.uploading || !this.canUpload)
        return;
      common_vendor.index.chooseImage({
        count: this.remainingCount,
        success: async (res) => {
          const tempFilePaths = res.tempFilePaths || [];
          if (!tempFilePaths.length)
            return;
          this.setUploading(true);
          try {
            let nextFiles = this.single ? [] : [...this.files];
            for (const filePath of tempFilePaths) {
              if (nextFiles.length >= this.limit)
                break;
              const file = await common_vendor.uploadFile(filePath, this.fileType, this.usageScene);
              const fileObj = { fileId: file.fileId, fileUrl: file.fileUrl };
              if (this.single) {
                nextFiles = [fileObj];
              } else {
                nextFiles.push(fileObj);
              }
            }
            this.emitFiles(nextFiles);
          } catch (error) {
          } finally {
            this.setUploading(false);
          }
        }
      });
    },
    previewImage(url) {
      common_vendor.index.previewImage({ urls: [url] });
    },
    previewExample() {
      if (!this.exampleSrc)
        return;
      common_vendor.index.previewImage({ urls: [this.exampleSrc] });
    },
    deleteFile(index) {
      const nextFiles = [...this.files];
      nextFiles.splice(index, 1);
      this.emitFiles(nextFiles);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($props.title),
    b: $props.required
  }, $props.required ? {} : {}, {
    c: $props.tip
  }, $props.tip ? {
    d: common_vendor.t($props.tip)
  } : {}, {
    e: $props.showStatus
  }, $props.showStatus ? {
    f: common_vendor.t($options.computedStatusText),
    g: common_vendor.n($options.statusClass)
  } : {}, {
    h: common_vendor.f($options.files, (file, index, i0) => {
      return common_vendor.e({
        a: file.fileUrl,
        b: common_vendor.o(($event) => $options.previewImage(file.fileUrl), file.fileId || file.fileUrl)
      }, !$props.disabled ? {
        c: common_vendor.o(($event) => $options.deleteFile(index), file.fileId || file.fileUrl)
      } : {}, {
        d: file.fileId || file.fileUrl
      });
    }),
    i: !$props.disabled,
    j: $options.canUpload
  }, $options.canUpload ? {
    k: $data.uploading ? 1 : "",
    l: common_vendor.t($options.uploadButtonText),
    m: $data.uploading ? 1 : "",
    n: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args), "19")
  } : {}, {
    o: $props.exampleSrc
  }, $props.exampleSrc ? {
    p: $props.exampleSrc,
    q: common_vendor.t($props.exampleText),
    r: common_vendor.o((...args) => $options.previewExample && $options.previewExample(...args), "70")
  } : {}, {
    s: common_vendor.n($props.single ? "upload-grid-single" : "upload-grid"),
    t: $props.compact ? 1 : "",
    v: $props.single ? 1 : ""
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
