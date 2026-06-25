"use strict";
const common_vendor = require("../../common/vendor.js");
const CarrierImageUploader = () => "../../components/carrier-image-uploader/carrier-image-uploader.js";
const _sfc_main = {
  components: {
    CarrierImageUploader
  },
  data() {
    return {
      orderId: "",
      remark: "",
      photoFiles: [],
      handoverExampleImage: "",
      photoMinCount: 1,
      photoMaxCount: 9,
      uploading: false,
      submitting: false
    };
  },
  onLoad(options) {
    if (!common_vendor.requireLogin())
      return;
    this.orderId = options.orderId;
    this.loadExampleImages();
    this.loadMediaLimits();
  },
  computed: {
    photoLimitTip() {
      return `请上传${this.photoMinCount}-${this.photoMaxCount}张交收完好的现场照片或纸质签收单照片`;
    }
  },
  methods: {
    async loadExampleImages() {
      try {
        const data = await common_vendor.api.exampleImageConfigs();
        const item = (data.items || []).find(
          (config) => config.urlKey === "carrier_handover_photo_example_url"
        );
        this.handoverExampleImage = (item == null ? void 0 : item.enabled) && (item == null ? void 0 : item.url) ? item.url : "";
      } catch (error) {
        this.handoverExampleImage = "";
      }
    },
    async loadMediaLimits() {
      try {
        const data = await common_vendor.api.carrierOrderMediaLimits();
        const handover = data.handover || {};
        this.photoMinCount = Number(handover.minCount) || 1;
        this.photoMaxCount = Number(handover.maxCount) || 9;
      } catch (error) {
        this.photoMinCount = 1;
        this.photoMaxCount = 9;
      }
    },
    async useDevHandoverPhotos() {
      if (this.uploading)
        return;
      this.uploading = true;
      try {
        const files = await Promise.all([
          common_vendor.api.importDevTestFile("test/carrier/delivery_photo1.png", "IMAGE"),
          common_vendor.api.importDevTestFile("test/carrier/delivery_photo2.png", "IMAGE")
        ]);
        this.photoFiles.push(
          ...files.map((file) => ({ fileId: file.fileId, fileUrl: file.fileUrl }))
        );
      } finally {
        this.uploading = false;
      }
    },
    validate() {
      if (this.photoFiles.length < this.photoMinCount) {
        common_vendor.index.showToast({ title: `请至少上传${this.photoMinCount}张交收签收照片凭证`, icon: "none" });
        return false;
      }
      if (this.photoFiles.length > this.photoMaxCount) {
        common_vendor.index.showToast({ title: `最多上传${this.photoMaxCount}张交收签收照片凭证`, icon: "none" });
        return false;
      }
      return true;
    },
    async submit() {
      if (!this.validate())
        return;
      this.submitting = true;
      try {
        const payload = {
          photoFileIds: this.photoFiles.map((f) => f.fileId),
          remark: this.remark
        };
        await common_vendor.api.handover(this.orderId, payload);
        common_vendor.index.showToast({ title: "交车送达提交成功", icon: "success" });
        setTimeout(() => {
          common_vendor.index.redirectTo({ url: `/pages/order/detail?orderId=${this.orderId}` });
        }, 800);
      } catch (err) {
        console.error(err);
      } finally {
        this.submitting = false;
      }
    }
  }
};
if (!Array) {
  const _easycom_carrier_image_uploader2 = common_vendor.resolveComponent("carrier-image-uploader");
  _easycom_carrier_image_uploader2();
}
const _easycom_carrier_image_uploader = () => "../../components/carrier-image-uploader/carrier-image-uploader.js";
if (!Math) {
  _easycom_carrier_image_uploader();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o(($event) => $data.uploading = $event, "c6"),
    b: common_vendor.o(($event) => $data.photoFiles = $event, "05"),
    c: common_vendor.p({
      title: "交车凭证照片",
      tip: $options.photoLimitTip,
      ["usage-scene"]: "HANDOVER_PHOTO",
      ["max-count"]: $data.photoMaxCount,
      ["add-text"]: "添加图片",
      required: true,
      compact: true,
      ["example-src"]: $data.handoverExampleImage,
      modelValue: $data.photoFiles
    }),
    d: $data.remark,
    e: common_vendor.o(($event) => $data.remark = $event.detail.value, "95"),
    f: $data.submitting,
    g: common_vendor.o((...args) => $options.submit && $options.submit(...args), "01")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
