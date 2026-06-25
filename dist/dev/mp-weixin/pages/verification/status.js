"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      status: { reviewStatus: "UNVERIFIED" },
      verification: {},
      mediaFiles: [],
      reviewStatusText: common_vendor.reviewStatusText
    };
  },
  computed: {
    statusIcon() {
      const icons = {
        APPROVED: "/static/icons/check-circle.svg",
        PENDING: "/static/icons/clock.svg",
        REJECTED: "/static/icons/x-circle.svg"
      };
      return icons[this.status.reviewStatus] || "";
    },
    rejectReasonText() {
      return String(this.status.rejectReason || "").trim();
    },
    showRejectReason() {
      return this.status.reviewStatus === "REJECTED" && Boolean(this.rejectReasonText);
    },
    hasVerificationVersion() {
      return Boolean(this.verification.id);
    },
    businessLicenseFiles() {
      return this.filesByUsage("BUSINESS_LICENSE");
    },
    identityFiles() {
      const legalFiles = this.filesByUsages(["LEGAL_ID_FRONT", "LEGAL_ID_BACK"]);
      const agentFiles = this.filesByUsages(["AGENT_ID_FRONT", "AGENT_ID_BACK"]);
      return this.verification.verificationMethod === "AUTHORIZED_AGENT" ? agentFiles : legalFiles;
    },
    authorizationLetterFiles() {
      return this.filesByUsage("AUTHORIZATION_LETTER");
    },
    roadLicenseFiles() {
      return this.filesByUsage("ROAD_LICENSE");
    },
    operationSiteFiles() {
      return this.filesByUsage("OPERATION_SITE");
    },
    regionText() {
      const parts = [
        this.verification.officeProvinceName,
        this.verification.officeCityName,
        this.verification.officeDistrictName
      ].filter(Boolean);
      return parts.length ? parts.join(" · ") : "-";
    },
    addressText() {
      const parts = [this.verification.officePoiName, this.verification.officeAddressDetail].filter(
        Boolean
      );
      return parts.length ? parts.join(" / ") : "-";
    },
    coordinateText() {
      if (!this.verification.officeLongitude || !this.verification.officeLatitude) {
        return "-";
      }
      return `${this.verification.officeLongitude}, ${this.verification.officeLatitude}`;
    },
    largeTruckLicense() {
      return this.verification.largeTruckLicense || {};
    },
    licenseDateRangeText() {
      const from = this.largeTruckLicense.licenseValidFrom || this.largeTruckLicense.startDate;
      const to = this.largeTruckLicense.licenseValidTo || this.largeTruckLicense.endDate;
      if (!from && !to)
        return "-";
      return `${from || "-"} 至 ${to || "-"}`;
    },
    showLargeTruckSection() {
      return this.hasVerificationVersion && (this.verification.serviceCapabilities || []).includes("LARGE_TRUCK");
    }
  },
  onShow() {
    if (typeof common_vendor.index.hideModal === "function") {
      common_vendor.index.hideModal();
    }
    if (common_vendor.requireLogin())
      this.load();
  },
  methods: {
    dateText: common_vendor.dateText,
    async load() {
      try {
        const status = await common_vendor.api.verificationStatus();
        this.status = status;
        if (status.reviewStatus === "UNVERIFIED" && !status.submittedAt) {
          this.verification = {};
          this.mediaFiles = [];
          return;
        }
        const detail = await common_vendor.api.verificationDetail(
          status.pendingVersionId ? { versionId: status.pendingVersionId } : {}
        );
        this.applyVerificationDetail(detail);
      } catch (error) {
        console.error(error);
      }
    },
    applyVerificationDetail(detail) {
      const version = detail.version || null;
      if (!version) {
        this.verification = {};
        this.mediaFiles = [];
        return;
      }
      const snapshot = version.snapshotData || {};
      const largeTruckLicense = snapshot.largeTruckLicense || {};
      const serviceCapabilities = snapshot.serviceCapabilities || this.status.serviceCapabilities || this.companyTypeToCapabilities(snapshot.companyType || version.companyType);
      this.verification = {
        id: version.id,
        companyName: snapshot.companyName || version.companyName || this.status.companyName,
        companyType: snapshot.companyType || version.companyType || this.status.companyType,
        creditCode: snapshot.creditCode || version.creditCode,
        legalRepresentativeName: snapshot.legalRepresentativeName || version.legalRepresentativeName,
        businessLicenseFileId: snapshot.businessLicenseFileId,
        serviceCapabilities,
        verificationMethod: snapshot.verificationMethod || version.verificationMethod,
        legalIdNumber: snapshot.legalIdNumber || version.legalIdNumber,
        agentName: snapshot.agentName || version.agentName,
        agentIdNumber: snapshot.agentIdNumber || version.agentIdNumber,
        officeProvinceName: snapshot.officeProvinceName || version.officeProvinceName,
        officeCityName: snapshot.officeCityName || version.officeCityName,
        officeDistrictName: snapshot.officeDistrictName || version.officeDistrictName,
        officePoiName: snapshot.officePoiName || version.officePoiName,
        officeAddressDetail: snapshot.officeAddressDetail || snapshot.officeAddress || version.officeAddressDetail,
        officeLongitude: snapshot.officeLongitude || version.officeLongitude,
        officeLatitude: snapshot.officeLatitude || version.officeLatitude,
        largeTruckLicense: {
          licenseHolderName: largeTruckLicense.licenseHolderName || largeTruckLicense.ownerName || version.licenseHolderName,
          licenseNumber: largeTruckLicense.licenseNumber || largeTruckLicense.licenseNo || version.licenseNumber,
          licenseValidFrom: largeTruckLicense.licenseValidFrom || largeTruckLicense.startDate || this.dateOnly(version.licenseValidFrom),
          licenseValidTo: largeTruckLicense.licenseValidTo || largeTruckLicense.endDate || this.dateOnly(version.licenseValidTo)
        },
        submittedAt: version.submittedAt,
        reviewedAt: version.reviewedAt
      };
      this.mediaFiles = (version.mediaFiles || []).filter((file) => file.fileUrl);
    },
    dateOnly(value) {
      if (!value)
        return "";
      return String(value).split("T")[0];
    },
    safeText(value) {
      return value === void 0 || value === null || value === "" ? "未填写" : value;
    },
    formatCompanyType(companyType, caps = []) {
      if (companyType === "CAR_CARRIER" || caps.includes("LARGE_TRUCK")) {
        return "轿运公司";
      }
      if (companyType === "ROADSIDE_RESCUE" || caps.includes("SMALL_TRUCK")) {
        return "道路救援公司";
      }
      return "";
    },
    companyTypeToCapabilities(type) {
      if (type === "CAR_CARRIER")
        return ["LARGE_TRUCK", "SMALL_TRUCK"];
      if (type === "ROADSIDE_RESCUE")
        return ["SMALL_TRUCK"];
      return [];
    },
    serviceCapabilitiesText(caps = []) {
      const labels = {
        LARGE_TRUCK: "大板线路",
        SMALL_TRUCK: "小板线路",
        DRIVING: "代驾"
      };
      const text = caps.map((cap) => labels[cap] || cap).filter(Boolean);
      return text.length ? text.join("、") : "未填写";
    },
    verificationMethodText(method) {
      if (method === "LEGAL_REPRESENTATIVE")
        return "法定代表人自办";
      if (method === "AUTHORIZED_AGENT")
        return "经办人/委托人办理";
      return "未填写";
    },
    fileUsageText(usageScene) {
      const labels = {
        BUSINESS_LICENSE: "营业执照",
        LEGAL_ID_FRONT: "法人身份证人像面",
        LEGAL_ID_BACK: "法人身份证国徽面",
        AGENT_ID_FRONT: "经办人身份证正面",
        AGENT_ID_BACK: "经办人身份证反面",
        AUTHORIZATION_LETTER: "授权委托书",
        ROAD_LICENSE: "道路运输许可证",
        OPERATION_SITE: "场地照片"
      };
      return labels[usageScene] || "图片";
    },
    filesByUsage(usageScene) {
      return this.mediaFiles.filter((file) => file.usageScene === usageScene);
    },
    filesByUsages(usageScenes) {
      return this.mediaFiles.filter((file) => usageScenes.includes(file.usageScene));
    },
    previewFiles(files, currentUrl) {
      const urls = files.map((file) => file.fileUrl).filter(Boolean);
      if (!urls.length)
        return;
      common_vendor.index.previewImage({ urls, current: currentUrl || urls[0] });
    },
    goHome() {
      common_vendor.index.switchTab({ url: "/pages/home/index" });
    },
    goForm() {
      common_vendor.index.navigateTo({ url: "/pages/verification/form" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $options.statusIcon
  }, $options.statusIcon ? {
    b: $options.statusIcon
  } : {
    c: common_assets._imports_0
  }, {
    d: common_vendor.t($data.reviewStatusText[$data.status.reviewStatus] || "未认证"),
    e: $data.status.reviewStatus === "APPROVED"
  }, $data.status.reviewStatus === "APPROVED" ? {} : $data.status.reviewStatus === "PENDING" ? {} : $data.status.reviewStatus === "REJECTED" ? {} : {}, {
    f: $data.status.reviewStatus === "PENDING",
    g: $data.status.reviewStatus === "REJECTED",
    h: $options.showRejectReason
  }, $options.showRejectReason ? {
    i: common_vendor.t($options.rejectReasonText)
  } : {}, {
    j: common_vendor.n($data.status.reviewStatus ? $data.status.reviewStatus.toLowerCase() : "unverified"),
    k: $options.hasVerificationVersion
  }, $options.hasVerificationVersion ? common_vendor.e({
    l: common_vendor.t($options.safeText($data.verification.companyName)),
    m: common_vendor.t($options.safeText($data.verification.creditCode)),
    n: common_vendor.t($options.safeText($data.verification.legalRepresentativeName)),
    o: common_vendor.t($options.formatCompanyType($data.verification.companyType, $data.verification.serviceCapabilities) || "未填写"),
    p: common_vendor.t($options.serviceCapabilitiesText($data.verification.serviceCapabilities)),
    q: common_vendor.t($options.verificationMethodText($data.verification.verificationMethod)),
    r: $data.status.submittedAt || $data.verification.submittedAt
  }, $data.status.submittedAt || $data.verification.submittedAt ? {
    s: common_vendor.t($options.dateText($data.status.submittedAt || $data.verification.submittedAt))
  } : {}, {
    t: $data.status.reviewedAt || $data.verification.reviewedAt
  }, $data.status.reviewedAt || $data.verification.reviewedAt ? {
    v: common_vendor.t($options.dateText($data.status.reviewedAt || $data.verification.reviewedAt))
  } : {}, {
    w: $options.businessLicenseFiles.length
  }, $options.businessLicenseFiles.length ? {
    x: common_vendor.f($options.businessLicenseFiles, (file, k0, i0) => {
      return {
        a: file.fileUrl,
        b: file.fileId,
        c: common_vendor.o(($event) => $options.previewFiles($options.businessLicenseFiles, file.fileUrl), file.fileId)
      };
    })
  } : {}) : {}, {
    y: $options.hasVerificationVersion
  }, $options.hasVerificationVersion ? common_vendor.e({
    z: common_vendor.t($options.regionText),
    A: common_vendor.t($options.addressText),
    B: $options.coordinateText !== "-"
  }, $options.coordinateText !== "-" ? {
    C: common_vendor.t($options.coordinateText)
  } : {}) : {}, {
    D: $options.hasVerificationVersion
  }, $options.hasVerificationVersion ? common_vendor.e({
    E: $data.verification.verificationMethod === "AUTHORIZED_AGENT"
  }, $data.verification.verificationMethod === "AUTHORIZED_AGENT" ? {
    F: common_vendor.t($options.safeText($data.verification.agentName)),
    G: common_vendor.t($options.safeText($data.verification.agentIdNumber))
  } : {
    H: common_vendor.t($options.safeText($data.verification.legalRepresentativeName)),
    I: common_vendor.t($options.safeText($data.verification.legalIdNumber))
  }, {
    J: $options.identityFiles.length
  }, $options.identityFiles.length ? {
    K: common_vendor.f($options.identityFiles, (file, k0, i0) => {
      return {
        a: file.fileUrl,
        b: common_vendor.t($options.fileUsageText(file.usageScene)),
        c: file.fileId,
        d: common_vendor.o(($event) => $options.previewFiles($options.identityFiles, file.fileUrl), file.fileId)
      };
    })
  } : {}, {
    L: $options.authorizationLetterFiles.length
  }, $options.authorizationLetterFiles.length ? {
    M: common_vendor.f($options.authorizationLetterFiles, (file, k0, i0) => {
      return {
        a: file.fileUrl,
        b: common_vendor.t($options.fileUsageText(file.usageScene)),
        c: file.fileId,
        d: common_vendor.o(($event) => $options.previewFiles($options.authorizationLetterFiles, file.fileUrl), file.fileId)
      };
    })
  } : {}) : {}, {
    N: $options.showLargeTruckSection
  }, $options.showLargeTruckSection ? common_vendor.e({
    O: common_vendor.t($options.safeText($options.largeTruckLicense.licenseHolderName)),
    P: common_vendor.t($options.safeText($options.largeTruckLicense.licenseNumber)),
    Q: common_vendor.t($options.licenseDateRangeText),
    R: $options.roadLicenseFiles.length
  }, $options.roadLicenseFiles.length ? {
    S: common_vendor.f($options.roadLicenseFiles, (file, k0, i0) => {
      return {
        a: file.fileUrl,
        b: file.fileId,
        c: common_vendor.o(($event) => $options.previewFiles($options.roadLicenseFiles, file.fileUrl), file.fileId)
      };
    })
  } : {}, {
    T: $options.operationSiteFiles.length
  }, $options.operationSiteFiles.length ? {
    U: common_vendor.f($options.operationSiteFiles, (file, k0, i0) => {
      return {
        a: file.fileUrl,
        b: file.fileId,
        c: common_vendor.o(($event) => $options.previewFiles($options.operationSiteFiles, file.fileUrl), file.fileId)
      };
    })
  } : {}) : {}, {
    V: !$options.hasVerificationVersion
  }, !$options.hasVerificationVersion ? common_vendor.e({
    W: common_vendor.t($data.status.companyName || "未填写"),
    X: common_vendor.t($options.formatCompanyType($data.status.companyType, $data.status.serviceCapabilities) || "未填写"),
    Y: $data.status.submittedAt
  }, $data.status.submittedAt ? {
    Z: common_vendor.t($options.dateText($data.status.submittedAt))
  } : {}, {
    aa: $data.status.reviewedAt
  }, $data.status.reviewedAt ? {
    ab: common_vendor.t($options.dateText($data.status.reviewedAt))
  } : {}) : {}, {
    ac: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "ca"),
    ad: $data.status.reviewStatus !== "PENDING"
  }, $data.status.reviewStatus !== "PENDING" ? {
    ae: common_vendor.t($data.status.reviewStatus === "REJECTED" || $data.status.reviewStatus === "APPROVED" ? "重新提交资料" : "立即去认证"),
    af: common_vendor.o((...args) => $options.goForm && $options.goForm(...args), "51")
  } : {
    ag: common_vendor.o((...args) => $options.load && $options.load(...args), "55")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
