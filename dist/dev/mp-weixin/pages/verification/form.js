"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      // Historical capabilities (if already approved)
      originalCapabilities: [],
      form: {
        companyName: "",
        creditCode: "",
        legalRepresentativeName: "",
        serviceCapabilities: [],
        // LARGE_TRUCK, SMALL_TRUCK
        verificationMethod: "LEGAL_REPRESENTATIVE",
        // LEGAL_REPRESENTATIVE, AUTHORIZED_AGENT
        legalIdNumber: "",
        legalIdFrontFileId: "",
        legalIdBackFileId: "",
        agentName: "",
        agentIdNumber: "",
        agentIdFrontFileId: "",
        agentIdBackFileId: "",
        authorizationLetterFileId: "",
        largeTruckLicense: {
          ownerName: "",
          licenseNo: "",
          licenseFileId: "",
          startDate: "",
          endDate: "",
          officeAddress: ""
        }
      },
      operationSiteFileIds: [],
      siteFiles: [],
      // Array of { fileId, fileUrl } for office photos
      // File URL temporary mappings for display
      urlsMap: {},
      uploadingMap: {},
      uploadingLargeTruckLicense: false,
      uploadingSite: false,
      submitting: false
    };
  },
  computed: {
    legalIdFrontUrl() {
      return this.urlsMap["legalIdFrontFileId"] || "";
    },
    legalIdBackUrl() {
      return this.urlsMap["legalIdBackFileId"] || "";
    },
    agentIdFrontUrl() {
      return this.urlsMap["agentIdFrontFileId"] || "";
    },
    agentIdBackUrl() {
      return this.urlsMap["agentIdBackFileId"] || "";
    },
    authorizationLetterUrl() {
      return this.urlsMap["authorizationLetterFileId"] || "";
    },
    largeTruckLicenseUrl() {
      return this.urlsMap["largeTruckLicense.licenseFileId"] || "";
    },
    companyType() {
      if (this.form.serviceCapabilities.includes("LARGE_TRUCK"))
        return "CAR_CARRIER";
      if (this.form.serviceCapabilities.includes("SMALL_TRUCK"))
        return "ROADSIDE_RESCUE";
      return "";
    },
    removedCapabilitiesWarning() {
      if (!this.originalCapabilities.length)
        return false;
      return this.originalCapabilities.some((cap) => !this.form.serviceCapabilities.includes(cap));
    }
  },
  onLoad() {
    if (common_vendor.requireLogin())
      this.loadDetail();
  },
  methods: {
    async loadDetail() {
      var _a, _b;
      try {
        const detail = await common_vendor.api.verificationDetail();
        const profile = detail.profile || {};
        const snapshot = ((_a = detail.version) == null ? void 0 : _a.snapshotData) || {};
        this.originalCapabilities = profile.serviceCapabilities || [];
        const savedCompanyType = snapshot.companyType || profile.companyType || "";
        const savedCapabilities = snapshot.serviceCapabilities || profile.serviceCapabilities || this.companyTypeToCapabilities(savedCompanyType);
        this.form = {
          companyName: snapshot.companyName || profile.companyName || "",
          creditCode: snapshot.creditCode || profile.creditCode || "",
          legalRepresentativeName: snapshot.legalRepresentativeName || profile.legalRepresentativeName || "",
          serviceCapabilities: savedCapabilities,
          verificationMethod: snapshot.verificationMethod || "LEGAL_REPRESENTATIVE",
          legalIdNumber: snapshot.legalIdNumber || "",
          legalIdFrontFileId: snapshot.legalIdFrontFileId || "",
          legalIdBackFileId: snapshot.legalIdBackFileId || "",
          agentName: snapshot.agentName || "",
          agentIdNumber: snapshot.agentIdNumber || "",
          agentIdFrontFileId: snapshot.agentIdFrontFileId || "",
          agentIdBackFileId: snapshot.agentIdBackFileId || "",
          authorizationLetterFileId: snapshot.authorizationLetterFileId || "",
          largeTruckLicense: {
            ownerName: snapshot.largeTruckLicense && (snapshot.largeTruckLicense.ownerName || snapshot.largeTruckLicense.licenseHolderName) || "",
            licenseNo: snapshot.largeTruckLicense && (snapshot.largeTruckLicense.licenseNo || snapshot.largeTruckLicense.licenseNumber) || "",
            licenseFileId: snapshot.largeTruckLicense && (snapshot.largeTruckLicense.licenseFileId || snapshot.largeTruckLicense.licensePhotoFileId) || "",
            startDate: snapshot.largeTruckLicense && (snapshot.largeTruckLicense.startDate || snapshot.largeTruckLicense.licenseValidFrom) || "",
            endDate: snapshot.largeTruckLicense && (snapshot.largeTruckLicense.endDate || snapshot.largeTruckLicense.licenseValidTo) || "",
            officeAddress: snapshot.largeTruckLicense && snapshot.largeTruckLicense.officeAddress || snapshot.officeAddressDetail || ""
          }
        };
        if ((_b = detail.version) == null ? void 0 : _b.mediaFiles) {
          const media = detail.version.mediaFiles || [];
          media.forEach((m) => {
            if (m.usageScene === "OPERATION_SITE") {
              this.siteFiles.push({ fileId: m.fileId, fileUrl: m.fileUrl });
            } else if (m.usageScene === "ROAD_LICENSE") {
              this.urlsMap["largeTruckLicense.licenseFileId"] = m.fileUrl;
              this.form.largeTruckLicense.licenseFileId = m.fileId;
            } else {
              const fileKey = this.getFileKeyFromId(m.fileId, snapshot);
              if (fileKey) {
                this.urlsMap[fileKey] = m.fileUrl;
              }
            }
          });
        }
      } catch (err) {
        console.error(err);
      }
    },
    getFileKeyFromId(id, snapshot) {
      if (snapshot.legalIdFrontFileId === id)
        return "legalIdFrontFileId";
      if (snapshot.legalIdBackFileId === id)
        return "legalIdBackFileId";
      if (snapshot.agentIdFrontFileId === id)
        return "agentIdFrontFileId";
      if (snapshot.agentIdBackFileId === id)
        return "agentIdBackFileId";
      if (snapshot.authorizationLetterFileId === id)
        return "authorizationLetterFileId";
      return "";
    },
    setCompanyType(type) {
      this.form.serviceCapabilities = this.companyTypeToCapabilities(type);
    },
    companyTypeToCapabilities(type) {
      if (type === "CAR_CARRIER")
        return ["LARGE_TRUCK", "SMALL_TRUCK"];
      if (type === "ROADSIDE_RESCUE")
        return ["SMALL_TRUCK"];
      return [];
    },
    setVerificationMethod(method) {
      this.form.verificationMethod = method;
    },
    onDateChange(e, key) {
      this.form.largeTruckLicense[key] = e.detail.value;
    },
    previewImg(url) {
      common_vendor.index.previewImage({ urls: [url] });
    },
    chooseImg(fieldKey, scene) {
      if (this.uploadingMap[fieldKey])
        return;
      common_vendor.index.chooseImage({
        count: 1,
        success: async (res) => {
          this.uploadingMap[fieldKey] = true;
          try {
            const file = await common_vendor.uploadFile(res.tempFilePaths[0], "IMAGE", scene);
            this.form[fieldKey] = file.fileId;
            this.urlsMap[fieldKey] = file.fileUrl;
          } finally {
            this.uploadingMap[fieldKey] = false;
          }
        }
      });
    },
    deleteFile(fieldKey) {
      this.form[fieldKey] = "";
      this.urlsMap[fieldKey] = "";
    },
    chooseLicenseImg() {
      if (this.uploadingLargeTruckLicense)
        return;
      common_vendor.index.chooseImage({
        count: 1,
        success: async (res) => {
          this.uploadingLargeTruckLicense = true;
          try {
            const file = await common_vendor.uploadFile(res.tempFilePaths[0], "IMAGE", "ROAD_LICENSE");
            this.form.largeTruckLicense.licenseFileId = file.fileId;
            this.urlsMap["largeTruckLicense.licenseFileId"] = file.fileUrl;
          } finally {
            this.uploadingLargeTruckLicense = false;
          }
        }
      });
    },
    deleteLicenseFile() {
      this.form.largeTruckLicense.licenseFileId = "";
      this.urlsMap["largeTruckLicense.licenseFileId"] = "";
    },
    chooseSiteImg() {
      if (this.uploadingSite)
        return;
      common_vendor.index.chooseImage({
        count: 9 - this.siteFiles.length,
        success: async (res) => {
          this.uploadingSite = true;
          try {
            for (const path of res.tempFilePaths) {
              const file = await common_vendor.uploadFile(path, "IMAGE", "OPERATION_SITE");
              this.siteFiles.push({ fileId: file.fileId, fileUrl: file.fileUrl });
            }
          } finally {
            this.uploadingSite = false;
          }
        }
      });
    },
    deleteSiteFile(index) {
      this.siteFiles.splice(index, 1);
    },
    validate() {
      if (!this.form.companyName.trim()) {
        common_vendor.index.showToast({ title: "请输入企业名称", icon: "none" });
        return false;
      }
      if (!this.form.creditCode.trim() || this.form.creditCode.trim().length !== 18) {
        common_vendor.index.showToast({ title: "请输入正确的18位信用代码", icon: "none" });
        return false;
      }
      if (!this.form.legalRepresentativeName.trim()) {
        common_vendor.index.showToast({ title: "请输入法人姓名", icon: "none" });
        return false;
      }
      if (!this.companyType) {
        common_vendor.index.showToast({ title: "请选择运输公司类型", icon: "none" });
        return false;
      }
      if (this.form.verificationMethod === "LEGAL_REPRESENTATIVE") {
        if (!this.form.legalIdNumber.trim() || this.form.legalIdNumber.trim().length !== 18) {
          common_vendor.index.showToast({ title: "请输入正确的法人身份证号", icon: "none" });
          return false;
        }
        if (!this.form.legalIdFrontFileId || !this.form.legalIdBackFileId) {
          common_vendor.index.showToast({ title: "请上传法人身份证正反面照片", icon: "none" });
          return false;
        }
      } else {
        if (!this.form.agentName.trim()) {
          common_vendor.index.showToast({ title: "请输入委托经办人姓名", icon: "none" });
          return false;
        }
        if (!this.form.agentIdNumber.trim() || this.form.agentIdNumber.trim().length !== 18) {
          common_vendor.index.showToast({ title: "请输入正确的经办人身份证号", icon: "none" });
          return false;
        }
        if (!this.form.agentIdFrontFileId || !this.form.agentIdBackFileId || !this.form.authorizationLetterFileId) {
          common_vendor.index.showToast({ title: "请上传经办人正反面身份证和授权书", icon: "none" });
          return false;
        }
      }
      if (this.form.serviceCapabilities.includes("LARGE_TRUCK")) {
        const license = this.form.largeTruckLicense;
        if (!license.ownerName.trim()) {
          common_vendor.index.showToast({ title: "请输入大板许可证业户名称", icon: "none" });
          return false;
        }
        if (!license.licenseNo.trim()) {
          common_vendor.index.showToast({ title: "请输入大板许可证字号", icon: "none" });
          return false;
        }
        if (!license.startDate || !license.endDate) {
          common_vendor.index.showToast({ title: "请选择许可证有效期起止时间", icon: "none" });
          return false;
        }
        if (!license.officeAddress.trim()) {
          common_vendor.index.showToast({ title: "请输入办公及经营场所地址", icon: "none" });
          return false;
        }
        if (!license.licenseFileId) {
          common_vendor.index.showToast({ title: "请上传许可证照片", icon: "none" });
          return false;
        }
        if (!this.siteFiles.length) {
          common_vendor.index.showToast({ title: "请至少上传一张办公/场地照片", icon: "none" });
          return false;
        }
      }
      return true;
    },
    async submit() {
      if (!this.validate())
        return;
      const proceed = () => {
        this.doSubmit();
      };
      if (this.removedCapabilitiesWarning) {
        common_vendor.index.showModal({
          title: "公司类型变更提示",
          content: "由于您修改公司类型后减少了原有服务能力，资质通过后，不再支持的相关线路将被系统自动关闭，是否确认提交？",
          success(res) {
            if (res.confirm)
              proceed();
          }
        });
      } else {
        proceed();
      }
    },
    async doSubmit() {
      this.submitting = true;
      try {
        const payload = {
          companyName: this.form.companyName,
          companyType: this.companyType,
          creditCode: this.form.creditCode,
          legalRepresentativeName: this.form.legalRepresentativeName,
          serviceCapabilities: this.form.serviceCapabilities,
          verificationMethod: this.form.verificationMethod
        };
        if (this.form.verificationMethod === "LEGAL_REPRESENTATIVE") {
          payload.legalIdNumber = this.form.legalIdNumber;
          payload.legalIdFrontFileId = this.form.legalIdFrontFileId;
          payload.legalIdBackFileId = this.form.legalIdBackFileId;
        } else {
          payload.agentName = this.form.agentName;
          payload.agentIdNumber = this.form.agentIdNumber;
          payload.agentIdFrontFileId = this.form.agentIdFrontFileId;
          payload.agentIdBackFileId = this.form.agentIdBackFileId;
          payload.authorizationLetterFileId = this.form.authorizationLetterFileId;
        }
        if (this.form.serviceCapabilities.includes("LARGE_TRUCK")) {
          payload.largeTruckLicense = {
            ...this.form.largeTruckLicense,
            licenseHolderName: this.form.largeTruckLicense.ownerName,
            licenseNumber: this.form.largeTruckLicense.licenseNo,
            licensePhotoFileId: this.form.largeTruckLicense.licenseFileId,
            licenseValidFrom: this.form.largeTruckLicense.startDate,
            licenseValidTo: this.form.largeTruckLicense.endDate
          };
          payload.officeAddressDetail = this.form.largeTruckLicense.officeAddress;
          payload.operationSiteFileIds = this.siteFiles.map((f) => f.fileId);
        }
        await common_vendor.api.submitVerification(payload);
        common_vendor.index.showToast({ title: "资质认证提交成功", icon: "success" });
        setTimeout(() => {
          common_vendor.index.redirectTo({ url: "/pages/verification/status" });
        }, 800);
      } finally {
        this.submitting = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0,
    b: common_vendor.t($options.companyType === "CAR_CARRIER" ? "●" : ""),
    c: $options.companyType === "CAR_CARRIER" ? 1 : "",
    d: common_vendor.o(($event) => $options.setCompanyType("CAR_CARRIER"), "ff"),
    e: common_assets._imports_1,
    f: common_vendor.t($options.companyType === "ROADSIDE_RESCUE" ? "●" : ""),
    g: $options.companyType === "ROADSIDE_RESCUE" ? 1 : "",
    h: common_vendor.o(($event) => $options.setCompanyType("ROADSIDE_RESCUE"), "ac"),
    i: $options.removedCapabilitiesWarning
  }, $options.removedCapabilitiesWarning ? {} : {}, {
    j: $data.form.companyName,
    k: common_vendor.o(($event) => $data.form.companyName = $event.detail.value, "07"),
    l: $data.form.creditCode,
    m: common_vendor.o(($event) => $data.form.creditCode = $event.detail.value, "db"),
    n: $data.form.legalRepresentativeName,
    o: common_vendor.o(($event) => $data.form.legalRepresentativeName = $event.detail.value, "00"),
    p: common_vendor.t($data.form.verificationMethod === "LEGAL_REPRESENTATIVE" ? "●" : ""),
    q: $data.form.verificationMethod === "LEGAL_REPRESENTATIVE" ? 1 : "",
    r: common_vendor.o(($event) => $options.setVerificationMethod("LEGAL_REPRESENTATIVE"), "90"),
    s: common_vendor.t($data.form.verificationMethod === "AUTHORIZED_AGENT" ? "●" : ""),
    t: $data.form.verificationMethod === "AUTHORIZED_AGENT" ? 1 : "",
    v: common_vendor.o(($event) => $options.setVerificationMethod("AUTHORIZED_AGENT"), "d9"),
    w: $data.form.verificationMethod === "LEGAL_REPRESENTATIVE"
  }, $data.form.verificationMethod === "LEGAL_REPRESENTATIVE" ? common_vendor.e({
    x: $data.form.legalIdNumber,
    y: common_vendor.o(($event) => $data.form.legalIdNumber = $event.detail.value, "35"),
    z: $data.form.legalIdFrontFileId
  }, $data.form.legalIdFrontFileId ? {
    A: $options.legalIdFrontUrl,
    B: common_vendor.o(($event) => $options.previewImg($options.legalIdFrontUrl), "47"),
    C: common_vendor.o(($event) => $options.deleteFile("legalIdFrontFileId"), "da")
  } : {
    D: common_vendor.t($data.uploadingMap["legalIdFrontFileId"] ? "⏳" : "+"),
    E: common_vendor.t($data.uploadingMap["legalIdFrontFileId"] ? "上传中..." : "上传人像面"),
    F: common_vendor.o(($event) => $options.chooseImg("legalIdFrontFileId", "IDENTITY_CARD"), "7f")
  }, {
    G: $data.form.legalIdBackFileId
  }, $data.form.legalIdBackFileId ? {
    H: $options.legalIdBackUrl,
    I: common_vendor.o(($event) => $options.previewImg($options.legalIdBackUrl), "f3"),
    J: common_vendor.o(($event) => $options.deleteFile("legalIdBackFileId"), "0e")
  } : {
    K: common_vendor.t($data.uploadingMap["legalIdBackFileId"] ? "⏳" : "+"),
    L: common_vendor.t($data.uploadingMap["legalIdBackFileId"] ? "上传中..." : "上传国徽面"),
    M: common_vendor.o(($event) => $options.chooseImg("legalIdBackFileId", "IDENTITY_CARD"), "03")
  }) : {}, {
    N: $data.form.verificationMethod === "AUTHORIZED_AGENT"
  }, $data.form.verificationMethod === "AUTHORIZED_AGENT" ? common_vendor.e({
    O: $data.form.agentName,
    P: common_vendor.o(($event) => $data.form.agentName = $event.detail.value, "df"),
    Q: $data.form.agentIdNumber,
    R: common_vendor.o(($event) => $data.form.agentIdNumber = $event.detail.value, "28"),
    S: $data.form.agentIdFrontFileId
  }, $data.form.agentIdFrontFileId ? {
    T: $options.agentIdFrontUrl,
    U: common_vendor.o(($event) => $options.previewImg($options.agentIdFrontUrl), "39"),
    V: common_vendor.o(($event) => $options.deleteFile("agentIdFrontFileId"), "74")
  } : {
    W: common_vendor.t($data.uploadingMap["agentIdFrontFileId"] ? "⏳" : "+"),
    X: common_vendor.t($data.uploadingMap["agentIdFrontFileId"] ? "上传中..." : "上传正面"),
    Y: common_vendor.o(($event) => $options.chooseImg("agentIdFrontFileId", "IDENTITY_CARD"), "af")
  }, {
    Z: $data.form.agentIdBackFileId
  }, $data.form.agentIdBackFileId ? {
    aa: $options.agentIdBackUrl,
    ab: common_vendor.o(($event) => $options.previewImg($options.agentIdBackUrl), "2c"),
    ac: common_vendor.o(($event) => $options.deleteFile("agentIdBackFileId"), "56")
  } : {
    ad: common_vendor.t($data.uploadingMap["agentIdBackFileId"] ? "⏳" : "+"),
    ae: common_vendor.t($data.uploadingMap["agentIdBackFileId"] ? "上传中..." : "上传反面"),
    af: common_vendor.o(($event) => $options.chooseImg("agentIdBackFileId", "IDENTITY_CARD"), "a5")
  }, {
    ag: $data.form.authorizationLetterFileId
  }, $data.form.authorizationLetterFileId ? {
    ah: $options.authorizationLetterUrl,
    ai: common_vendor.o(($event) => $options.previewImg($options.authorizationLetterUrl), "40"),
    aj: common_vendor.o(($event) => $options.deleteFile("authorizationLetterFileId"), "62")
  } : {
    ak: common_vendor.t($data.uploadingMap["authorizationLetterFileId"] ? "⏳" : "+"),
    al: common_vendor.t($data.uploadingMap["authorizationLetterFileId"] ? "上传中..." : "上传委托书"),
    am: common_vendor.o(($event) => $options.chooseImg("authorizationLetterFileId", "AUTHORIZATION_LETTER"), "e6")
  }) : {}, {
    an: $data.form.serviceCapabilities.includes("LARGE_TRUCK")
  }, $data.form.serviceCapabilities.includes("LARGE_TRUCK") ? common_vendor.e({
    ao: $data.form.largeTruckLicense.ownerName,
    ap: common_vendor.o(($event) => $data.form.largeTruckLicense.ownerName = $event.detail.value, "12"),
    aq: $data.form.largeTruckLicense.licenseNo,
    ar: common_vendor.o(($event) => $data.form.largeTruckLicense.licenseNo = $event.detail.value, "3a"),
    as: common_vendor.t($data.form.largeTruckLicense.startDate || "选择开始日期"),
    at: common_vendor.o(($event) => $options.onDateChange($event, "startDate"), "ab"),
    av: common_vendor.t($data.form.largeTruckLicense.endDate || "选择结束日期"),
    aw: common_vendor.o(($event) => $options.onDateChange($event, "endDate"), "7d"),
    ax: $data.form.largeTruckLicense.officeAddress,
    ay: common_vendor.o(($event) => $data.form.largeTruckLicense.officeAddress = $event.detail.value, "3d"),
    az: $data.form.largeTruckLicense.licenseFileId
  }, $data.form.largeTruckLicense.licenseFileId ? {
    aA: $options.largeTruckLicenseUrl,
    aB: common_vendor.o(($event) => $options.previewImg($options.largeTruckLicenseUrl), "3d"),
    aC: common_vendor.o(($event) => $options.deleteLicenseFile(), "dc")
  } : {
    aD: common_vendor.t($data.uploadingLargeTruckLicense ? "⏳" : "+"),
    aE: common_vendor.t($data.uploadingLargeTruckLicense ? "上传中..." : "上传许可证"),
    aF: common_vendor.o(($event) => $options.chooseLicenseImg(), "d6")
  }, {
    aG: common_vendor.t($data.siteFiles.length),
    aH: common_vendor.n($data.siteFiles.length ? "status-success" : "status-warning"),
    aI: common_vendor.f($data.siteFiles, (file, index, i0) => {
      return {
        a: file.fileUrl,
        b: common_vendor.o(($event) => $options.previewImg(file.fileUrl), file.fileId),
        c: common_vendor.o(($event) => $options.deleteSiteFile(index), file.fileId),
        d: file.fileId
      };
    }),
    aJ: $data.siteFiles.length < 9
  }, $data.siteFiles.length < 9 ? {
    aK: common_vendor.t($data.uploadingSite ? "⏳" : "+"),
    aL: common_vendor.t($data.uploadingSite ? "上传中..." : "上传场所照"),
    aM: common_vendor.o((...args) => $options.chooseSiteImg && $options.chooseSiteImg(...args), "38")
  } : {}) : {}, {
    aN: $data.submitting,
    aO: common_vendor.o((...args) => $options.submit && $options.submit(...args), "9f")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
